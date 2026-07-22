/* global React */
/* Flex Business Cards — adaptive port of v0/screens-cards.jsx. */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;
const Data = window.OBData;
const { Page, Sheet, Pill, useIsDesktop, DemoCta } = window.OBPrimitives;

const CARD_BG = "../v0/design-system/assets/card-bg.svg";
const MOCK_CARDHOLDER = "Amara Nwosu";
const BILLING_ADDRESS = { street: "14 Admiralty Way", city: "Lekki", state: "Lagos", zip: "106104", country: "Nigeria" };
const CARD_CREATION_FEE = 5;
const CARD_FUNDING_FEE_PCT = 0.005;
const NAME_SUGGESTIONS = ["Marketing", "Operations", "Travel", "Software", "Ads & media", "Office supplies"];
const fmtBal = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_TXNS = [
  { id: "CTX-W01", date: "Jun 28, 14:10", party: "Withdrawal to USD wallet", type: "withdrawal", amount: "150.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", ref: "TXN-W01-4821" },
  { id: "CTX-001", date: "Jun 25, 14:32", party: "Figma Inc.",               type: "purchase",   amount: "45.00",    ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Software & SaaS",     merchantCountry: "United States",  ref: "TXN-001-4821" },
  { id: "CTX-002", date: "Jun 24, 09:17", party: "Google Workspace",         type: "purchase",   amount: "138.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Software & SaaS",     merchantCountry: "United States",  ref: "TXN-002-4821" },
  { id: "CTX-003", date: "Jun 22, 11:05", party: "Amazon Web Services",      type: "purchase",   amount: "1,247.83", ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Cloud Infrastructure", merchantCountry: "United States",  ref: "TXN-003-4821" },
  { id: "CTX-004", date: "Jun 20, 16:41", party: "Notion Labs",              type: "purchase",   amount: "96.00",    ccy: "USD", fxAmount: "88.50", fxCcy: "EUR", fxRate: "1 EUR = 1.085 USD", fxFee: "1.44", status: "COMPLETED", pillTone: "success", category: "Productivity",         merchantCountry: "United States",  ref: "TXN-004-4821" },
  { id: "CTX-005", date: "Jun 18, 08:55", party: "Linear Inc.",              type: "purchase",   amount: "80.00",    ccy: "USD", fxAmount: "63.50", fxCcy: "GBP", fxRate: "1 GBP = 1.260 USD", fxFee: "1.20", status: "PENDING",   pillTone: "warn",    category: "Software & SaaS",     merchantCountry: "United Kingdom", ref: "TXN-005-4821" },
  { id: "CTX-006", date: "Jun 15, 13:20", party: "Vercel Inc.",              type: "purchase",   amount: "240.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Cloud Infrastructure", merchantCountry: "United States",  ref: "TXN-006-4821" },
  { id: "CTX-F01", date: "Jun 10, 10:03", party: "Top-up from USD wallet",   type: "funding",    amount: "500.00",   ccy: "USD", fee: "2.50", netFunded: "497.50",         status: "COMPLETED", pillTone: "success", ref: "TXN-F01-4821" },
  { id: "CTX-C01", date: "Jun 10, 09:58", party: "Card creation fee",        type: "creation",   amount: "5.00",     ccy: "USD",                                          status: "COMPLETED", pillTone: "success", ref: "TXN-C01-4821" },
];

function copyText(text, onToast, label) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  onToast && onToast(label ? `${label} copied` : "Copied");
}

// =====================================================
// Card visual — desktop keeps hover-then-click reveal/copy with tooltips;
// mobile drops hover entirely (tap reveals, tap again copies, toast confirms —
// hover states have no touch equivalent and risk sticking on tap).
// =====================================================
function CardVisual({ card, compact, fillWidth, interactive, onToast }) {
  const isDesktop = useIsDesktop();
  const [revealed, setRevealed] = useState(false);
  const [hoverField, setHoverField] = useState(null);

  const status = card.status;
  const activating = status === "activating";
  const failed = status === "failed";
  const frozen = status === "frozen";
  const muted = frozen || activating || failed;
  const canInteract = interactive && !activating && !failed;

  const w = fillWidth ? "100%" : compact ? 260 : 380;
  const h = fillWidth ? "auto" : compact ? 164 : 240;
  const pad = compact ? 18 : 24;
  const numSize = compact ? 14 : 17;
  const labelSize = compact ? 8.5 : 10;
  const valSize = compact ? 10.5 : 12;
  const balSize = compact ? 16 : 22;
  const bal = (card.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleClick = (field) => (e) => {
    if (!canInteract) return;
    if (!revealed) { setRevealed(true); return; }
    e.stopPropagation();
    if (field === "number") copyText(card.number.replace(/\s/g, ""), onToast, "Card number");
    else if (field === "exp") copyText(card.expiry, onToast, "Expiry");
    else if (field === "cvv") copyText(card.cvv, onToast, "CVV");
  };

  const hlNum = isDesktop && canInteract && hoverField !== null && (!revealed || hoverField === "number");
  const hlExp = isDesktop && canInteract && hoverField !== null && (!revealed || hoverField === "exp");
  const hlCvv = isDesktop && canInteract && hoverField !== null && (!revealed || hoverField === "cvv");

  const cardTip = (field) => {
    if (!isDesktop || !canInteract || hoverField !== field) return null;
    const text = revealed ? "Click to copy" : "Click to reveal";
    return <span className="card-tip">{text}</span>;
  };

  const hoverProps = (field) => isDesktop ? { onMouseEnter: () => setHoverField(field), onMouseLeave: () => setHoverField(null) } : {};

  const statusLabel = frozen ? "Frozen" : activating ? "Activating" : failed ? "Failed" : null;

  return (
    <div className={`card-visual ${muted ? "muted" : ""} ${frozen ? "frozen" : ""} ${failed ? "failed" : ""}`}
         style={{ width: w, height: h, borderRadius: compact ? 14 : 16, aspectRatio: fillWidth ? "380/240" : undefined, backgroundImage: `url(${CARD_BG})`, paddingTop: compact ? 14 : 18, paddingLeft: pad, paddingRight: pad, paddingBottom: pad }}>
      {activating && <style>{`@keyframes cardPulse{0%,100%{opacity:.75}50%{opacity:.95}}`}</style>}
      <div className="card-visual-content">
        <div>
          <div style={{ fontSize: compact ? 12 : 15, fontWeight: 500, letterSpacing: "0.02em" }}>Flex Business</div>
          {statusLabel && <div className={`card-status-badge ${failed ? "failed" : ""}`}>{statusLabel}</div>}
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <div style={{ marginBottom: compact ? 8 : 12 }}>
            <div className="card-field" {...hoverProps("number")} onClick={handleClick("number")}
                 style={{ fontSize: numSize, fontWeight: 500, letterSpacing: "0.12em", background: hlNum ? "rgba(255,255,255,.15)" : "transparent", cursor: canInteract ? "pointer" : "default" }}>
              {revealed && canInteract ? card.number : `•••• •••• •••• ${card.last4}`}
              {cardTip("number")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: compact ? 16 : 24 }}>
              <div className="card-field" {...hoverProps("exp")} onClick={handleClick("exp")}
                   style={{ background: hlExp ? "rgba(255,255,255,.15)" : "transparent", cursor: canInteract ? "pointer" : "default" }}>
                <div className="card-field-lbl" style={{ fontSize: labelSize }}>Exp</div>
                <div style={{ fontSize: valSize, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{revealed && canInteract ? card.expiry : "••/••"}</div>
                {cardTip("exp")}
              </div>
              <div className="card-field" {...hoverProps("cvv")} onClick={handleClick("cvv")}
                   style={{ background: hlCvv ? "rgba(255,255,255,.15)" : "transparent", cursor: canInteract ? "pointer" : "default" }}>
                <div className="card-field-lbl" style={{ fontSize: labelSize }}>CVV</div>
                <div style={{ fontSize: valSize, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{revealed && canInteract ? card.cvv : "•••"}</div>
                {cardTip("cvv")}
              </div>
            </div>
            {!activating && !failed && (
              <div style={{ fontSize: balSize, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>${bal}</div>
            )}
          </div>
        </div>
      </div>
      {activating && <div className="card-visual-pulse" />}
    </div>
  );
}

function CardTile({ card, onClick }) {
  const activating = card.status === "activating";
  const failed = card.status === "failed";
  return (
    <div className="card-tile" onClick={onClick}>
      <CardVisual card={card} compact fillWidth />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)" }}>{card.name}</div>
        {activating ? (
          <div className="card-tile-status"><span className="spin" style={{ width: 12, height: 12 }} /><span style={{ color: "var(--purple-600,#7C3AED)", fontWeight: 500 }}>Activating…</span></div>
        ) : failed ? (
          <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 500, marginTop: 4 }}>Activation failed</div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
            Virtual · ••{card.last4}
            {card.status === "frozen" && <span style={{ color: "var(--info-700)", marginLeft: 6 }}>· Frozen</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Card transactions — table on desktop, card rows on mobile. Reused by the
// list page (all cards, shows a Card column) and the detail page (one card).
// =====================================================
function CardTxnValue({ tx, mobile }) {
  const isFx = !!tx.fxCcy;
  const isCredit = tx.type === "funding";
  const sign = isCredit ? "+" : "−";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: mobile ? 13.5 : 13.5, color: isCredit ? "var(--success-700)" : "var(--gray-900)" }}>
        {sign}{isFx ? tx.fxAmount : tx.amount}
        <span style={{ color: "var(--gray-500)", fontWeight: 500, fontSize: 12, marginLeft: 4 }}>{isFx ? tx.fxCcy : tx.ccy}</span>
      </span>
      {isFx && <span style={{ fontSize: 11, color: "var(--gray-400)", fontVariantNumeric: "tabular-nums" }}>≈ {sign}${tx.amount} USD</span>}
    </div>
  );
}

function CardTxnList({ txns, onOpen, showCard }) {
  const isDesktop = useIsDesktop();
  if (txns.length === 0) {
    return (
      <div className="empty" style={{ padding: "40px 0" }}>
        <div className="ic"><Icon.card style={{ width: 28, height: 28 }} /></div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-700)", marginBottom: 4 }}>No transactions yet</div>
        <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>Transactions will appear here once your card is active.</div>
      </div>
    );
  }
  if (isDesktop) {
    return (
      <table className="records-table">
        <thead><tr>
          <th>Merchant</th>
          {showCard && <th>Card</th>}
          <th>Date</th>
          <th>Status</th>
          <th className="num">Amount</th>
        </tr></thead>
        <tbody>
          {txns.map((tx) => (
            <tr key={tx.id} onClick={() => onOpen(tx)}>
              <td style={{ fontWeight: 500, color: "var(--gray-900)" }}>{tx.party}</td>
              {showCard && <td style={{ color: "var(--gray-500)", fontSize: 12.5 }}>{tx.card ? <>{tx.card.name} <span style={{ fontVariantNumeric: "tabular-nums" }}>••{tx.card.last4}</span></> : "—"}</td>}
              <td style={{ color: "var(--gray-600)", fontSize: 12.5 }}>{tx.date}</td>
              <td><Pill tone={tx.pillTone}>{tx.status}</Pill></td>
              <td className="num"><CardTxnValue tx={tx} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <div className="records-list">
      {txns.map((tx) => {
        const isCredit = tx.type === "funding";
        return (
          <div key={tx.id} className="records-row" onClick={() => onOpen(tx)}>
            <div className={`ic ${isCredit ? "in" : "out"}`}>{isCredit ? <Icon.arrowDownLeft /> : <Icon.card />}</div>
            <div className="mid">
              <div className="party">{tx.party}</div>
              <div className="sub">{showCard && tx.card ? `${tx.card.name} · ` : ""}{tx.date}</div>
            </div>
            <CardTxnValue tx={tx} mobile />
          </div>
        );
      })}
    </div>
  );
}

function CardTxnDetailSheet({ tx, card, onClose, onToast }) {
  if (!tx) return null;
  const isFx = !!tx.fxCcy;
  const isCredit = tx.type === "funding";
  const sign = isCredit ? "+" : "−";
  const rows = [
    { label: "Date & time", value: tx.date },
    tx.type === "funding" && { label: "Source", value: "USD wallet balance" },
    tx.type === "funding" && tx.fee && { label: "Funding fee", value: `0.5% ($${tx.fee})` },
    tx.type === "funding" && tx.netFunded && { label: "Net funded", value: `$${tx.netFunded}` },
    tx.type === "withdrawal" && { label: "Destination", value: "USD wallet balance" },
    isFx && { label: "Exchange rate", value: tx.fxRate },
    isFx && tx.fxFee && { label: "FX fee", value: `1.5% ($${tx.fxFee})` },
    card && { label: "Card", value: `${card.name} ••${card.last4}` },
    tx.category && { label: "Category", value: tx.category },
    tx.merchantCountry && { label: "Merchant country", value: tx.merchantCountry },
    { label: "Reference", value: tx.ref, copy: true },
  ].filter(Boolean);

  return (
    <Sheet open={!!tx} onClose={onClose} title={tx.party}>
      <div style={{ marginBottom: 12 }}><Pill tone={tx.pillTone}>{tx.status}</Pill></div>
      <div style={{ textAlign: "center", padding: "8px 0 20px", borderBottom: "1px solid var(--gray-100)", marginBottom: 4 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: isCredit ? "var(--success-700)" : "var(--gray-900)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          {sign}{isFx ? tx.fxAmount : `$${tx.amount}`}
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--gray-500)", marginLeft: 6 }}>{isFx ? tx.fxCcy : "USD"}</span>
        </div>
        {isFx && <div style={{ fontSize: 12.5, color: "var(--gray-500)", marginTop: 6 }}>≈ {sign}${tx.amount} USD charged to card</div>}
      </div>
      <div className="pay-review-list" style={{ paddingTop: 0 }}>
        {rows.map((row) => (
          <div className="row-item" key={row.label}>
            <div className="k">{row.label}</div>
            <div className="v">
              {row.value}
              {row.copy && <button className="copy-inline" onClick={() => copyText(row.value, onToast, "Reference")}><Icon.copy /></button>}
            </div>
          </div>
        ))}
      </div>
      <div className="set-modal-foot" style={{ justifyContent: "center" }}>
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "var(--gray-600)" }}>Report an issue</button>
      </div>
    </Sheet>
  );
}

// =====================================================
// Fund card
// =====================================================
function FundCardSheet({ card, onClose, onFund }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form");
  const parsed = parseFloat(amount) || 0;
  const usdBalance = Data.V0_USD_BALANCE;
  const tooLow = amount !== "" && parsed < 1;
  const tooHigh = parsed > usdBalance;
  const valid = parsed >= 1 && !tooHigh;
  const fundingFee = valid ? parsed * CARD_FUNDING_FEE_PCT : 0;
  const netAmount = parsed - fundingFee;

  const handleSubmit = () => { if (!valid) return; setStep("processing"); setTimeout(() => setStep("done"), 1600); };
  const close = step === "processing" ? () => {} : onClose;

  return (
    <Sheet open onClose={close} title={step === "form" ? "Fund card" : ""}>
      {step === "processing" && (
        <div style={{ padding: "24px 0 12px", textAlign: "center" }}>
          <span className="spin" style={{ width: 40, height: 40, margin: "0 auto 20px", display: "block" }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6 }}>Funding card</div>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Adding ${parsed.toFixed(2)} to {card.name}…</div>
        </div>
      )}
      {step === "done" && (
        <>
          <div style={{ padding: "8px 0 16px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 16px", borderRadius: "50%", background: "var(--success-100)", display: "grid", placeItems: "center" }}><Icon.check style={{ width: 22, height: 22, color: "var(--success-700)" }} /></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)" }}>{card.name} ••{card.last4} funded</div>
          </div>
          <div className="pay-review-list" style={{ paddingTop: 0 }}>
            <div className="row-item"><div className="k">Amount funded</div><div className="v">${fmtBal(parsed)}</div></div>
            <div className="row-item"><div className="k">Funding fee (0.5%)</div><div className="v" style={{ color: "#DC2626" }}>−${fmtBal(fundingFee)}</div></div>
            <div className="row-item"><div className="k">New card balance</div><div className="v strong">${fmtBal((card.balance || 0) + netAmount)}</div></div>
          </div>
          <div className="set-modal-foot"><button className="btn btn-lg" onClick={() => onFund(netAmount)} style={{ width: "100%", justifyContent: "center" }}>Done</button></div>
        </>
      )}
      {step === "form" && (
        <>
          <div style={{ padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12.5, color: "var(--gray-600)" }}>Card balance</span><span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmtBal(card.balance || 0)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12.5, color: "var(--gray-600)" }}>USD balance (source)</span><span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmtBal(usdBalance)}</span></div>
          </div>
          <div className="field">
            <div className="lbl">Amount from USD balance</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
              <input className={`inp${(tooLow || tooHigh) ? " inp-error" : ""}`} type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30 }} autoFocus />
            </div>
            {tooLow && <div className="help" style={{ color: "#DC2626" }}>Minimum $1.00.</div>}
            {tooHigh && <div className="help" style={{ color: "#DC2626" }}>Insufficient funds. Your USD balance is ${fmtBal(usdBalance)}.</div>}
            {valid && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--gray-500)" }}><span>Funding fee (0.5%)</span><span style={{ color: "#DC2626" }}>−${fmtBal(fundingFee)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span style={{ color: "var(--gray-600)" }}>Added to card</span><span style={{ color: "var(--gray-900)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmtBal(netAmount)}</span></div>
              </div>
            )}
          </div>
          <div className="set-modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-lg" onClick={handleSubmit} disabled={!valid}>Fund card</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

// =====================================================
// Withdraw to wallet
// =====================================================
function WithdrawCardSheet({ card, onClose, onWithdraw }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form");
  const cardBalance = card.balance || 0;
  const parsed = parseFloat(amount) || 0;
  const maxWithdraw = Math.max(0, cardBalance - 1);
  const tooLow = amount !== "" && parsed < 1;
  const tooHigh = parsed > maxWithdraw;
  const valid = parsed >= 1 && !tooHigh;
  const close = step === "processing" ? () => {} : onClose;

  const handleSubmit = () => { if (!valid) return; setStep("processing"); setTimeout(() => setStep("done"), 1400); };

  return (
    <Sheet open onClose={close} title={step === "form" ? "Withdraw to wallet" : ""}>
      {step === "processing" && (
        <div style={{ padding: "24px 0 12px", textAlign: "center" }}>
          <span className="spin" style={{ width: 40, height: 40, margin: "0 auto 20px", display: "block" }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6 }}>Withdrawing…</div>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Moving ${parsed.toFixed(2)} to your USD wallet</div>
        </div>
      )}
      {step === "done" && (
        <>
          <div style={{ padding: "8px 0 16px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 16px", borderRadius: "50%", background: "var(--success-100)", display: "grid", placeItems: "center" }}><Icon.check style={{ width: 22, height: 22, color: "var(--success-700)" }} /></div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)" }}>Withdrawal successful</div>
          </div>
          <div className="pay-review-list" style={{ paddingTop: 0 }}>
            <div className="row-item"><div className="k">Amount withdrawn</div><div className="v">${fmtBal(parsed)}</div></div>
            <div className="row-item"><div className="k">Destination</div><div className="v">USD wallet</div></div>
            <div className="row-item"><div className="k">New card balance</div><div className="v strong">${fmtBal(cardBalance - parsed)}</div></div>
          </div>
          <div className="set-modal-foot"><button className="btn btn-lg" onClick={() => onWithdraw(parsed)} style={{ width: "100%", justifyContent: "center" }}>Done</button></div>
        </>
      )}
      {step === "form" && (
        <>
          <div className="field">
            <div className="lbl">Amount</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
              <input className={`inp${(tooLow || tooHigh) ? " inp-error" : ""}`} type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30 }} autoFocus />
            </div>
            {tooLow && <div className="help" style={{ color: "#DC2626" }}>Minimum $1.00.</div>}
            {tooHigh && <div className="help" style={{ color: "#DC2626" }}>Max withdrawal is ${fmtBal(maxWithdraw)} — card must keep a $1.00 minimum balance.</div>}
            {!tooLow && !tooHigh && (
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--gray-500)" }}>
                <span>Available: <strong style={{ color: "var(--gray-700)" }}>${fmtBal(cardBalance)}</strong></span>
                {valid && <span>Remaining: <strong style={{ color: "var(--gray-700)" }}>${fmtBal(cardBalance - parsed)}</strong></span>}
              </div>
            )}
          </div>
          <div style={{ padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span style={{ color: "var(--gray-500)" }}>Destination</span><span style={{ fontWeight: 500, color: "var(--gray-900)" }}>USD wallet</span>
          </div>
          <div className="set-modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-lg" onClick={handleSubmit} disabled={!valid}>Withdraw</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

// =====================================================
// Create card
// =====================================================
function CreateCardSheet({ onClose, onCreate }) {
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const MIN_FUND = CARD_CREATION_FEE + 1;
  const usdBalance = Data.V0_USD_BALANCE;
  const parsed = parseFloat(fundAmount) || 0;
  const validFund = parsed >= MIN_FUND;
  const tooHigh = parsed > usdBalance;
  const fundingFee = validFund ? parsed * CARD_FUNDING_FEE_PCT : 0;
  const cardBalance = validFund ? (parsed - CARD_CREATION_FEE - fundingFee) : 0;
  const canProceed = name.trim() && validFund && !tooHigh;

  const handleConfirm = () => {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    onCreate({
      id: "card-" + Date.now(), name: name.trim(), last4, type: "virtual", status: "activating",
      number: `4539 ${String(Math.floor(1000 + Math.random() * 9000))} ${String(Math.floor(1000 + Math.random() * 9000))} ${last4}`,
      expiry: "06/28", cvv: String(Math.floor(100 + Math.random() * 900)),
      limit: { perTransaction: 5000, daily: 10000, monthly: 25000 }, created: "Jun 28, 2026", balance: cardBalance,
    });
    setStep("done");
  };

  return (
    <Sheet open onClose={onClose} title={step === "review" ? "Confirm card creation" : step === "done" ? "" : "Create new card"}>
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div className="pay-confirm-icon"><Icon.check /></div>
          <div className="pay-confirm-title">Card created</div>
          <div className="pay-confirm-sub">{name.trim()} is activating — it'll be ready to use in a moment.</div>
          <button className="btn btn-lg btn-block" onClick={onClose}>Done</button>
          <DemoCta message="Ready to issue real cards for your team?" campaign="card_confirm" />
        </div>
      )}
      {step === "review" && (
        <>
          <div className="pay-review-list" style={{ paddingTop: 0 }}>
            <div className="row-item"><div className="k">Card name</div><div className="v">{name}</div></div>
            <div className="row-item"><div className="k">Card type</div><div className="v">Virtual</div></div>
            <div className="row-item"><div className="k">Fund amount</div><div className="v">${parsed.toFixed(2)}</div></div>
            <div className="row-item"><div className="k">Creation fee</div><div className="v" style={{ color: "#DC2626" }}>−${CARD_CREATION_FEE.toFixed(2)}</div></div>
            <div className="row-item"><div className="k">Funding fee (0.5%)</div><div className="v" style={{ color: "#DC2626" }}>−${fundingFee.toFixed(2)}</div></div>
            <div className="row-item"><div className="k">Card balance</div><div className="v strong">${cardBalance.toFixed(2)}</div></div>
          </div>
          <div style={{ marginTop: 4, padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-100)", fontSize: 12, color: "var(--gray-600)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--gray-700)" }}>${parsed.toFixed(2)}</strong> will be deducted from your USD balance.
          </div>
          <div className="set-modal-foot">
            <button className="btn btn-ghost" onClick={() => setStep("form")}>Back</button>
            <button className="btn btn-lg" onClick={handleConfirm}>Confirm & create</button>
          </div>
        </>
      )}
      {step === "form" && (
        <>
          <div className="field">
            <div className="lbl">Card name</div>
            <input className="inp" placeholder="e.g. Marketing spend" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="card-name-chips">
              {NAME_SUGGESTIONS.map((s) => (
                <span key={s} role="button" tabIndex={0} onClick={() => setName(s)} className={`card-name-chip ${name === s ? "on" : ""}`}>{s}</span>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="lbl">Card type</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="card-type-opt on">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#6D28D9" }}>Virtual</div><Icon.check style={{ width: 14, height: 14, color: "#7C3AED" }} /></div>
                <div style={{ fontSize: 11.5, color: "#7C3AED", marginTop: 2 }}>Use online or add to wallet.</div>
              </div>
              <div className="card-type-opt disabled">
                <div style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>Physical</div>
                <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>Coming soon</div>
              </div>
            </div>
          </div>
          <div className="field">
            <div className="lbl">Fund from USD balance</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
              <input className={`inp${(fundAmount && !validFund) || tooHigh ? " inp-error" : ""}`} type="number" min={MIN_FUND} step="0.01" placeholder="0.00" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} style={{ paddingLeft: 30 }} />
            </div>
            {fundAmount && !validFund && !tooHigh && <div className="help" style={{ color: "#DC2626" }}>Minimum $6.00 required — $5.00 creation fee + $1.00 minimum balance.</div>}
            {tooHigh && <div className="help" style={{ color: "#DC2626" }}>Insufficient funds. Your USD balance is ${fmtBal(usdBalance)}.</div>}
            {validFund && !tooHigh && <div className="help">After $5.00 creation fee + 0.5% funding fee: <strong style={{ color: "var(--gray-900)" }}>${cardBalance.toFixed(2)}</strong></div>}
          </div>
          <div className="td-banner info" style={{ marginTop: 4 }}>
            <Icon.info />
            <div><div className="s">A one-time <strong>$5.00</strong> creation fee and <strong>0.5%</strong> funding fee apply, both deducted from the funded amount.</div></div>
          </div>
          <div className="set-modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-lg" onClick={() => setStep("review")} disabled={!canProceed}>Review</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function FreezeCardSheet({ card, onClose, onConfirm }) {
  const frozen = card.status === "frozen";
  return (
    <Sheet open onClose={onClose} title={frozen ? "Unfreeze card?" : "Freeze card?"}>
      <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
        {frozen ? <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be able to process new transactions again.</>
                : <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be blocked from processing new transactions immediately.</>}
      </div>
      {!frozen && (
        <div style={{ marginTop: 14, background: "var(--gray-50)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          {["Online and in-store purchases will be declined", "Recurring subscriptions may still process", "You can unfreeze at any time"].map((note) => (
            <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--gray-600)" }}>
              <span style={{ marginTop: 2, color: "var(--gray-400)", flexShrink: 0 }}>•</span>{note}
            </div>
          ))}
        </div>
      )}
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" style={frozen ? {} : { background: "#1D4ED8" }} onClick={onConfirm}>{frozen ? "Unfreeze card" : "Freeze card"}</button>
      </div>
    </Sheet>
  );
}

function CardFeesSheet({ onClose }) {
  const rows = [
    { label: "Card creation", value: "$5.00", note: "One-time, per card" },
    { label: "Funding fee", value: "0.5%", note: "Per top-up transaction" },
    { label: "Monthly fee", value: "Free", note: null },
    { label: "Card transactions", value: "Free", note: null },
    { label: "FX transactions", value: "—", note: "Coming soon" },
  ];
  return (
    <Sheet open onClose={onClose} title="Fee schedule">
      <div>
        {rows.map((r, i, arr) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
            <div><div style={{ fontSize: 13, color: "var(--gray-700)" }}>{r.label}</div>{r.note && <div style={{ fontSize: 11.5, color: "var(--gray-400)", marginTop: 1 }}>{r.note}</div>}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: r.value === "Free" ? "var(--success-700)" : "var(--gray-900)" }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="set-modal-foot"><button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button></div>
    </Sheet>
  );
}

function SpendingLimitsSheet({ card, onClose }) {
  const fmt = (n) => "$" + n.toLocaleString();
  return (
    <Sheet open onClose={onClose} title="Spending limits">
      <div>
        {[{ label: "Per transaction", value: card.limit.perTransaction }, { label: "Daily", value: card.limit.daily }, { label: "Monthly", value: card.limit.monthly }].map((l, i, arr) => (
          <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
            <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{l.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{fmt(l.value)}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 12 }}>Contact support to adjust limits.</div>
      </div>
      <div className="set-modal-foot"><button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button></div>
    </Sheet>
  );
}

function MoreActionsSheet({ open, onClose, onAction }) {
  const items = [
    { key: "limits", icon: <Icon.shield />, label: "Spending limits" },
    { key: "withdraw", icon: <Icon.arrowLeft />, label: "Withdraw to wallet" },
    { key: "fees", icon: <Icon.info />, label: "Fee schedule" },
    { key: "edit", icon: <Icon.pencil />, label: "Edit card name" },
    { key: "cancel", icon: <Icon.trash />, label: "Delete card", danger: true },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="More">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => (
          <div key={it.key} className="sb-item" style={{ borderRight: "none", borderRadius: 8, color: it.danger ? "#DC2626" : undefined }} onClick={() => { onAction(it.key); onClose(); }}>
            {it.icon}<span>{it.label}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// =====================================================
// Card details — cardholder, billing address, add to wallet
// =====================================================
function CardDetailsCard({ card, onToast }) {
  const addr = BILLING_ADDRESS;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;
  return (
    <div className="card" style={{ marginTop: 20, padding: 0 }}>
      <div className="card-detail-row">
        <div className="card-detail-row-head"><span>Cardholder</span><button className="copy-inline" onClick={() => copyText(MOCK_CARDHOLDER, onToast, "Cardholder name")}><Icon.copy /></button></div>
        <div style={{ fontSize: 13.5, color: "var(--gray-900)" }}>{MOCK_CARDHOLDER}</div>
      </div>
      <div className="card-detail-row">
        <div className="card-detail-row-head"><span>Billing address</span><button className="copy-inline" onClick={() => copyText(fullAddress, onToast, "Full address")}><Icon.copy /></button></div>
        <div style={{ fontSize: 13.5, color: "var(--gray-800)", lineHeight: 1.7 }}>
          <div>{addr.street}</div>
          <div>{addr.city}, {addr.state} {addr.zip}</div>
          <div>{addr.country}</div>
        </div>
      </div>
      <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12.5, padding: "10px 12px", gap: 8, border: "1px solid var(--gray-200)", borderRadius: 8 }} onClick={() => onToast("Added to Apple Pay")}>
          <img src="../v0/design-system/assets/apple-wallet.svg" style={{ height: 15 }} /> Apple Pay
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12.5, padding: "10px 12px", gap: 8, border: "1px solid var(--gray-200)", borderRadius: 8 }} onClick={() => onToast("Added to Google Pay")}>
          <img src="../v0/design-system/assets/google-wallet.svg" style={{ height: 15 }} /> Google Pay
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Cards list page
// =====================================================
function CardsListPage({ cards, onSelect, onCreateCard }) {
  const allTxns = CARD_TXNS.map((tx, i) => ({ ...tx, card: cards[i % Math.max(cards.length, 1)] }));
  const [selectedTxn, setSelectedTxn] = useState(null);

  return (
    <Page>
      <div className="page-head">
        <div><h1 className="title">Cards</h1><p className="subtitle">Manage your Flex Business virtual cards.</p></div>
        <button className="btn btn-lg" onClick={onCreateCard}><Icon.plus style={{ width: 15, height: 15 }} /> Create card</button>
      </div>

      <div className="cards-scroll rail-tabs" style={{ display: "flex", gap: 20, border: "none", marginBottom: 28 }}>
        {cards.map((c) => <div key={c.id} style={{ flexShrink: 0 }}><CardTile card={c} onClick={() => onSelect(c)} /></div>)}
        <div className="card-new-tile" onClick={onCreateCard}>
          <Icon.plus style={{ width: 20, height: 20, color: "var(--gray-600)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>New card</span>
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="records-card">
          <div className="records-head"><h2>Card transactions</h2><span className="meta">{allTxns.length} transactions</span></div>
          <CardTxnList txns={allTxns} onOpen={setSelectedTxn} showCard />
        </div>
      ) : (
        <div className="card">
          <div className="empty">
            <div className="ic"><Icon.card style={{ width: 36, height: 36 }} /></div>
            <div style={{ fontWeight: 500, color: "var(--gray-900)", marginBottom: 4, fontSize: 14 }}>No cards yet</div>
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", maxWidth: 360, margin: "4px auto 16px", lineHeight: 1.6 }}>Create a virtual card to start making payments online or add to Apple Pay and Google Pay.</div>
            <button className="btn btn-lg" onClick={onCreateCard}>Create your first card</button>
          </div>
        </div>
      )}
      <CardTxnDetailSheet tx={selectedTxn} card={selectedTxn?.card} onClose={() => setSelectedTxn(null)} />
    </Page>
  );
}

// =====================================================
// Card detail page
// =====================================================
function CardDetailPage({ card, onBack, onToast, onUpdateCard, onDeleteCard }) {
  const [showFund, setShowFund] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [nameVal, setNameVal] = useState(card.name);
  const frozen = card.status === "frozen";
  const activating = card.status === "activating";
  const failed = card.status === "failed";
  const usable = card.status === "active" || card.status === "frozen";

  const handleFreeze = () => { onUpdateCard({ ...card, status: frozen ? "active" : "frozen" }); onToast(frozen ? "Card unfrozen" : "Card frozen"); setShowFreeze(false); };
  const handleSaveName = () => { if (nameVal.trim() && nameVal.trim() !== card.name) { onUpdateCard({ ...card, name: nameVal.trim() }); onToast("Card name updated"); } setEditingName(false); };
  const handleFund = (amount) => { onUpdateCard({ ...card, balance: (card.balance || 0) + amount }); setShowFund(false); onToast(`$${amount.toFixed(2)} added`); };
  const handleWithdraw = (amount) => { onUpdateCard({ ...card, balance: Math.max(0, (card.balance || 0) - amount) }); setShowWithdraw(false); onToast(`$${amount.toFixed(2)} withdrawn to USD wallet`); };
  const handleRetry = () => { onUpdateCard({ ...card, status: "activating" }); onToast("Retrying activation…"); };
  const handleMoreAction = (key) => {
    if (key === "limits") setShowLimits(true);
    else if (key === "withdraw") setShowWithdraw(true);
    else if (key === "fees") setShowFees(true);
    else if (key === "edit") setEditingName(true);
    else if (key === "cancel") { onDeleteCard(card.id); onToast("Card deleted"); }
  };

  return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Cards</a>
        <span className="crumb-sep">/</span><span className="crumb-current">Card details</span>
      </div>

      {editingName ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <input className="inp" value={nameVal} onChange={(e) => setNameVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setNameVal(card.name); setEditingName(false); } }} style={{ fontSize: 18, fontWeight: 700, padding: "6px 10px", maxWidth: 280 }} autoFocus />
          <button className="btn btn-sm" onClick={handleSaveName}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setNameVal(card.name); setEditingName(false); }}>Cancel</button>
        </div>
      ) : (
        <h1 className="title" style={{ marginBottom: 4 }}>{card.name}</h1>
      )}
      <p className="subtitle" style={{ marginBottom: 20 }}>Virtual · Created {card.created}</p>

      <div className="card-detail-grid">
        <div className="card-detail-left">
          <CardVisual card={card} fillWidth interactive onToast={onToast} />

          {activating && (
            <div className="card" style={{ marginTop: 16, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span className="spin" style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)", marginBottom: 3 }}>Activation in progress</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>We're setting up your card. This usually takes a few minutes. You'll be notified when it's ready to use.</div>
              </div>
            </div>
          )}

          {failed && (
            <div className="card" style={{ marginTop: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FEE2E2", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}><span style={{ color: "#DC2626", fontWeight: 700, fontSize: 13 }}>!</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#991B1B", marginBottom: 3 }}>Activation failed</div>
                  <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>Something went wrong. Your funds have not been charged.</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button className="btn btn-sm" onClick={handleRetry}>Retry</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#DC2626", gap: 6 }} onClick={() => { onDeleteCard(card.id); onToast("Card cancelled"); }}><Icon.trash style={{ width: 13, height: 13 }} /> Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {usable && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-lg" style={{ flex: 1, fontSize: 13, padding: "10px 12px", justifyContent: "center" }} onClick={() => setShowFund(true)}><Icon.plus style={{ width: 14, height: 14 }} /> Fund</button>
              <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13, padding: "10px 12px", gap: 6, justifyContent: "center", border: "1.5px solid var(--gray-300)", color: frozen ? "var(--success-700)" : "var(--gray-700)" }} onClick={() => setShowFreeze(true)}>
                {frozen ? <><Icon.zap style={{ width: 14, height: 14 }} /> Unfreeze</> : <><Icon.snowflake style={{ width: 14, height: 14 }} /> Freeze</>}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: "10px 14px", justifyContent: "center", gap: 5, border: "1.5px solid var(--gray-300)", color: "var(--gray-700)" }} onClick={() => setShowMore(true)}>
                More <Icon.arrowDown style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}

          {usable && <CardDetailsCard card={card} onToast={onToast} />}
        </div>

        <div className="card-detail-right">
          <div className="records-card">
            <div className="records-head"><h2>Card transactions</h2><span className="meta">{usable ? CARD_TXNS.length : 0} transactions</span></div>
            {usable ? <CardTxnList txns={CARD_TXNS} onOpen={setSelectedTxn} /> : (
              <div className="empty" style={{ padding: "40px 0" }}>
                <div className="ic"><Icon.card style={{ width: 28, height: 28 }} /></div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-700)", marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>Transactions will appear here once your card is active.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFund && <FundCardSheet card={card} onClose={() => setShowFund(false)} onFund={handleFund} />}
      {showWithdraw && <WithdrawCardSheet card={card} onClose={() => setShowWithdraw(false)} onWithdraw={handleWithdraw} />}
      {showFreeze && <FreezeCardSheet card={card} onClose={() => setShowFreeze(false)} onConfirm={handleFreeze} />}
      {showLimits && <SpendingLimitsSheet card={card} onClose={() => setShowLimits(false)} />}
      {showFees && <CardFeesSheet onClose={() => setShowFees(false)} />}
      <MoreActionsSheet open={showMore} onClose={() => setShowMore(false)} onAction={handleMoreAction} />
      <CardTxnDetailSheet tx={selectedTxn} card={card} onClose={() => setSelectedTxn(null)} />
    </Page>
  );
}

// =====================================================
// Apply page (cardsAccess === "not_applied")
// =====================================================
function CardsApplyPage({ onApply }) {
  return (
    <Page>
      <div className="cards-apply">
        <div className="cards-apply-eyebrow">Flex Business Cards</div>
        <h1 className="cards-apply-h1">Spend flexibly, anywhere</h1>
        <p className="cards-apply-lede">Issue virtual cards with granular spending limits. Use online or add to Apple Pay and Google Pay.</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div className="cards-apply-visual">
            <div style={{ fontSize: 14, fontWeight: 400, letterSpacing: "0.02em" }}>Flex Business</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 16, letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums", marginBottom: 14 }}>•••• •••• •••• ••••</div>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase" }}>Exp</div><div style={{ fontSize: 11 }}>••/••</div></div>
              <div><div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase" }}>CVV</div><div style={{ fontSize: 11 }}>•••</div></div>
            </div>
          </div>
        </div>
        <div className="cards-apply-features">
          {[
            { icon: <Icon.zap />, title: "Instant virtual cards", desc: "Create and use immediately — no waiting for delivery." },
            { icon: <Icon.shield />, title: "Spending controls", desc: "Set per-transaction, daily, and monthly limits." },
            { icon: <Icon.globe />, title: "Use anywhere", desc: "Accepted online worldwide. Add to Apple Pay or Google Pay." },
          ].map((f) => (
            <div key={f.title} className="cards-apply-feature">
              <div className="cards-apply-feature-ic">{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-lg" style={{ padding: "12px 32px", fontSize: 14 }} onClick={onApply}>Apply for cards</button>
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 10 }}>$5.00 creation fee per card. Cards are funded from your USD balance.</div>
      </div>
    </Page>
  );
}

// =====================================================
// Root
// =====================================================
function CardsScreen({ onToast, cardsAccess = "active" }) {
  const [cards, setCards] = useState(() => [...Data.CARDS]);
  const [view, setView] = useState("list");
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  if (cardsAccess === "not_applied") {
    return <CardsApplyPage onApply={() => onToast("Application submitted — we'll review and get back to you.")} />;
  }

  const handleSelect = (card) => { setSelectedCard(card); setView("detail"); };
  const handleBack = () => { setSelectedCard(null); setView("list"); };
  const handleCreate = (newCard) => {
    setCards((prev) => [...prev, newCard]);
    onToast(`${newCard.name} is being activated…`);
    setTimeout(() => setCards((prev) => prev.map((c) => c.id === newCard.id && c.status === "activating" ? { ...c, status: "active" } : c)), 30000);
  };
  const handleUpdate = (updated) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCard(updated);
    if (updated.status === "activating") {
      setTimeout(() => setCards((prev) => prev.map((c) => c.id === updated.id && c.status === "activating" ? { ...c, status: "active" } : c)), 4000);
    }
  };
  const handleDelete = (id) => { setCards((prev) => prev.filter((c) => c.id !== id)); setSelectedCard(null); setView("list"); };

  if (view === "detail" && selectedCard) {
    const liveCard = cards.find((c) => c.id === selectedCard.id);
    if (!liveCard) { setView("list"); return null; }
    return <CardDetailPage card={liveCard} onBack={handleBack} onToast={onToast} onUpdateCard={handleUpdate} onDeleteCard={handleDelete} />;
  }

  return (
    <>
      <CardsListPage cards={cards} onSelect={handleSelect} onCreateCard={() => setShowCreate(true)} />
      {showCreate && <CreateCardSheet onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </>
  );
}

window.OBCards = { CardsScreen };
