/* global React */
// =====================================================
// Apply for access — product showcase (the right panel), three variants
// =====================================================
// The apply page is the one the website and other entry points link to, so its panel shows the
// whole product instead of the cross-border line the other auth screens keep (Paul, 8 Oct).
// Every variant is built from the product's own pieces (the real CardVisual, the demo's mock
// data), so it shows what an approved business actually gets, never an illustration of it.
//
//   A  The desk    account, card and payout laid together; the payout clears
//   B  The card    one Business Classic card at hero scale, lit, over a printed spec sheet
//   C  The ledger  a window onto the dashboard, its activity filling in
//
// Switch with Mock controls > Apply panel, or link straight to one with ?apply=a|b|c.
// Each runs one GSAP entrance and then holds still; B's card also tilts with the pointer.
// Reduced motion, or GSAP failing to load, shows the finished state at once.
const { useState, useEffect, useRef } = React;
const { Flag, Pill } = window.OBPrimitives;
const Data = window.OBData;

const APPLY_PANELS = ["a", "b", "c"];
const APPLY_PANEL_LABELS = { a: "Desk", b: "Card", c: "Ledger" };
const HEADLINE = "Accounts, cards and payouts for your business.";
const SUBHEAD = "Fund in USD, GBP, EUR, NGN or stablecoins, spend on corporate cards, and pay suppliers and staff in their local currency.";
const usd = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// One entrance per variant: run `build(gsap)` inside a context scoped to `root`, unless motion is
// unwanted, in which case `done()` jumps straight to the finished state.
function useEntrance(root, build, done) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!root.current || !window.gsap || reduce) { done(); return undefined; }
    const ctx = window.gsap.context(() => build(window.gsap), root);
    return () => ctx.revert();
  }, []);
}

function TrustBadges() {
  return (
    <div className="showcase-trust">
      <span><Flag cc="us" size={16} />FinCEN MSB</span>
      <span><Flag cc="ca" size={16} />FINTRAC MSB</span>
    </div>
  );
}

// `withSub` is off for B and C: B's spec sheet and C's activity feed carry what it would say.
function ShowcaseCopy({ withSub = true }) {
  return (
    <div className="showcase-copy">
      <img src="../v0/design-system/assets/onboard-icon-512.png" alt="" className="showcase-mark" />
      <h2 className="showcase-title">{HEADLINE}</h2>
      {withSub && <p className="showcase-sub">{SUBHEAD}</p>}
    </div>
  );
}

// ---------- A: the desk ----------
const DESK_FUNDING = ["us", "gb", "eu", "ng"];

function DeskShowcase() {
  const ref = useRef(null);
  const [paid, setPaid] = useState(false);
  const { CardVisual } = window.OBCards;
  const card = Data.CARDS.find((c) => c.status === "active");

  useEntrance(ref, (gsap) => {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".showcase-account", { y: 28, autoAlpha: 0, duration: 0.6 })
      .from(".showcase-card", { x: 36, y: 20, rotation: 2, autoAlpha: 0, duration: 0.7 }, "-=0.3")
      .from(".showcase-payout", { y: 16, autoAlpha: 0, duration: 0.5 }, "-=0.2")
      // The payout clears: the one change worth watching.
      .call(() => setPaid(true), null, "+=0.9");
  }, () => setPaid(true));

  return (
    <div className="auth-info-panel showcase" ref={ref}>
      <ShowcaseCopy />
      {/* A picture of the product; the copy above says the same thing in words. */}
      <div className="showcase-stage" aria-hidden="true">
        <div className="showcase-account">
          <div className="showcase-account-head">
            <Flag cc="us" size={22} />
            <span>Main USD account</span>
            <span className="showcase-active">Active</span>
          </div>
          <div className="showcase-balance">${usd(Data.V0_USD_BALANCE)}<span>USD</span></div>
          <div className="showcase-holder">In the name of {Data.BUSINESS_PROFILE.legalName}</div>
          <div className="showcase-funding">
            {DESK_FUNDING.map((cc) => <Flag key={cc} cc={cc} size={18} />)}
          </div>
        </div>
        <div className="showcase-card"><CardVisual card={card} compact /></div>
        <div className="showcase-payout">
          <Flag cc="ng" size={30} />
          <div className="showcase-payout-who">
            <div>Adaeze Okafor</div>
            <div>First Bank, Nigeria</div>
          </div>
          <div className="showcase-payout-amt">
            <div>₦1,250,000.00</div>
            <Pill tone={paid ? "success" : "warn"}>{paid ? "Completed" : "Processing"}</Pill>
          </div>
        </div>
      </div>
      <TrustBadges />
    </div>
  );
}

// ---------- B: the card ----------
// The card is the one object; everything else is type. It catches the light where the pointer is
// and tilts a few degrees toward it, the way a metal card does in the hand. The spec sheet under
// it is three facts, ruled like a printed product sheet: no icons, no tiles.
const SPEC = [
  ["Account", "A USD account in your business name, funded by bank transfer or stablecoins"],
  ["Cards", "Virtual corporate cards for your team, each with its own limits"],
  ["Payouts", "Local payouts to Nigeria, Ghana, Kenya and more, at live rates"],
];

// The card's resting angle, in degrees: tipped back and turned slightly toward the copy.
const REST = { x: 10, y: -14 };

function CardShowcase() {
  const ref = useRef(null);
  const tilt = useRef(null);
  const { CardVisual } = window.OBCards;
  const card = Data.CARDS.find((c) => c.status === "active");

  useEntrance(ref, (gsap) => {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(".sc-card-tilt", { y: 40, rotationX: 34, rotationY: REST.y, autoAlpha: 0, transformPerspective: 900 },
        { y: 0, rotationX: REST.x, rotationY: REST.y, autoAlpha: 1, duration: 1.0 })
      .from(".sc-card-floor", { scaleX: 0.6, autoAlpha: 0, duration: 0.8 }, "<0.15")
      .from(".sc-spec-row", { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, "-=0.45");
  }, () => {});

  // Pointer tilt: a few degrees, eased, and only for a fine pointer with motion allowed.
  useEffect(() => {
    const el = tilt.current;
    const panel = ref.current?.closest(".auth-split-right");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!el || !panel || !window.gsap || reduce || !fine) return undefined;
    const gsap = window.gsap;
    gsap.set(el, { transformPerspective: 900, rotationX: REST.x, rotationY: REST.y });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const sx = gsap.quickTo(el, "--sheen-x", { duration: 0.6, ease: "power3.out" });
    const sy = gsap.quickTo(el, "--sheen-y", { duration: 0.6, ease: "power3.out" });
    const move = (e) => {
      const r = panel.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(REST.y + px * 10); rx(REST.x - py * 8);
      sx(50 + px * 70); sy(30 + py * 60);
    };
    // Back to the resting pose, not flat: a card in the hand is never square to you.
    const leave = () => { rx(REST.x); ry(REST.y); sx(50); sy(30); };
    panel.addEventListener("pointermove", move);
    panel.addEventListener("pointerleave", leave);
    return () => { panel.removeEventListener("pointermove", move); panel.removeEventListener("pointerleave", leave); };
  }, []);

  return (
    <div className="auth-info-panel showcase showcase-b" ref={ref}>
      <ShowcaseCopy withSub={false} />
      <div className="sc-card-stage" aria-hidden="true">
        <div className="sc-card-tilt" ref={tilt}>
          <CardVisual card={card} fillWidth />
          <div className="sc-card-sheen" />
        </div>
        <div className="sc-card-floor" />
      </div>
      <dl className="sc-spec">
        {SPEC.map(([term, text]) => (
          <div className="sc-spec-row" key={term}>
            <dt>{term}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <TrustBadges />
    </div>
  );
}

// ---------- C: the ledger ----------
// The product itself, framed: Home's top row (the account beside the cards, as on
// the dashboard; Paul, 9 Oct, so a card is in the picture) and its activity, filling in newest
// first. The range of the product comes across through real entries (a
// stablecoin deposit, a UK bank deposit, payouts in three currencies, a card payment) rather
// than through claims about it. The top payout clears once the feed has landed.
const LEDGER = [
  { id: "l1", party: "Adaeze Okafor", detail: "Payout to First Bank", amount: "−₦1,250,000.00", out: true, flag: "ng", pending: true },
  // A stablecoin is not a country: the USDC mark, not a flag (Paul, 9 Oct).
  { id: "l2", party: "USDC on Base", detail: "Stablecoin deposit, Base network", amount: "+$5,000.00", token: "usdc" },
  // A card payment shows the merchant's own mark, as a statement would.
  { id: "l3", party: "Figma", detail: "Card ending 4821", amount: "−$45.00", out: true, merchant: "figma" },
  { id: "l4", party: "Mensah Holdings Ltd", detail: "Payout to GCB Bank", amount: "−₵48,200.00", out: true, flag: "gh" },
  { id: "l5", party: "Barclays ****8821", detail: "Faster Payments deposit", amount: "+$10,125.95", flag: "gb" },
  { id: "l6", party: "Joseph Mwangi", detail: "Payout to M-Pesa", amount: "−KSh62,500.00", out: true, flag: "ke" },
];

const CARD_ART = "../v0/design-system/assets/card-bg.svg";

function LedgerShowcase() {
  const ref = useRef(null);
  const cards = Data.CARDS;
  const cardsTotal = cards.reduce((n, c) => n + (c.balance || 0), 0);
  const [cleared, setCleared] = useState(false);

  useEntrance(ref, (gsap) => {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".sc-ledger-window", { x: 48, autoAlpha: 0, duration: 0.8 })
      .from(".sc-ledger-tile", { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, "-=0.4")
      .from(".sc-ledger-row", { y: -10, autoAlpha: 0, duration: 0.45, stagger: 0.11 }, "-=0.35")
      .call(() => setCleared(true), null, "+=0.8");
  }, () => setCleared(true));

  return (
    <div className="auth-info-panel showcase showcase-c" ref={ref}>
      <ShowcaseCopy withSub={false} />
      <div className="sc-ledger" aria-hidden="true">
        <div className="sc-ledger-window">
          <div className="sc-ledger-tiles">
            <div className="sc-ledger-tile">
              <div className="sc-ledger-tile-name"><Flag cc="us" size={18} />Main USD account</div>
              <div className="sc-ledger-balance">${usd(Data.V0_USD_BALANCE)}<span>USD</span></div>
              <div className="sc-ledger-actions"><span className="sc-btn-primary">Deposit</span><span className="sc-btn-soft">Send money</span></div>
            </div>
            <div className="sc-ledger-tile">
              <div className="sc-ledger-tile-name"><span className="sc-ledger-cardart" style={{ backgroundImage: `url(${CARD_ART})` }} />Cards</div>
              <div className="sc-ledger-balance">${usd(cardsTotal)}<span>on {cards.length} cards</span></div>
              <div className="sc-ledger-chips">
                {/* One name where Home shows two: the tile is half the panel's width. */}
                <span>{cards[0].name}</span>
                {cards.length > 1 && <span className="more">+{cards.length - 1} more</span>}
              </div>
            </div>
          </div>
          <div className="sc-ledger-feed">
          <div className="sc-ledger-head">Recent activity</div>
          {LEDGER.map((row) => (
            <div className="sc-ledger-row" key={row.id}>
              {row.merchant ? <span className="sc-ledger-merchant"><img src={`../v0/design-system/assets/merchants/${row.merchant}.svg`} alt="" /></span>
                : row.token ? <span className="sc-ledger-token" style={{ backgroundImage: `url(../v0/design-system/assets/tokens/${row.token}.svg)` }} />
                : <Flag cc={row.flag} size={28} />}
              <div className="sc-ledger-who">
                <div>{row.party}</div>
                <div>{row.detail}</div>
              </div>
              <div className={`sc-ledger-amt ${row.out ? "" : "in"}`}>{row.amount}</div>
              {row.pending && <Pill tone={cleared ? "success" : "warn"}>{cleared ? "Completed" : "Processing"}</Pill>}
            </div>
          ))}
          </div>
        </div>
      </div>
      <TrustBadges />
    </div>
  );
}

const SHOWCASES = { a: DeskShowcase, b: CardShowcase, c: LedgerShowcase };

function ApplyShowcase({ variant = "a" }) {
  const Showcase = SHOWCASES[variant] || DeskShowcase;
  // Keyed by variant so switching replays the new one's entrance from the start.
  return <Showcase key={variant} />;
}

window.OBApplyShowcase = { ApplyShowcase, APPLY_PANELS, APPLY_PANEL_LABELS };
