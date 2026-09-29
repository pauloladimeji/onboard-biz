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

// Bank details are the ones this business already holds — picked, not typed, because an invoice
// must never quote an account that doesn't exist. Stablecoin addresses are typed for now: the
// wallet being invoiced into may be one Onboard doesn't issue.
const PAY_KINDS = [
  { id: "usd", label: "USD account", hint: "Wire, ACH or SWIFT" },
  { id: "ngn", label: "NGN account", hint: "Naira bank transfer" },
  { id: "eurgbp", label: "EUR or GBP account", hint: "SEPA, FPS or CHAPS" },
  { id: "stablecoin", label: "Stablecoin", hint: "USDC or USDT on any network", coin: true },
];
const STABLE_COINS = ["USDC", "USDT"];
// One source for the networks — the same list Deposit and sub-accounts render.
const chainsFor = (coin) => ((IData.STABLECOIN_CHAINS || {})[coin] || []);
const kindOf = (id) => PAY_KINDS.find((k) => k.id === id) || PAY_KINDS[0];

// The accounts this business actually holds. USD is one account, not three: ACH, Fedwire and
// SWIFT all arrive at the same details, which is how the Deposit page states it.
function payAccounts() {
  const wire = (IData.FIAT_RAILS || []).find((r) => r.id === "usd-wire");
  const rails = wire ? [{
    id: "usd",
    label: "USD account",
    sub: "ACH, Fedwire or SWIFT",
    fields: wire.fields.map((f) => [f.k, f.v]),
  }] : [];
  const ngn = {
    id: "ngn",
    label: "NGN account",
    sub: "Naira bank transfer",
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

// Who most invoices are from and to while this is used internally. A new invoice inherits
// whoever the last one was addressed to, so switching customers sticks without editing these.
const DEFAULT_FROM = {
  name: "Gopay Financial Services Inc. (Onboard Pay)",
  address: "3080 Yonge St, Suite 6060\nToronto, ON M4N 3N1, Canada",
  email: "finance@onboard.xyz",
};
const DEFAULT_TO = {
  name: "Muva Networks Limited",
  address: "1 Ayo Makun Street, Richmond Gate Estate 1\nLagos, Nigeria",
  email: "babasola@muvanetworks.com",
};

function blankInvoice(list) {
  const last = (list || [])[0];
  return {
    id: "inv-" + Date.now(),
    number: nextNumber(list),
    issued: todayISO(),
    due: plusDays(14),
    currency: "USD",
    status: "draft",
    from: last ? { ...last.from } : { ...DEFAULT_FROM },
    to: last ? { ...last.to } : { ...DEFAULT_TO },
    payTo: last ? (last.payTo || []).map((m) => ({ ...m, id: m.id + "-c" })) : [],
    items: [{ desc: "", qty: "1", price: "" }],
    taxRate: "",
    discount: "",
    discountType: "pct",
    notes: "",
  };
}

// Discount comes off before tax, which is how tax is assessed nearly everywhere.
const invoiceTotals = (inv) => {
  const subtotal = (inv.items || []).reduce((s, it) => s + parseNum(it.qty) * parseNum(it.price), 0);
  const raw = parseNum(inv.discount);
  const discount = Math.min(inv.discountType === "amt" ? raw : subtotal * (raw / 100), subtotal);
  const taxable = subtotal - discount;
  const tax = taxable * (parseNum(inv.taxRate) / 100);
  return { subtotal, discount, taxable, tax, total: taxable + tax };
};

// ---------- The document ----------
// Not the Onboard letterhead: this invoice comes from the business, so the business's name is the
// masthead and Onboard appears once, small, at the foot.
function InvoiceDoc({ inv }) {
  const { subtotal, discount, tax, total } = invoiceTotals(inv);
  const accounts = (inv.payTo || []).filter((a) => a && a.fields && a.fields.length);
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
        {discount > 0 && (
          <div className="r"><span>Discount{inv.discountType === "pct" ? ` (${parseNum(inv.discount)}%)` : ""}</span><span>−{money(discount, inv.currency)}</span></div>
        )}
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
                {a.fields.filter(([, v]) => v).map(([k, v]) => (
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


// One payment method at a time: pick what kind, then fill the fields that kind needs. Checkboxes
// over a fixed list didn't survive a business with several accounts per currency.
function PaymentMethodSheet({ method, onClose, onSave }) {
  const [kindId, setKindId] = useStateI(method ? method.kind : "usd");
  const [accountId, setAccountId] = useStateI(method ? method.accountId || "" : "");
  const [coin, setCoin] = useStateI(method ? method.coin || "USDC" : "USDC");
  const [chainId, setChainId] = useStateI(method ? method.chainId || "" : "");
  const [address, setAddress] = useStateI(() => {
    const f = (method ? method.fields : []).find(([k]) => k === "Address");
    return f ? f[1] : "";
  });
  const kind = kindOf(kindId);

  const accounts = payAccounts().filter((a) => (
    kindId === "usd" ? a.id === "usd" : kindId === "ngn" ? a.id === "ngn" : false
  ));
  const account = accounts.find((a) => a.id === accountId);
  const chains = chainsFor(coin);
  const chain = chains.find((c) => c.id === chainId) || chains[0];
  const ready = kind.coin ? !!(chain && address.trim()) : !!account;

  const save = () => {
    if (kind.coin) {
      onSave({
        id: method ? method.id : "pm-" + Date.now(),
        kind: kindId, coin, chainId: chain.id,
        label: `${coin} · ${chain.name}`,
        fields: [["Network", `${chain.name} (${chain.short})`], ["Address", address.trim()]],
      });
      return;
    }
    onSave({
      id: method ? method.id : "pm-" + Date.now(),
      kind: kindId, accountId: account.id,
      label: account.label,
      fields: account.fields,
    });
  };

  return (
    <Sheet open onClose={onClose} title={method ? "Edit payment method" : "Add payment method"}>
      <div className="field">
        <div className="lbl">What can they pay into?</div>
        <select className="inp" value={kindId} onChange={(e) => { setKindId(e.target.value); setAccountId(""); }}>
          {PAY_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label} — {k.hint}</option>)}
        </select>
      </div>

      {kind.coin ? (
        <>
          <div className="inv-grid-2">
            <div className="field">
              <div className="lbl">Coin</div>
              <select className="inp" value={coin} onChange={(e) => { setCoin(e.target.value); setChainId(""); }}>
                {STABLE_COINS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="lbl">Network</div>
              <select className="inp" value={chain ? chain.id : ""} onChange={(e) => setChainId(e.target.value)}>
                {chains.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.short})</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <div className="lbl">Address</div>
            <input className="inp" placeholder={chain && chain.id === "solana" ? "Solana address" : "0x…"} value={address} onChange={(e) => setAddress(e.target.value)} />
            <div className="help">Must be the address for {chain ? chain.name : "this network"} — anything sent on another network is lost.</div>
          </div>
        </>
      ) : accounts.length === 0 ? (
        <div className="td-banner info">
          <IIcon.info />
          <div><div className="s">No {kind.label.replace(" account", "")} account details on this business yet. Request one from Deposit, then add it here.</div></div>
        </div>
      ) : (
        <>
          <div className="field">
            <div className="lbl">Which account?</div>
            <select className="inp" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select an account…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.sub}</option>)}
            </select>
          </div>
          {account && (
            <div className="inv-preview">
              {account.fields.map(([k, v]) => (
                <div className="inv-pay-row" key={k}><span>{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-lg" disabled={!ready} onClick={save}>{method ? "Save changes" : "Add method"}</button>
      </div>
    </Sheet>
  );
}

// ---------- Editor ----------
function InvoiceEditor({ invoice, onChange, onCancel, onSave, onPreview }) {
  const inv = invoice;
  const { subtotal, discount, tax, total } = invoiceTotals(inv);
  const [editingMethod, setEditingMethod] = useStateI(null);
  const set = (patch) => onChange({ ...inv, ...patch });
  const setItem = (i, patch) => onChange({ ...inv, items: inv.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const addItem = () => onChange({ ...inv, items: [...inv.items, { desc: "", qty: "1", price: "" }] });
  const removeItem = (i) => onChange({ ...inv, items: inv.items.filter((_, idx) => idx !== i) });
  const saveMethod = (m) => {
    const exists = inv.payTo.some((x) => x.id === m.id);
    onChange({ ...inv, payTo: exists ? inv.payTo.map((x) => (x.id === m.id ? m : x)) : [...inv.payTo, m] });
    setEditingMethod(null);
  };
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
            <div className="field">
              <div className="lbl">Discount (optional)</div>
              <div className="inv-discount">
                <input className="inp" type="number" min="0" step="0.01" placeholder="0" value={inv.discount} onChange={(e) => set({ discount: e.target.value })} />
                <select className="inp" value={inv.discountType} onChange={(e) => set({ discountType: e.target.value })}>
                  <option value="pct">%</option>
                  <option value="amt">{CCY_SYMBOL[inv.currency] || inv.currency}</option>
                </select>
              </div>
              <div className="help">Taken off before tax.</div>
            </div>
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
            {discount > 0 && <div className="r"><span>Discount</span><span>−{money(discount, inv.currency)}</span></div>}
            {parseNum(inv.taxRate) > 0 && <div className="r"><span>Tax ({parseNum(inv.taxRate)}%)</span><span>{money(tax, inv.currency)}</span></div>}
            <div className="r total"><span>Total due</span><span>{money(total, inv.currency)}</span></div>
          </div>
        </div>

        <div className="card inv-card">
          <h2 className="inv-card-h">How to pay</h2>
          <p className="inv-card-sub">The accounts this invoice asks to be paid into. Two is usually plenty — every extra one is another to reconcile.</p>
          {inv.payTo.length > 0 && (
            <div className="inv-methods">
              {inv.payTo.map((m) => (
                <div className="inv-method" key={m.id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nm">{m.label}</div>
                    <div className="sub">{m.fields.map(([, v]) => v).filter(Boolean).slice(0, 2).join(" · ")}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingMethod(m)}>Edit</button>
                  <button className="inv-x" onClick={() => onChange({ ...inv, payTo: inv.payTo.filter((x) => x.id !== m.id) })} aria-label="Remove"><IIcon.trash /></button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingMethod("new")}><IIcon.plus style={{ width: 13, height: 13 }} /> Add payment method</button>
          {inv.payTo.length === 0 && <div className="help" style={{ color: "#B45309", marginTop: 8 }}>No payment details yet — the invoice won't say where to pay.</div>}
          <div className="field" style={{ marginTop: 16 }}>
            <div className="lbl">Notes (optional)</div>
            <textarea className="inp" rows={2} placeholder="Payment terms, PO number, thanks." value={inv.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>
      </div>

      {editingMethod && (
        <PaymentMethodSheet
          method={editingMethod === "new" ? null : editingMethod}
          onClose={() => setEditingMethod(null)}
          onSave={saveMethod}
        />
      )}

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
