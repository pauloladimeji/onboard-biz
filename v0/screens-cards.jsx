/* global React */
const { useState, useEffect, useRef } = React;

const _Icon = window.OBIcon;
const _Data = window.OBData;

const CARD_BG = "design-system/assets/card-bg.svg";

const MOCK_CARDHOLDER = "Amara Nwosu";

const BILLING_ADDRESS = {
  street: "14 Admiralty Way",
  city: "Lekki",
  state: "Lagos",
  zip: "106104",
  country: "Nigeria",
};

function copyText(text, onToast, label) {
  navigator.clipboard.writeText(text).then(() => onToast(label ? `${label} copied` : "Copied"));
}

// =====================================================
// Tooltip helper
// =====================================================
function Tooltip({ text }) {
  return (
    <span style={{
      position: "absolute", left: "50%", bottom: "calc(100% + 6px)", transform: "translateX(-50%)",
      whiteSpace: "nowrap", fontSize: 10.5, fontWeight: 500, color: "#fff",
      background: "var(--gray-900)", borderRadius: 5, padding: "3px 8px",
      pointerEvents: "none", zIndex: 10,
    }}>{text}</span>
  );
}

// =====================================================
// Copyable inline field — hover highlights + tooltip
// =====================================================
function CopyableField({ value, label, onToast, style }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      style={{
        cursor: "pointer", position: "relative", borderRadius: 4,
        padding: "1px 4px", display: "inline-block",
        transition: "background .1s", background: hover ? "var(--gray-100)" : "transparent", ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); copyText(value, onToast, label); }}
    >
      {value}
      {hover && <Tooltip text="Click to copy" />}
    </span>
  );
}

// =====================================================
// Copy icon button with tooltip
// =====================================================
function CopyIconBtn({ text, label, onToast }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      onClick={() => copyText(text, onToast, label)}
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", position: "relative", color: hover ? "var(--gray-600)" : "var(--gray-400)", transition: "color .1s" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <_Icon.copy style={{ width: 13, height: 13 }} />
      {hover && (
        <span style={{
          position: "absolute", left: 0, bottom: "calc(100% + 6px)",
          whiteSpace: "nowrap", fontSize: 10.5, fontWeight: 500, color: "#fff",
          background: "var(--gray-900)", borderRadius: 5, padding: "3px 8px",
          pointerEvents: "none", zIndex: 10,
        }}>Copy {label}</span>
      )}
    </span>
  );
}

// =====================================================
// Card visual
// =====================================================
function CardVisual({ card, compact, fillWidth, interactive, onToast }) {
  const [revealed, setRevealed] = useState(false);
  // tracks which field is hovered: "number" | "exp" | "cvv" | null
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

  // Pre-reveal: all three highlight when any is hovered.
  // Post-reveal: only the hovered field highlights.
  const hlNum = canInteract && hoverField !== null && (!revealed || hoverField === "number");
  const hlExp = canInteract && hoverField !== null && (!revealed || hoverField === "exp");
  const hlCvv = canInteract && hoverField !== null && (!revealed || hoverField === "cvv");

  const cardTip = (field) => {
    if (!canInteract || hoverField !== field) return null;
    const text = revealed ? "Click to copy" : "Click to reveal";
    return (
      <span style={{
        position: "absolute", left: "50%", bottom: "calc(100% + 6px)",
        transform: "translateX(-50%)", whiteSpace: "nowrap",
        fontSize: 10.5, fontWeight: 500, color: "var(--gray-900)", letterSpacing: "normal",
        background: "#fff", borderRadius: 5, padding: "3px 8px",
        pointerEvents: "none", boxShadow: "0 2px 8px rgba(0,0,0,.15)", zIndex: 5,
      }}>{text}</span>
    );
  };

  const statusLabel = frozen ? "Frozen" : activating ? "Activating" : failed ? "Failed" : null;
  const statusBg = failed ? "rgba(239,68,68,.65)" : "rgba(255,255,255,.18)";

  return (
    <div style={{
      width: w, height: h, borderRadius: compact ? 14 : 16,
      aspectRatio: fillWidth ? "380/240" : undefined,
      backgroundImage: `url(${CARD_BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      color: "#fff", paddingTop: compact ? 14 : 18, paddingLeft: pad, paddingRight: pad, paddingBottom: pad, display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden", flexShrink: 0,
      boxShadow: "none",
    }}>
      {muted && (
        <div style={{
          position: "absolute", inset: 0,
          background: frozen ? "rgba(80,100,130,.65)" : failed ? "rgba(80,80,80,.5)" : "rgba(100,80,160,.3)",
          zIndex: 1,
        }} />
      )}
      {activating && <style>{`@keyframes cardPulse{0%,100%{opacity:.75}50%{opacity:.95}}`}</style>}

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Top: name + optional status badge */}
        <div>
          <div style={{ fontSize: compact ? 12 : 15, fontWeight: 500, letterSpacing: "0.02em" }}>Flex Business</div>
          {statusLabel && (
            <div style={{
              marginTop: 5, display: "inline-block",
              fontSize: 9, fontWeight: 600, background: statusBg,
              borderRadius: 5, padding: "2px 7px", letterSpacing: "0.04em", textTransform: "uppercase",
            }}>{statusLabel}</div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom: number + exp/cvv + balance */}
        <div>
          {/* Card number */}
          <div style={{ marginBottom: compact ? 8 : 12 }}>
            <div
              onClick={handleClick("number")}
              onMouseEnter={() => setHoverField("number")}
              onMouseLeave={() => setHoverField(null)}
              style={{
                display: "inline-block", position: "relative",
                fontSize: numSize, fontWeight: 500, letterSpacing: "0.12em",
                fontVariantNumeric: "tabular-nums",
                cursor: canInteract ? "pointer" : "default",
                borderRadius: 6, padding: "3px 6px",
                background: hlNum ? "rgba(255,255,255,.15)" : "transparent",
                transition: "background .12s",
              }}
            >
              {revealed && canInteract ? card.number : `•••• •••• •••• ${card.last4}`}
              {cardTip("number")}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: compact ? 16 : 24 }}>
              {/* Exp */}
              <div
                onClick={handleClick("exp")}
                onMouseEnter={() => setHoverField("exp")}
                onMouseLeave={() => setHoverField(null)}
                style={{
                  position: "relative", display: "inline-block",
                  cursor: canInteract ? "pointer" : "default",
                  borderRadius: 4, padding: "2px 4px",
                  background: hlExp ? "rgba(255,255,255,.15)" : "transparent",
                  transition: "background .12s",
                }}
              >
                <div style={{ fontSize: labelSize, opacity: 0.6, marginBottom: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>Exp</div>
                <div style={{ fontSize: valSize, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {revealed && canInteract ? card.expiry : "••/••"}
                </div>
                {cardTip("exp")}
              </div>

              {/* CVV */}
              <div
                onClick={handleClick("cvv")}
                onMouseEnter={() => setHoverField("cvv")}
                onMouseLeave={() => setHoverField(null)}
                style={{
                  position: "relative", display: "inline-block",
                  cursor: canInteract ? "pointer" : "default",
                  borderRadius: 4, padding: "2px 4px",
                  background: hlCvv ? "rgba(255,255,255,.15)" : "transparent",
                  transition: "background .12s",
                }}
              >
                <div style={{ fontSize: labelSize, opacity: 0.6, marginBottom: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>CVV</div>
                <div style={{ fontSize: valSize, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {revealed && canInteract ? card.cvv : "•••"}
                </div>
                {cardTip("cvv")}
              </div>
            </div>

            {!activating && !failed && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: balSize, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>${bal}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activating && <div style={{ position: "absolute", inset: 0, zIndex: 0, animation: "cardPulse 2s ease-in-out infinite" }} />}
    </div>
  );
}

function CardTile({ card, onClick }) {
  const activating = card.status === "activating";
  const failed = card.status === "failed";
  return (
    <div onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 260 }}>
      <CardVisual card={card} compact />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)" }}>{card.name}</div>
        {activating ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
            <div style={{ width: 12, height: 12, border: "2px solid var(--gray-200)", borderTopColor: "var(--purple-600)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            <span style={{ fontSize: 12, color: "var(--purple-600)", fontWeight: 500 }}>Activating…</span>
          </div>
        ) : failed ? (
          <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 500, marginTop: 4 }}>Activation failed</div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
            Virtual · ••{card.last4}
            {card.status === "frozen" && <span style={{ color: "var(--info-700)", marginLeft: 6 }}>· Frozen</span>}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// =====================================================
// Fund card modal
// =====================================================
function FundCardModal({ card, onClose, onFund }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form");
  const parsed = parseFloat(amount) || 0;
  const usdBalance = _Data.V0_USD_BALANCE;
  const tooLow = amount !== "" && parsed < 1;
  const tooHigh = parsed > usdBalance;
  const hasError = tooLow || tooHigh;
  const valid = parsed >= 1 && !tooHigh;
  const fundingFee = valid ? parsed * CARD_FUNDING_FEE_PCT : 0;
  const netAmount = parsed - fundingFee;

  const handleSubmit = () => {
    if (!valid) return;
    setStep("processing");
    setTimeout(() => setStep("done"), 1600);
  };

  const fmtBal = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="set-modal-bg" onClick={step === "processing" ? undefined : onClose}>
      <div className="set-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        {step === "processing" && (
          <>
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 20px", border: "3px solid var(--gray-200)", borderTopColor: "var(--purple-600)", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6 }}>Funding card</div>
              <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Adding ${parsed.toFixed(2)} to {card.name}…</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}
        {step === "done" && (
          <>
            <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 16px", borderRadius: "50%", background: "var(--success-100)", display: "grid", placeItems: "center" }}>
                <_Icon.check style={{ width: 22, height: 22, color: "var(--success-700)" }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)" }}>{card.name} ••{card.last4} funded</div>
            </div>
            <div style={{ marginBottom: 20, background: "var(--gray-50)", borderRadius: 10, overflow: "hidden" }}>
              {[
                { label: "Amount funded", value: `$${fmtBal(parsed)}` },
                { label: "Funding fee (0.5%)", value: `−$${fmtBal(fundingFee)}`, fee: true },
                { label: "New card balance", value: `$${fmtBal((card.balance || 0) + netAmount)}`, strong: true },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: row.strong ? 600 : 500, color: row.fee ? "#DC2626" : "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="set-modal-foot" style={{ marginTop: 0 }}>
              <button className="btn btn-lg" onClick={() => onFund(netAmount)} style={{ width: "100%", justifyContent: "center" }}>Done</button>
            </div>
          </>
        )}
        {step === "form" && (
          <>
            <div className="set-modal-head">
              <h3>Fund card</h3>
              <button className="set-modal-x" onClick={onClose}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "var(--gray-600)" }}>Card balance</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmtBal(card.balance || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "var(--gray-600)" }}>USD balance (source)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmtBal(usdBalance)}</span>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="lbl">Amount from USD balance</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
                  <input className={`inp${hasError ? " inp-error" : ""}`} type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30, fontVariantNumeric: "tabular-nums" }} autoFocus />
                </div>
                {tooLow && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Minimum $1.00.</div>}
                {tooHigh && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Insufficient funds. Your USD balance is ${fmtBal(usdBalance)}.</div>}
                {valid && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--gray-500)" }}>
                      <span>Funding fee (0.5%)</span>
                      <span style={{ color: "#DC2626" }}>−${fmtBal(fundingFee)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                      <span style={{ color: "var(--gray-600)" }}>Added to card</span>
                      <span style={{ color: "var(--gray-900)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${fmtBal(netAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-lg" onClick={handleSubmit} disabled={!valid}>Fund card</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Create card modal
// =====================================================
const CARD_CREATION_FEE = 5;
const CARD_FUNDING_FEE_PCT = 0.005;
const NAME_SUGGESTIONS = ["Marketing", "Operations", "Travel", "Software", "Ads & media", "Office supplies"];

function CreateCardModal({ onClose, onCreate }) {
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [type, setType] = useState("virtual");
  const [fundAmount, setFundAmount] = useState("");

  const MIN_FUND = CARD_CREATION_FEE + 1;
  const usdBalance = _Data.V0_USD_BALANCE;
  const parsed = parseFloat(fundAmount) || 0;
  const validFund = parsed >= MIN_FUND;
  const tooHigh = parsed > usdBalance;
  const fundingFee = validFund ? parsed * CARD_FUNDING_FEE_PCT : 0;
  const cardBalance = validFund ? (parsed - CARD_CREATION_FEE - fundingFee) : 0;
  const canProceed = name.trim() && validFund && !tooHigh;
  const fundHasError = fundAmount && (!validFund || tooHigh);

  const fmtBal = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirm = () => {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    onCreate({
      id: "card-" + Date.now(),
      name: name.trim(),
      last4,
      type: "virtual",
      status: "activating",
      number: `4539 ${String(Math.floor(1000 + Math.random() * 9000))} ${String(Math.floor(1000 + Math.random() * 9000))} ${last4}`,
      expiry: "06/28",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      limit: { perTransaction: 5000, daily: 10000, monthly: 25000 },
      created: "Jun 28, 2026",
      balance: cardBalance,
    });
  };

  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        {step === "review" && (
          <>
            <div className="set-modal-head">
              <h3>Confirm card creation</h3>
              <button className="set-modal-x" onClick={onClose}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Card name", value: name },
                { label: "Card type", value: "Virtual" },
                { label: "Fund amount", value: `$${parsed.toFixed(2)}` },
                { label: "Creation fee", value: `−$${CARD_CREATION_FEE.toFixed(2)}`, fee: true },
                { label: "Funding fee (0.5%)", value: `−$${fundingFee.toFixed(2)}`, fee: true },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: r.fee ? "#DC2626" : "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "2px solid var(--gray-200)", marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>Card balance</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${cardBalance.toFixed(2)}</span>
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-100)" }}>
                <div style={{ fontSize: 12, color: "var(--gray-600)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--gray-700)" }}>${parsed.toFixed(2)}</strong> will be deducted from your USD balance.
                </div>
              </div>
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={() => setStep("form")}>Back</button>
              <button className="btn btn-lg" onClick={handleConfirm}>Confirm & create</button>
            </div>
          </>
        )}
        {step === "form" && (
          <>
            <div className="set-modal-head">
              <h3>Create new card</h3>
              <button className="set-modal-x" onClick={onClose}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="lbl">Card name</div>
                <input className="inp" placeholder="e.g. Marketing spend" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
                  {NAME_SUGGESTIONS.map((s) => {
                    const sel = name === s;
                    return (
                      <span key={s} role="button" tabIndex={0} onClick={() => setName(s)} style={{
                        display: "inline-block", cursor: "pointer", whiteSpace: "nowrap",
                        padding: "5px 12px", borderRadius: 999, lineHeight: 1.4,
                        fontSize: 12, fontWeight: 500, userSelect: "none",
                        backgroundColor: sel ? "#7C3AED" : "#F3F4F6",
                        color: sel ? "#fff" : "#4B5563",
                        border: sel ? "1px solid #7C3AED" : "1px solid transparent",
                        transition: "background-color .1s, color .1s, border-color .1s",
                      }}>{s}</span>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="lbl" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-700)", marginBottom: 8 }}>Card type</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div onClick={() => setType("virtual")} style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "2px solid #7C3AED", backgroundColor: "#F5F3FF", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#6D28D9" }}>Virtual</div>
                      <_Icon.check style={{ width: 14, height: 14, color: "#7C3AED" }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: "#7C3AED", marginTop: 2 }}>Use online or add to wallet.</div>
                  </div>
                  <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", cursor: "not-allowed", textAlign: "left", opacity: 0.6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>Physical</div>
                    <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 2 }}>Coming soon</div>
                  </div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="lbl">Fund from USD balance</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
                  <input className={`inp${fundHasError ? " inp-error" : ""}`} type="number" min={MIN_FUND} step="0.01" placeholder="0.00" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} style={{ paddingLeft: 30, fontVariantNumeric: "tabular-nums" }} />
                </div>
                {fundAmount && !validFund && !tooHigh && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Minimum $6.00 required — $5.00 creation fee + $1.00 minimum balance.</div>}
                {tooHigh && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Insufficient funds. Your USD balance is ${fmtBal(usdBalance)}.</div>}
                {validFund && !tooHigh && (
                  <div style={{ fontSize: 11.5, color: "var(--gray-600)", marginTop: 6 }}>
                    After $5.00 creation fee + 0.5% funding fee: <strong style={{ color: "var(--gray-900)" }}>${cardBalance.toFixed(2)}</strong>
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 14px", background: "var(--info-100)", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <_Icon.info style={{ width: 16, height: 16, color: "var(--info-700)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: "var(--info-700)", lineHeight: 1.5 }}>A one-time <strong>$5.00</strong> creation fee and <strong>0.5%</strong> funding fee apply, both deducted from the funded amount.</div>
              </div>
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-lg" onClick={() => setStep("review")} disabled={!canProceed}>Review</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Withdraw to wallet modal
// =====================================================
function WithdrawCardModal({ card, onClose, onWithdraw }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form");
  const cardBalance = card.balance || 0;
  const parsed = parseFloat(amount) || 0;
  const maxWithdraw = Math.max(0, cardBalance - 1);
  const tooLow = amount !== "" && parsed < 1;
  const tooHigh = parsed > maxWithdraw;
  const hasError = tooLow || tooHigh;
  const valid = parsed >= 1 && !tooHigh;
  const fmtBal = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = () => {
    if (!valid) return;
    setStep("processing");
    setTimeout(() => setStep("done"), 1400);
  };

  return (
    <div className="set-modal-bg" onClick={step === "processing" ? undefined : onClose}>
      <div className="set-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        {step === "processing" && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, margin: "0 auto 20px", border: "3px solid var(--gray-200)", borderTopColor: "var(--purple-600)", borderRadius: "50%", animation: "card-spin .7s linear infinite" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6 }}>Withdrawing…</div>
            <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Moving ${parsed.toFixed(2)} to your USD wallet</div>
          </div>
        )}
        {step === "done" && (
          <>
            <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 16px", borderRadius: "50%", background: "var(--success-100)", display: "grid", placeItems: "center" }}>
                <_Icon.check style={{ width: 22, height: 22, color: "var(--success-700)" }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)" }}>Withdrawal successful</div>
            </div>
            <div style={{ marginBottom: 20, background: "var(--gray-50)", borderRadius: 10, overflow: "hidden" }}>
              {[
                { label: "Amount withdrawn", value: `$${fmtBal(parsed)}` },
                { label: "Destination", value: "USD wallet" },
                { label: "New card balance", value: `$${fmtBal(cardBalance - parsed)}`, strong: true },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: row.strong ? 600 : 500, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="set-modal-foot" style={{ marginTop: 0 }}>
              <button className="btn btn-lg" onClick={() => onWithdraw(parsed)} style={{ width: "100%", justifyContent: "center" }}>Done</button>
            </div>
          </>
        )}
        {step === "form" && (
          <>
            <div className="set-modal-head">
              <h3>Withdraw to wallet</h3>
              <button className="set-modal-x" onClick={onClose}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="lbl">Amount</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
                  <input className={`inp${hasError ? " inp-error" : ""}`} type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30, fontVariantNumeric: "tabular-nums" }} autoFocus />
                </div>
                {tooLow && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Minimum $1.00.</div>}
                {tooHigh && <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 6 }}>Max withdrawal is ${fmtBal(maxWithdraw)} — card must keep a $1.00 minimum balance.</div>}
                {!hasError && (
                  <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--gray-500)" }}>
                    <span>Available on card: <strong style={{ color: "var(--gray-700)" }}>${fmtBal(cardBalance)}</strong></span>
                    {valid && <span>Remaining: <strong style={{ color: "var(--gray-700)" }}>${fmtBal(cardBalance - parsed)}</strong></span>}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 14px", background: "var(--gray-50)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--gray-500)" }}>Destination</span>
                  <span style={{ fontWeight: 500, color: "var(--gray-900)" }}>USD wallet</span>
                </div>
              </div>
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-lg" onClick={handleSubmit} disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }}>Withdraw</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Card transaction detail modal
// =====================================================
function TxnAmountCell({ tx, align = "right" }) {
  const isFx = !!tx.fxCcy;
  const isCredit = tx.type === "funding";
  const sign = isCredit ? "+" : "−";
  const signColor = isCredit ? "var(--success-700)" : "var(--gray-900)";
  return (
    <td className="num" style={{ verticalAlign: "middle" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13.5, color: signColor }}>
          {sign}{isFx ? tx.fxAmount : tx.amount}
          <span style={{ color: "var(--gray-500)", fontWeight: 500, fontSize: 12, marginLeft: 4 }}>{isFx ? tx.fxCcy : tx.ccy}</span>
        </span>
        {isFx && (
          <span style={{ fontSize: 11.5, color: "var(--gray-400)", fontVariantNumeric: "tabular-nums" }}>≈ {sign}${tx.amount} USD</span>
        )}
      </div>
    </td>
  );
}

function CardTxnDetailModal({ tx, card, onClose }) {
  const isFx = !!tx.fxCcy;
  const isCredit = tx.type === "funding";
  const sign = isCredit ? "+" : "−";
  const heroColor = isCredit ? "var(--success-700)" : "var(--gray-900)";
  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    navigator.clipboard.writeText(tx.ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const rows = [
    { label: "Date & time", value: tx.date },
    tx.type === "funding"    && { label: "Source",      value: "USD wallet balance" },
    tx.type === "funding"    && tx.fee && { label: "Funding fee", value: `0.5% ($${tx.fee})` },
    tx.type === "funding"    && tx.netFunded && { label: "Net funded",  value: `$${tx.netFunded}` },
    tx.type === "withdrawal" && { label: "Destination", value: "USD wallet balance" },
    isFx && { label: "Exchange rate", value: tx.fxRate },
    isFx && tx.fxFee && { label: "FX fee", value: `1.5% ($${tx.fxFee})` },
    card && { label: "Card", value: `${card.name} ••${card.last4}` },
    tx.category && { label: "Category", value: tx.category },
    tx.merchantCountry && { label: "Merchant country", value: tx.merchantCountry },
    { label: "Reference", value: tx.ref },
  ].filter(Boolean);

  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <div>
            <h3 style={{ marginBottom: 4 }}>{tx.party}</h3>
            <span className={`pill ${tx.pillTone}`}><span className="dot" />{tx.status}</span>
          </div>
          <button className="set-modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid var(--gray-100)", marginBottom: 4 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: heroColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {sign}{isFx ? `${tx.fxAmount}` : `$${tx.amount}`}
            <span style={{ fontSize: 18, fontWeight: 500, color: "var(--gray-500)", marginLeft: 6 }}>{isFx ? tx.fxCcy : "USD"}</span>
          </div>
          {isFx && (
            <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
              ≈ {sign}${tx.amount} USD charged to card
            </div>
          )}
        </div>

        {/* Detail rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row, i) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <span style={{ fontSize: 13, color: "var(--gray-500)" }}>{row.label}</span>
              {row.label === "Reference" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  <button onClick={copyRef} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: copied ? "var(--success-600)" : "var(--gray-400)", display: "flex", alignItems: "center", transition: "color .15s" }}>
                    {copied ? <_Icon.check style={{ width: 14, height: 14 }} /> : <_Icon.copy style={{ width: 14, height: 14 }} />}
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
              )}
            </div>
          ))}
        </div>

        <div className="set-modal-foot" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", color: "var(--gray-600)" }}>
            Report an issue
          </button>
        </div>
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
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Cards</h1>
          <p className="subtitle">Manage your Flex Business virtual cards.</p>
        </div>
        <button className="btn btn-lg" onClick={onCreateCard}>
          <_Icon.plus style={{ width: 15, height: 15 }} /> Create card
        </button>
      </div>

      {/* Horizontal scrollable card row */}
      <style>{`.cards-scroll::-webkit-scrollbar{display:none}`}</style>
      <div className="cards-scroll" style={{ display: "flex", gap: 20, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: 28 }}>
        {cards.map((c) => (
          <div key={c.id} style={{ flexShrink: 0 }}>
            <CardTile card={c} onClick={() => onSelect(c)} />
          </div>
        ))}
        {/* New card tile — direct 260×126 flex item, matching card tile dimensions */}
        <div
          onClick={onCreateCard}
          style={{ flexShrink: 0, cursor: "pointer", width: 260, height: 164, borderRadius: 14, border: "2px dashed var(--gray-400)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color .12s, background .12s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gray-500)"; e.currentTarget.style.background = "var(--gray-50)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gray-400)"; e.currentTarget.style.background = "transparent"; }}
        >
          <_Icon.plus style={{ width: 20, height: 20, color: "var(--gray-600)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>New card</span>
        </div>
      </div>

      {/* All-card transactions */}
      {cards.length > 0 && (
        <div className="tablecard">
          <div className="head">
            <h2>Card transactions</h2>
            <span className="meta">{allTxns.length} transactions</span>
          </div>
          <table className="t">
            <thead><tr>
              <th>Merchant</th>
              <th>Card</th>
              <th>Date</th>
              <th>Status</th>
              <th className="num">Amount</th>
            </tr></thead>
            <tbody>
              {allTxns.map((tx) => (
                <tr key={tx.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTxn(tx)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ fontWeight: 500, color: "var(--gray-900)" }}>{tx.party}</td>
                  <td style={{ color: "var(--gray-500)", fontSize: 12.5 }}>
                    {tx.card ? <span>{tx.card.name} <span style={{ fontVariantNumeric: "tabular-nums" }}>••{tx.card.last4}</span></span> : "—"}
                  </td>
                  <td style={{ color: "var(--gray-600)", fontSize: 12.5 }}>{tx.date}</td>
                  <td><span className={`pill ${tx.pillTone}`}><span className="dot" />{tx.status}</span></td>
                  <TxnAmountCell tx={tx} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cards.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="ic"><_Icon.card style={{ width: 36, height: 36 }} /></div>
            <div style={{ fontWeight: 500, color: "var(--gray-900)", marginBottom: 4, fontSize: 14 }}>No cards yet</div>
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", maxWidth: 360, margin: "4px auto 16px", lineHeight: 1.6 }}>
              Create a virtual card to start making payments online or add to Apple Pay and Google Pay.
            </div>
            <button className="btn btn-lg" onClick={onCreateCard}>Create your first card</button>
          </div>
        </div>
      )}
      {selectedTxn && <CardTxnDetailModal tx={selectedTxn} card={selectedTxn.card} onClose={() => setSelectedTxn(null)} />}
    </div>
  );
}

// =====================================================
// Freeze / unfreeze confirmation modal
// =====================================================
function FreezeCardModal({ card, onClose, onConfirm }) {
  const frozen = card.status === "frozen";
  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <h3>{frozen ? "Unfreeze card?" : "Freeze card?"}</h3>
          <button className="set-modal-x" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
          {frozen ? (
            <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be able to process new transactions again.</>
          ) : (
            <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be blocked from processing new transactions immediately.</>
          )}
        </div>
        {!frozen && (
          <div style={{ marginTop: 14, background: "var(--gray-50)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              "Online and in-store purchases will be declined",
              "Recurring subscriptions may still process",
              "You can unfreeze at any time",
            ].map((note) => (
              <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--gray-600)" }}>
                <span style={{ marginTop: "2px", color: "var(--gray-400)", flexShrink: 0 }}>•</span>
                {note}
              </div>
            ))}
          </div>
        )}
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-lg" style={frozen ? {} : { background: "#1D4ED8" }} onClick={onConfirm}>
            {frozen ? "Unfreeze card" : "Freeze card"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Fee schedule modal
// =====================================================
function CardFeesModal({ onClose }) {
  const rows = [
    { label: "Card creation", value: "$5.00", note: "One-time, per card" },
    { label: "Funding fee", value: "0.5%", note: "Per top-up transaction" },
    { label: "Monthly fee", value: "Free", note: null },
    { label: "Card transactions", value: "Free", note: null },
    { label: "FX transactions", value: "—", note: "Coming soon" },
  ];
  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <h3>Fee schedule</h3>
          <button className="set-modal-x" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--gray-700)" }}>{r.label}</div>
                {r.note && <div style={{ fontSize: 11.5, color: "var(--gray-400)", marginTop: 1 }}>{r.note}</div>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: r.value === "Free" ? "var(--success-700)" : "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// "More" dropdown — spending limits, edit name, delete
// =====================================================
function MoreDropdown({ onAction, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { key: "limits", icon: <_Icon.shield style={{ width: 15, height: 15 }} />, label: "Spending limits" },
    { key: "withdraw", icon: <_Icon.arrowLeft style={{ width: 15, height: 15 }} />, label: "Withdraw to wallet" },
    { key: "fees", icon: <_Icon.info style={{ width: 15, height: 15 }} />, label: "Fee schedule" },
    { key: "divider" },
    { key: "edit", icon: <_Icon.pencil style={{ width: 15, height: 15 }} />, label: "Edit card name" },
    { key: "cancel", icon: <_Icon.trash style={{ width: 15, height: 15 }} />, label: "Delete card", danger: true },
  ];

  return (
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, marginTop: 6,
      background: "#fff", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.08)",
      border: "1px solid var(--gray-100)", minWidth: 180, zIndex: 20, padding: "6px 0",
    }}>
      {items.map((it) =>
        it.key === "divider" ? (
          <div key="divider" style={{ height: 1, background: "var(--gray-100)", margin: "4px 0" }} />
        ) : (
          <div
            key={it.key}
            onClick={() => { onAction(it.key); onClose(); }}
            style={{
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: it.danger ? "#DC2626" : "var(--gray-700)",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ display: "flex", alignItems: "center", color: it.danger ? "#DC2626" : "var(--gray-500)" }}>{it.icon}</span>
            {it.label}
          </div>
        )
      )}
    </div>
  );
}

// =====================================================
// Spending limits modal
// =====================================================
function SpendingLimitsModal({ card, onClose }) {
  const fmt = (n) => "$" + n.toLocaleString();
  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <h3>Spending limits</h3>
          <button className="set-modal-x" onClick={onClose}>✕</button>
        </div>
        <div>
          {[
            { label: "Per transaction", value: card.limit.perTransaction },
            { label: "Daily", value: card.limit.daily },
            { label: "Monthly", value: card.limit.monthly },
          ].map((l, i, arr) => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{l.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{fmt(l.value)}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 12 }}>Contact support to adjust limits.</div>
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Card details info card — cardholder, billing, wallet
// =====================================================
function CardDetailsCard({ card, onToast }) {
  const addr = BILLING_ADDRESS;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;

  return (
    <div className="card" style={{ marginTop: 20, padding: 0 }}>
      {/* Cardholder */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>Cardholder</span>
          <CopyIconBtn text={MOCK_CARDHOLDER} label="cardholder name" onToast={onToast} />
        </div>
        <div style={{ fontSize: 13.5, color: "var(--gray-900)" }}>{MOCK_CARDHOLDER}</div>
      </div>

      {/* Billing address */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>Billing address</span>
          <CopyIconBtn text={fullAddress} label="full address" onToast={onToast} />
        </div>
        <div style={{ fontSize: 13.5, color: "var(--gray-800)", lineHeight: 1.7, marginLeft: -4 }}>
          <div><CopyableField value={addr.street} label="Street" onToast={onToast} /></div>
          <div>
            <CopyableField value={addr.city} label="City" onToast={onToast} style={{ paddingRight: 0 }} /><span style={{ color: "var(--gray-700)" }}>,</span>{" "}<CopyableField value={addr.state} label="State" onToast={onToast} style={{ paddingLeft: 0, paddingRight: 0 }} />{" "}<CopyableField value={addr.zip} label="Postal code" onToast={onToast} style={{ paddingLeft: 0 }} />
          </div>
          <div><CopyableField value={addr.country} label="Country" onToast={onToast} /></div>
        </div>
      </div>

      {/* Add to wallet */}
      <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: "center", fontSize: 12.5, padding: "10px 12px", gap: 8, border: "1px solid var(--gray-200)", borderRadius: 8 }}
          onClick={() => onToast("Added to Apple Pay")}
        >
          <img src="design-system/assets/apple-wallet.svg" style={{ height: 15 }} />
          Apple Pay
        </button>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: "center", fontSize: 12.5, padding: "10px 12px", gap: 8, border: "1px solid var(--gray-200)", borderRadius: 8 }}
          onClick={() => onToast("Added to Google Pay")}
        >
          <img src="design-system/assets/google-wallet.svg" style={{ height: 15 }} />
          Google Pay
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Card detail page
// =====================================================
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

  const handleFreeze = () => {
    onUpdateCard({ ...card, status: frozen ? "active" : "frozen" });
    onToast(frozen ? "Card unfrozen" : "Card frozen");
    setShowFreeze(false);
  };

  const handleSaveName = () => {
    if (nameVal.trim() && nameVal.trim() !== card.name) {
      onUpdateCard({ ...card, name: nameVal.trim() });
      onToast("Card name updated");
    }
    setEditingName(false);
  };

  const handleFund = (amount) => {
    onUpdateCard({ ...card, balance: (card.balance || 0) + amount });
    setShowFund(false);
    onToast(`$${amount.toFixed(2)} added`);
  };

  const handleWithdraw = (amount) => {
    onUpdateCard({ ...card, balance: Math.max(0, (card.balance || 0) - amount) });
    setShowWithdraw(false);
    onToast(`$${amount.toFixed(2)} withdrawn to USD wallet`);
  };

  const handleRetry = () => {
    onUpdateCard({ ...card, status: "activating" });
    onToast("Retrying activation…");
  };

  const handleMoreAction = (key) => {
    if (key === "limits") setShowLimits(true);
    else if (key === "withdraw") setShowWithdraw(true);
    else if (key === "fees") setShowFees(true);
    else if (key === "edit") setEditingName(true);
    else if (key === "cancel") { onDeleteCard(card.id); onToast("Card deleted"); }
  };

  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><_Icon.arrowLeft /> Cards</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Card details</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        {editingName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input className="inp" value={nameVal} onChange={(e) => setNameVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setNameVal(card.name); setEditingName(false); } }} style={{ fontSize: 20, fontWeight: 700, padding: "4px 8px", width: 280 }} autoFocus />
            <button className="btn btn-sm" onClick={handleSaveName}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setNameVal(card.name); setEditingName(false); }}>Cancel</button>
          </div>
        ) : (
          <h1 className="title" style={{ marginBottom: 0 }}>{card.name}</h1>
        )}
      </div>
      <p className="subtitle" style={{ marginBottom: 20 }}>Virtual · Created {card.created}</p>

      <style>{`@keyframes card-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Left col */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <CardVisual card={card} fillWidth interactive onToast={onToast} />

          {/* Activating status card */}
          {activating && (
            <div className="card" style={{ marginTop: 16, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 18, height: 18, border: "2.5px solid var(--gray-200)", borderTopColor: "var(--purple-600)", borderRadius: "50%", animation: "card-spin .7s linear infinite", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)", marginBottom: 3 }}>Activation in progress</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>We're setting up your card. This usually takes a few minutes. You'll be notified when it's ready to use.</div>
              </div>
            </div>
          )}

          {/* Failed status card */}
          {failed && (
            <div className="card" style={{ marginTop: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FEE2E2", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 13 }}>!</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#991B1B", marginBottom: 3 }}>Activation failed</div>
                  <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>Something went wrong. Your funds have not been charged.</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button className="btn btn-sm" onClick={handleRetry}>Retry</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#DC2626", gap: 6 }} onClick={() => { onDeleteCard(card.id); onToast("Card cancelled"); }}>
                      <_Icon.trash style={{ width: 13, height: 13 }} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action row: Fund | Freeze | More */}
          {usable && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-lg"
                style={{ flex: 1, fontSize: 13, padding: "10px 12px", justifyContent: "center", border: "1.5px solid transparent" }}
                onClick={() => setShowFund(true)}
              >
                <_Icon.plus style={{ width: 14, height: 14 }} /> Fund
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: 13, padding: "10px 12px", gap: 6, justifyContent: "center", border: "1.5px solid var(--gray-300)", color: frozen ? "var(--success-700)" : "var(--gray-700)" }}
                onClick={() => setShowFreeze(true)}
              >
                {frozen
                  ? <><_Icon.zap style={{ width: 14, height: 14 }} /> Unfreeze</>
                  : <><_Icon.snowflake style={{ width: 14, height: 14 }} /> Freeze</>
                }
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: "10px 14px", justifyContent: "center", gap: 5, border: "1.5px solid var(--gray-300)", color: "var(--gray-700)" }}
                  onClick={() => setShowMore(!showMore)}
                >
                  More
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showMore && <MoreDropdown onAction={handleMoreAction} onClose={() => setShowMore(false)} />}
              </div>
            </div>
          )}

          {usable && <CardDetailsCard card={card} onToast={onToast} />}
        </div>

        {/* Right col: transactions */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tablecard">
            <div className="head">
              <h2>Card transactions</h2>
              <span className="meta">{usable ? CARD_TXNS.length : 0} transactions</span>
            </div>
            {usable ? (
              <table className="t">
                <thead><tr>
                  <th>Merchant</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr></thead>
                <tbody>
                  {CARD_TXNS.map((tx) => (
                    <tr key={tx.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTxn(tx)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ fontWeight: 500, color: "var(--gray-900)" }}>{tx.party}</td>
                      <td style={{ color: "var(--gray-600)", fontSize: 12.5 }}>{tx.date}</td>
                      <td><span className={`pill ${tx.pillTone}`}><span className="dot" />{tx.status}</span></td>
                      <TxnAmountCell tx={tx} />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty" style={{ padding: "40px 0" }}>
                <div className="ic"><_Icon.card style={{ width: 28, height: 28 }} /></div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-700)", marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>Transactions will appear here once your card is active.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFund && <FundCardModal card={card} onClose={() => setShowFund(false)} onFund={handleFund} />}
      {showWithdraw && <WithdrawCardModal card={card} onClose={() => setShowWithdraw(false)} onWithdraw={handleWithdraw} />}
      {showFreeze && <FreezeCardModal card={card} onClose={() => setShowFreeze(false)} onConfirm={handleFreeze} />}
      {showLimits && <SpendingLimitsModal card={card} onClose={() => setShowLimits(false)} />}
      {showFees && <CardFeesModal onClose={() => setShowFees(false)} />}
      {selectedTxn && <CardTxnDetailModal tx={selectedTxn} card={card} onClose={() => setSelectedTxn(null)} />}
    </div>
  );
}

// =====================================================
// Cards apply page
// =====================================================
function CardsApplyPage({ onApply }) {
  return (
    <div className="page">
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gray-500)", marginBottom: 12 }}>Flex Business Cards</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--gray-900)", margin: "0 0 12px", lineHeight: 1.3 }}>Spend flexibly, anywhere</h1>
        <p style={{ fontSize: 15, color: "var(--gray-600)", lineHeight: 1.6, maxWidth: 440, margin: "0 auto 32px" }}>
          Issue virtual cards with granular spending limits. Use online or add to Apple Pay and Google Pay.
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{
            width: 300, height: 190, borderRadius: 16,
            backgroundImage: `url(${CARD_BG})`, backgroundSize: "cover", backgroundPosition: "center",
            color: "#fff", padding: 24, display: "flex", flexDirection: "column",
            overflow: "hidden", boxShadow: "0 12px 40px rgba(79,70,229,.3)", transform: "rotate(-3deg)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 400, letterSpacing: "0.02em" }}>Flex Business</div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 16, letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums", marginBottom: 14 }}>•••• •••• •••• ••••</div>
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase" }}>Exp</div><div style={{ fontSize: 11 }}>••/••</div></div>
              <div><div style={{ fontSize: 9, opacity: 0.6, textTransform: "uppercase" }}>CVV</div><div style={{ fontSize: 11 }}>•••</div></div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginBottom: 36, textAlign: "left" }}>
          {[
            { icon: <_Icon.zap style={{ width: 18, height: 18 }} />, title: "Instant virtual cards", desc: "Create and use immediately — no waiting for delivery." },
            { icon: <_Icon.shield style={{ width: 18, height: 18 }} />, title: "Spending controls", desc: "Set per-transaction, daily, and monthly limits." },
            { icon: <_Icon.globe style={{ width: 18, height: 18 }} />, title: "Use anywhere", desc: "Accepted online worldwide. Add to Apple Pay or Google Pay." },
          ].map((f) => (
            <div key={f.title} style={{ flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--purple-50)", display: "grid", placeItems: "center", color: "var(--purple-600)", marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-lg" style={{ padding: "12px 32px", fontSize: 14 }} onClick={onApply}>Apply for cards</button>
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 10 }}>$5.00 creation fee per card. Cards are funded from your USD balance.</div>
      </div>
    </div>
  );
}

// =====================================================
// Main cards screen
// =====================================================
function CardsScreen({ onToast, cardsAccess }) {
  const [cards, setCards] = useState(() => [..._Data.CARDS]);
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
    setShowCreate(false);
    onToast(`${newCard.name} is being activated…`);
    setTimeout(() => {
      setCards((prev) => prev.map((c) => c.id === newCard.id && c.status === "activating" ? { ...c, status: "active" } : c));
    }, 30000);
  };

  const handleUpdate = (updated) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCard(updated);
    if (updated.status === "activating") {
      setTimeout(() => {
        setCards((prev) => prev.map((c) => c.id === updated.id && c.status === "activating" ? { ...c, status: "active" } : c));
      }, 4000);
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
      {showCreate && <CreateCardModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </>
  );
}

window.OBCards = { CardsScreen };
