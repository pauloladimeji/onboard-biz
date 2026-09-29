/* global React */
/* Invoices — create an invoice, pick which of your accounts the customer should pay into, and
   issue it as a PDF on the same document machinery as the account letter and receipts.

   Internal-first: the immediate use is Onboard billing its own subscription customers, so the
   "from" block is editable rather than locked to the signed-in business. The same screen is what
   a customer would use to invoice their own buyers, which is why nothing here knows about
   Onboard's plans — the line items are whatever you type.

   Saved in localStorage, on this machine only. No backend, so an invoice created here is a
   document, not a receivable: nothing reconciles it against an incoming payment yet. */

const { useState: useStateI } = React;
const IIcon = window.OBIcon;
const IData = window.OBData;
const { Page, Sheet, Pill, useIsDesktop: useIsDesktopI } = window.OBPrimitives;
const { openDocument: iOpenDocument } = window.OBLetter;

const INVOICE_KEY = "ob_invoices";
const CCY_SYMBOL = { USD: "$", NGN: "₦", GBP: "£", EUR: "€" };
const INVOICE_CCYS = ["USD", "NGN", "GBP", "EUR"];

// The accounts an invoice can ask to be paid into. Built from the same fixtures the Deposit page
// shows, so an invoice can never quote details the account doesn't actually have.
function payAccounts() {
  const rails = (IData.FIAT_RAILS || []).map((r) => ({
    id: r.id,
    label: `${r.name} · USD`,
    sub: r.desc,
    fields: r.fields.map((f) => [f.k, f.v]),
  }));
  const ngn = {
    id: "ngn",
    label: "Bank transfer · NGN",
    sub: "Naira virtual account",
    fields: [["Account name", "GFS / Acme Trading Co"], ["Bank", "Aella Microfinance Bank"], ["Account number", "5200 0443 12"]],
  };
  const chains = IData.STABLECOIN_CHAINS || {};
  const coins = ["USDC", "USDT"].filter((c) => chains[c] && chains[c].length).map((c) => {
    const net = chains[c].find((n) => n.id === (c === "USDC" ? "base" : "tron")) || chains[c][0];
    return {
      id: `${c.toLowerCase()}-${net.id}`,
      label: `${c} · ${net.name}`,
      sub: `${net.short} · arrives ${net.arrival}`,
      fields: [["Network", `${net.name} (${net.short})`], ["Address", net.address]],
    };
  });
  return [...rails, ngn, ...coins];
}

const parseNum = (v) => parseFloat(String(v).replace(/,/g, "")) || 0;
const money = (n, ccy) => `${CCY_SYMBOL[ccy] || ""}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const prettyDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

function loadInvoices() {
  try { return JSON.parse(localStorage.getItem(INVOICE_KEY) || "[]"); } catch (e) { return []; }
}
function saveInvoices(list) {
  try { localStorage.setItem(INVOICE_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
}

function nextNumber(list) {
  const year = new Date().getFullYear();
  const used = list
    .map((i) => (i.number || "").match(new RegExp(`^INV-${year}-(\\d+)$`)))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const n = (used.length ? Math.max(...used) : 0) + 1;
  return `INV-${year}-${String(n).padStart(4, "0")}`;
}

const BP = IData.BUSINESS_PROFILE || {};
const addrLines = (a) => (a ? [a.line1, a.line2, [a.city, a.region].filter(Boolean).join(", "), a.postalCode, a.country].filter(Boolean) : []);

function blankInvoice(list) {
  return {
    id: "inv-" + Date.now(),
    number: nextNumber(list),
    issued: todayISO(),
    due: plusDays(14),
    currency: "USD",
    status: "draft",
    from: { name: BP.legalName || "", address: addrLines(BP.registeredAddress).join("\n"), email: (BP.primaryContact || {}).email || "" },
    to: { name: "", email: "", address: "" },
    items: [{ desc: "", qty: "1", price: "" }],
    taxRate: "",
    payTo: ["usd-wire"],
    notes: "",
  };
}

const invoiceTotals = (inv) => {
  const subtotal = (inv.items || []).reduce((s, it) => s + parseNum(it.qty) * parseNum(it.price), 0);
  const tax = subtotal * (parseNum(inv.taxRate) / 100);
  return { subtotal, tax, total: subtotal + tax };
};

// ---------- The document ----------
// Not the Onboard letterhead: this invoice comes from the business, so the business's name is the
// masthead and Onboard appears once, small, at the foot.
function InvoiceDoc({ inv }) {
  const { subtotal, tax, total } = invoiceTotals(inv);
  const accounts = payAccounts().filter((a) => (inv.payTo || []).includes(a.id));
  const fromLines = (inv.from.address || "").split("\n").filter(Boolean);
  const toLines = (inv.to.address || "").split("\n").filter(Boolean);
  return (
    <div className="letter inv-doc" id="invoice-doc">
      <div className="inv-top">
        <div>
          <div className="inv-from-name">{inv.from.name || "Your business"}</div>
          {fromLines.map((l, i) => <div key={i} className="inv-from-line">{l}</div>)}
          {inv.from.email && <div className="inv-from-line">{inv.from.email}</div>}
        </div>
        <div className="inv-meta">
          <div className="inv-word">Invoice</div>
          <div className="inv-meta-row"><span>Number</span><strong>{inv.number}</strong></div>
          <div className="inv-meta-row"><span>Issued</span><strong>{prettyDate(inv.issued)}</strong></div>
          <div className="inv-meta-row"><span>Due</span><strong>{prettyDate(inv.due)}</strong></div>
        </div>
      </div>

      <div className="inv-billto">
        <div className="inv-h">Bill to</div>
        <div className="inv-billto-name">{inv.to.name || "—"}</div>
        {toLines.map((l, i) => <div key={i} className="inv-from-line">{l}</div>)}
        {inv.to.email && <div className="inv-from-line">{inv.to.email}</div>}
      </div>

      <table className="inv-table">
        <thead>
          <tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {(inv.items || []).filter((it) => it.desc || parseNum(it.price)).map((it, i) => (
            <tr key={i}>
              <td>{it.desc}</td>
              <td className="num">{parseNum(it.qty) || 1}</td>
              <td className="num">{money(parseNum(it.price), inv.currency)}</td>
              <td className="num">{money(parseNum(it.qty) * parseNum(it.price), inv.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-totals">
        <div className="r"><span>Subtotal</span><span>{money(subtotal, inv.currency)}</span></div>
        {parseNum(inv.taxRate) > 0 && <div className="r"><span>Tax ({parseNum(inv.taxRate)}%)</span><span>{money(tax, inv.currency)}</span></div>}
        <div className="r total"><span>Total due</span><span>{money(total, inv.currency)} {inv.currency}</span></div>
      </div>

      {accounts.length > 0 && (
        <div className="inv-pay">
          <div className="inv-h">How to pay</div>
          <div className="inv-pay-grid">
            {accounts.map((a) => (
              <div className="inv-pay-block" key={a.id}>
                <div className="t">{a.label}</div>
                {a.fields.map(([k, v]) => (
                  <div className="inv-pay-row" key={k}><span>{k}</span><strong>{v}</strong></div>
                ))}
              </div>
            ))}
          </div>
          <div className="inv-pay-ref">Quote <strong>{inv.number}</strong> as the payment reference.</div>
        </div>
      )}

      {inv.notes && (
        <div className="inv-notes">
          <div className="inv-h">Notes</div>
          <p>{inv.notes}</p>
        </div>
      )}

      <div className="inv-foot">Created with Onboard · business.onboard.xyz</div>
    </div>
  );
}

const openInvoice = (inv) => iOpenDocument("invoice-doc", `Invoice ${inv.number}`);

// ---------- Editor ----------
function InvoiceEditor({ invoice, onChange, onCancel, onSave, onPreview }) {
  const inv = invoice;
  const { subtotal, tax, total } = invoiceTotals(inv);
  const accounts = payAccounts();
  const set = (patch) => onChange({ ...inv, ...patch });
  const setItem = (i, patch) => onChange({ ...inv, items: inv.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const addItem = () => onChange({ ...inv, items: [...inv.items, { desc: "", qty: "1", price: "" }] });
  const removeItem = (i) => onChange({ ...inv, items: inv.items.filter((_, idx) => idx !== i) });
  const togglePay = (id) => onChange({ ...inv, payTo: inv.payTo.includes(id) ? inv.payTo.filter((x) => x !== id) : [...inv.payTo, id] });
  const ready = inv.to.name.trim() && total > 0;

  return (
    <>
      <div className="inv-form">
        <div className="card inv-card">
          <h2 className="inv-card-h">Invoice details</h2>
          <div className="inv-grid-3">
            <div className="field"><div className="lbl">Invoice number</div><input className="inp" value={inv.number} onChange={(e) => set({ number: e.target.value })} /></div>
            <div className="field"><div className="lbl">Issued</div><input className="inp" type="date" value={inv.issued} onChange={(e) => set({ issued: e.target.value })} /></div>
            <div className="field"><div className="lbl">Due</div><input className="inp" type="date" value={inv.due} onChange={(e) => set({ due: e.target.value })} /></div>
          </div>
          <div className="inv-grid-2">
            <div className="field">
              <div className="lbl">Currency</div>
              <select className="inp" value={inv.currency} onChange={(e) => set({ currency: e.target.value })}>
                {INVOICE_CCYS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><div className="lbl">Tax rate (optional)</div><input className="inp" type="number" min="0" step="0.5" placeholder="0" value={inv.taxRate} onChange={(e) => set({ taxRate: e.target.value })} /></div>
          </div>
        </div>

        <div className="inv-grid-2">
          <div className="card inv-card">
            <h2 className="inv-card-h">From</h2>
            <div className="field"><div className="lbl">Business name</div><input className="inp" value={inv.from.name} onChange={(e) => set({ from: { ...inv.from, name: e.target.value } })} /></div>
            <div className="field"><div className="lbl">Address</div><textarea className="inp" rows={3} value={inv.from.address} onChange={(e) => set({ from: { ...inv.from, address: e.target.value } })} /></div>
            <div className="field"><div className="lbl">Email</div><input className="inp" value={inv.from.email} onChange={(e) => set({ from: { ...inv.from, email: e.target.value } })} /></div>
          </div>
          <div className="card inv-card">
            <h2 className="inv-card-h">Bill to</h2>
            <div className="field"><div className="lbl">Customer</div><input className="inp" placeholder="Business or person" value={inv.to.name} onChange={(e) => set({ to: { ...inv.to, name: e.target.value } })} /></div>
            <div className="field"><div className="lbl">Address</div><textarea className="inp" rows={3} value={inv.to.address} onChange={(e) => set({ to: { ...inv.to, address: e.target.value } })} /></div>
            <div className="field"><div className="lbl">Email</div><input className="inp" value={inv.to.email} onChange={(e) => set({ to: { ...inv.to, email: e.target.value } })} /></div>
          </div>
        </div>

        <div className="card inv-card">
          <h2 className="inv-card-h">Items</h2>
          <div className="inv-items">
            <div className="inv-item head"><span>Description</span><span className="num">Qty</span><span className="num">Unit price</span><span className="num">Amount</span><span /></div>
            {inv.items.map((it, i) => (
              <div className="inv-item" key={i}>
                <input className="inp" placeholder="Monthly subscription — Pro plan, October 2026" value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} />
                <input className="inp num" type="number" min="1" step="1" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
                <input className="inp num" type="number" min="0" step="0.01" placeholder="0.00" value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} />
                <span className="amt">{money(parseNum(it.qty) * parseNum(it.price), inv.currency)}</span>
                <button className="inv-x" onClick={() => removeItem(i)} disabled={inv.items.length === 1} aria-label="Remove line"><IIcon.trash /></button>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}><IIcon.plus style={{ width: 13, height: 13 }} /> Add line</button>
          <div className="inv-sum">
            <div className="r"><span>Subtotal</span><span>{money(subtotal, inv.currency)}</span></div>
            {parseNum(inv.taxRate) > 0 && <div className="r"><span>Tax ({parseNum(inv.taxRate)}%)</span><span>{money(tax, inv.currency)}</span></div>}
            <div className="r total"><span>Total due</span><span>{money(total, inv.currency)}</span></div>
          </div>
        </div>

        <div className="card inv-card">
          <h2 className="inv-card-h">How to pay</h2>
          <p className="inv-card-sub">Pick the accounts to print on the invoice. Two is usually plenty — every extra rail is another one to reconcile.</p>
          <div className="inv-pay-picks">
            {accounts.map((a) => (
              <label className={`inv-pick${inv.payTo.includes(a.id) ? " on" : ""}`} key={a.id}>
                <input type="checkbox" checked={inv.payTo.includes(a.id)} onChange={() => togglePay(a.id)} />
                <span><span className="nm">{a.label}</span><span className="sub">{a.sub}</span></span>
              </label>
            ))}
          </div>
          {inv.payTo.length === 0 && <div className="help" style={{ color: "#B45309" }}>No payment details selected — the invoice won't say where to pay.</div>}
          <div className="field" style={{ marginTop: 16 }}>
            <div className="lbl">Notes (optional)</div>
            <textarea className="inp" rows={2} placeholder="Payment terms, PO number, thanks." value={inv.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="inv-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ghost" onClick={onSave} disabled={!ready}>Save draft</button>
        <button className="btn btn-lg" onClick={onPreview} disabled={!ready}>Save and open PDF</button>
      </div>
    </>
  );
}

// ---------- Screen ----------
function InvoicesScreen({ onToast }) {
  const [list, setList] = useStateI(loadInvoices);
  const [editing, setEditing] = useStateI(null);
  const [preview, setPreview] = useStateI(null);
  const isDesktop = useIsDesktopI();

  const persist = (next) => { setList(next); saveInvoices(next); };
  const upsert = (inv) => {
    const next = list.some((i) => i.id === inv.id) ? list.map((i) => (i.id === inv.id ? inv : i)) : [inv, ...list];
    persist(next);
    return next;
  };
  const remove = (id) => { persist(list.filter((i) => i.id !== id)); onToast("Invoice deleted"); };
  const duplicate = (inv) => {
    const copy = { ...inv, id: "inv-" + Date.now(), number: nextNumber(list), issued: todayISO(), due: plusDays(14), status: "draft" };
    persist([copy, ...list]);
    onToast(`${copy.number} created from ${inv.number}`);
  };
  // The document is mounted hidden and only the new tab ever shows it, same as the letter and
  // receipt — so it has to be in the DOM before openDocument goes looking for it.
  const issue = (inv) => {
    setPreview(inv);
    setTimeout(() => openInvoice(inv), 0);
  };

  if (editing) {
    return (
      <Page>
        <div className="crumbs">
          <a className="crumb-back" onClick={() => setEditing(null)}><IIcon.arrowLeft /> Invoices</a>
          <span className="crumb-sep">/</span><span className="crumb-current">{editing.number}</span>
        </div>
        <h1 className="title" style={{ marginBottom: 20 }}>{list.some((i) => i.id === editing.id) ? "Edit invoice" : "New invoice"}</h1>
        <InvoiceEditor
          invoice={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => { upsert(editing); setEditing(null); onToast(`${editing.number} saved`); }}
          onPreview={() => { upsert({ ...editing, status: "issued" }); setEditing(null); issue({ ...editing, status: "issued" }); }}
        />
        {preview && <div className="letter-print-only"><InvoiceDoc inv={preview} /></div>}
      </Page>
    );
  }

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Invoices</h1>
          <p className="subtitle">Create an invoice, choose where you want to be paid, and send it as a PDF.</p>
        </div>
        <button className="btn btn-lg" onClick={() => setEditing(blankInvoice(list))}><IIcon.plus style={{ width: 15, height: 15 }} /> New invoice</button>
      </div>

      {list.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6 }}>No invoices yet</div>
          <div style={{ fontSize: 13, color: "var(--gray-500)", maxWidth: 420, margin: "0 auto 18px", lineHeight: 1.6 }}>
            Bill a customer and tell them exactly where to pay — your USD, NGN or stablecoin account details go on the invoice.
          </div>
          <button className="btn" onClick={() => setEditing(blankInvoice(list))}><IIcon.plus style={{ width: 14, height: 14 }} /> New invoice</button>
        </div>
      ) : (
        <div className="records-card">
          <div className="records-head"><h2>All invoices</h2><span className="meta">{list.length}</span></div>
          <div className="inv-list">
            {list.map((inv) => {
              const { total } = invoiceTotals(inv);
              return (
                <div className="inv-row" key={inv.id}>
                  <div className="c num">{inv.number}</div>
                  <div className="c grow">{inv.to.name || "—"}</div>
                  {isDesktop && <div className="c muted">{prettyDate(inv.issued)}</div>}
                  <div className="c amt">{money(total, inv.currency)} {inv.currency}</div>
                  <div className="c"><Pill tone={inv.status === "paid" ? "success" : inv.status === "issued" ? "info" : "neutral"}>{inv.status}</Pill></div>
                  <div className="c acts">
                    <button className="btn btn-ghost btn-sm" onClick={() => issue(inv)}>PDF</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(inv)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => duplicate(inv)}>Duplicate</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "#DC2626" }} onClick={() => remove(inv.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="inv-disclaimer">
        Saved in this browser only — nothing is sent anywhere, and an invoice here isn't tracked
        against incoming payments.
      </p>

      {preview && <div className="letter-print-only"><InvoiceDoc inv={preview} /></div>}
    </Page>
  );
}

window.OBInvoices = { InvoicesScreen, InvoiceDoc, openInvoice };
