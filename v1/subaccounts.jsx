/* global React */
/* Sub-accounts — hidden behind a mock toggle; not part of the shipped product yet.
   Model follows the ledger spec + docs: sub-accounts are always USD, funded by internal
   transfer from the main account (USD/EUR/GBP account numbers are main-account only), can
   pay out directly in every supported corridor, and can be frozen. `reference` is a
   client-supplied unique key — it's how a business maps its own customer/unit ID onto the
   sub-account, so it's shown as the secondary identifier throughout.

   Two modes, because the two real use cases want genuinely different UIs:
     "units" — a handful of departments/budgets. Browse-first: card grid + allocation bar.
     "customers" — thousands, created by API. Search-first: counts + dense rows. */
const { useState, useMemo } = React;
const Icon = window.OBIcon;
const { Page, Sheet, Pill, Records, useIsDesktop } = window.OBPrimitives;

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${fmt(n)}`;

// Visual anchors so a list of balances is scannable rather than four grey boxes.
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
const initialsOf = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const UNITS_SEED = [
  { id: "sa1", reference: "payroll-ops", name: "Payroll", balance: 32400.00, frozen: false, created: "Mar 4, 2026", last: "2 hours ago" },
  { id: "sa2", reference: "supplier-pay", name: "Supplier payments", balance: 12850.00, frozen: false, created: "Mar 4, 2026", last: "Yesterday" },
  { id: "sa3", reference: "lagos-ops", name: "Lagos operations", balance: 6120.40, frozen: false, created: "Apr 18, 2026", last: "3 days ago" },
  { id: "sa4", reference: "tax-reserve", name: "Tax reserve", balance: 18000.00, frozen: false, created: "Jun 2, 2026", last: "Jul 25" },
];

const CUSTOMERS_SEED = [
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
// The list is a sample of a much larger set — the counts are what a platform actually reads.
const CUSTOMERS_TOTALS = { count: 4812, active: 3904, held: 2410338.00 };

// Shaped for the shared Records component so the feed matches the rest of the app.
const SUB_ACTIVITY = {
  sa1: [
    { id: "s1a", date: "Aug 1, 09:12", direction: "out", type: "Cash payout", party: "Adaeze Okafor", ref: "PAY-2026-04981", amount: "1,250,000.00", ccy: "NGN", from: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s1b", date: "Jul 31, 16:40", direction: "in", type: "Internal transfer", party: "From main account", ref: "ITR-2026-00841", amount: "40,000.00", ccy: "USD", status: "COMPLETED", pillTone: "success" },
    { id: "s1c", date: "Jul 28, 11:02", direction: "out", type: "Cash payout", party: "Kwame Osei", ref: "PAY-2026-04944", amount: "48,200.00", ccy: "GHS", from: "USD", status: "COMPLETED", pillTone: "success" },
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

// Mirrors the spec's constraint: 6–36 chars, alphanumeric plus dash/underscore.
function slugRef(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
  return base.length >= 6 ? base : (base + "-account").slice(0, 36);
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

// Turns "here are four numbers" into "here's how the money is split" — the actual value of
// sub-accounts, and the single biggest thing making the list read as more than a table.
function AllocationBar({ subs, mainBalance }) {
  const total = subs.reduce((s, x) => s + x.balance, 0) + mainBalance;
  if (total <= 0) return null;
  const seg = [{ key: "__main", name: "Main account", balance: mainBalance, color: { bg: "var(--gray-300)" } },
    ...subs.filter(s => s.balance > 0).map(s => ({ key: s.id, name: s.name, balance: s.balance, color: colorFor(s.reference) }))];
  return (
    <div>
      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 12 }}>
        {seg.map(s => (
          <div key={s.key} title={`${s.name} · $${fmt(s.balance)}`}
               style={{ width: `${(s.balance / total) * 100}%`, background: s.key === "__main" ? "var(--gray-300)" : s.color.fg, minWidth: 3 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {seg.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--gray-600)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.key === "__main" ? "var(--gray-300)" : s.color.fg, flexShrink: 0 }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateSubAccountSheet({ onClose, onCreate, mode }) {
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
        <input className="inp" placeholder={mode === "customers" ? "e.g. Adaeze Okafor" : "e.g. Payroll"} value={name} autoFocus
               onChange={(e) => setName(e.target.value)} />
        <div className="help">Shown across your dashboard. Only you see this.</div>
      </div>
      <div className="field">
        <div className="lbl">Reference</div>
        <input className="inp" placeholder={mode === "customers" ? "cus_8f3c5d2a" : "payroll-ops"} value={effectiveRef}
               onChange={(e) => { setTouchedRef(true); setReference(e.target.value); }} />
        <div className="help" style={effectiveRef && !refValid ? { color: "#DC2626" } : undefined}>
          {effectiveRef && !refValid
            ? "6–36 characters. Letters, numbers, dashes and underscores only."
            : "A unique ID you choose — use your own customer or cost-centre code to match your records."}
        </div>
      </div>
      <div className="td-banner info" style={{ marginTop: 4 }}>
        <Icon.info />
        <div><div className="s">Sub-accounts hold <strong>USD</strong> and are funded from your main account. They can pay out in every currency you already support.</div></div>
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!canCreate}
                onClick={() => onCreate({ name: name.trim(), reference: effectiveRef })}>Create sub-account</button>
      </div>
    </Sheet>
  );
}

function MoveMoneySheet({ sub, mainBalance, onClose, onMove }) {
  const [dir, setDir] = useState("in"); // in = main → sub, out = sub → main
  const [amount, setAmount] = useState("");
  const parsed = parseFloat(amount) || 0;
  const available = dir === "in" ? mainBalance : sub.balance;
  const tooMuch = parsed > available;
  const canMove = parsed > 0 && !tooMuch;

  return (
    <Sheet open onClose={onClose} title="Move money">
      <div className="field">
        <div className="lbl">Direction</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`chan-btn ${dir === "in" ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setDir("in")}>Main → {sub.name}</button>
          <button className={`chan-btn ${dir === "out" ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setDir("out")}>{sub.name} → Main</button>
        </div>
      </div>
      <div className="field">
        <div className="lbl">Amount</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--gray-500)", pointerEvents: "none" }}>$</span>
          <input className={`inp${tooMuch ? " inp-error" : ""}`} type="number" min="0" step="0.01" placeholder="0.00"
                 value={amount} onChange={(e) => setAmount(e.target.value)} style={{ paddingLeft: 30 }} autoFocus />
        </div>
        <div className="help" style={tooMuch ? { color: "#DC2626" } : undefined}>
          {tooMuch ? `Only $${fmt(available)} available.` : `$${fmt(available)} available · transfers are instant and free`}
        </div>
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!canMove} onClick={() => onMove(dir, parsed)}>Move money</button>
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

// ---------- "units" mode: browse-first ----------
function UnitsListPage({ subs, mainBalance, onSelect, onCreate }) {
  const allocated = subs.reduce((s, x) => s + x.balance, 0);
  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Sub-accounts</h1>
          <p className="subtitle">Split your balance across teams, departments, or clients — each with its own balance and activity.</p>
        </div>
        <button className="btn btn-lg" onClick={onCreate}><Icon.plus style={{ width: 15, height: 15 }} /> Create sub-account</button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12.5, color: "var(--gray-600)", marginBottom: 3 }}>Main account</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmt(mainBalance)}</div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--gray-200)" }} />
          <div>
            <div style={{ fontSize: 12.5, color: "var(--gray-600)", marginBottom: 3 }}>In sub-accounts</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmt(allocated)}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>{subs.length} sub-account{subs.length === 1 ? "" : "s"}</div>
        </div>
        <AllocationBar subs={subs} mainBalance={mainBalance} />
      </div>

      {subs.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="ic"><Icon.wallet style={{ width: 36, height: 36 }} /></div>
            <div style={{ fontWeight: 500, color: "var(--gray-900)", marginBottom: 4, fontSize: 14 }}>No sub-accounts yet</div>
            <div style={{ fontSize: 12.5, color: "var(--gray-500)", maxWidth: 360, margin: "4px auto 16px", lineHeight: 1.6 }}>Create one to keep payroll, suppliers, or a client's funds separate from your main balance.</div>
            <button className="btn btn-lg" onClick={onCreate}>Create your first sub-account</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(238px, 1fr))", gap: 14 }}>
          {subs.map((s) => (
            <div key={s.id} className="card sa-card" onClick={() => onSelect(s)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                <SubAvatar sub={s} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{s.reference}</div>
                </div>
                {s.frozen && <Pill tone="info">Frozen</Pill>}
              </div>
              <div style={{ fontSize: 21, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmt(s.balance)}</div>
              <div style={{ fontSize: 11.5, color: "var(--gray-500)", marginTop: 4 }}>Last activity {s.last}</div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}

// ---------- "customers" mode: search-first ----------
function CustomersListPage({ subs, onSelect, onCreate }) {
  const [q, setQ] = useState("");
  const isDesktop = useIsDesktop();
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return subs;
    return subs.filter(s => s.name.toLowerCase().includes(t) || s.reference.toLowerCase().includes(t));
  }, [q, subs]);

  const metric = (label, value) => (
    <div style={{ background: "var(--gray-50)", borderRadius: 10, padding: "14px 16px", flex: "1 1 150px" }}>
      <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Sub-accounts</h1>
          <p className="subtitle">A dedicated balance for every customer, created through the API and settled under your one Onboard relationship.</p>
        </div>
        <button className="btn btn-lg" onClick={onCreate}><Icon.plus style={{ width: 15, height: 15 }} /> Create sub-account</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {metric("Sub-accounts", CUSTOMERS_TOTALS.count.toLocaleString())}
        {metric("Active this month", CUSTOMERS_TOTALS.active.toLocaleString())}
        {metric("Total held", fmtCompact(CUSTOMERS_TOTALS.held))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--gray-200)" }}>
          <div className="tx-search">
            <Icon.search />
            <input placeholder="Search by name or reference…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

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
          Showing {filtered.length} of {CUSTOMERS_TOTALS.count.toLocaleString()}
        </div>
      </div>
    </Page>
  );
}

function SubAccountDetailPage({ sub, mainBalance, activity, onBack, onToast, onUpdate, onDelete }) {
  const [showMove, setShowMove] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleMove = (dir, amount) => {
    onUpdate({ ...sub, balance: dir === "in" ? sub.balance + amount : sub.balance - amount }, dir === "in" ? -amount : amount);
    setShowMove(false);
    onToast(dir === "in" ? `$${fmt(amount)} moved to ${sub.name}` : `$${fmt(amount)} moved to main account`);
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
            <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>{sub.reference} · USD · created {sub.created}</div>
          </div>
        </div>

        <div style={{ fontSize: 32, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", marginBottom: 18 }}>
          ${fmt(sub.balance)}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setShowMove(true)} disabled={sub.frozen}><Icon.swap /> Move money</button>
          <button className="btn btn-soft" onClick={() => setShowFreeze(true)}><Icon.snowflake /> {sub.frozen ? "Unfreeze" : "Freeze"}</button>
          <button className="btn btn-ghost" onClick={() => setShowDelete(true)}><Icon.trash /> Close</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-800)", marginBottom: 10 }}>Funding</div>
        <div style={{ fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
          Move money in from your main account, or fund it directly with a dedicated NGN account number or stablecoin address.
          Your USD, EUR and GBP account numbers sit on the main account.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <button className="btn btn-soft btn-sm" onClick={() => onToast("NGN account number — not in this prototype")}><Icon.bank /> Get NGN account number</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onToast("Stablecoin address — not in this prototype")}><Icon.wallet /> Get stablecoin address</button>
        </div>
      </div>

      <Records title="Activity" txns={activity} emptyHint="Transfers and payouts for this sub-account will show up here." />

      {showMove && <MoveMoneySheet sub={sub} mainBalance={mainBalance} onClose={() => setShowMove(false)} onMove={handleMove} />}
      {showFreeze && (
        <FreezeSubSheet sub={sub} onClose={() => setShowFreeze(false)}
          onConfirm={() => { onUpdate({ ...sub, frozen: !sub.frozen }, 0); setShowFreeze(false); onToast(sub.frozen ? `${sub.name} unfrozen` : `${sub.name} frozen`); }} />
      )}
      {showDelete && (
        <DeleteSubSheet sub={sub} onClose={() => setShowDelete(false)}
          onConfirm={() => { setShowDelete(false); onDelete(sub.id); onToast(`${sub.name} closed`); }} />
      )}
    </Page>
  );
}

function SubAccountsScreen({ onToast, mode = "units", mainBalance: seedBalance = 84231.50 }) {
  const seed = mode === "customers" ? CUSTOMERS_SEED : UNITS_SEED;
  const [subs, setSubs] = useState(() => [...seed]);
  const [mainBalance, setMainBalance] = useState(seedBalance);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activity, setActivity] = useState(() => ({ ...SUB_ACTIVITY }));
  const [seededMode, setSeededMode] = useState(mode);

  // Swapping mode from the mock panel should reset to that mode's fixtures, not merge them.
  if (seededMode !== mode) {
    setSeededMode(mode);
    setSubs([...seed]);
    setSelectedId(null);
  }

  const selected = selectedId ? subs.find((s) => s.id === selectedId) : null;

  const handleCreate = ({ name, reference }) => {
    const id = `sa${Date.now()}`;
    setSubs((prev) => [{ id, reference, name, balance: 0, frozen: false, created: "Aug 3, 2026", last: "Just now" }, ...prev]);
    setActivity((prev) => ({ ...prev, [id]: [] }));
    setShowCreate(false);
    onToast(`${name} created`);
  };

  const handleUpdate = (updated, mainDelta) => {
    setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (mainDelta) setMainBalance((b) => b + mainDelta);
  };

  const handleDelete = (id) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  if (selected) {
    return (
      <SubAccountDetailPage
        sub={selected}
        mainBalance={mainBalance}
        activity={activity[selected.id] || DEFAULT_ACTIVITY}
        onBack={() => setSelectedId(null)}
        onToast={onToast}
        onUpdate={handleUpdate}
        onDelete={handleDelete} />
    );
  }

  const List = mode === "customers" ? CustomersListPage : UnitsListPage;
  return (
    <>
      <List subs={subs} mainBalance={mainBalance} onSelect={(s) => setSelectedId(s.id)} onCreate={() => setShowCreate(true)} />
      {showCreate && <CreateSubAccountSheet mode={mode} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </>
  );
}

// Compact dashboard section — the "few units" case belongs where the balance already lives,
// rather than behind its own nav item.
function SubAccountsHomeSection({ onOpen }) {
  const subs = UNITS_SEED;
  const allocated = subs.reduce((s, x) => s + x.balance, 0);
  return (
    <div className="records-card" style={{ marginBottom: 18 }}>
      <div className="records-head">
        <h2>Sub-accounts</h2>
        <div className="records-head-right">
          <span className="meta">${fmt(allocated)} allocated</span>
          <a className="records-viewall" onClick={onOpen}>View all →</a>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <AllocationBar subs={subs} mainBalance={84231.50} />
      </div>
      <div style={{ borderTop: "1px solid var(--gray-100)" }}>
        {subs.slice(0, 3).map((s) => (
          <div key={s.id} className="sa-row" onClick={onOpen}>
            <SubAvatar sub={s} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-900)" }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{s.reference}</div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gray-900)", fontVariantNumeric: "tabular-nums" }}>${fmt(s.balance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.OBSubAccounts = { SubAccountsScreen, SubAccountsHomeSection };
