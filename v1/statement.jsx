/* global React */
/* Account statement — the periodic record of the USD account: what it opened at, every settled
   movement, what it closed at. Two outputs from one set of numbers: a PDF a business sends to a
   bank, auditor or counterparty, and a CSV its finance team reconciles against.

   The balance is a single USD balance, so every line is stated in USD. A payout of ₦780,000 shows
   the USD that left the account, with the local amount underneath — a statement has to foot, and
   it can only foot in the account's own currency.

   Only settled movements count. Anything still processing has not moved the balance, so including
   it would make the statement disagree with the account; it is named in a note instead. */

const { useState: useStateS } = React;
const { BUSINESS_PROFILE: SPROFILE, TXNS_FULL: S_TXNS, V0_USD_BALANCE: S_BALANCE, displayActivityLabel: sLabel } = window.OBData;
const { DocFrame: SDocFrame, openDocument: sOpenDocument } = window.OBLetter;
const { txMoney: sTxMoney, fmtAmt: sFmt } = window.OBReceipt;
const { Sheet: SSheet } = window.OBPrimitives;

const S_MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
// The fixtures carry a display date ("May 6, 09:14") with no year — the real feed has a timestamp,
// so this parse is the one thing here that a backend makes redundant.
const S_YEAR = 2026;
function sDate(tx) {
  const m = /^([A-Za-z]{3})\s+(\d{1,2})(?:,\s*(\d{1,2}):(\d{2}))?/.exec(tx.date || "");
  if (!m || !(m[1] in S_MONTHS)) return null;
  return new Date(S_YEAR, S_MONTHS[m[1]], +m[2], +(m[3] || 0), +(m[4] || 0));
}
const sISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sDay = (d) => d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const sLong = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
const sNum = (n) => (Number.isFinite(n) ? sFmt(n) : "—");

// What each movement did to the USD balance. txMoney already resolves fees and conversion for
// every rail, so this only has to read the right field off it.
function sDelta(tx) {
  const m = sTxMoney(tx);
  if (m.kind === "fiat-in" || m.kind === "crypto-in") return { in: m.credited || 0, out: 0 };
  return { in: 0, out: m.debited || 0 };
}

// One pass over the whole feed, oldest first, with the balance rolled back from today's figure:
// the prototype stores a current balance, not a historical one, so every earlier balance is
// derived from it rather than invented.
function sLedger() {
  const rows = S_TXNS
    .map((tx) => ({ tx, at: sDate(tx) }))
    .filter((r) => r.at && r.tx.status === "COMPLETED")
    .sort((a, b) => a.at - b.at)
    .map((r) => ({ ...r, ...sDelta(r.tx) }));
  let bal = S_BALANCE;
  for (let i = rows.length - 1; i >= 0; i--) {
    rows[i].balance = bal;
    bal = bal - rows[i].in + rows[i].out;
  }
  return rows;
}

function statementModel(fromISO, toISO) {
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T23:59:59`);
  const all = sLedger();
  const rows = all.filter((r) => r.at >= from && r.at <= to);
  const before = all.filter((r) => r.at < from);
  // Opening is the closing balance of everything before the period — not the first row's balance,
  // which would already include that row's own movement.
  const opening = rows.length
    ? rows[0].balance - rows[0].in + rows[0].out
    : (before.length ? before[before.length - 1].balance : S_BALANCE);
  const closing = rows.length ? rows[rows.length - 1].balance : opening;
  const unsettled = S_TXNS.filter((tx) => {
    const at = sDate(tx);
    return at && at >= from && at <= to && (tx.status === "PROCESSING" || tx.status === "PENDING");
  });
  return {
    from, to, rows, opening, closing, unsettled,
    totalIn: rows.reduce((n, r) => n + r.in, 0),
    totalOut: rows.reduce((n, r) => n + r.out, 0),
  };
}

// A payout's own currency belongs in the description, not the amount column: the columns have to
// add up to the closing balance, so they can only hold USD.
function sDescription(r) {
  const tx = r.tx;
  const local = tx.from && tx.from !== tx.ccy
    ? (tx.direction === "in" ? `${tx.fromAmount || ""} ${tx.from}`.trim() : `${tx.amount} ${tx.ccy}`)
    : null;
  return { main: tx.party, sub: [sLabel(tx.activityType) || tx.type, local].filter(Boolean).join(" · ") };
}

// =====================================================
// The document
// =====================================================
function StatementDoc({ model }) {
  const addr = SPROFILE.registeredAddress || {};
  return (
    <SDocFrame id="statement-doc">
      <h2 className="letter-h2">Account Statement</h2>
      <p className="letter-lede">
        Statement of the Onboard USD account held by <strong>{SPROFILE.legalName}</strong> for the
        period {sLong(model.from)} to {sLong(model.to)}.
      </p>

      <div className="letter-section">
        <div className="letter-rows">
          <div className="letter-row"><div className="letter-row-k">Account holder</div><div className="letter-row-v">{SPROFILE.legalName}</div></div>
          <div className="letter-row"><div className="letter-row-k">Registered address</div><div className="letter-row-v">{[addr.line1, addr.line2, addr.city, addr.region, addr.postalCode, SPROFILE.registeredCountry].filter(Boolean).join(", ")}</div></div>
          <div className="letter-row"><div className="letter-row-k">Account currency</div><div className="letter-row-v">USD</div></div>
          <div className="letter-row"><div className="letter-row-k">Statement period</div><div className="letter-row-v">{sDay(model.from)} — {sDay(model.to)}</div></div>
        </div>
      </div>

      <div className="letter-section">
        <h3 className="letter-h3">Summary</h3>
        <table className="doc-table">
          <tbody>
            <tr><th scope="row">Opening balance</th><td className="doc-num">${sNum(model.opening)}</td></tr>
            <tr><th scope="row">Money in</th><td className="doc-num">${sNum(model.totalIn)}</td></tr>
            <tr><th scope="row">Money out</th><td className="doc-num">${sNum(model.totalOut)}</td></tr>
            <tr><th scope="row">Closing balance</th><td className="doc-num"><strong>${sNum(model.closing)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div className="letter-section">
        <h3 className="letter-h3">Transactions</h3>
        {model.rows.length === 0 ? (
          <p className="doc-note">No settled transactions in this period.</p>
        ) : (
          <table className="doc-table stmt-table">
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Reference</th>
                <th className="doc-num">Out</th><th className="doc-num">In</th><th className="doc-num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((r) => {
                const d = sDescription(r);
                return (
                  <tr key={r.tx.id}>
                    <td className="stmt-date">{sDay(r.at)}</td>
                    <td>{d.main}<em>{d.sub}</em></td>
                    <td className="stmt-ref">{r.tx.ref}</td>
                    <td className="doc-num">{r.out ? sNum(r.out) : ""}</td>
                    <td className="doc-num">{r.in ? sNum(r.in) : ""}</td>
                    <td className="doc-num">{sNum(r.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="letter-section">
        <p className="doc-note">
          All amounts are in USD. Payouts and deposits made in another currency are shown at the
          amount converted to or from USD, with the original amount in the description.
        </p>
      </div>
    </SDocFrame>
  );
}

// =====================================================
// CSV
// =====================================================
const sCsvCell = (v) => {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function sCsv(model) {
  const head = ["Date", "Description", "Type", "Reference", "Original amount", "Original currency", "Money out (USD)", "Money in (USD)", "Balance (USD)"];
  const lines = model.rows.map((r) => {
    const tx = r.tx;
    const foreign = tx.from && tx.from !== tx.ccy;
    const original = tx.direction === "in" ? (foreign ? tx.fromAmount : tx.amount) : tx.amount;
    const originalCcy = tx.direction === "in" ? (foreign ? tx.from : tx.ccy) : tx.ccy;
    return [
      sISO(r.at), tx.party, sLabel(tx.activityType) || tx.type, tx.ref,
      original, originalCcy,
      r.out ? r.out.toFixed(2) : "", r.in ? r.in.toFixed(2) : "", r.balance.toFixed(2),
    ].map(sCsvCell).join(",");
  });
  // The opening and closing balances ride in the file: a row of movements with no anchor can't be
  // reconciled, and whoever opens this won't have the PDF beside them.
  return [
    `Account statement,${SPROFILE.legalName}`,
    `Period,${sISO(model.from)},${sISO(model.to)}`,
    `Opening balance (USD),${model.opening.toFixed(2)}`,
    `Closing balance (USD),${model.closing.toFixed(2)}`,
    "",
    head.join(","),
    ...lines,
  ].join("\n");
}

function sDownloadCsv(model) {
  const blob = new Blob([sCsv(model)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `statement-${sISO(model.from)}-to-${sISO(model.to)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================================================
// The sheet
// =====================================================
// Presets are months that exist rather than "this month": the account's history is what a
// statement is of, and an empty period is a dead end, not a result.
function sPresets() {
  const all = sLedger();
  if (!all.length) return [];
  const months = [];
  all.forEach((r) => {
    const key = `${r.at.getFullYear()}-${r.at.getMonth()}`;
    if (!months.some((m) => m.key === key)) months.push({ key, y: r.at.getFullYear(), m: r.at.getMonth() });
  });
  months.reverse();
  const monthPresets = months.slice(0, 3).map(({ y, m }) => ({
    id: `${y}-${m}`,
    label: new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    from: sISO(new Date(y, m, 1)),
    to: sISO(new Date(y, m + 1, 0)),
  }));
  return [
    ...monthPresets,
    { id: "all", label: "All time", from: sISO(all[0].at), to: sISO(all[all.length - 1].at) },
  ];
}

function StatementSheet({ onClose }) {
  const presets = sPresets();
  const [preset, setPreset] = useStateS(presets[0] ? presets[0].id : "custom");
  const active = presets.find((p) => p.id === preset);
  const [from, setFrom] = useStateS(active ? active.from : "");
  const [to, setTo] = useStateS(active ? active.to : "");

  const pick = (p) => { setPreset(p.id); setFrom(p.from); setTo(p.to); };
  const valid = from && to && from <= to;
  const model = valid ? statementModel(from, to) : null;

  return (
    <SSheet open title="Statement" onClose={onClose}>
      <div className="field">
        <div className="lbl">Period</div>
        <div className="stmt-presets">
          {presets.map((p) => (
            <button key={p.id} className={`chan-btn${preset === p.id ? " on" : ""}`} onClick={() => pick(p)}>{p.label}</button>
          ))}
          <button className={`chan-btn${preset === "custom" ? " on" : ""}`} onClick={() => setPreset("custom")}>Custom</button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="stmt-range">
          <div className="field"><div className="lbl">From</div><input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><div className="lbl">To</div><input className="inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      )}

      {model && (
        <div className="card stmt-summary">
          <div className="stmt-sum-row"><span>Opening balance</span><strong>${sNum(model.opening)}</strong></div>
          <div className="stmt-sum-row"><span>Money in</span><strong className="in">${sNum(model.totalIn)}</strong></div>
          <div className="stmt-sum-row"><span>Money out</span><strong>${sNum(model.totalOut)}</strong></div>
          <div className="stmt-sum-row total"><span>Closing balance</span><strong>${sNum(model.closing)}</strong></div>
          <div className="stmt-sum-note">
            {model.rows.length} settled transaction{model.rows.length === 1 ? "" : "s"}
            {model.unsettled.length > 0 && ` · ${model.unsettled.length} still in progress, not included`}
          </div>
        </div>
      )}

      {!valid && <div className="help" style={{ color: "#DC2626" }}>Choose a start date on or before the end date.</div>}

      {model && <div className="letter-print-only"><StatementDoc model={model} /></div>}

      <div className="stmt-actions">
        <button className="btn btn-lg btn-dark" disabled={!model} onClick={() => sOpenDocument("statement-doc", `Statement — ${SPROFILE.legalName}`)}>Download PDF</button>
        <button className="btn btn-lg" disabled={!model} onClick={() => sDownloadCsv(model)}>Export CSV</button>
      </div>
    </SSheet>
  );
}

window.OBStatement = { StatementSheet, StatementDoc, statementModel, sCsv };
