/* global React */
/* Business Classic cards — adaptive port of v0/screens-cards.jsx. */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;
const Data = window.OBData;
// One constant, because the card provider (and so the product name) is still moving.
const CARD_BRAND = "Business Classic";
const CARD_SUPPORT_WA = "https://wa.me/14313404484";
const CARD_MIN_BALANCE = 1;
// Frozen is deliberately not here: the user chose it and can undo it, so hiding it would lose
// the card they're looking for. Only states that can never become active again.
const DEAD_STATUSES = ["failed", "terminated"];
// Declines before a card is terminated automatically. Shared by the terms and the low-balance
// warning so the two can't disagree.
const DECLINE_LIMIT = { domestic: 5, international: 2 };
const HIDE_DEAD_KEY = "ob_cards_hide_dead";

const { Page, Sheet, Pill, useIsDesktop, DemoCta, can, SIGNED_IN, ROLE_LABEL } = window.OBPrimitives;

const CARD_BG = "../v0/design-system/assets/card-bg.svg";
// Cardholder = any active team member. The holder's name is what's printed for billing, and the
// person a card is scoped to when their role can't manage cards.
const TEAM = Data.TEAM_MEMBERS;
const memberById = (id) => TEAM.find((m) => m.id === id);
const holderName = (card) => (memberById(card.holderId) || {}).name || "Unassigned";
const firstName = (name) => name.split(" ")[0];
const initialsOf = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
const activeMembers = () => TEAM.filter((m) => m.status === "active");
const youSuffix = (m) => (m.id === SIGNED_IN.id ? " (you)" : "");
const DEFAULT_LIMITS = { perTransaction: 5000, daily: 10000, monthly: 25000 };
// Configured ceilings per limit. Placeholder values until the real ones are confirmed.
const LIMIT_MAX = { perTransaction: 10000, daily: 25000, monthly: 100000 };
const LIMIT_STEP = { perTransaction: 50, daily: 100, monthly: 500 };
const LIMIT_FIELDS = [["perTransaction", "Per transaction"], ["daily", "Daily"], ["monthly", "Monthly"]];
const fmtUsd0 = (n) => "$" + n.toLocaleString();

// Limits must nest (per transaction ≤ daily ≤ monthly). Rather than show an error, moving one
// limit past its neighbour carries the neighbour with it. The maxes nest too, so this always fits.
function nestLimits(l, changed) {
  let { perTransaction: p, daily: d, monthly: m } = l;
  if (changed === "perTransaction") { d = Math.max(d, p); m = Math.max(m, d); }
  else if (changed === "daily") { p = Math.min(p, d); m = Math.max(m, d); }
  else { d = Math.min(d, m); p = Math.min(p, d); }
  return { perTransaction: p, daily: d, monthly: m };
}

// Spend counted against the daily and monthly limits. Per transaction has nothing to accumulate.
const spentOf = (card) => card.spent || { today: 0, month: 0 };
const SPEND_PERIODS = [
  { key: "daily", spentKey: "today", label: "Today", resets: "Resets daily" },
  { key: "monthly", spentKey: "month", label: "This month", resets: "Resets on the 1st" },
];

function SpendMeter({ label, spent, limit, resets }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const reached = spent >= limit;
  const tone = reached || pct >= 90 ? "danger" : pct >= 75 ? "warn" : "";
  return (
    <div className="spend-meter">
      <div className="spend-meter-head">
        <span>{label}</span>
        <span><strong>${fmtBal(spent)}</strong> of {fmtUsd0(limit)}</span>
      </div>
      <div className="spend-bar" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={spent} aria-label={`${label} spend`}>
        <div className={tone} style={{ width: `${pct}%` }} />
      </div>
      <div className="spend-meter-foot">
        <span className={tone}>{reached ? "Limit reached — payments declined until it resets" : `$${fmtBal(limit - spent)} left`}</span>
        <span>{resets}</span>
      </div>
    </div>
  );
}

// Secondary to the card's own details, so it's one bar: the monthly figure, with today and the
// per-transaction cap in a line beneath. The limits sheet has the full breakdown.
function CardSpendCard({ card, onViewLimits }) {
  const s = spentOf(card);
  const pct = Math.min(100, (s.month / card.limit.monthly) * 100);
  const tone = pct >= 90 ? "danger" : pct >= 75 ? "warn" : "";
  const dayReached = s.today >= card.limit.daily;
  return (
    <div className="card spend-card">
      <div className="spend-mini-head">
        <span>Spent this month</span>
        <span className="fig"><strong>${fmtBal(s.month)}</strong> of {fmtUsd0(card.limit.monthly)}</span>
      </div>
      <div className="spend-bar" role="meter" aria-valuemin={0} aria-valuemax={card.limit.monthly} aria-valuenow={s.month} aria-label="Spend this month">
        <div className={tone} style={{ width: `${pct}%` }} />
      </div>
      <div className="spend-mini-foot">
        <div className="spend-mini-facts">
          <span className={dayReached ? "danger" : ""}>Today ${fmtBal(s.today)} of {fmtUsd0(card.limit.daily)}</span>
          <span>Up to {fmtUsd0(card.limit.perTransaction)} per payment</span>
        </div>
        <button className="card-holder-change" onClick={onViewLimits}>Limits</button>
      </div>
    </div>
  );
}

function LimitSliders({ value, onChange, spent }) {
  return (
    <div className="lim-sliders">
      {LIMIT_FIELDS.map(([k, label]) => (
        <div className="lim-slider" key={k}>
          <div className="lim-slider-head"><label htmlFor={`lim-${k}`}>{label}</label><strong>{fmtUsd0(value[k])}</strong></div>
          <input id={`lim-${k}`} type="range" min={LIMIT_STEP[k]} max={LIMIT_MAX[k]} step={LIMIT_STEP[k]} value={value[k]}
            style={{ "--fill": `${(value[k] / LIMIT_MAX[k]) * 100}%` }}
            onChange={(e) => onChange(nestLimits({ ...value, [k]: Number(e.target.value) }, k))} />
          <div className="lim-slider-scale"><span>{fmtUsd0(LIMIT_STEP[k])}</span><span>Max {fmtUsd0(LIMIT_MAX[k])}</span></div>
          {spent && k !== "perTransaction" && (() => {
            const used = k === "daily" ? spent.today : spent.month;
            if (!used) return null;
            const period = k === "daily" ? "today" : "this month";
            return value[k] < used
              ? <div className="lim-slider-note warn">Below the ${fmtBal(used)} already spent {period} — payments will be declined until it resets.</div>
              : <div className="lim-slider-note">${fmtBal(used)} spent {period}</div>;
          })()}
        </div>
      ))}
    </div>
  );
}
const BILLING_ADDRESS = { street: "14 Admiralty Way", city: "Lekki", state: "Lagos", zip: "106104", country: "Nigeria" };
const CARD_CREATION_FEE = 5;
const CARD_FUNDING_FEE_PCT = 0.01;
const CARD_XB_FEE_PCT = 0.0175;
const CARD_XB_FEE_FLAT = 1;
const pctLabel = (r) => `${+(r * 100).toFixed(2)}%`;
const FUNDING_FEE_LABEL = pctLabel(CARD_FUNDING_FEE_PCT);
const XB_FEE_LABEL = `${pctLabel(CARD_XB_FEE_PCT)} + $${CARD_XB_FEE_FLAT.toFixed(2)}`;
const NAME_SUGGESTIONS = ["Marketing", "Operations", "Travel", "Software", "Ads & media", "Office supplies"];
const fmtBal = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_TXNS = [
  { id: "CTX-W01", date: "Jun 28, 14:10", party: "Withdrawal to USD wallet", type: "withdrawal", amount: "150.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", ref: "TXN-W01-4821" },
  { id: "CTX-001", date: "Jun 25, 14:32", party: "Figma Inc.",               type: "purchase",   amount: "45.00",    ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Software & SaaS",     merchantCountry: "United States",  ref: "TXN-001-4821" },
  { id: "CTX-002", date: "Jun 24, 09:17", party: "Google Workspace",         type: "purchase",   amount: "138.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Software & SaaS",     merchantCountry: "United States",  ref: "TXN-002-4821" },
  { id: "CTX-003", date: "Jun 22, 11:05", party: "Amazon Web Services",      type: "purchase",   amount: "1,247.83", ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Cloud Infrastructure", merchantCountry: "United States",  ref: "TXN-003-4821" },
  { id: "CTX-004", date: "Jun 20, 16:41", party: "Notion Labs",              type: "purchase",   amount: "96.00",    ccy: "USD", fxAmount: "88.50", fxCcy: "EUR", fxRate: "1 EUR = 1.085 USD", fxFee: "2.68", status: "COMPLETED", pillTone: "success", category: "Productivity",         merchantCountry: "United States",  ref: "TXN-004-4821" },
  { id: "CTX-005", date: "Jun 18, 08:55", party: "Linear Inc.",              type: "purchase",   amount: "80.00",    ccy: "USD", fxAmount: "63.50", fxCcy: "GBP", fxRate: "1 GBP = 1.260 USD", fxFee: "2.40", status: "PENDING",   pillTone: "warn",    category: "Software & SaaS",     merchantCountry: "United Kingdom", ref: "TXN-005-4821" },
  { id: "CTX-006", date: "Jun 15, 13:20", party: "Vercel Inc.",              type: "purchase",   amount: "240.00",   ccy: "USD",                                          status: "COMPLETED", pillTone: "success", category: "Cloud Infrastructure", merchantCountry: "United States",  ref: "TXN-006-4821" },
  { id: "CTX-F01", date: "Jun 10, 10:03", party: "Top-up from USD wallet",   type: "funding",    amount: "500.00",   ccy: "USD", fee: "5.00", netFunded: "495.00",         status: "COMPLETED", pillTone: "success", ref: "TXN-F01-4821" },
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
  // KYC rejection looks like a failure but isn't retryable, so it carries its own label.
  const rejected = status === "rejected";
  // Terminated is final and keeps its history — it reads as a spent card, not a broken one.
  const terminated = status === "terminated";
  const failed = status === "failed" || rejected || terminated;
  const neverIssued = status === "failed" || rejected;
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

  const statusLabel = frozen ? "Frozen" : activating ? "Activating" : terminated ? "Terminated" : rejected ? "Not approved" : failed ? "Failed" : null;

  return (
    <div className={`card-visual ${muted ? "muted" : ""} ${frozen ? "frozen" : ""} ${failed ? "failed" : ""}`}
         style={{ width: w, height: h, borderRadius: compact ? 14 : 16, aspectRatio: fillWidth ? "380/240" : undefined, backgroundImage: `url(${CARD_BG})`, paddingTop: compact ? 14 : 18, paddingLeft: pad, paddingRight: pad, paddingBottom: pad }}>
      {activating && <style>{`@keyframes cardPulse{0%,100%{opacity:.75}50%{opacity:.95}}`}</style>}
      <div className="card-visual-content">
        <div>
          <div style={{ fontSize: compact ? 12 : 15, fontWeight: 500, letterSpacing: "0.02em" }}>{CARD_BRAND}</div>
          {statusLabel && <div className={`card-status-badge ${failed ? "failed" : ""}`}>{statusLabel}</div>}
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <div style={{ marginBottom: compact ? 8 : 12 }}>
            <div className="card-field" {...hoverProps("number")} onClick={handleClick("number")}
                 style={{ fontSize: numSize, fontWeight: 500, letterSpacing: "0.12em", background: hlNum ? "rgba(255,255,255,.15)" : "transparent", cursor: canInteract ? "pointer" : "default" }}>
              {neverIssued ? "•••• •••• •••• ••••" : revealed && canInteract ? card.number : `•••• •••• •••• ${card.last4}`}
              {cardTip("number")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: compact ? 16 : 24, visibility: neverIssued ? "hidden" : "visible" }}>
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

function CardTile({ card, onClick, showHolder }) {
  const activating = card.status === "activating";
  const rejected = card.status === "rejected";
  const terminated = card.status === "terminated";
  const failed = card.status === "failed";
  return (
    <div className="card-tile" onClick={onClick}>
      <CardVisual card={card} compact fillWidth />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)" }}>{card.name}</div>
        {activating ? (
          <div className="card-tile-status"><span className="spin" style={{ width: 12, height: 12 }} /><span style={{ color: "var(--purple-600,#7C3AED)", fontWeight: 500 }}>Activating…</span></div>
        ) : terminated ? (
          <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 500, marginTop: 4 }}>Terminated</div>
        ) : (failed || rejected) ? (
          <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 500, marginTop: 4 }}>{rejected ? "Not approved" : "Activation failed"}</div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
            {showHolder ? firstName(holderName(card)) : "Virtual"} · ••{card.last4}

            {card.status === "frozen" && (card.holderRemoved
              ? <span style={{ color: "#B45309", marginLeft: 6, fontWeight: 500 }}>· Holder removed</span>
              : card.lowBalance
              ? <span style={{ color: "#DC2626", marginLeft: 6, fontWeight: 500 }}>· Needs funding</span>
              : <span style={{ color: "var(--info-700)", marginLeft: 6 }}>· Frozen</span>)}
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
    tx.type === "funding" && tx.fee && { label: "Funding fee", value: `${FUNDING_FEE_LABEL} ($${tx.fee})` },
    tx.type === "funding" && tx.netFunded && { label: "Net funded", value: `$${tx.netFunded}` },
    tx.type === "withdrawal" && { label: "Destination", value: "USD wallet balance" },
    isFx && { label: "Exchange rate", value: tx.fxRate },
    isFx && tx.fxFee && { label: "Cross-border fee", value: `${XB_FEE_LABEL} ($${tx.fxFee})` },
    card && { label: "Card", value: `${card.name} ••${card.last4}` },
    card && card.holderId && { label: "Cardholder", value: holderName(card) },
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
            <div className="row-item"><div className="k">Funding fee ({FUNDING_FEE_LABEL})</div><div className="v" style={{ color: "#DC2626" }}>−${fmtBal(fundingFee)}</div></div>
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--gray-500)" }}><span>Funding fee ({FUNDING_FEE_LABEL})</span><span style={{ color: "#DC2626" }}>−${fmtBal(fundingFee)}</span></div>
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
  const [holderId, setHolderId] = useState(SIGNED_IN.id);
  const [limits, setLimits] = useState({ ...DEFAULT_LIMITS });
  const [showLimits, setShowLimits] = useState(false);
  const holder = memberById(holderId) || {};
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
      limit: { ...limits }, created: "Jun 28, 2026", balance: cardBalance, holderId,
    });
    setStep("done");
  };

  return (
    <Sheet open onClose={onClose} title={step === "review" ? "Confirm card creation" : step === "done" ? "" : "Create new card"}>
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div className="pay-confirm-icon"><Icon.check /></div>
          <div className="pay-confirm-title">Card created</div>
          <div className="pay-confirm-sub">
            {name.trim()} is activating — it'll be ready to use in a moment.
            {holderId !== SIGNED_IN.id && <> {firstName(holder.name)} can see it in Cards once it's active.</>}
          </div>
          <button className="btn btn-lg btn-block" onClick={onClose}>Done</button>
          <DemoCta message="Ready to issue real cards for your team?" campaign="card_confirm" />
        </div>
      )}
      {step === "review" && (
        <>
          <div className="pay-review-list" style={{ paddingTop: 0 }}>
            <div className="row-item"><div className="k">Card name</div><div className="v">{name}</div></div>
            <div className="row-item"><div className="k">Cardholder</div><div className="v">{holder.name}{youSuffix(holder)}</div></div>
            <div className="row-item"><div className="k">Card type</div><div className="v">Virtual</div></div>
            <div className="row-item"><div className="k">Spending limits</div><div className="v">{fmtUsd0(limits.perTransaction)} per txn · {fmtUsd0(limits.daily)} daily · {fmtUsd0(limits.monthly)} monthly</div></div>
            <div className="row-item"><div className="k">Fund amount</div><div className="v">${parsed.toFixed(2)}</div></div>
            <div className="row-item"><div className="k">Creation fee</div><div className="v" style={{ color: "#DC2626" }}>−${CARD_CREATION_FEE.toFixed(2)}</div></div>
            <div className="row-item"><div className="k">Funding fee ({FUNDING_FEE_LABEL})</div><div className="v" style={{ color: "#DC2626" }}>−${fundingFee.toFixed(2)}</div></div>
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
            <div className="lbl">Cardholder</div>
            <select className="inp" value={holderId} onChange={(e) => setHolderId(e.target.value)}>
              {activeMembers().map((m) => <option key={m.id} value={m.id}>{m.name}{youSuffix(m)}</option>)}
            </select>
            <div className="help">Their name goes on the card. They can use it and freeze it, but not fund it or change its limits.</div>
          </div>
          <div className="field">
            <div className="lbl">Card type</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="card-type-opt on">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#6D28D9" }}>Virtual</div><Icon.check style={{ width: 14, height: 14, color: "#7C3AED" }} /></div>
                <div style={{ fontSize: 11.5, color: "#7C3AED", marginTop: 2 }}>For online payments.</div>
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
            {validFund && !tooHigh && <div className="help">After $5.00 creation fee + {FUNDING_FEE_LABEL} funding fee: <strong style={{ color: "var(--gray-900)" }}>${cardBalance.toFixed(2)}</strong></div>}
          </div>
          <div className="field">
            <div className="field-lbl-row">
              <div className="lbl">Spending limits</div>
              <button type="button" className="card-holder-change" onClick={() => setShowLimits((v) => !v)}>{showLimits ? "Done" : "Adjust"}</button>
            </div>
            {showLimits
              ? <LimitSliders value={limits} onChange={setLimits} />
              : <div className="lim-summary">{fmtUsd0(limits.perTransaction)} per transaction · {fmtUsd0(limits.daily)} daily · {fmtUsd0(limits.monthly)} monthly</div>}
          </div>
          <div className="td-banner info" style={{ marginTop: 4 }}>
            <Icon.info />
            <div><div className="s">A one-time <strong>$5.00</strong> creation fee and <strong>{FUNDING_FEE_LABEL}</strong> funding fee apply, both deducted from the funded amount.</div></div>
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

function FreezeCardSheet({ card, onClose, onConfirm, manage }) {
  const frozen = card.status === "frozen";
  return (
    <Sheet open onClose={onClose} title={frozen ? "Unfreeze card?" : "Freeze card?"}>
      <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
        {frozen ? <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be able to process new transactions again.</>
                : <><strong style={{ color: "var(--gray-900)" }}>{card.name}</strong> will be blocked from processing new transactions immediately.</>}
      </div>
      {!frozen && (
        <div style={{ marginTop: 14, background: "var(--gray-50)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          {["Online and in-store purchases will be declined", "Recurring subscriptions may still process", manage ? "You can unfreeze at any time" : "Only an admin or operator can unfreeze it"].map((note) => (
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

// Fees and the terms that come with them, in one place and before anyone creates a card. The
// terms are the ones that surprise people after the fact — the minimum balance freeze, and the
// automatic termination after repeated declines, which isn't shown anywhere else in the app.
const CARD_FEES = [
  { label: "Card creation", value: "$5.00", note: "One-time, per card" },
  { label: "Funding fee", value: FUNDING_FEE_LABEL, note: "Per top-up" },
  { label: "Monthly fee", value: "Free", note: null },
  { label: "USD transactions", value: "Free", note: "US merchants, in USD" },
  // Cross-border, not "FX": the provider charges it on non-US merchants even when they bill in
  // USD, so a label about currency alone would promise a fee-free charge that isn't.
  { label: "Cross-border transactions", value: XB_FEE_LABEL, note: "Non-US merchants, or any non-USD currency" },
  { label: "Chargeback", value: "$50.00", note: "Per chargeback raised" },
];
const CARD_TERMS = [
  { title: "Minimum balance", body: `Keep at least $${CARD_MIN_BALANCE.toFixed(2)} on a card, or it's frozen until you fund it.` },
  { title: "Repeated declines", body: `${DECLINE_LIMIT.domestic} declined domestic or ${DECLINE_LIMIT.international} declined international payments terminates the card.` },
  { title: "Termination", body: "Final. Any balance left on the card returns to your USD balance." },
];

function CardFeesSheet({ onClose }) {
  return (
    <Sheet open onClose={onClose} title="Fees and terms">
      <div className="fees-h">Fees</div>
      <div>
        {CARD_FEES.map((r, i, arr) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
            <div><div style={{ fontSize: 13, color: "var(--gray-700)" }}>{r.label}</div>{r.note && <div style={{ fontSize: 11.5, color: "var(--gray-600)", marginTop: 1 }}>{r.note}</div>}</div>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", color: r.value === "Free" ? "var(--success-700)" : "var(--gray-900)" }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="fees-h" style={{ marginTop: 22 }}>Terms</div>
      <div className="fees-terms">
        {CARD_TERMS.map((t) => (
          <div key={t.title} className="fees-term">
            <div className="t">{t.title}</div>
            <div className="b">{t.body}</div>
          </div>
        ))}
      </div>

      <div className="set-modal-foot"><button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button></div>
    </Sheet>
  );
}

// Per card. Managers edit; everyone else reads. Limits must nest (per transaction ≤ daily ≤
// monthly) — a daily cap below the per-transaction one would silently become the real limit.
function SpendingLimitsSheet({ card, onClose, canEdit, onSave }) {
  const fmt = (n) => "$" + n.toLocaleString();
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState({ ...card.limit });
  const unchanged = LIMIT_FIELDS.every(([k]) => vals[k] === card.limit[k]);

  if (editing) {
    return (
      <Sheet open onClose={onClose} title="Edit spending limits">
        <p className="set-sheet-lede" style={{ marginTop: 0 }}>For <strong>{card.name}</strong>, held by {holderName(card)}. Changes apply to the next payment.</p>
        <LimitSliders value={vals} onChange={setVals} spent={spentOf(card)} />
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={() => { setVals({ ...card.limit }); setEditing(false); }}>Cancel</button>
          <button className="btn btn-lg" disabled={unchanged} onClick={() => onSave(vals)}>Save limits</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="Spending limits">
      <div>
        {SPEND_PERIODS.map((p) => <SpendMeter key={p.key} label={p.key === "daily" ? "Daily" : "Monthly"} spent={spentOf(card)[p.spentKey]} limit={card.limit[p.key]} resets={p.resets} />)}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0", borderTop: "1px solid var(--gray-100)" }}>
          <span style={{ fontSize: 13, color: "var(--gray-600)" }}>Per transaction</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{fmt(card.limit.perTransaction)}</span>
        </div>
        {!canEdit && <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 12 }}>Only admins and operators can change limits.</div>}
      </div>
      <div className="set-modal-foot">
        {canEdit
          ? <><button className="btn btn-ghost" onClick={onClose}>Done</button><button className="btn btn-lg" onClick={() => setEditing(true)}>Edit limits</button></>
          : <button className="btn btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Done</button>}
      </div>
    </Sheet>
  );
}

// Terminating is final, and any balance left on the card comes back — which is the thing people
// actually want confirmed before they press it.
function TerminateCardSheet({ card, onClose, onConfirm }) {
  const balance = card.balance || 0;
  return (
    <Sheet open onClose={onClose} title="Terminate this card?">
      <p className="set-sheet-lede">
        <strong>{card.name}</strong> will stop working immediately and can't be reactivated. Its
        transactions stay available for your records.
      </p>
      {balance > 0 && (
        <div className="row-item" style={{ borderTop: "1px solid var(--gray-100)", paddingTop: 12 }}>
          <div className="k">Returned to your USD balance</div>
          <div className="v strong">${fmtBal(balance)}</div>
        </div>
      )}
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg btn-danger" onClick={onConfirm}>Terminate card</button>
      </div>
    </Sheet>
  );
}

function MoreActionsSheet({ open, onClose, onAction, manage }) {
  const items = [
    { key: "limits", icon: <Icon.shield />, label: "Spending limits" },
    manage && { key: "holder", icon: <Icon.people />, label: "Change cardholder" },
    manage && { key: "withdraw", icon: <Icon.arrowLeft />, label: "Withdraw to wallet" },
    { key: "fees", icon: <Icon.info />, label: "Fees and terms" },
    manage && { key: "edit", icon: <Icon.pencil />, label: "Edit card name" },
    manage && { key: "cancel", icon: <Icon.trash />, label: "Terminate card", danger: true },
  ].filter(Boolean);
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
function CardDetailsCard({ card, onToast, onChangeHolder }) {
  const holder = holderName(card);
  const addr = BILLING_ADDRESS;
  const fullAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;
  return (
    <div className="card" style={{ marginTop: 20, padding: 0 }}>
      <div className="card-detail-row">
        <div className="card-detail-row-head"><span>Cardholder</span><button className="copy-inline" onClick={() => copyText(holder, onToast, "Cardholder name")}><Icon.copy /></button></div>
        <div className="card-holder-row">
          <div style={{ fontSize: 13.5, color: "var(--gray-900)" }}>{holder}{card.holderId === SIGNED_IN.id ? " (you)" : ""}</div>
          {onChangeHolder && <button className="card-holder-change" onClick={onChangeHolder}>Change</button>}
        </div>
      </div>
      <div className="card-detail-row">
        <div className="card-detail-row-head"><span>Billing address</span><button className="copy-inline" onClick={() => copyText(fullAddress, onToast, "Full address")}><Icon.copy /></button></div>
        <div style={{ fontSize: 13.5, color: "var(--gray-800)", lineHeight: 1.7 }}>
          <div>{addr.street}</div>
          <div>{addr.city}, {addr.state} {addr.zip}</div>
          <div>{addr.country}</div>
        </div>
      </div>
      {/* Not buttons: disabled controls for a feature that doesn't exist yet read as broken.
          One line keeps it signposted until it ships. */}
      <div className="wallet-soon-line">
        <img src="../v0/design-system/assets/apple-wallet.svg" alt="" />
        <img src="../v0/design-system/assets/google-wallet.svg" alt="" />
        <span>Apple Pay and Google Pay coming soon</span>
      </div>
    </div>
  );
}

// =====================================================
// Cards list page
// =====================================================
// First run has no cards, so the "+ New card" tile has nothing to append to and the header
// button, the tile and the empty-state button are three controls firing the same action. One
// CTA instead, and the panel does the job those buttons weren't: saying what a card is for.
const PLACEHOLDER_CARD = { name: CARD_BRAND, last4: "••••", expiry: "••/••", cvv: "•••", number: "", status: "active", balance: 0 };
const CARD_BENEFITS = [
  "Pay online in USD or other currencies — Apple Pay and Google Pay coming soon",
  "Funded from your USD balance — top up or withdraw anytime",
  "Freeze, unfreeze or terminate it in one tap",
];

// Cards exist but nothing has been spent yet. Split by whether the card can actually transact:
// "nothing here yet" is a different message from "nothing can happen here yet".
function CardTxnsEmpty({ pending }) {
  return (
    <div className="empty" style={{ padding: "44px 16px" }}>
      <div className="ic"><Icon.card style={{ width: 28, height: 28 }} /></div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-700)", marginBottom: 4 }}>No transactions yet</div>
      <div style={{ fontSize: 12.5, color: "var(--gray-500)", maxWidth: 320, margin: "0 auto", lineHeight: 1.55 }}>
        {pending
          ? "Transactions will appear here once your card is active."
          : "Use your card online and transactions will show up here."}
      </div>
    </div>
  );
}

function CardsEmptyState({ onCreateCard }) {
  const [showFees, setShowFees] = useState(false);
  return (
    <div className="card cards-empty">
      <div className="cards-empty-copy">
        <h2>Create your first card</h2>
        <p>Virtual cards for online payments, subscriptions and ad spend — funded straight from your USD balance.</p>
        <ul className="cards-empty-list">
          {CARD_BENEFITS.map(b => <li key={b}><Icon.check /><span>{b}</span></li>)}
        </ul>
        <div className="cards-empty-actions">
          <button className="btn btn-lg" onClick={onCreateCard}><Icon.plus style={{ width: 15, height: 15 }} /> Create card</button>
          <button className="btn btn-ghost btn-lg" onClick={() => setShowFees(true)}>View fees and terms</button>
        </div>
      </div>
      <div className="cards-empty-art"><CardVisual card={PLACEHOLDER_CARD} /></div>
      {showFees && <CardFeesSheet onClose={() => setShowFees(false)} />}
    </div>
  );
}

// A member who can't create cards has nothing to do on the first-run panel, so this one says how
// a card reaches them instead.
function CardsNoneAssigned() {
  return (
    <div className="card cards-empty">
      <div className="cards-empty-copy">
        <h2>No cards assigned to you</h2>
        <p>Admins and operators create cards and assign them to team members. Ask one of them to set up a card for you — it'll show up here.</p>
      </div>
      <div className="cards-empty-art"><CardVisual card={PLACEHOLDER_CARD} /></div>
    </div>
  );
}

// Moves a card to another active member. Number, balance, limits and history stay with the card.
function ReassignCardSheet({ card, onClose, onConfirm }) {
  const [pick, setPick] = useState(null);
  const options = activeMembers().filter((m) => m.id !== card.holderId);
  const current = memberById(card.holderId);
  return (
    <Sheet open onClose={onClose} title="Change cardholder">
      <p className="set-sheet-lede" style={{ marginTop: 0 }}>
        <strong>{card.name}</strong> keeps its number, balance, limits and history.
        {current && current.status === "active" && <> {firstName(current.name)} loses access to it straight away.</>}
      </p>
      {options.map((m) => (
        <div key={m.id} className={`holder-opt${pick === m.id ? " on" : ""}`} role="radio" aria-checked={pick === m.id} tabIndex={0} onClick={() => setPick(m.id)}>
          <div className="av">{initialsOf(m.name)}</div>
          <div style={{ flex: 1 }}><div className="nm">{m.name}{youSuffix(m)}</div><div className="rl">{ROLE_LABEL[m.role]}</div></div>
          {pick === m.id && <Icon.check style={{ width: 16, height: 16, color: "#7C3AED" }} />}
        </div>
      ))}
      {card.holderRemoved && (
        <div className="td-banner warn" style={{ marginTop: 4 }}>
          <Icon.alert />
          <div><div className="s">The card stays frozen after you reassign it. {current ? firstName(current.name) : "The previous holder"} may have saved the card details — if that's a concern, terminate it and create a new card instead.</div></div>
        </div>
      )}
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!pick} onClick={() => onConfirm(pick)}>Reassign card</button>
      </div>
    </Sheet>
  );
}

function CardsListPage({ cards, onSelect, onCreateCard, txns, blocked, manage }) {
  const allTxns = txns.map((tx, i) => ({ ...tx, card: cards[i % Math.max(cards.length, 1)] }));
  const [selectedTxn, setSelectedTxn] = useState(null);
  // Off by default, but remembered once set — a dead card is clutter every visit, not just once.
  const [hideDead, setHideDead] = useState(() => {
    try { return localStorage.getItem(HIDE_DEAD_KEY) === "1"; } catch (e) { return false; }
  });
  const toggleHideDead = () => setHideDead(v => {
    const next = !v;
    try { localStorage.setItem(HIDE_DEAD_KEY, next ? "1" : "0"); } catch (e) { /* private mode */ }
    return next;
  });
  const deadCount = cards.filter(c => DEAD_STATUSES.includes(c.status)).length;
  const shownCards = hideDead ? cards.filter(c => !DEAD_STATUSES.includes(c.status)) : cards;
  const isEmpty = cards.length === 0;
  // No create affordances while the provider has declined the business — otherwise the customer
  // mints one dead card after another.
  const canCreate = !blocked && manage;

  return (
    <Page>
      <div className="page-head">
        <div><h1 className="title">Cards</h1><p className="subtitle">{manage ? `Manage your team's ${CARD_BRAND} virtual cards.` : `${CARD_BRAND} cards assigned to you.`}</p></div>
        {!isEmpty && canCreate && <button className="btn btn-lg" onClick={onCreateCard}><Icon.plus style={{ width: 15, height: 15 }} /> Create card</button>}
      </div>

      {!isEmpty && !blocked && deadCount > 0 && (
        <label className="cards-hide">
          <input type="checkbox" checked={hideDead} onChange={toggleHideDead} />
          <span>Hide failed and terminated cards ({deadCount})</span>
        </label>
      )}

      {!isEmpty && !blocked && (
        <div className="cards-scroll rail-tabs" style={{ display: "flex", gap: 20, border: "none", marginBottom: 28 }}>
          {shownCards.map((c) => <div key={c.id} style={{ flexShrink: 0 }}><CardTile card={c} showHolder={manage} onClick={() => onSelect(c)} /></div>)}
          {canCreate && (
            <div className="card-new-tile" onClick={onCreateCard}>
              <Icon.plus style={{ width: 20, height: 20, color: "var(--gray-600)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)" }}>New card</span>
            </div>
          )}
        </div>
      )}

      {blocked && (
        <CardRejectedPanel scope="business" />
      )}

      {!isEmpty && !blocked ? (
        <div className="records-card">
          <div className="records-head"><h2>Card transactions</h2><span className="meta">{allTxns.length} transactions</span></div>
          {allTxns.length > 0
            ? <CardTxnList txns={allTxns} onOpen={setSelectedTxn} showCard />
            : <CardTxnsEmpty pending={cards.every(c => c.status !== "active" && c.status !== "frozen")} />}
        </div>
      ) : isEmpty && !blocked ? (
        manage ? <CardsEmptyState onCreateCard={onCreateCard} /> : <CardsNoneAssigned />
      ) : null}
      <CardTxnDetailSheet tx={selectedTxn} card={selectedTxn?.card} onClose={() => setSelectedTxn(null)} />
    </Page>
  );
}

// =====================================================
// Card detail page
// =====================================================
// A card that was never approved can't have transactions, so the notice takes the space the
// transaction panel would have used rather than being squeezed into the 360px card column.
// The provider declines the *business*, not one card — so the next card fails identically.
// `scope="business"` is the version that says so; the card-level one only covers the request
// that happened to be in flight when it was declined.
// The provider declines the *business*, not one card — so at business scope there is no card to
// show, only a request that was declined. Leading with a card tile would assert an object that
// doesn't exist, and push the explanation below it on its own page.
function CardRejectedPanel({ scope = "card", onRemove }) {
  // Business scope carries no per-request detail and no dismiss: the fact is that cards are off,
  // and an action whose only effect is hiding that explanation would leave a blank page.
  const business = scope === "business";
  return (
    <div className="card card-rejected">
      <div className="card-rejected-ic"><Icon.alert /></div>
      <h2>{business ? "Card issuing not approved" : "Card not approved"}</h2>
      <p>
        Our card provider couldn't verify your business for card issuing{business ? ", so cards aren't available on your account right now" : ""}.
        {" "}Your account, balances and payments are unaffected.
      </p>
      <p>Your account team can tell you what the provider needs, and whether it's worth trying again.</p>
      <div className="card-rejected-actions">
        <a className="btn btn-lg" href={CARD_SUPPORT_WA} target="_blank" rel="noopener noreferrer">Message your account team</a>
        {!business && onRemove && <button className="btn btn-ghost btn-lg" style={{ color: "#DC2626", gap: 6 }} onClick={onRemove}>
          <Icon.trash style={{ width: 14, height: 14 }} /> Remove card
        </button>}
      </div>
    </div>
  );
}

// Same shape as the rejected panel: the card never issued, so it takes the transactions slot
// rather than being squeezed beside an empty one.
// A failed card can be neither retried nor terminated — the backend supports neither — so there's
// nothing to do to *this* card. The way forward is a new one; the failed card can be hidden from
// the list with the failed/terminated toggle.
function CardFailedPanel() {
  return (
    <div className="card card-rejected">
      <div className="card-rejected-ic"><Icon.alert /></div>
      <h2>Activation failed</h2>
      <p>We couldn't create this card. Nothing else on your account is affected.</p>
      <p>You can create a new card from Cards. If it keeps happening, your account team can look into it.</p>
      <div className="card-rejected-actions">
        <a className="btn btn-lg" href={CARD_SUPPORT_WA} target="_blank" rel="noopener noreferrer">Message your account team</a>
      </div>
    </div>
  );
}

function CardDetailPage({ card, onBack, onToast, onUpdateCard, onDeleteCard, txns, manage }) {
  const [showReassign, setShowReassign] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [nameVal, setNameVal] = useState(card.name);
  const frozen = card.status === "frozen";
  const activating = card.status === "activating";
  const failed = card.status === "failed";
  const rejected = card.status === "rejected";
  const terminated = card.status === "terminated";
  const usable = card.status === "active" || card.status === "frozen";
  // The reason people keep terminated cards around: the spend history stays readable.
  const showsTxns = usable || terminated;
  // Below the $1.00 minimum the provider freezes the card, and only funding unfreezes it — so
  // this is frozen, but with no Unfreeze button, since pressing it would just fail.
  const lowBalance = frozen && card.lowBalance;
  // Removing a member freezes their cards until a manager reassigns or terminates them — unfreezing
  // first would leave a live card with nobody on the team holding it.
  const holderRemoved = frozen && card.holderRemoved;
  // Anyone holding a card can freeze it (the fast response to a leaked number); only managers
  // can undo that, fund it, or change it.
  const canToggleFreeze = !lowBalance && !holderRemoved && (manage || !frozen);

  const handleFreeze = () => { onUpdateCard({ ...card, status: frozen ? "active" : "frozen" }); onToast(frozen ? "Card unfrozen" : "Card frozen"); setShowFreeze(false); };
  const handleSaveName = () => { if (nameVal.trim() && nameVal.trim() !== card.name) { onUpdateCard({ ...card, name: nameVal.trim() }); onToast("Card name updated"); } setEditingName(false); };
  const handleFund = (amount) => {
    const balance = (card.balance || 0) + amount;
    const lifts = card.lowBalance && balance >= CARD_MIN_BALANCE;
    onUpdateCard({ ...card, balance, ...(lifts ? { status: "active", lowBalance: false } : {}) });
    setShowFund(false);
    onToast(lifts ? `$${amount.toFixed(2)} added — card unfrozen` : `$${amount.toFixed(2)} added`);
  };
  const handleWithdraw = (amount) => { onUpdateCard({ ...card, balance: Math.max(0, (card.balance || 0) - amount) }); setShowWithdraw(false); onToast(`$${amount.toFixed(2)} withdrawn to USD wallet`); };
  const handleReassign = (id) => {
    onUpdateCard({ ...card, holderId: id, holderRemoved: false });
    setShowReassign(false);
    onToast(`Card reassigned to ${memberById(id).name}`);
  };
  const handleSaveLimits = (limit) => { onUpdateCard({ ...card, limit }); setShowLimits(false); onToast("Spending limits updated"); };
  const handleMoreAction = (key) => {
    if (key === "limits") setShowLimits(true);
    else if (key === "holder") setShowReassign(true);
    else if (key === "withdraw") setShowWithdraw(true);
    else if (key === "fees") setShowFees(true);
    else if (key === "edit") setEditingName(true);
    else if (key === "cancel") setShowTerminate(true);
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
      <p className="subtitle" style={{ marginBottom: 20 }}>{(rejected || failed) ? `Requested ${card.created}` : `Virtual · Created ${card.created}`}</p>

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

          {lowBalance && (
            <div className="card card-lowbal">
              <div className="card-lowbal-head"><Icon.alert /><span>Card funding required</span></div>
              <p>This card fell below the ${CARD_MIN_BALANCE.toFixed(2)} minimum, so it's frozen. Fund it to unfreeze it.</p>
              <p>Payments on a frozen card are declined. After {DECLINE_LIMIT.domestic} domestic or {DECLINE_LIMIT.international} international declines, the card is terminated.</p>
              <div className="card-lowbal-bal"><span>Current balance</span><strong>${fmtBal(card.balance || 0)}</strong></div>
            </div>
          )}

          {holderRemoved && (
            <div className="card card-removed">
              <div className="card-removed-head"><Icon.alert /><span>Cardholder removed</span></div>
              <p>{holderName(card)} was removed from the team, so this card is frozen. Reassign it to someone else, or terminate it — any balance returns to your USD balance.</p>
              {manage && (
                <div className="card-removed-actions">
                  <button className="btn" onClick={() => setShowReassign(true)}>Reassign</button>
                  <button className="btn btn-ghost" style={{ color: "#DC2626" }} onClick={() => setShowTerminate(true)}>Terminate</button>
                </div>
              )}
            </div>
          )}

          {terminated && (
            <div className="card" style={{ marginTop: 16, padding: "16px 18px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)", marginBottom: 3 }}>Card terminated</div>
              <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.5 }}>This card can't be used or reactivated. Its transactions stay here for your records.</div>
            </div>
          )}

          {usable && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {manage && <button className="btn btn-lg" style={{ flex: 1, fontSize: 13, padding: "10px 12px", justifyContent: "center" }} onClick={() => setShowFund(true)}><Icon.plus style={{ width: 14, height: 14 }} /> Fund</button>}
              {canToggleFreeze && (
                <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13, padding: "10px 12px", gap: 6, justifyContent: "center", border: "1.5px solid var(--gray-300)", color: frozen ? "var(--success-700)" : "var(--gray-700)" }} onClick={() => setShowFreeze(true)}>
                  {frozen ? <><Icon.zap style={{ width: 14, height: 14 }} /> Unfreeze</> : <><Icon.snowflake style={{ width: 14, height: 14 }} /> Freeze</>}
                </button>
              )}
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: "10px 14px", justifyContent: "center", gap: 5, border: "1.5px solid var(--gray-300)", color: "var(--gray-700)" }} onClick={() => setShowMore(true)}>
                More <Icon.arrowDown style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}

          {usable && !manage && frozen && !lowBalance && (
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", marginTop: 10, lineHeight: 1.5 }}>This card is frozen. Ask an admin or operator to unfreeze it.</div>
          )}
          {usable && !manage && lowBalance && (
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", marginTop: 10, lineHeight: 1.5 }}>Ask an admin or operator to fund it.</div>
          )}

          {usable && <CardDetailsCard card={card} onToast={onToast} onChangeHolder={manage ? () => setShowReassign(true) : null} />}

          {usable && <CardSpendCard card={card} onViewLimits={() => setShowLimits(true)} />}
        </div>

        <div className="card-detail-right">
          {rejected ? (
            <CardRejectedPanel onRemove={manage ? () => { onDeleteCard(card.id); onToast("Card removed"); } : null} />
          ) : failed ? (
            <CardFailedPanel />
          ) : (
          <div className="records-card">
            <div className="records-head"><h2>Card transactions</h2><span className="meta">{showsTxns ? txns.length : 0} transactions</span></div>
            {showsTxns && txns.length > 0
              ? <CardTxnList txns={txns} onOpen={setSelectedTxn} />
              : <CardTxnsEmpty pending={!usable && !terminated} />}
          </div>
          )}
        </div>
      </div>

      {showFund && <FundCardSheet card={card} onClose={() => setShowFund(false)} onFund={handleFund} />}
      {showWithdraw && <WithdrawCardSheet card={card} onClose={() => setShowWithdraw(false)} onWithdraw={handleWithdraw} />}
      {showFreeze && <FreezeCardSheet card={card} manage={manage} onClose={() => setShowFreeze(false)} onConfirm={handleFreeze} />}
      {showLimits && <SpendingLimitsSheet card={card} canEdit={manage} onSave={handleSaveLimits} onClose={() => setShowLimits(false)} />}
      {showReassign && <ReassignCardSheet card={card} onClose={() => setShowReassign(false)} onConfirm={handleReassign} />}
      {showFees && <CardFeesSheet onClose={() => setShowFees(false)} />}
      <MoreActionsSheet open={showMore} manage={manage} onClose={() => setShowMore(false)} onAction={handleMoreAction} />
      {showTerminate && (
        <TerminateCardSheet card={card} onClose={() => setShowTerminate(false)} onConfirm={() => {
          onUpdateCard({ ...card, status: "terminated", balance: 0, holderRemoved: false });
          setShowTerminate(false);
          onToast((card.balance || 0) > 0 ? `Card terminated — $${fmtBal(card.balance)} returned to your USD balance` : "Card terminated");
        }} />
      )}
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
        <div className="cards-apply-eyebrow">{CARD_BRAND} cards</div>
        <h1 className="cards-apply-h1">Spend online, your way</h1>
        <p className="cards-apply-lede">Issue virtual cards with granular spending limits. Use them for online payments — Apple Pay and Google Pay are coming soon.</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div className="cards-apply-visual">
            <div style={{ fontSize: 14, fontWeight: 400, letterSpacing: "0.02em" }}>{CARD_BRAND}</div>
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
            { icon: <Icon.globe />, title: "Pay online", desc: "Pay merchants in USD or other currencies. Apple Pay and Google Pay coming soon." },
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
// The fixtures always seed three funded cards with a full transaction history, which hides every
// first-run and failure state. These seeds make them reachable.
// Cards held by someone no longer on the team are frozen until reassigned. Derived from the roster
// rather than stored, so a removal in Settings shows up here too.
const withHolderState = (cards) => cards.map((c) => {
  const gone = (memberById(c.holderId) || {}).status === "removed";
  return gone && (c.status === "active" || c.status === "frozen") ? { ...c, status: "frozen", holderRemoved: true } : c;
});

function seedCards(access) {
  if (access === "no_cards") return [];
  if (access === "no_txns") return [{ ...Data.CARDS[0], balance: 0 }];
  if (access === "rejected") return [{ ...Data.CARDS[0], status: "rejected", balance: 0 }];
  if (access === "low_balance") return Data.CARDS.map((c, i) => i === 0 ? { ...c, status: "frozen", lowBalance: true, balance: 0.2 } : c);
  return [
    ...Data.CARDS,
    { id: "card-4", name: "Ads — legacy", last4: "5510", type: "virtual", status: "terminated", number: "4539 1201 7781 5510", expiry: "09/28", cvv: "204", limit: { perTransaction: 2000, daily: 5000, monthly: 15000 }, created: "Feb 2, 2026", balance: 0, holderId: "m2" },
    { id: "card-5", name: "Contractor spend", last4: "9032", type: "virtual", status: "failed", number: "4539 1201 4460 9032", expiry: "09/28", cvv: "771", limit: { perTransaction: 2000, daily: 5000, monthly: 15000 }, created: "Aug 9, 2026", balance: 0, holderId: "m1" },
    { id: "card-6", name: "Field sales", last4: "2648", type: "virtual", status: "active", number: "4539 1201 5073 2648", expiry: "09/28", cvv: "416", limit: { perTransaction: 1000, daily: 2500, monthly: 10000 }, created: "Jul 21, 2026", balance: 185.40, holderId: "m6", spent: { today: 0, month: 140.00 } },
  ];
}

function CardsScreen({ onToast, cardsAccess = "active", role = "admin" }) {
  const manage = can(role, "cards");
  const [allCards, setCards] = useState(() => withHolderState(seedCards(cardsAccess)));
  // Without card management a member sees only the cards they hold.
  const cards = manage ? allCards : allCards.filter((c) => c.holderId === SIGNED_IN.id);
  const txns = (cardsAccess === "no_txns" || cardsAccess === "rejected") ? [] : CARD_TXNS;
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
    return <CardDetailPage card={liveCard} onBack={handleBack} onToast={onToast} onUpdateCard={handleUpdate} onDeleteCard={handleDelete} txns={txns} manage={manage} />;
  }

  return (
    <>
      <CardsListPage cards={cards} onSelect={handleSelect} onCreateCard={() => setShowCreate(true)} txns={txns} blocked={cardsAccess === "rejected"} manage={manage} />
      {showCreate && <CreateCardSheet onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </>
  );
}

window.OBCards = { CardsScreen };
