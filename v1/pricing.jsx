/* global React */
/* Pricing — plans, fees and terms, read-only. The in-app companion to the public pricing page,
   for a customer who has already signed up: it answers "what does this cost me and what are the
   rules", never "should I buy". No billing engine behind it, so every plan the business isn't on
   routes to a conversation rather than a checkout.

   Kept deliberately light (Attio's page is the reference): three short benefits per card, a
   comparison that is mostly ticks, and every explanation folded into the FAQ instead of sitting
   on the page as prose. Anything true of all four plans is a one-line "on every plan" strip, not
   four identical cells.

   Source: revenue-activation pricing table (2026-09-18, revised 09-23). Those rates are still
   pending provider-cost validation, so they live in the tables below and never in a sentence —
   a change is a data edit, not a rewrite. */

const { useState: useStateR } = React;
const RIcon = window.OBIcon;
const { Page, Sheet, useIsDesktop, DemoCta: RDemoCta, XIcon: PXIcon } = window.OBPrimitives;
const { DocFrame: PDocFrame, openDocument: pOpenDocument } = window.OBLetter;

const PRICING_WA = "https://wa.me/14313404484";
const PRICING_UPDATED = "23 September 2026";

const PLANS = [
  {
    id: "standard", name: "Standard", price: "$0", per: "/month",
    bestFor: "For businesses getting started or processing smaller volumes.",
    // Reads as a full-width line above the paid cards rather than a fourth column: nobody signs
    // up for the plan they're already on, and sat in the row it reads as the one you lost.
    strip: "Pay as you go, for smaller businesses and lighter payment volumes.",
    benefits: ["Pay as you go", "Named-account applications", "Standard support"],
    cta: "Talk to us",
  },
  {
    id: "pro", name: "Pro", price: "$350", per: "/month",
    // Names the API audience without turning Pro into "the API plan" — API access is on every
    // plan, so the pull is the help you get building, not the capability.
    bestFor: "For growing teams paying out in their business name, from the dashboard or their own systems.",
    hint: "Usually moving $250,000+ a month",
    benefits: ["Lower transaction fees", "Guided onboarding for your integration", "Priority support"],
    cta: "Talk to us",
  },
  {
    id: "business", name: "Business", price: "$1,000", per: "/month",
    bestFor: "For treasury teams running high volumes across several named accounts.",
    hint: "Usually moving $1m+ a month",
    benefits: ["Free account applications", "Additional named USD accounts", "Dedicated account manager"],
    cta: "Talk to us",
  },
  {
    id: "enterprise", name: "Enterprise", price: "Custom", per: "",
    bestFor: "For platforms embedding payments, or businesses needing bespoke terms.",
    benefits: ["Tailored account setup", "White-labelling and custom workflows", "Dedicated implementation"],
    cta: "Contact sales",
  },
];

// True on every plan, so it's one line under the cards rather than four identical table rows.
const ON_EVERY_PLAN = ["Stablecoin wallets", "API access", "Corporate cards", "Named-account applications"];

// `true` renders a tick, `false` a dash, a string renders as written, and [value, descriptor]
// renders the descriptor as a second line — for cells whose headline word means nothing alone.
const COMPARISON = [
  {
    title: "Transaction fees",
    rows: [
      { label: "USD deposits and withdrawals", values: ["0.40% + method fee", "0.25% + method fee", "0.15% + method fee", "Custom"] },
      // Free on every plan: the margin on these rails is in the conversion rate, not a fee.
      { label: "Local currency payouts", note: "NGN, GHS, IDR and more", values: ["Free", "Free", "Free", "Free"] },
      { label: "USDT payouts", values: ["$5 per payout", "$3 per payout", "$1 per payout", "Custom"] },
      { label: "USDC payouts", values: ["0.25% per payout", "0.10% per payout", "0.05% per payout", "Custom"] },
    ],
  },
  {
    title: "Accounts and cards",
    rows: [
      // A capability, not a fee line: the accounts come with every plan and the deposits into
      // them are free, so it belongs here rather than in the rate card.
      { label: "NGN collection accounts", note: "Named and one-time. Deposits are converted to USD at the live rate", values: [true, true, true, true] },
      { label: "Named USD, EUR and GBP accounts", values: [["$200", "one-time application fee", true], ["$75", "one-time application fee", true], "Free", "Free"] },
      { label: "Additional named USD accounts", values: [false, false, "On request", "Custom"] },
      { label: "USD payouts in your business name", values: [false, true, true, true] },
      { label: "Card limits", values: ["Standard", "Higher", "Higher", "Tailored"] },
      // Billed per *active* account, so the definition rides with the row — it's the number
      // people dispute at the end of a month.
      { label: "Sub-accounts", note: "Separate balances for your customers or teams. Active = held a balance or transacted that month.", values: [["$5.00", "per active account/month"], ["$1.50", "per active account/month"], ["$0.25", "per active account/month"], "Custom"] },
    ],
  },
  {
    title: "Support and customisation",
    rows: [
      { label: "Customer support", values: [["Standard", "Shared queue"], ["Priority", "Ahead of the queue"], ["Account manager", "Named contact"], ["Dedicated team", "Agreed service level"]] },
      { label: "API integration", values: [["Documentation", "Self-serve"], ["Guided onboarding", "Walkthrough with us"], ["Dedicated support", "Engineer on hand"], ["Implementation team", "We plan it with you"]] },
      { label: "White-labelling", values: [false, false, false, true] },
      { label: "Custom workflows", values: [false, false, false, true] },
    ],
  },
];

// Per card, on every plan — so a flat list, not a column per plan. Lives inside the FAQ.
const CARD_FEES_ROWS = [
  { label: "Card creation", value: "$5.00" },
  { label: "Funding fee", value: "1%" },
  { label: "Monthly fee", value: "Free" },
  { label: "USD transactions", value: "Free", note: "US merchants, in USD" },
  { label: "Cross-border transactions", value: "1.75% + $1.00", note: "Non-US merchants, or any non-USD currency" },
  { label: "Chargeback", value: "$50.00" },
];

// Everything that would otherwise be prose on the page. The account-fee answer carries the
// approved wording verbatim — don't paraphrase it.
const FAQS = [
  {
    q: "When do plan fees start?",
    a: "Plan fees begin when your business enters production. Transaction, conversion and payment-method fees are charged separately as you use them.",
  },
  {
    q: "What is a payment-method fee?",
    a: "Some rails carry a fee from the bank or network carrying the payment. It's charged in addition to the rates above, and shown before you confirm.",
  },
  {
    q: "How does the account application fee work?",
    a: "The application and compliance fee covers the review and processing of your request. Account issuance is subject to eligibility, compliance checks and provider approval. The fee is non-refundable once review begins, including where an account cannot be issued.",
    steps: ["Request account", "Fee paid", "Compliance review", "Provider review", "Issued, or unable to issue"],
  },
  {
    // Channel and who, not response times: a published response time is a commitment, and there
    // is no agreed SLA behind these yet. Add the targets here once there is one.
    q: "What do the support levels mean?",
    a: "Every plan can reach a person — the difference is who, and how fast you get to them.",
    defs: [
      { t: "Standard", b: "Email and in-app chat during business hours, answered from a shared queue." },
      { t: "Priority", b: "The same channels, with your requests handled ahead of the standard queue." },
      { t: "Account manager", b: "A named person who knows your account and your payment flows, reachable directly." },
      { t: "Dedicated team", b: "A team assigned to your business, with the service level agreed in your contract." },
    ],
  },
  {
    q: "What does API integration cover?",
    a: "How much help you get building against the API, on top of the same API access every plan has.",
    defs: [
      { t: "Documentation", b: "Public docs, API reference and support through the standard channels." },
      { t: "Guided onboarding", b: "A walkthrough of your integration and help getting your first calls working." },
      { t: "Dedicated support", b: "An engineer you can take integration questions to as you build." },
      { t: "Implementation team", b: "We build the integration plan with you and support you through going live." },
    ],
  },
  {
    q: "What do cards cost?",
    a: "Cards are included on every plan. These fees are charged per card, whatever plan you're on.",
    fees: true,
  },
  {
    q: "What are the card terms?",
    a: "Keep at least $1.00 on a card or it's frozen until you fund it. 5 declined domestic or 2 declined international payments terminates the card, which is final — any balance returns to your USD balance.",
  },
  {
    q: "Is everything available to every business?",
    a: "No. Currencies, rails and account types vary by jurisdiction and by provider approval.",
  },
  {
    q: "How do I change plan?",
    a: "Plans are set up with your account team. Tell them how you're using Onboard and they'll work out which plan fits your volumes.",
  },
];

const ACCOUNT_FEE_NOTE = "The account application and compliance fee is charged once per business, before review begins. It covers compliance review and non-refundable costs from our banking partner, and is not returned if an account cannot be issued.";

const planIndex = (id) => PLANS.findIndex((p) => p.id === id);

function CellValue({ v }) {
  if (v === true) return <RIcon.check className="cmp-tick" />;
  if (v === false) return <PXIcon className="cmp-x" />;
  if (Array.isArray(v)) return <><span>{v[0]}</span><em className="cmp-sub">{v[1]}{v[2] && <sup className="cmp-mark">†</sup>}</em></>;
  return <span>{v}</span>;
}

// Each plan is the one before it plus a few things, so the cards say so rather than repeating
// what the previous card already listed.
function StandardStrip({ plan, onSeeGrid }) {
  return (
    <div className="plan-strip">
      <div className="plan-strip-main">
        <div className="plan-strip-head">
          <span className="plan-name">{plan.name}</span>
          <span className="plan-strip-price">{plan.price}{plan.per}</span>
        </div>
        <p>{plan.strip}</p>
      </div>
      <button className="btn btn-ghost" onClick={onSeeGrid}>Compare plans</button>
    </div>
  );
}

function PlanCard({ plan, onTalk, inherits }) {
  return (
    <div className="plan-card">
      <div className="plan-card-head">
        <span className="plan-name">{plan.name}</span>
      </div>
      <div className="plan-price">{plan.price}<span>{plan.per}</span></div>
      <div className="plan-bestfor">{plan.bestFor}</div>
      {plan.hint && <div className="plan-hint">{plan.hint}</div>}
      <div className="plan-inherits">{inherits ? `Everything in ${inherits}, plus` : "Includes"}</div>
      <ul className="plan-benefits">
        {plan.benefits.map((b) => <li key={b}><RIcon.check /><span>{b}</span></li>)}
      </ul>
      <button className="btn plan-cta" onClick={() => onTalk(plan)}>{plan.cta}</button>
    </div>
  );
}

// Desktop reads across four columns. Mobile can't, so it gets one accordion per plan with that
// plan's values only — a 4-column table at 375px is a horizontal scroll nobody finishes.
function ComparisonTable() {
  return (
    <table className="cmp-table">
      <thead>
        <tr>
          <th />
          {PLANS.map((p) => <th key={p.id}><span className="cmp-plan">{p.name}</span><span className="cmp-price">{p.price}{p.per}</span></th>)}
        </tr>
      </thead>
      {COMPARISON.map((g) => (
        <tbody key={g.title}>
          <tr className="cmp-group"><th scope="rowgroup" colSpan={5}>{g.title}</th></tr>
          {g.rows.map((r) => (
            <tr key={r.label}>
              <th scope="row"><span>{r.label}</span>{r.note && <em>{r.note}</em>}</th>
              {r.values.map((v, i) => <td key={i}><CellValue v={v} /></td>)}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}

function PlanAccordion({ plan, open, onToggle }) {
  const i = planIndex(plan.id);
  return (
    <div className={`plan-acc${open ? " open" : ""}`}>
      <button className="plan-acc-head" onClick={onToggle} aria-expanded={open}>
        <div>
          <div className="plan-acc-name">{plan.name}</div>
          <div className="plan-acc-price">{plan.price}<span>{plan.per}</span></div>
        </div>
        <RIcon.arrowDown style={{ width: 16, height: 16, flexShrink: 0 }} />
      </button>
      {open && (
        <div className="plan-acc-body">
          {COMPARISON.map((g) => (
            <React.Fragment key={g.title}>
              <div className="plan-acc-group">{g.title}</div>
              {g.rows.map((r) => (
                <div className="plan-acc-row" key={r.label}>
                  <span>{r.label}</span>
                  <strong><CellValue v={r.values[i]} /></strong>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function Faq({ item, open, onToggle }) {
  return (
    <div className={`price-faq${open ? " open" : ""}`}>
      <button className="price-faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{item.q}</span>
        <RIcon.arrowDown style={{ width: 15, height: 15, flexShrink: 0 }} />
      </button>
      {open && (
        <div className="price-faq-a">
          <p>{item.a}</p>
          {item.defs && (
            <div className="price-defs">
              {item.defs.map((d) => (
                <div className="price-def" key={d.t}>
                  <div className="t">{d.t}</div>
                  <div className="b">{d.b}</div>
                </div>
              ))}
            </div>
          )}
          {item.fees && (
            <div className="price-fees">
              {CARD_FEES_ROWS.map((r) => (
                <div key={r.label} className="price-fee-row">
                  <span className="k">{r.label}{r.note && <em>{r.note}</em>}</span>
                  <span className={`v${r.value === "Free" ? " free" : ""}`}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
          {item.steps && (
            <div className="price-steps">
              {item.steps.map((s, i, arr) => (
                <React.Fragment key={s}>
                  <span className="price-step">{s}</span>
                  {i < arr.length - 1 && <RIcon.arrowRight style={{ width: 12, height: 12, flexShrink: 0, color: "var(--gray-400)" }} />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocCell({ v }) {
  if (v === true) return <span>Included</span>;
  if (v === false) return <span>—</span>;
  if (Array.isArray(v)) return <span>{v[0]}<em>{v[1]}{v[2] && <span className="doc-mark">†</span>}</em></span>;
  return <span>{v}</span>;
}

function PricingDoc() {
  return (
    <PDocFrame id="pricing-doc">
      <h2 className="letter-h2">Pricing</h2>
      <p className="letter-lede">
        Plans, fees and terms for Onboard Business accounts. Rates are charged in USD.
      </p>

      <div className="letter-section">
        <h3 className="letter-h3">Plans</h3>
        <table className="doc-table">
          <thead><tr><th>Plan</th><th>Price</th><th>Who it's for</th></tr></thead>
          <tbody>
            {PLANS.map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.name}</th>
                <td className="doc-num">{p.price}{p.per}</td>
                <td>{p.strip || p.bestFor}{p.hint ? ` ${p.hint}.` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="doc-note">On every plan: {ON_EVERY_PLAN.join(" · ")}.</p>
      </div>

      {COMPARISON.map((g) => (
        <div className="letter-section" key={g.title}>
          <h3 className="letter-h3">{g.title}</h3>
          <table className="doc-table">
            <thead>
              <tr><th /> {PLANS.map((p) => <th key={p.id} className="doc-num">{p.name}</th>)}</tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}{r.note && <em>{r.note}</em>}</th>
                  {r.values.map((v, i) => <td key={i} className="doc-num"><DocCell v={v} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {g.rows.some((r) => r.values.some((v) => Array.isArray(v) && v[2])) && (
            <p className="doc-note"><span className="doc-mark">†</span> {ACCOUNT_FEE_NOTE}</p>
          )}
        </div>
      ))}

      <div className="letter-section">
        <h3 className="letter-h3">Card fees</h3>
        <p className="doc-note">Charged per card, on every plan.</p>
        <table className="doc-table">
          <tbody>
            {CARD_FEES_ROWS.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}{r.note && <em>{r.note}</em>}</th>
                <td className="doc-num">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="letter-section">
        <h3 className="letter-h3">Notes</h3>
        <div className="doc-notes">
          <p>Account issuance is always subject to eligibility, compliance checks and provider approval.</p>
          {FAQS.filter((f) => !f.fees && !f.defs).map((f) => <p key={f.q}><strong>{f.q}</strong> {f.a}</p>)}
          {FAQS.filter((f) => f.defs).map((f) => (
            <p key={f.q}>
              <strong>{f.q}</strong> {f.defs.map((d) => `${d.t} — ${d.b}`).join(" ")}
            </p>
          ))}
          <p>Prices are current as of {PRICING_UPDATED} and may change. Availability varies by jurisdiction and provider approval.</p>
        </div>
      </div>
    </PDocFrame>
  );
}

const openPricingSheet = () => pOpenDocument("pricing-doc", "Onboard Business — Pricing");

function TalkSheet({ plan, onClose }) {
  return (
    <Sheet open onClose={onClose} title={`Talk about ${plan.name}`}>
      <p className="set-sheet-lede" style={{ marginTop: 0 }}>
        Plans are set up with your account team — tell them how you're using Onboard and they'll
        work out whether {plan.name} fits your volumes.
      </p>
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <a className="btn btn-lg" href={PRICING_WA} target="_blank" rel="noopener noreferrer" onClick={onClose}>Message your account team</a>
      </div>
    </Sheet>
  );
}

function PricingScreen() {
  const isDesktop = useIsDesktop();
  const [talk, setTalk] = useStateR(null);
  const [openPlan, setOpenPlan] = useStateR(PLANS[0].id);
  const [openFaq, setOpenFaq] = useStateR(null);

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Pricing</h1>
          <p className="subtitle">Start pay as you go, or move to a plan for better rates and support.</p>
        </div>
        <button className="btn btn-ghost" onClick={openPricingSheet}><RIcon.doc style={{ width: 15, height: 15 }} /> Download as PDF</button>
      </div>

      <div className="plan-grid">
        {PLANS.slice(1).map((p, i) => <PlanCard key={p.id} plan={p} onTalk={setTalk} inherits={i === 0 ? "the free plan" : PLANS[i].name} />)}
      </div>

      <StandardStrip plan={PLANS[0]} onSeeGrid={() => {
        const el = document.getElementById("compare-plans");
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }} />

      <div className="price-every">
        <span className="lb">On every plan</span>
        {ON_EVERY_PLAN.map((f) => <span className="it" key={f}><RIcon.check /> {f}</span>)}
      </div>

      <div className="price-block" id="compare-plans">
        <h2 className="price-h2">Compare plans</h2>
        {isDesktop
          ? <ComparisonTable />
          : PLANS.map((p) => (
              <PlanAccordion key={p.id} plan={p} open={openPlan === p.id} onToggle={() => setOpenPlan(openPlan === p.id ? null : p.id)} />
            ))}
        <p className="cmp-note">
          {isDesktop && <span className="cmp-mark">†</span>}
          {ACCOUNT_FEE_NOTE}
        </p>
      </div>

      <div className="price-block">
        <h2 className="price-h2">Questions</h2>
        <div className="price-faqs">
          {FAQS.map((f) => (
            <Faq key={f.q} item={f} open={openFaq === f.q} onToggle={() => setOpenFaq(openFaq === f.q ? null : f.q)} />
          ))}
        </div>
      </div>

      <div className="price-help">
        <div>
          <div className="t">Not sure which plan fits your volumes?</div>
          <div className="s">Your account team can work it out with you.</div>
        </div>
        <a className="btn" href={PRICING_WA} target="_blank" rel="noopener noreferrer">Talk about pricing</a>
      </div>
      <div className="price-updated">Last updated {PRICING_UPDATED}</div>
      <RDemoCta message="Want pricing for your own business?" campaign="pricing" />

      {talk && <TalkSheet plan={talk} onClose={() => setTalk(null)} />}
      <div className="letter-print-only"><PricingDoc /></div>
    </Page>
  );
}

window.OBPricing = { PricingScreen, PLANS, COMPARISON };
