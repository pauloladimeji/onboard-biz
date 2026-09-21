/* global React */
/* Account letter ("proof of account details") — the document a business sends a counterparty to
   prove the account it's asking to be paid into is real. Today this is produced by hand in Slack;
   this is the in-app version.

   Structure follows the letters we already send, plus the decisions from the thread: USD splits
   domestic and international instructions into separate blocks, and the footer carries a CTA to
   open an Onboard account. EUR and GBP each get a single block — neither has a separate
   international rail today. Set in Arial: the real document is rendered by the backend, so it
   shouldn't depend on the app's webfont. */

const { BUSINESS_PROFILE: LPROFILE } = window.OBData;
const { APPLY_URL: L_APPLY_URL } = window.OBPrimitives;

const ISSUER = {
  brand: "Onboard",
  addressLines: ["3080 Yonge St, Suite 6060,", "Toronto, ON M4N 3N1, Canada"],
  legal: "Gopay Financial Services Inc., doing business under the brand name Onboard Pay, is a federally incorporated Canadian corporation (Corporation Number: 1666979-4) with its registered office at 3080 Yonge St, Suite 6060, Toronto, ON M4N 3N1, Canada. Gopay is registered with FINTRAC as a Money Services Business (MSB) under registration number C100000565.",
};

const letterDate = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// Each block is one way the counterparty can pay. Rows are spelled out per currency rather than
// reused from the deposit panel: a letter names "ABA / Routing number" where the app says
// "Routing", and it never carries app-only rows like the conversion rate. Rows whose value the
// account doesn't have are dropped rather than printed as a dash — a blank line on a proof of
// account reads as a missing detail.
function letterSections(ccy, f) {
  const get = (k) => (f.find((x) => x.k === k) || {}).v || "";
  const holder = get("Account holder") || get("Account name");
  const bank = [["Bank", get("Bank name")], ["Bank address", get("Bank address")]];
  const clean = (rows) => rows.filter(([, v]) => v);

  // USD is the only currency with a domestic / international split — different rails, different
  // details. EUR and GBP each have a single set of instructions.
  if (ccy === "USD") {
    return [
      {
        title: "Instructions For Domestic Transfer (from within the US)",
        rows: clean([
          ["Account name / holder", holder],
          ["Account currency", "USD"],
          ["Account number", get("Account number")],
          ["ABA / Routing number", get("ABA / Routing number")],
          ["Account type", get("Account type")],
          ...bank,
        ]),
      },
      {
        title: "Instructions For International Transfer (from outside the US)",
        rows: clean([
          ["Account name / holder", holder],
          ["Account currency", "USD"],
          ["IBAN / Account number", get("IBAN") || get("Account number")],
          ["SWIFT / BIC", get("SWIFT / BIC")],
          ...bank,
        ]),
      },
    ];
  }

  return [
    {
      title: "Instructions For Transfer",
      rows: clean([
        ["Account name / holder", holder],
        ["Account currency", ccy],
        ["Account number", get("Account number")],
        ["Sort code", get("Sort code")],
        ["Account type", get("Account type")],
        ["IBAN", get("IBAN")],
        ["BIC", get("SWIFT / BIC") || get("BIC")],
        ...bank,
      ]),
    },
  ];
}

// The frame every document we issue shares — letterhead, issue date, watermark, legal footer. Letters
// and receipts both render inside it, so they can't drift apart as either one changes.
function DocFrame({ id, children }) {
  return (
    <div className="letter" id={id}>
      <div className="letter-rule" />

      <div className="letter-head">
        <img className="letter-logo" src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard" />
        <div className="letter-issuer">
          {ISSUER.addressLines.map((l) => <div key={l}>{l}</div>)}
        </div>
      </div>

      <div className="letter-body">
        <div className="letter-date">
          <div className="k">Date</div>
          <div className="v">{letterDate()}</div>
        </div>
        {children}
      </div>

      <div className="letter-foot">
        <div className="letter-foot-brand">Copyright © {new Date().getFullYear()} Onboard Pay</div>
        <p>{ISSUER.legal}</p>
      </div>
    </div>
  );
}

function AccountLetterDoc({ ccy, fields, businessName }) {
  const sections = letterSections(ccy, fields);
  return (
    <DocFrame id="account-letter">
        <div className="letter-salutation">To Whom it May Concern:</div>

        <h2 className="letter-h2">Proof of Account Details</h2>
        <p className="letter-lede">
          This is to confirm that <strong>{businessName}</strong> can receive payments into their
          Onboard account using the details below.
        </p>

        {sections.map((s) => (
          <div className="letter-section" key={s.title}>
            <h3 className="letter-h3">{s.title}</h3>
            <div className="letter-rows">
              {s.rows.map(([k, v]) => (
                <div className="letter-row" key={k}>
                  <div className="letter-row-k">{k}</div>
                  <div className="letter-row-v">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="letter-cta">
          Want an account like this for your business? Open one at{" "}
          <a href={L_APPLY_URL}>business.onboard.xyz/apply</a>.
        </div>
    </DocFrame>
  );
}

// Mounted hidden on the deposit panel and revealed only by the print stylesheet, so "Account
// letter" goes straight to the browser's print-to-PDF instead of opening a modal first. In the
// real app this document is rendered by the backend; the markup is the same either way.
function AccountLetterPrintable({ ccy, fields }) {
  return (
    <div className="letter-print-only">
      <AccountLetterDoc ccy={ccy} fields={fields} businessName={LPROFILE.legalName} />
    </div>
  );
}

// Opens an issued document in its own tab rather than printing from the app page. Printing from the
// app tripped the desktop/mobile media listener, which swaps Shell's tree and remounted the screen
// behind it (the deposit rail tab snapped back to NGN). A tab is also what a document implies:
// something to read, save or send on.
function openDocument(id, title) {
  const node = document.getElementById(id);
  const win = node && window.open("", "_blank");
  if (!win) return;
  // Carry whatever stylesheets the app is running, so the document can't drift from the app and
  // nothing here has to track cache-busting versions.
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${l.getAttribute("href")}">`)
    .join("");
  win.document.write(
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<title>${title}</title>` +
    `<base href="${window.location.href}">` + styles +
    '<style>' +
      'body { margin: 0; padding: 26px 20px; background: #eef0f4; }' +
      '.lt-bar { max-width: 820px; margin: 0 auto 14px; display: flex; justify-content: flex-end; }' +
      '.lt-bar button { font: inherit; font-weight: 600; cursor: pointer; border: 0; border-radius: 8px; padding: 9px 16px; background: #5433FF; color: #fff; }' +
      '.letter { max-width: 820px; margin: 0 auto; box-shadow: 0 10px 30px rgba(15,23,42,.12); }' +
      '@media print { body { margin: 0; padding: 0; background: #fff; } .lt-bar { display: none; } .letter { max-width: none; box-shadow: none; } }' +
    '</style></head><body>' +
    '<div class="lt-bar"><button onclick="window.print()">Download as PDF</button></div>' +
    node.outerHTML +
    '</body></html>'
  );
  win.document.close();
}

const openAccountLetter = () => openDocument("account-letter", `Account letter — ${LPROFILE.legalName}`);

window.OBLetter = { AccountLetterPrintable, AccountLetterDoc, openAccountLetter, DocFrame, openDocument };
