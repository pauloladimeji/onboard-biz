/* global React */
// =====================================================
// Apply for access — product showcase (the right panel)
// =====================================================
// The apply page is the one the website and other entry points link to, so its panel shows the
// whole product instead of the cross-border line the other auth screens keep (Paul, 8 Oct).
// It is the product itself, bleeding off the panel's edge: Home's top row (the account beside the
// cards, as on the dashboard, so a card is in the picture) and its recent activity, filling in
// newest first. The range of the product comes across through real entries (a stablecoin
// deposit, a UK bank deposit, payouts in three currencies, a card payment) rather than through
// claims about it. The top payout clears once the feed has landed.
//
// Chosen by Paul on 9 Oct from three directions (the others were a composed account/card/payout
// "desk" and a single hero card); they are in this file's git history.
// One GSAP entrance, then still. Reduced motion, or GSAP failing to load, shows the finished state.
const { useState, useEffect, useRef } = React;
const { Flag, Pill } = window.OBPrimitives;
const Data = window.OBData;

const HEADLINE = "Accounts, cards and payouts for your business.";
const CARD_ART = "../v0/design-system/assets/card-bg.svg";
const usd = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function LedgerIcon({ row }) {
  if (row.merchant) {
    return <span className="sc-ledger-merchant"><img src={`../v0/design-system/assets/merchants/${row.merchant}.svg`} alt="" /></span>;
  }
  if (row.token) {
    return <span className="sc-ledger-token" style={{ backgroundImage: `url(../v0/design-system/assets/tokens/${row.token}.svg)` }} />;
  }
  return <Flag cc={row.flag} size={28} />;
}

function ApplyShowcase() {
  const ref = useRef(null);
  const stage = useRef(null);
  const cards = Data.CARDS;
  const cardsTotal = cards.reduce((n, c) => n + (c.balance || 0), 0);
  const [cleared, setCleared] = useState(false);

  // The entrance: the window slides in, the two tiles land, the feed fills in, the payout clears.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ref.current || !window.gsap || reduce) { setCleared(true); return undefined; }
    const ctx = window.gsap.context(() => {
      window.gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".sc-ledger-window", { x: 48, autoAlpha: 0, duration: 0.8 })
        .from(".sc-ledger-tile", { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, "-=0.4")
        .from(".sc-ledger-row", { y: -10, autoAlpha: 0, duration: 0.45, stagger: 0.11 }, "-=0.35")
        .call(() => setCleared(true), null, "+=0.8");
    }, ref);
    return () => ctx.revert();
  }, []);

  // How much of the window shows before the panel cuts it off, so the content can stop the same
  // distance from that cut as it starts from the window's left edge. Re-measured on resize.
  useEffect(() => {
    const el = stage.current;
    const panel = el?.closest(".auth-split-right");
    if (!el || !panel) return undefined;
    const measure = () => el.style.setProperty("--sc-visible", `${panel.getBoundingClientRect().right - el.getBoundingClientRect().left}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="auth-info-panel showcase showcase-ledger" ref={ref}>
      <div className="showcase-copy">
        <img src="../v0/design-system/assets/onboard-icon-512.png" alt="" className="showcase-mark" />
        <h2 className="showcase-title">{HEADLINE}</h2>
      </div>

      {/* A picture of the product; the left column says it in words. */}
      <div className="sc-ledger" aria-hidden="true" ref={stage}>
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
                <LedgerIcon row={row} />
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

      <div className="showcase-trust">
        <span><Flag cc="us" size={16} />FinCEN MSB</span>
        <span><Flag cc="ca" size={16} />FINTRAC MSB</span>
      </div>
    </div>
  );
}

window.OBApplyShowcase = { ApplyShowcase };
