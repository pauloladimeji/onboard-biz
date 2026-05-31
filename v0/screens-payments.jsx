/* global React */
const { useState: useStateP, useMemo: useMemoP, useRef: useRefP, useEffect: useEffectP } = React;
const PIcon = window.OBIcon;
const PNetworkIcon = window.OBNetworkIcon;
const { CURRENCIES: PCCY, RECIPIENTS_FULL, V0_USD_BALANCE } = window.OBData;

// =====================================================
// Recipient data
// =====================================================
const RECIPIENTS = RECIPIENTS_FULL;

const PAGE_SIZE = 8;

const REASONS = [
  "Supplier payment", "Payroll", "Contractor / freelancer",
  "Intercompany transfer", "Logistics & shipping",
  "Tax & government", "Refund", "Other",
];

const FX = { USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1485.5, GHS: 14.2, KES: 129.4, TZS: 2640.0, MZN: 63.8, USDC: 1, USDT: 1 };
const FEE = { USD: 4.5, GBP: 3.6, EUR: 4.1 };
const SOURCES = ["USD"];
const DEST_OPTIONS = ["NGN", "GHS", "KES", "TZS", "MZN", "USDC", "USDT"];

function convert(src, dst, a) {
  const n = parseFloat(String(a).replace(/,/g, "")) || 0;
  if (!n) return 0;
  return (n / FX[src]) * FX[dst];
}
function fmt(n) {
  if (!n && n !== 0) return "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Rate countdown — refreshes the indicated FX rate every 30s (mock)
function RateCountdown() {
  const [t, setT] = useStateP(30);
  useEffectP(() => {
    const id = setInterval(() => setT(x => x <= 1 ? 30 : x - 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{`Rate refreshes in ${t}s`}</span>;
}

// =====================================================
// Atoms
// =====================================================
function PFlag({ cc, size = 24 }) {
  return <div className="ccy-flag" style={{width: size, height: size, backgroundImage: `url(design-system/assets/flags/${cc}.svg)`}} />;
}

function PCoinBadge({ coin, size = 22 }) {
  const colors = { USDC: "#2775CA", USDT: "#26A17B" };
  const labels = { USDC: "Ⓒ", USDT: "Ⓣ" };
  return (
    <div style={{width: size, height: size, borderRadius: "50%", background: colors[coin] || "#888",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.7, fontWeight: 700, lineHeight: 1, flexShrink: 0}}>
      {labels[coin] || "?"}
    </div>
  );
}

function RecipientBadge({ recipient, size = 14 }) {
  if (recipient.country === "crypto") {
    const NetIc = recipient.network ? PNetworkIcon[recipient.network] : null;
    if (NetIc) {
      return <div className="ccy-flag" style={{width: size, height: size, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center"}}><NetIc style={{width: size * 0.8, height: size * 0.8}} /></div>;
    }
    return <PCoinBadge coin={recipient.ccy} size={size} />;
  }
  return <PFlag cc={recipient.country} size={size} />;
}

function FlowShell({ steps, current, children }) {
  return (
    <div className="flow-shell">
      <div className="flow-steps">
        {steps.map((label, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <React.Fragment key={label + i}>
              {i > 0 && <div className="flow-step-connector" />}
              <div className={`flow-step ${state}`}>
                <div className="flow-step-dot">
                  {state === "done" ? <PIcon.check /> : i + 1}
                </div>
                <div className="flow-step-lbl">{label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flow-content">{children}</div>
    </div>
  );
}
window.OBFlowShell = FlowShell;

function CcyBadge({ code, size = 18 }) {
  const meta = PCCY[code];
  if (meta?.stablecoin) return <PCoinBadge coin={code} size={size} />;
  return <PFlag cc={meta?.flag || "us"} size={size} />;
}

function CcyDropdown({ value, options, onChange }) {
  const [open, setOpen] = useStateP(false);
  if (options.length <= 1) {
    return (
      <div className="ccy-dd">
        <div className="ccy-locked">
          <CcyBadge code={value} size={18} />
          <span>{value}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="ccy-dd">
      <button className="ccy-dd-btn" onClick={() => setOpen(!open)} type="button">
        <CcyBadge code={value} size={18} />
        <span>{value}</span>
        <PIcon.arrowDown />
      </button>
      {open && (
        <>
          <div className="ccy-dd-veil" onClick={() => setOpen(false)} />
          <div className="ccy-dd-pop">
            {options.map((c) => (
              <button key={c} className={`ccy-dd-opt ${c === value ? "on" : ""}`}
                      onClick={() => { onChange(c); setOpen(false); }} type="button">
                <CcyBadge code={c} size={18} />
                <span>{c}</span>
                <span className="muted">{PCCY[c].name}</span>
                {c === value && <PIcon.check />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// Recipient picker (used standalone or as part of step 1 left pane)
// =====================================================
function RecipientPanel({ selectedId, onSelect, onAddNew, title = "Choose recipient", subtitle = "Select a saved recipient or add a new one" }) {
  const [q, setQ] = useStateP("");
  const [visible, setVisible] = useStateP(PAGE_SIZE);
  const sentinelRef = useRefP(null);

  const filtered = useMemoP(() => {
    const t = q.trim().toLowerCase();
    if (!t) return RECIPIENTS;
    return RECIPIENTS.filter(r =>
      r.name.toLowerCase().includes(t) ||
      r.handle.toLowerCase().includes(t) ||
      r.ccy.toLowerCase().includes(t)
    );
  }, [q]);

  useEffectP(() => { setVisible(PAGE_SIZE); }, [q]);

  useEffectP(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) {
        setVisible(v => Math.min(v + PAGE_SIZE, filtered.length));
      }
    }, { root: el.closest('.recip-list') || null, rootMargin: '60px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="pay-panel">
      <div className="pay-panel-head">
        <div className="pay-panel-title">{title}</div>
        <div className="pay-panel-sub">{subtitle}</div>
      </div>

      <div className="pay-search">
        <PIcon.search />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, bank, or currency…" />
      </div>

      <button className="recip-add" onClick={onAddNew}>
        <span className="ic"><PIcon.plus /></span>
        <span className="t">Add new recipient</span>
        <PIcon.arrowRight />
      </button>

      {list.length === 0 ? (
        <div className="empty" style={{padding: "32px 16px"}}>
          <div className="ic"><PIcon.people /></div>
          <div style={{fontSize: 13, color: "var(--gray-700)", fontWeight: 500}}>No matches</div>
          <div style={{fontSize: 12, marginTop: 4}}>Try a different name or add a new recipient.</div>
        </div>
      ) : (
        <div className="recip-list" style={{maxHeight: 420, overflowY: "auto"}}>
          {list.map((r) => {
            const sel = r.id === selectedId;
            return (
              <button key={r.id} className={`recip-row ${sel ? "on" : ""}`} onClick={() => onSelect(r)}>
                <div className="ava">
                  <span>{r.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
                  <RecipientBadge recipient={r} size={14} />
                </div>
                <div className="meta">
                  <div className="t">{r.name}</div>
                  <div className="s">{`${r.handle} · ${r.type}`}</div>
                </div>
                <div className="rt">
                  <div className="ccy">{r.ccy}</div>
                  <div className="last">{`Last: ${r.last}`}</div>
                </div>
                {sel
                  ? <div className="selected-mark"><PIcon.check /></div>
                  : <div className="selected-spacer" />}
              </button>
            );
          })}
          {hasMore && (
            <div ref={sentinelRef} className="recip-loader">
              <span className="spin" /> Loading more recipients…
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <div className="recip-end">All {filtered.length} recipients shown</div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Amount panel (full or compact)
// =====================================================
function SwappableAmountFields({ srcCcy, setSrcCcy, dstCcy, setDstCcy, amount, setAmount, recipient, showDstPicker = false, availBalance }) {
  const dst = recipient ? recipient.ccy : dstCcy;
  const rate = FX[dst] / FX[srcCcy];
  const fee = FEE[srcCcy] || 0;
  const [driver, setDriver] = useStateP("send");
  const [recvAmt, setRecvAmt] = useStateP("");

  const amtNum = parseFloat(String(amount).replace(/,/g, "")) || 0;
  const hasBalance = availBalance !== undefined && availBalance !== null;
  const overBal = hasBalance && amtNum > 0 && (amtNum + fee) > availBalance;

  const onSendType = (v) => {
    setDriver("send");
    setAmount(v);
    setRecvAmt(v ? fmt(convert(srcCcy, dst, v)) : "");
  };

  const onRecvType = (v) => {
    setDriver("receive");
    setRecvAmt(v);
    const sendVal = convert(dst, srcCcy, v);
    setAmount(sendVal ? String(sendVal.toFixed(2)) : "");
  };

  const displaySend = amount;
  const displayRecv = driver === "send" ? (amount ? fmt(convert(srcCcy, dst, amount)) : "") : recvAmt;

  return (
    <div className="pay-fx">
      <div className="pay-fx-row">
        <div className="lb">If you send</div>
        <div className={`amt-box${overBal ? " amt-box-err" : ""}`}>
          <input className="amt-inp" inputMode="decimal" value={displaySend} onChange={(e) => onSendType(e.target.value)} placeholder="0.00" />
          <CcyDropdown value={srcCcy} options={SOURCES} onChange={setSrcCcy} />
        </div>
        <div className="hint" style={overBal ? {color: "var(--danger-600)"} : undefined}>
          {hasBalance
            ? <>Available: <strong style={{fontVariantNumeric: "tabular-nums"}}>${fmt(availBalance)}</strong>{overBal && " · Insufficient balance"}</>
            : `From your ${srcCcy} balance`}
        </div>
      </div>

      <div className="pay-fx-divider">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width: 14, height: 14}}><path d="M7 7h13l-3-3M17 17H4l3 3"/></svg>
      </div>

      <div className="pay-fx-row">
        <div className="lb">They will receive</div>
        <div className="amt-box">
          <input className="amt-inp" inputMode="decimal" value={displayRecv} onChange={(e) => onRecvType(e.target.value)} placeholder="0.00" />
          {recipient ? (
            <div className="ccy-locked">
              <RecipientBadge recipient={recipient} size={18} /> {dst}
            </div>
          ) : showDstPicker ? (
            <CcyDropdown value={dstCcy} options={DEST_OPTIONS} onChange={setDstCcy} />
          ) : null}
        </div>
        <div className="hint">
          <span className="rate"><span className="rate-pulse" /> {`1 ${srcCcy} ≈ ${rate.toFixed(rate < 5 ? 4 : 2)} ${dst}`}</span>
          <span className="rate-refresh"><RateCountdown /></span>
          <span className="rate-fee">{`Fee · ${srcCcy} ${fee.toFixed(2)}`}</span>
        </div>
      </div>
    </div>
  );
}

function AmountPanel({
  recipient, srcCcy, setSrcCcy, dstCcy, setDstCcy,
  amount, setAmount, reason, setReason, memo, setMemo,
  title = "Amount to send",
  subtitle,
  showRecipientHeader = false,
}) {
  return (
    <div className="pay-panel">
      <div className="pay-panel-head">
        <div className="pay-panel-title">{title}</div>
        <div className="pay-panel-sub">{subtitle || (recipient ? `Sending to ${recipient.name}` : "Choose currencies and enter an amount")}</div>
      </div>

      {showRecipientHeader && recipient && (
        <div className="pay-recip-strip">
          <div className="ava">
            <span>{recipient.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
            <RecipientBadge recipient={recipient} size={14} />
          </div>
          <div className="meta">
            <div className="t">{recipient.name}</div>
            <div className="s">{recipient.handle}</div>
          </div>
          <div className="rt">{recipient.ccy}</div>
        </div>
      )}

      <SwappableAmountFields srcCcy={srcCcy} setSrcCcy={setSrcCcy} dstCcy={dstCcy} setDstCcy={setDstCcy}
        amount={amount} setAmount={setAmount} recipient={recipient} showDstPicker={!recipient} />

      <div className="pay-fields">
        <div className="field" style={{marginBottom: 14}}>
          <div className="lbl">Reason for payment <span className="req">· required</span></div>
          <select className="inp pay-select" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason…</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field" style={{marginBottom: 0}}>
          <div className="lbl">Memo <span className="opt">· optional</span></div>
          <textarea className="inp pay-memo" maxLength={120} rows={2}
            placeholder="Add a note for your records (visible on the transaction)"
            value={memo} onChange={(e) => setMemo(e.target.value)} />
          <div className="help" style={{textAlign: "right", fontVariantNumeric: "tabular-nums"}}>{`${memo.length}/120`}</div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Placeholder panel (right-side of step 1 before the gating action)
// =====================================================
function StepOnePlaceholder({ mode }) {
  const isRecipFirst = mode === "recipient";
  return (
    <div className="pay-panel placeholder">
      <div className="pay-panel-head">
        <div className="pay-panel-title muted">{isRecipFirst ? "Amount to send" : "Choose recipient"}</div>
        <div className="pay-panel-sub">{isRecipFirst ? "Will appear after you choose a recipient" : "Will appear after you set the amount"}</div>
      </div>
      <div className="pay-empty">
        <div className="ic">{isRecipFirst ? <PIcon.paperplane /> : <PIcon.people />}</div>
        <div className="t">{isRecipFirst ? "Select a recipient to continue" : "Set an amount to continue"}</div>
        <div className="s">
          {isRecipFirst
            ? "Pick from your saved recipients on the left, or add a new one. We'll set up the right currency and rails automatically."
            : "Enter an amount on the left. Once you do, we'll show your saved recipients filtered to the destination currency."}
        </div>
        <div className="dotted-fields">
          <div className="dotted-row" />
          <div className="dotted-row short" />
          <div className="dotted-row" />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// UNIFIED Send Payment flow
// =====================================================
function SendPayment({ onAddRecipient, onToast, defaultMode = "recipient", paymentApproval = "required", paymentApprovalMethod = "totp", accountSuspended = false, dataState = "full" }) {
  const [mode, setMode] = useStateP(defaultMode); // "recipient" | "amount"
  // steps: 0=pick, 1=configure, 2=review, 3=approve(cond), 4=confirm
  const [step, setStep] = useStateP(0);
  const [recipient, setRecipient] = useStateP(null);
  const [srcCcy, setSrcCcy] = useStateP("USD");
  const [dstCcy, setDstCcy] = useStateP("NGN");
  const [amount, setAmount] = useStateP("");
  const [reason, setReason] = useStateP("");
  const [memo, setMemo] = useStateP("");
  const [reference, setReference] = useStateP(null);

  if (dataState === "empty") {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="title">Send payment</h1>
            <p className="subtitle">Save people and businesses you pay regularly so sending is one tap next time.</p>
          </div>
        </div>
        <div className="tablecard">
          <div className="empty" style={{padding: "72px 16px"}}>
            <div className="ic"><PIcon.people /></div>
            <div style={{fontSize: 15, color: "var(--gray-900)", fontWeight: 600, marginBottom: 4}}>No recipients yet</div>
            <div style={{fontSize: 13, maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.55}}>
              Add someone you want to pay — once saved, sending a payment is one tap.
            </div>
            <button className="btn" onClick={onAddRecipient}><PIcon.plus /> Add your first recipient</button>
          </div>
        </div>
      </div>
    );
  }

  if (accountSuspended) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="title">Send payment</h1>
            <p className="subtitle">Move money to suppliers, payroll, and partners across the world.</p>
          </div>
        </div>
        <div className="banner danger">
          <div className="icw"><PIcon.alert /></div>
          <div className="body">
            <div className="ttl">Outbound payments disabled</div>
            <div className="copy">Your account is currently suspended. Deposits and withdrawals are not supported until the suspension is lifted. Contact support for next steps.</div>
            <div className="actions">
              <button className="btn btn-sm">Contact support</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dstFinal = recipient ? recipient.ccy : dstCcy;
  const amtNum = parseFloat(String(amount).replace(/,/g,"")) || 0;
  const availBalance = V0_USD_BALANCE;
  const fee = FEE[srcCcy] || 0;
  const overBalance = amtNum > 0 && (amtNum + fee) > availBalance;
  const canReview = !!recipient && amtNum > 0 && !!reason && !overBalance;

  // step labels visible in the stepper (confirmation is outside FlowShell)
  const hasApproval = paymentApproval === "required";
  const stepLabels = mode === "recipient"
    ? (hasApproval ? ["Recipient", "Amount", "Review", "Approve"] : ["Recipient", "Amount", "Review"])
    : (hasApproval ? ["Amount", "Recipient", "Review", "Approve"] : ["Amount", "Recipient", "Review"]);

  // map logical step to stepper index (confirmation step is outside)
  const stepperIndex = step <= stepLabels.length - 1 ? step : stepLabels.length;

  const goReview  = () => { if (canReview) setStep(2); };
  const goApprove = () => { hasApproval ? setStep(3) : doConfirm(); };
  const doConfirm = () => {
    setReference("PAY-2026-" + String(Math.floor(Math.random() * 90000) + 10000));
    setStep(hasApproval ? 4 : 3);
  };
  const reset = () => {
    setStep(0); setRecipient(null); setSrcCcy("USD"); setDstCcy("NGN");
    setAmount(""); setReason(""); setMemo(""); setReference(null);
  };

  const isConfirmStep = (hasApproval && step === 4) || (!hasApproval && step === 3);

  // Render confirmation outside FlowShell (no stepper)
  if (isConfirmStep) {
    return (
      <div className="page pay-flow">
        <h1 className="title">Send payment</h1>
        <p className="subtitle">Move money to suppliers, payroll, and partners across the world.</p>
        <SendConfirmation
          payment={{
            recipient, srcCcy, dstCcy: dstFinal, amount, reason, memo,
            receive: convert(srcCcy, dstFinal, amount),
            fee: FEE[srcCcy] || 0,
          }}
          reference={reference}
          onDone={() => onToast && onToast("Transaction details — phase 2")}
          onNewPayment={reset} />
      </div>
    );
  }

  return (
    <div className="page pay-flow">
      <h1 className="title">Send payment</h1>
      <p className="subtitle">Move money to suppliers, payroll, and partners across the world.</p>

      <FlowShell steps={stepLabels} current={stepperIndex}>

        {/* STEP 0 — recipient-first: pick recipient; amount-first: enter amount */}
        {step === 0 && mode === "recipient" && (
          <RecipientPanel
            selectedId={recipient?.id}
            onSelect={(r) => { setRecipient(r); setDstCcy(r.ccy); setStep(1); }}
            onAddNew={onAddRecipient}
            title="Choose recipient"
            subtitle="Pick a saved recipient or add a new one" />
        )}

        {step === 0 && mode === "amount" && (
          <AmountInputOnlyPanel
            srcCcy={srcCcy} setSrcCcy={setSrcCcy}
            dstCcy={dstCcy} setDstCcy={setDstCcy}
            amount={amount} setAmount={setAmount}
            reason={reason} setReason={setReason}
            memo={memo} setMemo={setMemo}
            availBalance={availBalance}
            onContinue={() => { if (amtNum > 0 && reason && !overBalance) setStep(1); }}
            canContinue={amtNum > 0 && !!reason && !overBalance} />
        )}

        {/* STEP 1 — recipient-first: enter amount; amount-first: pick recipient */}
        {step === 1 && mode === "recipient" && (
          <AmountPanelRight
            recipient={recipient} srcCcy={srcCcy} setSrcCcy={setSrcCcy}
            amount={amount} setAmount={setAmount}
            reason={reason} setReason={setReason}
            memo={memo} setMemo={setMemo}
            availBalance={availBalance}
            onBack={() => setStep(0)}
            onReview={goReview} canReview={canReview} />
        )}

        {step === 1 && mode === "amount" && (
          <RecipientPanelFiltered
            destCcy={dstCcy}
            selectedId={recipient?.id}
            onSelect={(r) => { setRecipient(r); setStep(2); }}
            onAddNew={onAddRecipient}
            onBack={() => setStep(0)} />
        )}

        {/* STEP 2 — review */}
        {step === 2 && (
          <ReviewPayment
            payment={{
              recipient, srcCcy, dstCcy: dstFinal, amount, reason, memo,
              receive: convert(srcCcy, dstFinal, amount),
              fee: FEE[srcCcy] || 0,
            }}
            requiresApproval={hasApproval}
            onBack={() => setStep(1)}
            onConfirm={goApprove} />
        )}

        {/* STEP 3 — 2FA approve */}
        {step === 3 && hasApproval && (
          <PaymentApprovalStep
            method={paymentApprovalMethod}
            payment={{
              recipient, srcCcy, dstCcy: dstFinal, amount,
              receive: convert(srcCcy, dstFinal, amount),
            }}
            onBack={() => setStep(2)}
            onApprove={doConfirm}
            onToast={onToast} />
        )}

      </FlowShell>
    </div>
  );
}

// Amount step: amount + reason + memo (recipient already chosen)
function AmountPanelRight({ recipient, srcCcy, setSrcCcy, amount, setAmount, reason, setReason, memo, setMemo, onBack, onReview, canReview, availBalance }) {
  return (
    <div className="pay-panel">
      <div className="pay-panel-head">
        <div className="pay-panel-title">Amount to send</div>
        <div className="pay-panel-sub">{`Sending to ${recipient.name}`}</div>
      </div>

      <div className="pay-recip-strip">
        <div className="ava">
          <span>{recipient.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
          <RecipientBadge recipient={recipient} size={14} />
        </div>
        <div className="meta">
          <div className="t">{recipient.name}</div>
          <div className="s">{recipient.handle}</div>
        </div>
        <div className="rt" style={{display: "flex", alignItems: "center", gap: 10}}>
          <span>{recipient.ccy}</span>
          <button className="btn btn-ghost btn-sm" style={{padding: "4px 10px", fontSize: 12}} onClick={onBack}>Change</button>
        </div>
      </div>

      <SwappableAmountFields srcCcy={srcCcy} setSrcCcy={setSrcCcy} amount={amount} setAmount={setAmount} recipient={recipient} availBalance={availBalance} />

      <ReasonMemoFields reason={reason} setReason={setReason} memo={memo} setMemo={setMemo} />

      <button className="btn btn-lg" style={{marginTop: 18, width: "100%", justifyContent: "center"}} disabled={!canReview} onClick={onReview}>
        Review payment <PIcon.arrowRight />
      </button>
    </div>
  );
}

// Amount-first step 0: enter amount + currencies + reason/memo, then Continue
function AmountInputOnlyPanel({ srcCcy, setSrcCcy, dstCcy, setDstCcy, amount, setAmount, reason, setReason, memo, setMemo, onContinue, canContinue, availBalance }) {
  return (
    <div className="pay-panel">
      <div className="pay-panel-head">
        <div className="pay-panel-title">Enter amount</div>
        <div className="pay-panel-sub">Set the destination currency and amount to send</div>
      </div>

      <SwappableAmountFields srcCcy={srcCcy} setSrcCcy={setSrcCcy} dstCcy={dstCcy} setDstCcy={setDstCcy}
        amount={amount} setAmount={setAmount} showDstPicker availBalance={availBalance} />

      <ReasonMemoFields reason={reason} setReason={setReason} memo={memo} setMemo={setMemo} />

      <button className="btn btn-lg" style={{marginTop: 18, width: "100%", justifyContent: "center"}} disabled={!canContinue} onClick={onContinue}>
        Continue <PIcon.arrowRight />
      </button>
    </div>
  );
}

// Amount-first step 1: filtered recipient list (select auto-advances)
function RecipientPanelFiltered({ destCcy, selectedId, onSelect, onAddNew, onBack }) {
  const [q, setQ] = useStateP("");
  const [visible, setVisible] = useStateP(PAGE_SIZE);
  const sentinelRef = useRefP(null);

  const filtered = useMemoP(() => {
    let res = RECIPIENTS.filter(r => r.ccy === destCcy);
    const t = q.trim().toLowerCase();
    if (t) res = res.filter(r => r.name.toLowerCase().includes(t) || r.handle.toLowerCase().includes(t));
    return res;
  }, [q, destCcy]);

  useEffectP(() => { setVisible(PAGE_SIZE); }, [q, destCcy]);

  useEffectP(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) {
        setVisible(v => Math.min(v + PAGE_SIZE, filtered.length));
      }
    }, { root: el.closest('.recip-list') || null, rootMargin: '60px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="pay-panel">
      <div className="pay-panel-head">
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12}}>
          <div className="pay-panel-title">Choose recipient</div>
          <button className="btn btn-ghost btn-sm" style={{padding: "4px 10px", fontSize: 12, flexShrink: 0}} onClick={onBack}>← Back</button>
        </div>
        <div className="pay-panel-sub">{`Showing recipients that can receive ${destCcy}`}</div>
      </div>

      <div className="pay-search">
        <PIcon.search />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or bank…" />
      </div>

      <button className="recip-add" onClick={onAddNew}>
        <span className="ic"><PIcon.plus /></span>
        <span className="t">{`Add new ${destCcy} recipient`}</span>
        <PIcon.arrowRight />
      </button>

      {list.length === 0 ? (
        <div className="empty" style={{padding: "24px 16px"}}>
          <div className="ic"><PIcon.people /></div>
          <div style={{fontSize: 13, color: "var(--gray-700)", fontWeight: 500}}>{`No saved ${destCcy} recipients`}</div>
          <div style={{fontSize: 12, marginTop: 4}}>Add a new one to continue.</div>
        </div>
      ) : (
        <div className="recip-list" style={{maxHeight: 480, overflowY: "auto"}}>
          {list.map((r) => {
            const sel = r.id === selectedId;
            return (
              <button key={r.id} className={`recip-row ${sel ? "on" : ""}`} onClick={() => onSelect(r)}>
                <div className="ava">
                  <span>{r.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
                  <RecipientBadge recipient={r} size={14} />
                </div>
                <div className="meta">
                  <div className="t">{r.name}</div>
                  <div className="s">{`${r.handle} · ${r.type}`}</div>
                </div>
                {sel
                  ? <div className="selected-mark"><PIcon.check /></div>
                  : <div className="selected-spacer" />}
              </button>
            );
          })}
          {hasMore && (
            <div ref={sentinelRef} className="recip-loader">
              <span className="spin" /> Loading more…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReasonMemoFields({ reason, setReason, memo, setMemo }) {
  return (
    <div className="pay-fields">
      <div className="field" style={{marginBottom: 20}}>
        <div className="lbl">Reason for payment <span className="req">· required</span></div>
        <select className="inp pay-select" value={reason || ""} onChange={(e) => setReason(e.target.value)}>
          <option value="">Select a reason…</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="field" style={{marginBottom: 0}}>
        <div className="lbl">Memo <span className="opt">· optional</span></div>
        <textarea className="inp pay-memo" maxLength={120} rows={2}
          placeholder="What's this payment for? (e.g. Invoice #4421 — April logistics)"
          value={memo} onChange={(e) => setMemo(e.target.value)} />
        <div className="help" style={{textAlign: "right", fontVariantNumeric: "tabular-nums"}}>{`${memo.length}/120`}</div>
      </div>
    </div>
  );
}

// =====================================================
// Review
// =====================================================
function ReviewPayment({ payment, onBack, onConfirm, requiresApproval = false }) {
  const { recipient, srcCcy, dstCcy, amount, reason, memo, receive, fee } = payment;
  const totalDebit = (parseFloat(String(amount).replace(/,/g,"")) || 0) + fee;
  const rate = FX[dstCcy] / FX[srcCcy];
  const [busy, setBusy] = useStateP(false);
  const handleConfirm = () => { setBusy(true); setTimeout(() => { onConfirm(); }, 1200); };

  return (
    <div className="pay-review">
      <div className="pay-flow-card">
        <div className="pay-review-head">
          <div>
            <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-600)", textTransform: "uppercase"}}>
              Review your payment
            </div>
            <div style={{fontSize: 14, color: "var(--gray-700)", marginTop: 4}}>FX rate is locked for the next 60 seconds.</div>
          </div>
          <span className="pill info"><span className="dot" />Rate locked · 0:58</span>
        </div>

        <div className="pay-review-hero">
          <div className="leg">
            <div className="lbl">You pay</div>
            <div className="big">{`${srcCcy} ${fmt(parseFloat(String(amount).replace(/,/g,"")) || 0)}`}</div>
            <div className="sub">{`From your ${srcCcy} balance`}</div>
          </div>
          <div className="arrow"><PIcon.arrowRight /></div>
          <div className="leg right">
            <div className="lbl">{`${recipient.name} receives`}</div>
            <div className="big">{`${dstCcy} ${fmt(receive)}`}</div>
            <div className="sub"><RecipientBadge recipient={recipient} size={14} /> {recipient.handle}</div>
          </div>
        </div>

        <div className="pay-review-list">
          <div className="row-item">
            <div className="k">Recipient</div>
            <div className="v">{`${recipient.name} · ${recipient.type}`}<br/><span className="muted">{recipient.handle}</span></div>
          </div>
          <div className="row-item">
            <div className="k">FX rate</div>
            <div className="v"><span className="rate-pulse" /> {`1 ${srcCcy} = ${rate.toFixed(rate < 5 ? 4 : 2)} ${dstCcy}`} <span className="rate-refresh"><RateCountdown /></span></div>
          </div>
          <div className="row-item">
            <div className="k">Fee</div>
            <div className="v">{`${srcCcy} ${fmt(fee)}`}</div>
          </div>
          <div className="row-item">
            <div className="k">Total debit</div>
            <div className="v strong">{`${srcCcy} ${fmt(totalDebit)}`}</div>
          </div>
          <div className="row-item">
            <div className="k">Estimated settlement</div>
            <div className="v"><PIcon.clock /> Within 0–10 minutes</div>
          </div>
          {memo && (
            <div className="row-item">
              <div className="k">Memo</div>
              <div className="v">{memo}</div>
            </div>
          )}
        </div>

        <div className="pay-review-foot">
          <button className="btn btn-ghost" onClick={onBack} disabled={busy}>← Back</button>
          <button className="btn btn-lg" onClick={handleConfirm} disabled={busy}>
            {busy ? <><span className="spin" style={{width:14,height:14,borderWidth:2}} /> Sending…</> : <><PIcon.shield /> {requiresApproval ? "Continue to approval" : "Confirm & send"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 2FA approval — TOTP or email OTP
// =====================================================
function PaymentApprovalStep({ method: defaultMethod, payment, onBack, onApprove, onToast }) {
  const { recipient, srcCcy, dstCcy, amount, receive } = payment;
  const [method, setMethod] = useStateP(defaultMethod || "totp");
  const [code, setCode] = useStateP(["", "", "", "", "", ""]);
  const [error, setError] = useStateP("");
  const [busy, setBusy] = useStateP(false);
  const [resendIn, setResendIn] = useStateP(method === "email" ? 30 : 0);
  const [methodPickerOpen, setMethodPickerOpen] = useStateP(false);
  const inputs = React.useRef([]);

  // Reset code & resend timer when user switches method
  const switchMethod = (m) => {
    if (m === method || busy) return;
    setMethod(m);
    setCode(["", "", "", "", "", ""]);
    setError("");
    setResendIn(m === "email" ? 30 : 0);
    setTimeout(() => inputs.current[0] && inputs.current[0].focus(), 0);
    if (m === "email") onToast && onToast("Code sent to finance@acmetrading.com");
  };

  // Email-OTP resend cooldown
  React.useEffect(() => {
    if (method !== "email" || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn, method]);

  // Auto-focus first input
  React.useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus();
  }, []);

  const setDigit = (i, v) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = cleaned;
    setCode(next);
    setError("");
    if (cleaned && i < 5 && inputs.current[i + 1]) inputs.current[i + 1].focus();
    // auto-submit when all 6 filled
    if (cleaned && i === 5 && next.every((d) => d)) {
      submit(next.join(""));
    }
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1].focus();
    if (e.key === "ArrowLeft"  && i > 0) inputs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1].focus();
  };

  const onPaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("").concat(["","","","","",""]).slice(0, 6);
    setCode(next);
    if (pasted.length === 6) submit(pasted);
    else inputs.current[Math.min(pasted.length, 5)].focus();
  };

  const submit = (full) => {
    setBusy(true);
    setError("");
    setTimeout(() => {
      // Mock: any 6 digits ending in even = success; demo "123456" always works.
      const ok = full === "123456" || (/^\d{6}$/.test(full) && parseInt(full[5], 10) % 2 === 0);
      if (ok) {
        setBusy(false);
        onApprove();
      } else {
        setBusy(false);
        setError("That code didn’t match. Try again.");
        setCode(["", "", "", "", "", ""]);
        if (inputs.current[0]) inputs.current[0].focus();
      }
    }, 600);
  };

  const resend = () => {
    if (resendIn > 0) return;
    setResendIn(30);
    onToast && onToast("New code sent to finance@acmetrading.com");
  };

  const amtNum = parseFloat(String(amount).replace(/,/g, "")) || 0;

  return (
    <div className="pay-approve">
      <div className="pay-flow-card">
        <div className="pay-approve-icon">
          <PIcon.shield />
        </div>
        <div className="pay-approve-title">
          {method === "totp" ? "Approve with your authenticator" : "Approve with email code"}
        </div>
        <div className="pay-approve-sub">
          {method === "totp"
            ? "Open your authenticator app and enter the 6-digit code for Onboard."
            : "We sent a 6-digit code to finance@acmetrading.com. It expires in 10 minutes."}
        </div>

        <div className="pay-approve-summary">
          <div className="row">
            <div className="lb">Sending</div>
            <div className="vl">{`${srcCcy} ${fmt(amtNum)}`}</div>
          </div>
          <div className="row">
            <div className="lb">To</div>
            <div className="vl">{`${recipient.name} · ${dstCcy} ${fmt(receive)}`}</div>
          </div>
        </div>

        <div className={"pay-otp-row" + (error ? " err" : "")}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              className="pay-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete={method === "email" ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              disabled={busy}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={i === 0 ? onPaste : undefined}
              aria-label={`Digit ${i + 1} of 6`} />
          ))}
        </div>

        {error && <div className="pay-approve-err">{error}</div>}

        <div className="pay-approve-meta">
          {method === "email" ? (
            <button className="pay-approve-back" onClick={resend} disabled={resendIn > 0}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          ) : (
            <span className="hint">Tip: codes refresh every 30 seconds.</span>
          )}
          <button
            className="pay-approve-altmethod"
            onClick={() => setMethodPickerOpen(true)}
            disabled={busy}>
            Use a different method
          </button>
        </div>

        <div className="pay-approve-actions">
          <button
            className="btn btn-lg pay-approve-primary"
            onClick={() => submit(code.join(""))}
            disabled={busy || code.some((d) => !d)}>
            {busy ? "Verifying…" : (<>{<PIcon.shield />} Approve & send</>)}
          </button>
          <button className="pay-approve-back" onClick={onBack} disabled={busy}>← Back to review</button>
        </div>

        {methodPickerOpen && (
          <div className="pay-method-sheet-bg" onClick={() => setMethodPickerOpen(false)}>
            <div className="pay-method-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pay-method-sheet-head">
                <div>
                  <div className="t">Choose a verification method</div>
                  <div className="s">We use this just to confirm it’s you approving the payment.</div>
                </div>
                <button className="pay-method-sheet-x" onClick={() => setMethodPickerOpen(false)} aria-label="Close">×</button>
              </div>
              <button
                className={"pay-method-opt" + (method === "totp" ? " on" : "")}
                onClick={() => { switchMethod("totp"); setMethodPickerOpen(false); }}>
                <span className="ic"><PIcon.shield /></span>
                <span className="meta">
                  <span className="t">Authenticator app <span className="rec">Recommended</span></span>
                  <span className="s">Use the 6-digit code from your authenticator app.</span>
                </span>
                {method === "totp" && <span className="chk"><PIcon.check /></span>}
              </button>
              <button
                className={"pay-method-opt" + (method === "email" ? " on" : "")}
                onClick={() => { switchMethod("email"); setMethodPickerOpen(false); }}>
                <span className="ic"><PIcon.email /></span>
                <span className="meta">
                  <span className="t">Email code</span>
                  <span className="s">We’ll email a 6-digit code to finance@acmetrading.com.</span>
                </span>
                {method === "email" && <span className="chk"><PIcon.check /></span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Confirmation
// =====================================================
function SendConfirmation({ payment, reference, onDone, onNewPayment }) {
  const { recipient, srcCcy, dstCcy, amount, receive } = payment;
  return (
    <div className="pay-confirm">
      <div className="pay-flow-card">
        <div className="pay-confirm-icon">
          <PIcon.check />
        </div>
        <div className="pay-confirm-title">Payment on its way</div>
        <div className="pay-confirm-sub">
          {`${srcCcy} ${fmt(parseFloat(String(amount).replace(/,/g,"")) || 0)} sent · ${recipient.name} will receive ${dstCcy} ${fmt(receive)}`}
        </div>

        <div className="pay-confirm-ref">
          <div className="lb">Reference number</div>
          <div className="ref">{reference}</div>
          <div className="pay-confirm-meta">
            <div className="m">
              <PIcon.clock />
              <span className="t">Expected settlement</span>
              <span className="s">Within 0–10 minutes</span>
            </div>
            <div className="m">
              <PIcon.email />
              <span className="t">Receipt sent to</span>
              <span className="s">finance@acmetrading.com</span>
            </div>
          </div>
        </div>

        <div className="pay-confirm-actions">
          <button className="btn btn-soft" onClick={onDone}><PIcon.external /> View transaction</button>
          <button className="btn" onClick={onNewPayment}>Send another payment</button>
        </div>
      </div>
    </div>
  );
}

window.OBSendPayment = {
  SendPayment,
  ReviewPayment,
  PaymentApprovalStep,
  SendConfirmation,
  RECIPIENTS,
};
