/* global React */
/* Sub-accounts — one screen, whatever you use them for.

   Verified against the ledger spec (ledger.onboard.json, 3.0.2) rather than the public docs,
   which are missing pieces:
     POST /subaccounts                       create — reference required, 6–36 chars, unique
     PUT  /subaccounts/{ref}                 rename, freeze/unfreeze
     DELETE /subaccounts/{ref}               close
     POST /internal-transfers                main↔sub AND sub↔sub, by source/destination id
     GET,POST /subaccounts/{ref}/account-details    its own virtual account number
     GET,POST /subaccounts/{ref}/funding-address    its own crypto address
     GET  /subaccounts/{ref}/activities
     cash-payments / cash-deposits accept a sub-account as `accountId`
   Sub-accounts are always USD.

   The earlier version had two UIs picked by a mock toggle — treasury vs customer wallets. That
   can't ship: you'd be asking a business to declare a use case, and plenty are both. The two
   differ in scale and who creates them, not in what the object is, so this is one list that
   changes with count (allocation bar for a handful, search and totals for thousands) and one
   detail page. `reference` is the mapping key back to the business's own records, so it's the
   secondary identifier everywhere and it's searchable.

   Payouts from a sub-account are supported by the API but deliberately absent here: adding a
   source picker to the global Send flow would complicate the surface for the majority who never
   use sub-accounts. Until that's designed properly, sub-account payouts are an API capability
   and the detail page says so. */
const { useState, useMemo } = React;
const Icon = window.OBIcon;
const { Page, Sheet, Pill, Records, useIsDesktop, can, NoAccessNote, FieldGrid, Banner, truncateMiddle, QrCode } = window.OBPrimitives;
const NetworkIcon = window.OBNetworkIcon;
const SACombobox = window.OBCombobox;
const SA_CHAINS = window.OBData.STABLECOIN_CHAINS || {};

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${fmt(n)}`);
// One view for both audiences. Treasury reads it top-down (how is my money split, which pot is
// which); a platform searches it (what's this customer's balance). Nothing branches on count —
// search is always there, the split is a two-part bar rather than a stripe per account, and the
// rows are the same whether there are four or four thousand.

const SA_COLORS = [
  { bg: "#EEF2FF", fg: "#4338CA" },
  { bg: "#ECFDF5", fg: "#047857" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#E0F2FE", fg: "#0369A1" },
  { bg: "#F3E8FF", fg: "#7E22CE" },
];
const colorFor = (ref) => {
  let h = 0;
  for (let i = 0; i < ref.length; i++) h = (h * 31 + ref.charCodeAt(i)) >>> 0;
  return SA_COLORS[h % SA_COLORS.length];
};
const initialsOf = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const SUBS_SEED = [
  { id: "sa1", reference: "payroll-ops", name: "Payroll", balance: 32400.00, frozen: false, created: "Mar 4, 2026", last: "2 hours ago" },
  { id: "sa2", reference: "supplier-pay", name: "Supplier payments", balance: 12850.00, frozen: false, created: "Mar 4, 2026", last: "Yesterday" },
  { id: "sa3", reference: "lagos-ops", name: "Lagos operations", balance: 6120.40, frozen: false, created: "Apr 18, 2026", last: "3 days ago" },
  { id: "sa4", reference: "tax-reserve", name: "Tax reserve", balance: 18000.00, frozen: false, created: "Jun 2, 2026", last: "Jul 25" },
  { id: "c1", reference: "cus_8f3c5d2a", name: "Adaeze Okafor", balance: 1240.00, frozen: false, created: "Jan 8, 2026", last: "2 hours ago" },
  { id: "c2", reference: "cus_2c7b4f9e", name: "Kwame Osei", balance: 18905.20, frozen: false, created: "Jan 9, 2026", last: "14 minutes ago" },
  { id: "c3", reference: "cus_41ef2670", name: "Tausi Logistics Ltd", balance: 0, frozen: true, created: "Feb 2, 2026", last: "Under review" },
  { id: "c4", reference: "cus_9d04a118", name: "Lucia Macamo", balance: 430.75, frozen: false, created: "Feb 14, 2026", last: "Yesterday" },
  { id: "c5", reference: "cus_5b31c0da", name: "Berlin Verlag GmbH", balance: 7120.00, frozen: false, created: "Mar 1, 2026", last: "3 days ago" },
  { id: "c6", reference: "cus_7a92be04", name: "Joseph Mwangi", balance: 2980.10, frozen: false, created: "Mar 22, 2026", last: "6 hours ago" },
  { id: "c7", reference: "cus_1f60d7c3", name: "Mensah Holdings Ltd", balance: 45210.00, frozen: false, created: "Apr 3, 2026", last: "Today" },
  { id: "c8", reference: "cus_63b8a0f1", name: "Aisha Komba", balance: 875.40, frozen: false, created: "Apr 27, 2026", last: "5 days ago" },
  { id: "c9", reference: "cus_0e4c93ab", name: "Riverbend Imports Inc", balance: 12400.00, frozen: false, created: "May 11, 2026", last: "Yesterday" },
  { id: "c10", reference: "cus_ba17f582", name: "Northwood Trading Ltd", balance: 3055.85, frozen: false, created: "Jun 6, 2026", last: "2 days ago" },
];

const SUB_ACTIVITY = {
  // Everything a sub-account can carry: internal transfers both ways, payouts in any corridor,
  // deposits into its own account number or address, and the states those pass through.
  sa1: [
    { id: "s1a", date: "Aug 1, 09:12", direction: "out", type: "Cash payout", party: "Adaeze Okafor", ref: "PAY-2026-04981", amount: "1,250,000.00", ccy: "NGN", from: "USD", status: "PROCESSING", pillTone: "warn" },
    { id: "s1b", date: "Jul 31, 16:40", direction: "in", type: "Internal transfer", party: "From main account", ref: "ITR-2026-00841", amount: "40,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s1g", date: "Jul 30, 18:05", direction: "in", type: "Crypto deposit", party: "USDC · Base network", ref: "OPN-c9d1f3a8-e472", amount: "12,000.00", ccy: "USD", chain: "base", txHash: "0x7b4a2f1c9e8d3a5b6f0c4e2d1a8b7c3f9e6d5a4b", status: "COMPLETED", pillTone: "success" },
    { id: "s1d", date: "Jul 30, 08:20", direction: "in", type: "Account number deposit", party: "NGN — GTBank ****4410", ref: "OPN-2b71c4e9-8a35", amount: "3,366.80", fromAmount: "5,000,000.00", ccy: "USD", from: "NGN", rate: "1 USD = ₦1,485.50", status: "COMPLETED", pillTone: "success" },
    { id: "s1e", date: "Jul 29, 15:44", direction: "out", type: "Internal transfer", party: "To Supplier payments", ref: "ITR-2026-00836", amount: "6,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s1c", date: "Jul 28, 11:02", direction: "out", type: "Cash payout", party: "Kwame Osei", ref: "PAY-2026-04944", amount: "48,200.00", ccy: "GHS", from: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s1f", date: "Jul 27, 09:30", direction: "out", type: "Cash payout", party: "Tausi Logistics Ltd", ref: "PAY-2026-04931", amount: "1,840,000.00", ccy: "TZS", from: "USD", status: "FAILED", pillTone: "danger" },
  ],
  sa2: [
    { id: "s2a", date: "Jul 30, 14:22", direction: "out", type: "Cash payout", party: "Mensah Holdings Ltd", ref: "PAY-2026-04960", amount: "18,400.00", ccy: "GHS", from: "USD", status: "PROCESSING", pillTone: "warn" },
    { id: "s2b", date: "Jul 26, 10:05", direction: "in", type: "Internal transfer", party: "From main account", ref: "ITR-2026-00812", amount: "15,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
  ],
  sa3: [
    { id: "s3a", date: "Jul 29, 08:31", direction: "in", type: "Internal transfer", party: "From main account", ref: "ITR-2026-00830", amount: "8,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s3b", date: "Jul 27, 15:18", direction: "out", type: "Cash payout", party: "Tausi Logistics Ltd", ref: "PAY-2026-04938", amount: "2,480,000.00", ccy: "TZS", from: "USD", status: "COMPLETED", pillTone: "success" },
  ],
  sa4: [
    { id: "s4a", date: "Jul 25, 12:00", direction: "in", type: "Internal transfer", party: "From main account", ref: "ITR-2026-00799", amount: "18,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
  ],
};
const DEFAULT_ACTIVITY = [
  { id: "d1", date: "Aug 1, 10:40", direction: "in", type: "Account number deposit", party: "NGN — First Bank ****1181", ref: "OPN-4a7c9f1e-2d83", amount: "504.87", ccy: "USD", from: "NGN", status: "COMPLETED", pillTone: "success" },
  { id: "d2", date: "Jul 29, 13:15", direction: "out", type: "Cash payout", party: "Supplier payout", ref: "PAY-2026-04952", amount: "1,200.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
];

// Per-sub funding details — what POST /subaccounts/{ref}/account-details and /funding-address
// return. Addresses are per sub *and* per network, same as the main account's.
const subNgnAccount = (sub) => ({
  bank: "Aella Microfinance Bank",
  name: `GFS / ${sub.name}`,
  number: "72" + String(Math.abs(sub.reference.length * 8171 + 4410293)).slice(0, 8),
});
const subCryptoAddress = (sub, chainId) => {
  const seed = (sub.reference + chainId).replace(/[^a-z0-9]/gi, "");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const hex = Array.from({ length: 40 }, (_, i) => "0123456789abcdef"[(h >> (i % 8) * 4 & 15) ^ (seed.charCodeAt(i % seed.length) & 15)]).join("");
  return chainId === "tron" ? "T" + hex.slice(0, 33) : "0x" + hex;
};

// Mirrors the spec's constraint: 6–36 chars, alphanumeric plus dash/underscore.
function slugRef(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
  return base.length >= 6 ? base : (base + "-account").slice(0, 36);
}

// Mirrors the Deposit page: rail tabs, then either bank fields or a network picker plus the
// address. Same components, one level down — a sub-account funds exactly like the main one.
function SubFunding({ sub, onToast, compact }) {
  const isDesktop = useIsDesktop();
  const [rail, setRail] = useState(0);
  const [chainIdx, setChainIdx] = useState(0);
  const rails = [
    { id: "ngn", name: "NGN account" },
    { id: "USDC", name: "USDC" },
    { id: "USDT", name: "USDT" },
    { id: "fiat", name: "USD · EUR · GBP", locked: true },
  ];
  const active = rails[rail];
  const tabs = (
    <div className="rail-tabs">
      {rails.map((r, i) => (
        <button key={r.id} className={`rail-tab ${i === rail ? "on" : ""} ${r.locked ? "locked" : ""}`} onClick={() => { setRail(i); setChainIdx(0); }}>
          {r.locked && <Icon.lock />}{r.name}
        </button>
      ))}
    </div>
  );

  if (active.id === "fiat") {
    return (
      <div className="sa-fundcard" id="sub-funding">
        <div className="deposit-head"><div className="deposit-head-row"><h2>Paying into this sub-account</h2></div>{tabs}</div>
        <div className="rail-panel">
          <div className="sa-locked">
            <Icon.lock />
            <div>
              <div className="t">USD, EUR and GBP accounts live on your main account</div>
              <div className="s">Sub-accounts don't get their own bank details in those currencies. Have the payer send to your main account, then move the money into {sub.name} — instantly, and free.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (active.id === "ngn") {
    const ngn = subNgnAccount(sub);
    return (
      <div className="sa-fundcard" id="sub-funding">
        <div className="deposit-head"><div className="deposit-head-row"><h2>Paying into this sub-account</h2></div>{tabs}</div>
        <div className="rail-panel">
          <FieldGrid
            fields={[
              { k: "Bank name", v: ngn.bank },
              { k: "Account name", v: ngn.name },
              { k: "Account number", v: ngn.number, copy: true },
              { k: "Conversion rate", v: "1 USD = ₦1,400.50" },
            ]}
            onCopy={() => onToast("Copied")}
          />
          <div className="sa-note" style={{ marginTop: 0 }}>Naira paid in here is converted to USD at the live rate and lands in this sub-account.</div>
        </div>
      </div>
    );
  }

  const chains = SA_CHAINS[active.id] || [];
  const chain = chains[Math.min(chainIdx, chains.length - 1)];
  const address = chain ? subCryptoAddress(sub, chain.id) : "";
  return (
    <div className="sa-fundcard" id="sub-funding">
      <div className="deposit-head"><div className="deposit-head-row"><h2>Paying into this sub-account</h2></div>{tabs}</div>
      <div className="rail-panel">
      <div style={{ marginBottom: 16 }}>
        <div className="field-k" style={{ marginBottom: 8 }}>Network</div>
        {isDesktop ? (
          <div className="chan-picker">
            {chains.map((c, i) => {
              const NIcon = NetworkIcon[c.id];
              return (
                <button key={c.id} className={`chan-btn ${i === chainIdx ? "on" : ""}`} onClick={() => setChainIdx(i)}>
                  {NIcon && <NIcon />}{c.name}
                  <span style={{ fontSize: 11, opacity: .65, fontWeight: 400 }}>({c.short})</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="net-select-wrap">
            {(() => { const NIcon = NetworkIcon[chain && chain.id]; return NIcon ? <span className="net-select-icon"><NIcon /></span> : null; })()}
            <select className="net-select" value={chainIdx} onChange={(e) => setChainIdx(Number(e.target.value))}>
              {chains.map((c, i) => <option key={c.id} value={i}>{c.name} ({c.short})</option>)}
            </select>
            <Icon.arrowDown />
          </div>
        )}
      </div>
      {chain && (
        <>
          {!compact && (
            <Banner tone="danger" icon={<Icon.alert />}>
              Only send {active.id} on the <strong>{chain.name}</strong> network to this address. Sending on the wrong network will result in permanent loss of funds.
            </Banner>
          )}
          <div className="qr-block">
            <div className="qr-frame"><QrCode value={address} /></div>
            <div className="qr-side">
              <div className="qr-side-lbl">{sub.name} · {chain.name}</div>
              <div className="qr-side-addr" title={address}>{truncateMiddle(address)}</div>
              <button className="btn btn-soft btn-sm" onClick={() => { try { navigator.clipboard.writeText(address); onToast("Address copied"); } catch (e) { onToast("Copy failed"); } }}><Icon.copy /> Copy address</button>
              <div className="qr-side-hint">Scan with your wallet, or copy the address to send {active.id} on {chain.name}.</div>
            </div>
          </div>
          <FieldGrid
            fields={[
              { k: `${active.id} address`, v: address, copy: true },
              { k: "Minimum", v: `${chain.min} ${active.id}` },
            ]}
            onCopy={() => onToast("Copied")}
          />
          <div className="sa-note" style={{ marginTop: 0 }}>Credited as USD in this sub-account.</div>
        </>
      )}
      </div>
    </div>
  );
}

function SubAvatar({ sub, size = 38 }) {
  const c = colorFor(sub.reference);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: c.bg, color: c.fg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontSize: size * 0.36, fontWeight: 600, letterSpacing: "0.01em",
    }}>{initialsOf(sub.name)}</div>
  );
}

function CreateSubAccountSheet({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [touchedRef, setTouchedRef] = useState(false);
  const effectiveRef = touchedRef ? reference : (name.trim() ? slugRef(name) : "");
  const refValid = /^[a-zA-Z0-9_-]{6,36}$/.test(effectiveRef);
  const canCreate = name.trim().length > 1 && refValid;

  return (
    <Sheet open onClose={onClose} title="Create sub-account">
      <div className="field">
        <div className="lbl">Name</div>
        <input className="inp" placeholder="e.g. Payroll, or a customer's name" value={name} autoFocus
               onChange={(e) => setName(e.target.value)} />
        <div className="help">Shown across your dashboard. Only you see this.</div>
      </div>
      <div className="field">
        <div className="lbl">Reference</div>
        <input className="inp" placeholder="payroll-ops" value={effectiveRef}
               onChange={(e) => { setTouchedRef(true); setReference(e.target.value); }} />
        <div className="help" style={effectiveRef && !refValid ? { color: "#DC2626" } : undefined}>
          {effectiveRef && !refValid
            ? "6–36 characters. Letters, numbers, dashes and underscores only."
            : "A unique ID you choose — use your own customer or cost-centre code to match your records. It can't be changed later."}
        </div>
      </div>
      <div className="td-banner info" style={{ marginTop: 4 }}>
        <Icon.info />
        <div><div className="s">Sub-accounts hold <strong>USD</strong>. Fund one from your main account, or give it its own account number or stablecoin address so others can pay into it directly.</div></div>
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!canCreate}
                onClick={() => onCreate({ name: name.trim(), reference: effectiveRef })}>Create sub-account</button>
      </div>
    </Sheet>
  );
}

// Money in: from the main balance, or from outside via this sub's own details. Both are real —
// a treasury pot gets topped up from main, and a counterparty can pay one directly.
function AddMoneySheet({ sub, mainBalance, onClose, onMove, onShowDetails }) {
  const [amount, setAmount] = useState("");
  const parsed = parseFloat(amount) || 0;
  const tooMuch = parsed > mainBalance;

  return (
    <Sheet open onClose={onClose} title={`Add money to ${sub.name}`}>
      <p className="set-sheet-lede" style={{ marginTop: 0 }}>Move USD from your main account. Instant and free.</p>
      <>
          <div className="field">
            <div className="lbl">Amount</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
              <input className={`inp${tooMuch ? " inp-error" : ""}`} type="number" min="0" step="0.01" placeholder="0.00"
                     value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30 }} autoFocus />
            </div>
            <div className="help" style={tooMuch ? { color: "#DC2626" } : undefined}>
              {tooMuch ? `Only $${fmt(mainBalance)} in your main account.` : `$${fmt(mainBalance)} available · instant and free`}
            </div>
          </div>
          <div className="sa-outside-note">
            Being paid by someone else?{" "}
            <button className="lnk" onClick={() => { onClose(); onShowDetails(); }}>Use this sub-account's own details</button> — its NGN account number or stablecoin address.
          </div>
          <div className="set-modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-lg" disabled={!(parsed > 0) || tooMuch} onClick={() => onMove(parsed)}>Add money</button>
          </div>
        </>
    </Sheet>
  );
}

// Money out of a sub, to somewhere else you own: the main account or another sub. Both are one
// call to POST /internal-transfers.
function MoveOutSheet({ sub, subs, mainBalance = 0, onClose, onMove }) {
  const others = subs.filter((s) => s.id !== sub.id && !s.frozen);
  const [dest, setDest] = useState("__main");
  const [amount, setAmount] = useState("");
  const parsed = parseFloat(amount) || 0;
  const tooMuch = parsed > sub.balance;
  const destName = dest === "__main" ? "your main account" : (others.find((s) => s.id === dest) || {}).name;

  return (
    <Sheet open onClose={onClose} title={`Move money out of ${sub.name}`}>
      <div className="field">
        <div className="lbl">Destination</div>
        <SACombobox
          value={dest}
          onChange={setDest}
          placeholder="Main account or a sub-account"
          searchPlaceholder="Search by name or reference…"
          options={[
            { value: "__main", label: "Main account", sub: `$${fmt(mainBalance)} available` },
            ...others.map((s) => ({ value: s.id, label: s.name, sub: s.reference, search: `${s.name} ${s.reference}` })),
          ]}
        />
      </div>
      <div className="field">
        <div className="lbl">Amount</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
          <input className={`inp${tooMuch ? " inp-error" : ""}`} type="number" min="0" step="0.01" placeholder="0.00"
                 value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30 }} autoFocus />
        </div>
        <div className="help" style={tooMuch ? { color: "#DC2626" } : undefined}>
          {tooMuch ? `Only $${fmt(sub.balance)} in ${sub.name}.` : `$${fmt(sub.balance)} available · instant and free`}
        </div>
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!(parsed > 0) || tooMuch} onClick={() => onMove(dest, parsed, destName)}>Move money</button>
      </div>
    </Sheet>
  );
}

function SubTxnSheet({ tx, sub, onClose, onToast }) {
  if (!tx) return null;
  const isIn = tx.direction === "in";
  // A crypto deposit is its hash — without it the row can't be checked against a chain or sent
  // to whoever paid. A converted deposit is the local amount and the rate it came in at.
  const R = window.OBReceipt || {};
  const explorer = tx.txHash ? (R.EXPLORERS || {})[tx.chain] : null;
  const network = tx.chain ? ((R.NETWORK_NAMES || {})[tx.chain] || tx.chain) : null;
  const rows = [
    { label: "Type", value: tx.type },
    { label: "Counterparty", value: tx.party },
    { label: "Sub-account", value: `${sub.name} · ${sub.reference}` },
    { label: "Date", value: tx.date },
    tx.fromAmount && { label: "Amount received", value: `${tx.fromAmount} ${tx.from}` },
    tx.rate && { label: "Rate", value: tx.rate },
    network && { label: "Network", value: network },
    { label: "Reference", value: tx.ref, copy: true },
    tx.txHash && { label: "Transaction hash", value: tx.txHash, copy: true, href: explorer ? explorer + tx.txHash : null, truncate: true },
  ].filter(Boolean);
  return (
    <Sheet open onClose={onClose} title={tx.party}>
      <div style={{ marginBottom: 12 }}><Pill tone={tx.pillTone}>{tx.status}</Pill></div>
      <div style={{ textAlign: "center", padding: "8px 0 20px", borderBottom: "1px solid var(--gray-100)", marginBottom: 4 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: isIn ? "var(--success-700)" : "var(--gray-900)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          {isIn ? "+" : "−"}{tx.amount}
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--gray-500)", marginLeft: 6 }}>{tx.ccy}</span>
        </div>
      </div>
      <div className="pay-review-list" style={{ paddingTop: 0 }}>
        {rows.map((r) => (
          <div className="row-item" key={r.label}>
            <div className="k">{r.label}</div>
            <div className="v">
              {r.href
                ? <a href={r.href} target="_blank" rel="noopener noreferrer" title={r.value}>{truncateMiddle(r.value)}</a>
                : r.truncate ? <span title={r.value}>{truncateMiddle(r.value)}</span> : r.value}
              {r.copy && <button className="copy-inline" onClick={() => { try { navigator.clipboard.writeText(r.value); onToast(`${r.label} copied`); } catch (e) { onToast("Copy failed"); } }}><Icon.copy /></button>}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function FreezeSubSheet({ sub, onClose, onConfirm }) {
  return (
    <Sheet open onClose={onClose} title={sub.frozen ? "Unfreeze sub-account?" : "Freeze sub-account?"}>
      <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
        {sub.frozen
          ? <><strong style={{ color: "var(--gray-900)" }}>{sub.name}</strong> will be able to send and receive again.</>
          : <><strong style={{ color: "var(--gray-900)" }}>{sub.name}</strong> will stop sending and receiving immediately. The balance stays put and you can unfreeze at any time.</>}
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" style={sub.frozen ? {} : { background: "#1D4ED8" }} onClick={onConfirm}>{sub.frozen ? "Unfreeze" : "Freeze"}</button>
      </div>
    </Sheet>
  );
}

function DeleteSubSheet({ sub, onClose, onConfirm }) {
  const hasBalance = sub.balance > 0;
  return (
    <Sheet open onClose={onClose} title="Close sub-account?">
      <div style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
        {hasBalance
          ? <>Move the remaining <strong style={{ color: "var(--gray-900)" }}>${fmt(sub.balance)}</strong> out of {sub.name} before closing it. Sub-accounts must be empty to close.</>
          : <><strong style={{ color: "var(--gray-900)" }}>{sub.name}</strong> will be closed permanently. This can't be undone, and the reference can't be reused.</>}
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={hasBalance} style={hasBalance ? {} : { background: "var(--danger-600)" }} onClick={onConfirm}>Close sub-account</button>
      </div>
    </Sheet>
  );
}

// ---------- List ----------
// One list. Few accounts: allocation bar, no search, roomy rows. Many: totals, search, and a
// count of what's showing. Nothing to choose — it follows the number of accounts.
function SubAccountsList({ subs, mainBalance, onSelect, onCreate, canManage }) {
  const [q, setQ] = useState("");
  const isDesktop = useIsDesktop();
  const count = subs.length;
  const held = subs.reduce((s, x) => s + x.balance, 0);
  const active = subs.filter((s) => !s.frozen).length;
  const pct = held + mainBalance > 0 ? (held / (held + mainBalance)) * 100 : 0;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return subs;
    return subs.filter((s) => s.name.toLowerCase().includes(t) || s.reference.toLowerCase().includes(t));
  }, [q, subs]);

  const metric = (label, value) => (
    <div className="tx-stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Sub-accounts</h1>
          <p className="subtitle">Separate USD balances under your account — for teams, budgets, or your own customers.</p>
        </div>
        {canManage && <button className="btn btn-lg" onClick={onCreate}><Icon.plus style={{ width: 15, height: 15 }} /> Create sub-account</button>}
      </div>

      <div className="tx-stats">
        {metric("Main account", `$${fmt(mainBalance)}`)}
        {metric(`In ${count.toLocaleString()} sub-account${count === 1 ? "" : "s"}`, fmtCompact(held))}
        {metric("Active this month", active.toLocaleString())}
      </div>

      {subs.length > 0 && (
        <div className="card sa-splitcard">
          <div className="sa-splitbar"><div className="subs" style={{ width: `${pct}%` }} /></div>
          <div className="sa-splitlegend">
            <span><i className="d subs" />{Math.round(pct)}% in sub-accounts</span>
            <span><i className="d main" />${fmt(mainBalance)} in your main account</span>
          </div>
        </div>
      )}

      {subs.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="ic"><Icon.wallet style={{ width: 36, height: 36 }} /></div>
            <div style={{ fontWeight: 500, color: "var(--gray-900)", marginBottom: 4, fontSize: 14 }}>No sub-accounts yet</div>
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", maxWidth: 380, margin: "4px auto 16px", lineHeight: 1.6 }}>
              Keep payroll, suppliers or a customer's funds separate from your main balance — each with its own balance, details and activity.
            </div>
            {canManage && <button className="btn btn-lg" onClick={onCreate}>Create your first sub-account</button>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {(
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--gray-200)" }}>
              <div className="tx-search">
                <Icon.search />
                <input placeholder="Search by name or reference…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: "48px 16px" }}>
              <div className="ic"><Icon.search /></div>
              <div style={{ fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500, marginBottom: 4 }}>No matches</div>
              <div style={{ fontSize: 12.5 }}>Try a different name or reference.</div>
            </div>
          ) : filtered.map((s) => (
            <div key={s.id} className="sa-row" onClick={() => onSelect(s)}>
              <SubAvatar sub={s} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{s.reference}</div>
              </div>
              {isDesktop && <div style={{ fontSize: 12, color: "var(--gray-500)", width: 110, textAlign: "right" }}>{s.last}</div>}
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 92 }}>${fmt(s.balance)}</div>
              {s.frozen ? <Pill tone="info">Frozen</Pill> : <Pill tone="success">Active</Pill>}
            </div>
          ))}

          <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--gray-500)", textAlign: "center", borderTop: "1px solid var(--gray-200)" }}>
            Showing {filtered.length} of {count.toLocaleString()}
          </div>
        </div>
      )}
    </Page>
  );
}

// ---------- Detail ----------
function SubAccountDetailPage({ sub, subs, mainBalance, activity, onBack, onToast, onUpdate, onDelete, canManage }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [openTx, setOpenTx] = useState(null);
  // Sends them to the details already on the page rather than duplicating them in a modal.
  const showFundingDetails = () => {
    const el = document.getElementById("sub-funding");
    if (!el) return;
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1800);
  };
  const copy = (text, label) => {
    try { navigator.clipboard.writeText(text); onToast(`${label} copied`); } catch (e) { onToast("Copy failed"); }
  };
  const addFromMain = (amount) => {
    onUpdate({ ...sub, balance: sub.balance + amount }, -amount);
    setShowAdd(false);
    onToast(`$${fmt(amount)} moved to ${sub.name}`);
  };
  const moveOut = (dest, amount, destName) => {
    onUpdate({ ...sub, balance: sub.balance - amount }, dest === "__main" ? amount : 0, dest === "__main" ? null : { id: dest, amount });
    setShowMove(false);
    onToast(`$${fmt(amount)} moved to ${destName}`);
  };

  return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Sub-accounts</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{sub.name}</span>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
          <SubAvatar sub={sub} size={46} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--gray-900)" }}>{sub.name}</h1>
              {sub.frozen && <Pill tone="info">Frozen</Pill>}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{sub.reference}</span>
              <button className="copy-inline" onClick={() => copy(sub.reference, "Reference")}><Icon.copy /></button>
              <span>· USD · created {sub.created}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 32, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", marginBottom: 18 }}>
          ${fmt(sub.balance)}
        </div>

        {canManage ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setShowAdd(true)} disabled={sub.frozen}><Icon.plus /> Add money</button>
            <button className="btn btn-soft" onClick={() => setShowMove(true)} disabled={sub.frozen}><Icon.swap /> Move money</button>
            <button className="btn btn-soft" onClick={() => setShowFreeze(true)}><Icon.snowflake /> {sub.frozen ? "Unfreeze" : "Freeze"}</button>
            <button className="btn btn-ghost" onClick={() => setShowDelete(true)}><Icon.trash /> Close</button>
          </div>
        ) : (
          <NoAccessNote>Only operators and admins can move money between accounts.</NoAccessNote>
        )}
      </div>

      <SubFunding sub={sub} onToast={onToast} />

      <Records title="Activity" txns={activity} onRowClick={setOpenTx} emptyHint="Transfers and payouts for this sub-account will show up here." />

      <div className="sa-note" style={{ marginTop: 14 }}>
        Paying out from this sub-account is available through the API — the Send screen pays from
        your main account.
      </div>

      {openTx && <SubTxnSheet tx={openTx} sub={sub} onClose={() => setOpenTx(null)} onToast={onToast} />}
      {showAdd && <AddMoneySheet sub={sub} mainBalance={mainBalance} onClose={() => setShowAdd(false)} onMove={addFromMain} onShowDetails={showFundingDetails} />}
      {showMove && <MoveOutSheet sub={sub} subs={subs} mainBalance={mainBalance} onClose={() => setShowMove(false)} onMove={moveOut} />}
      {showFreeze && (
        <FreezeSubSheet sub={sub} onClose={() => setShowFreeze(false)}
          onConfirm={() => { onUpdate({ ...sub, frozen: !sub.frozen }, 0); setShowFreeze(false); onToast(sub.frozen ? `${sub.name} unfrozen` : `${sub.name} frozen`); }} />
      )}
      {showDelete && (
        <DeleteSubSheet sub={sub} onClose={() => setShowDelete(false)}
          onConfirm={() => { onDelete(sub.id); setShowDelete(false); onToast(`${sub.name} closed`); }} />
      )}
    </Page>
  );
}

// ---------- Root ----------
// `mode` is how many to seed, not a different UI: "customers" loads the platform-scale fixtures.
function SubAccountsScreen({ onToast, mode = "on", mainBalance: seedBalance = 84231.50, role = "admin" }) {
  const [subs, setSubs] = useState(mode === "none" ? [] : SUBS_SEED);
  const [mainBalance, setMainBalance] = useState(seedBalance);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const canManage = can(role, "pay");

  const selected = subs.find((s) => s.id === selectedId);

  // `mainDelta` is what leaves or returns to the main balance; `toSub` moves it to another
  // sub-account instead, which is the sub↔sub case the ledger supports.
  const update = (next, mainDelta, toSub) => {
    setSubs((prev) => prev.map((s) => {
      if (s.id === next.id) return next;
      if (toSub && s.id === toSub.id) return { ...s, balance: s.balance + toSub.amount };
      return s;
    }));
    if (mainDelta) setMainBalance((b) => b + mainDelta);
  };
  const create = ({ name, reference }) => {
    const sub = { id: "sa-" + Date.now(), reference, name, balance: 0, frozen: false, created: "Today", last: "Just now" };
    setSubs((prev) => [sub, ...prev]);
    setCreating(false);
    setSelectedId(sub.id);
    onToast(`${name} created`);
  };
  const remove = (id) => { setSubs((prev) => prev.filter((s) => s.id !== id)); setSelectedId(null); };

  if (selected) {
    return (
      <SubAccountDetailPage
        sub={selected}
        subs={subs}
        mainBalance={mainBalance}
        activity={SUB_ACTIVITY[selected.id] || DEFAULT_ACTIVITY}
        onBack={() => setSelectedId(null)}
        onToast={onToast}
        onUpdate={update}
        onDelete={remove}
        canManage={canManage}
      />
    );
  }

  return (
    <>
      <SubAccountsList
        subs={subs}
        mainBalance={mainBalance}
        onSelect={(s) => setSelectedId(s.id)}
        onCreate={() => setCreating(true)}
        canManage={canManage}
      />
      {creating && <CreateSubAccountSheet onClose={() => setCreating(false)} onCreate={create} />}
    </>
  );
}

// Home only carries this when there are few enough to be worth showing — thousands of customer
// sub-accounts never belong on a dashboard.
// Summary, not a list. Naming three of 4,812 accounts tells you nothing, and with a cards panel
// underneath it a second list of rows turns the column into noise. The one thing worth knowing
// from Home is how the money is split, so that's a two-part bar and a count.
function SubAccountsHomePanel({ onOpen, mode = "on", mainBalance = 84231.50 }) {
  // Empty mirrors the account card line for line — label, balance, action, divider, note — so
  // the two panels read as one row rather than a balance next to an advert.
  if (mode === "none") {
    return (
      <div className="home-cards-panel">
        <div className="home-hero-top">
          <div className="home-acct-label"><Icon.wallet style={{ width: 17, height: 17, color: "var(--gray-500)" }} /><span>Sub-accounts</span></div>
        </div>
        <div className="home-balance">
          <span className="home-balance-num">$0.00</span>
          <span className="home-balance-ccy">in 0 accounts</span>
        </div>
        <div className="home-actions"><button className="btn btn-lg" onClick={onOpen}><Icon.plus /> Create sub-account</button></div>
        <div className="home-divider" />
        <div className="sa-panel-foot">Separate balances for teams, budgets or customers — each holding USD, with its own account number and address.</div>
      </div>
    );
  }
  const subs = SUBS_SEED;
  const count = subs.length;
  const held = subs.reduce((s, x) => s + x.balance, 0);
  const active = subs.filter((s) => !s.frozen).length;
  const total = held + mainBalance;
  const pct = total > 0 ? (held / total) * 100 : 0;
  return (
    <div className="home-cards-panel">
      <div className="home-hero-top">
        <div className="home-acct-label"><Icon.wallet style={{ width: 17, height: 17, color: "var(--gray-500)" }} /><span>Sub-accounts</span></div>
        <a className="records-viewall" onClick={onOpen}>View all →</a>
      </div>
      <div className="home-balance">
        <span className="home-balance-num">{fmtCompact(held)}</span>
        <span className="home-balance-ccy">in {count.toLocaleString()} account{count === 1 ? "" : "s"}</span>
      </div>
      <div className="sa-splitbar" title={`${Math.round(pct)}% of your balance is in sub-accounts`}>
        <div className="subs" style={{ width: `${pct}%` }} />
      </div>
      <div className="sa-splitlegend">
        <span><i className="d subs" />{Math.round(pct)}% in sub-accounts</span>
        <span><i className="d main" />{fmtCompact(mainBalance)} in main</span>
      </div>
      <div className="home-divider" />
      <div className="sa-panel-foot">{active.toLocaleString()} active this month</div>
    </div>
  );
}

// Nothing created yet — the common case today. A full panel of emptiness beside the balance
// would be worse than not mentioning it, so this is one quiet line under the hero.
function SubAccountsHomeStrip({ onOpen }) {
  return (
    <div className="home-cards-strip" onClick={onOpen}>
      <Icon.wallet />
      <span className="t">Sub-accounts</span>
      <span className="s">Separate balances for teams, budgets or your customers — each with its own details</span>
      <span className="go">Create →</span>
    </div>
  );
}

window.OBSubAccounts = { SubAccountsScreen, SubAccountsHomePanel, SubAccountsHomeStrip };
