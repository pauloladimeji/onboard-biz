/* global React */
/* Transaction receipt — proof of one completed payment or deposit, for the business's own records
   or to send to a counterparty. Built on the same document frame as the account letter
   (letterhead, watermark, legal footer, opens in its own tab), so everything we issue reads as one
   family. One template for every rail: fiat and crypto only differ in which rows exist. */

const { DocFrame, openDocument } = window.OBLetter;

// ---------- Money ----------
// Shared with the transaction detail page, so a receipt can never show different numbers from
// the screen it was opened from.
const TX_FX = { USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1485.5, GHS: 14.2, KES: 129.4, TZS: 2640.0, MZN: 63.8 };
const PAYOUT_FEE = { USD: 4.50, GBP: 3.60, EUR: 4.10 };
const parseAmt = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;
const fmtAmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// A zero fee reads "Free", matching how the Deposit page quotes NGN.
const feeText = (amt, ccy) => (amt > 0 ? `${ccy} ${fmtAmt(amt)}` : "Free");
const fmtRate = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

// Every rate is quoted one way — local currency per 1 USD — whichever direction the money moved.
// Deposits arrive with a pre-written string ("1 USD = ₦1,485.50") and payouts used to compute
// "1 USD = 1485.50 NGN", so the same rate printed two ways. The recorded rate is still read off
// the transaction where there is one, so no historical rate is recalculated.
function rateLabel(tx) {
  const local = [tx.from, tx.ccy].find((c) => c && c !== "USD");
  if (!local) return null;
  const quoted = tx.rate ? parseFloat((tx.rate.split("=")[1] || "").replace(/[^\d.]/g, "")) : NaN;
  const perUsd = quoted > 0 ? quoted : TX_FX[local];
  return perUsd ? `1 USD = ${fmtRate(perUsd)} ${local}` : null;
}

function txMoney(tx) {
  const ad = tx.activityData || {};
  const isIn = tx.direction === "in";
  const isCrypto = tx.activityType === "CRYPTO_DEPOSIT" || tx.activityType === "CRYPTO_WITHDRAWAL";
  const isCrossCcy = !isCrypto && !!tx.from && tx.from !== tx.ccy;
  const fxRate = isCrossCcy ? (TX_FX[tx.ccy] / TX_FX[tx.from]) : 1;
  const fxRateLabel = (isCrossCcy || tx.rate) ? rateLabel(tx) : null;
  const base = { isCrossCcy, fxRateLabel };

  if (isCrypto) {
    const fee = parseAmt(ad.feeAmount);
    const amt = parseAmt(tx.amount);
    return isIn
      ? { ...base, kind: "crypto-in", received: amt, token: (ad.blockchainInfo || {}).tokenSymbol, fee, credited: amt - fee }
      : { ...base, kind: "crypto-out", sent: amt, ccy: tx.ccy, fee, debited: amt + fee };
  }

  const dstAmt = parseAmt(tx.amount);
  const srcCcy = tx.from || tx.ccy;
  if (isIn) {
    // `amount` is what was credited, net of the fee. The fee is charged in the currency the sender
    // paid it in, so on a converted deposit it comes off the local amount before conversion.
    const fee = parseAmt(ad.fee);
    const feeCcy = ad.feeCcy || tx.ccy;
    const localCcy = isCrossCcy && tx.fromAmount ? tx.from : null;
    const localAmount = localCcy ? parseAmt(tx.fromAmount) : null;
    return {
      ...base, kind: "fiat-in", ccy: tx.ccy, fee, feeCcy, credited: dstAmt, localCcy, localAmount,
      // What the sender actually sent, before the fee came off.
      received: localCcy ? localAmount : dstAmt + fee,
      receivedCcy: localCcy || tx.ccy,
    };
  }
  const fee = PAYOUT_FEE[srcCcy] ?? 0;
  const debited = isCrossCcy ? (dstAmt / fxRate) : dstAmt;
  return {
    ...base, kind: "fiat-out", srcCcy, dstCcy: tx.ccy,
    sent: Math.max(0, debited - fee), fee, debited, recipientGets: dstAmt,
  };
}

// ---------- References ----------
// Always labelled "Network reference": the field a counterparty's bank traces the payment by.
const EXPLORERS = {
  eth: "https://etherscan.io/tx/", base: "https://basescan.org/tx/", tron: "https://tronscan.org/#/transaction/",
  polygon: "https://polygonscan.com/tx/", solana: "https://solscan.io/tx/",
};
const NETWORK_NAMES = { eth: "Ethereum (ERC-20)", base: "Base", polygon: "Polygon", solana: "Solana (SPL)", tron: "Tron (TRC-20)" };

// Rows are [label, value]; a value may be { text, href } for a link. Empty rows are dropped, and
// a section with nothing left is dropped with them.
const clean = (rows) => rows.filter(([, v]) => v && (typeof v === "string" ? v.trim() && v !== "—" : v.text));

function receiptModel(tx) {
  const ad = tx.activityData || {};
  const m = txMoney(tx);
  const isOut = tx.direction === "out";
  const channel = ad.channel || "";
  const refRow = ["Network reference", ad.providerReference || "N/A"];
  const memo = tx.activityType === "CASH_PAYMENT" ? `Invoice #${tx.ref.slice(-5)} · ${tx.party}` : "";

  let hero, sections;

  if (m.kind === "crypto-in" || m.kind === "crypto-out") {
    const bi = ad.blockchainInfo || {};
    const explorer = EXPLORERS[bi.network] || EXPLORERS[tx.chain];
    const hash = tx.txHash || "";
    hero = m.kind === "crypto-in"
      ? `${fmtAmt(m.received)} ${m.token || ""} received`.replace("  ", " ")
      : `${fmtAmt(m.sent)} ${m.ccy} sent`;
    sections = [
      {
        title: m.kind === "crypto-in" ? "Deposit" : "Payment",
        rows: m.kind === "crypto-in"
          ? [["Amount received", `${fmtAmt(m.received)} ${m.token || ""}`], ["Network fee", `USD ${fmtAmt(m.fee)}`], ["Total credited", `USD ${fmtAmt(m.credited)}`]]
          : [["Amount sent", `${fmtAmt(m.sent)} ${m.ccy}`], ["Network fee", `USD ${fmtAmt(m.fee)}`], ["Total debited", `USD ${fmtAmt(m.debited)}`]],
      },
      {
        title: "Blockchain",
        rows: [
          ["Network", NETWORK_NAMES[bi.network] || bi.network || ""],
          ["From", bi.senderAddress || ""],
          ["To", bi.recipientAddress || ""],
        ],
      },
      { title: "References", rows: [["Onboard reference", tx.ref], ["Network reference", hash ? (explorer ? { text: hash, href: explorer + hash } : hash) : "N/A"]] },
    ];
  } else if (m.kind === "fiat-in") {
    const sender = ad.senderAccountDetails || {};
    // Lead with what the sender sent, in their currency — the figure they'll recognise when this
    // is forwarded back to them. The fee, the rate and the USD credited follow in that order.
    const lead = `${m.receivedCcy} ${fmtAmt(m.received)}`;
    hero = `${lead} received${sender.accountName ? ` from ${sender.accountName}` : ""}`;
    sections = [
      {
        title: "Deposit",
        rows: [
          [m.localCcy ? "Amount deposited" : "Amount received", lead],
          ["Onboard fee", feeText(m.fee, m.feeCcy)],
          ["Exchange rate", m.localCcy ? (m.fxRateLabel || "") : ""],
          ["Total credited", `${m.ccy} ${fmtAmt(m.credited)}`],
        ],
      },
      {
        title: "Sender",
        rows: [
          ["Name", sender.accountName || ""],
          ["Bank / account", [sender.bankName, sender.accountNumber].filter((x) => x && x !== "—").join(" · ")],
          ["Channel", channel],
        ],
      },
      { title: "References", rows: [["Onboard reference", tx.ref], refRow] },
    ];
  } else {
    const r = ad.recipient || {};
    // Names what the recipient got, not what was sent: on a cross-currency payout those are
    // different amounts in different currencies, and "You sent NGN…" above "Amount sent USD…"
    // reads as a contradiction to the counterparty this is meant to reassure.
    hero = `${m.dstCcy} ${fmtAmt(m.recipientGets)} paid to ${r.accountName || tx.party}`;
    sections = [
      {
        title: "Payment",
        rows: [
          ["Amount sent", `${m.srcCcy} ${fmtAmt(m.sent)}`],
          ["Onboard fee", `${m.srcCcy} ${fmtAmt(m.fee)}`],
          ["Total debited", `${m.srcCcy} ${fmtAmt(m.debited)}`],
          ["Exchange rate", m.isCrossCcy ? (m.fxRateLabel || "") : ""],
          ["Recipient received", `${m.dstCcy} ${fmtAmt(m.recipientGets)}`],
        ],
      },
      {
        title: "Recipient",
        rows: [["Name", r.accountName || tx.party], ["Bank / account", r.bankName || ""], ["Channel", channel]],
      },
      { title: "References", rows: [["Onboard reference", tx.ref], refRow, ["Memo", memo]] },
    ];
  }

  sections = sections.map((s) => ({ ...s, rows: clean(s.rows) })).filter((s) => s.rows.length);
  return {
    title: isOut ? "Payment receipt" : "Deposit receipt",
    hero,
    date: tx.date.replace(/,/, ", 2026,"),
    sections,
  };
}

// ---------- Document ----------
function ReceiptDoc({ tx }) {
  const r = receiptModel(tx);
  return (
    <DocFrame id="receipt-doc">
      <h2 className="letter-h2 rcpt-title">{r.title}</h2>
      <div className="rcpt-hero">{r.hero}</div>
      <div className="rcpt-meta"><span className="rcpt-status">Completed</span> · {r.date}</div>

      {r.sections.map((s) => (
        <div className="letter-section" key={s.title}>
          <h3 className="letter-h3">{s.title}</h3>
          <div className="letter-rows">
            {s.rows.map(([k, v]) => (
              <div className="letter-row" key={k}>
                <div className="letter-row-k">{k}</div>
                <div className="letter-row-v">
                  {typeof v === "string" ? v : <a href={v.href} target="_blank" rel="noopener noreferrer">{v.text}</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

    </DocFrame>
  );
}

// Mounted hidden on the transaction detail page; only the new tab ever shows it.
function ReceiptPrintable({ tx }) {
  return <div className="letter-print-only"><ReceiptDoc tx={tx} /></div>;
}

const openReceipt = (tx) => openDocument("receipt-doc", `Receipt — ${tx.ref}`);

window.OBReceipt = { txMoney, fmtAmt, feeText, receiptModel, ReceiptDoc, ReceiptPrintable, openReceipt };
