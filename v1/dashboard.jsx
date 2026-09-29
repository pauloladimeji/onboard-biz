/* global React */
const Icon = window.OBIcon;
const { TXNS } = window.OBData;
const { useState: useStateD } = React;
const { CcyFlag, Page, Records, Sheet, can, ROLE_LABEL, SIGNED_IN, useIsDesktop } = window.OBPrimitives;

const HomeData = window.OBData;

// Cards live in the sidebar on desktop and behind "More" on mobile, which is where features go
// to be forgotten. These are the options for surfacing them on Home, switched from the mock
// panel so they can be compared on the real screen rather than described.
const fmtMoney = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Mirrors the seeds behind the Cards mock control, so Home shows the same reality the Cards
// screen does: no cards at all, a single unused card, or a funded set.
const liveCards = (access) => {
  if (access === "no_cards" || access === "not_applied" || access === "rejected") return [];
  const all = (HomeData.CARDS || []).filter((c) => c.status === "active" || c.status === "frozen");
  if (access === "no_txns") return all.slice(0, 1).map((c) => ({ ...c, balance: 500, spent: { today: 0, month: 0 } }));
  if (access === "low_balance") return all.map((c, i) => (i === 0 ? { ...c, status: "frozen", lowBalance: true, balance: 0.2 } : c));
  return all;
};
const sumSpend = (cards) => cards.reduce((s, c) => s + ((c.spent || {}).month || 0), 0);
const sumBalance = (cards) => cards.reduce((s, c) => s + (c.balance || 0), 0);

// Three realities, not one: no cards, a single card, or several. The headline number follows —
// spend only once there is spend to report, otherwise what's actually on the cards.
// Same four rows as the account card — label, figure, action, divider, note — in every state,
// so the two panels read as one row and the card state is the only thing that changes.
function CardsHomePanel({ onOpen, cards }) {
  // Two states, not five. Whether the business never applied, was declined, or simply hasn't
  // made one, from Home it's the same thing: no cards yet. The Cards screen handles the
  // difference, where there's room to explain it.
  const none = cards.length === 0;
  const balance = sumBalance(cards);

  const head = (link) => (
    <div className="home-hero-top">
      <div className="home-acct-label"><span className="home-card-badge"><Icon.card /></span><span>Cards</span></div>
      {link && <a className="records-viewall" onClick={onOpen}>View all →</a>}
    </div>
  );

  if (none) {
    return (
      <div className="home-cards-panel">
        {head(false)}
        <div className="home-balance">
          <span className="home-balance-num">$0.00</span>
          <span className="home-balance-ccy">on 0 cards</span>
        </div>
        <div className="home-actions"><button className="btn btn-lg" onClick={onOpen}><Icon.plus /> Create card</button></div>
        <div className="home-divider" />
        <div className="sa-panel-foot">For subscriptions, ad spend and online payments — funded from your USD balance.</div>
      </div>
    );
  }

  // Balance, always: it totals the cards underneath, and it's the number you act on. Spend
  // lives on the Cards screen, against the limits it's measured by.

  return (
    <div className="home-cards-panel">
      {head(true)}
      <div className="home-balance">
        <span className="home-balance-num">${fmtMoney(balance)}</span>
        <span className="home-balance-ccy">on {cards.length} card{cards.length === 1 ? "" : "s"}</span>
      </div>
      {/* Chips, not rows: fixed height however many cards there are, and the card that needs
          funding says so on its own chip instead of in a tally underneath. */}
      <div className="home-card-chips">
        {cards.slice(0, 2).map((c) => (
          <span key={c.id} className={`home-card-chip${c.lowBalance ? " warn" : ""}`} onClick={onOpen}>
            <Icon.card />{c.name}
          </span>
        ))}
        {cards.length > 2 && <span className="home-card-chip more" onClick={onOpen}>+{cards.length - 2} more</span>}
      </div>
      <div className="home-divider" />
      <div className="sa-panel-foot">Spend online in USD — top up, freeze or set limits on any card.</div>
    </div>
  );
}

function Dashboard({ dataState = "full", accountSuspended = false, onAddMoney, onSendPayment, onOpenTx, onViewAll, subAccountsOn = false, onOpenSubAccounts, onOpenRole, role = "admin", cardsHome = "off", onOpenCards, cardsAccess = "active" }) {
  const isEmpty = dataState === "empty";
  const wide = useIsDesktop();
  const homeCards = liveCards(isEmpty ? "no_cards" : cardsAccess);
  // Sub-accounts sit beside the account card on desktop rather than under it: the hero has
  // spare width, and a section below pushed recent activity off the fold.
  // Sub-accounts are reached from the nav only for now: no Home placement until there's
  // adoption data to judge it by. SubAccountsHomePanel is still in subaccounts.jsx for when
  // there is.
  const showCards = cardsHome !== "off" && wide;
  // With no cards there is nothing to list — the only version that still says something is the
  // pitch, so the list-shaped variants fall back to it.
  const balance = isEmpty ? "0.00" : "84,231.50";
  const recentTxns = isEmpty ? [] : TXNS.slice(0, 8);

  return (
    <Page>
      <div className="home-greet">
        <div className="home-greet-name">Welcome back, {SIGNED_IN.name.split(" ")[0]}</div>
        <button className="home-role-chip" onClick={onOpenRole} title="What your role can do">
          {ROLE_LABEL[role]} <Icon.arrowRight />
        </button>
      </div>

      {accountSuspended && (
        <div className="card" style={{ marginBottom: 18, borderLeft: "3px solid var(--danger-600)", display: "flex", gap: 12 }}>
          <Icon.alert style={{ width: 18, height: 18, color: "var(--danger-600)", flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: "var(--gray-900)", marginBottom: 2 }}>Account suspended</div>
            <div style={{ color: "var(--gray-600)" }}>Deposits and withdrawals are not supported. Contact <strong>support@onboard.xyz</strong>.</div>
          </div>
        </div>
      )}

      <div className={showCards ? "home-split" : undefined}>
      <div className="home-hero">
        <div className="home-hero-top">
          <div className="home-acct-label"><CcyFlag code="USD" size={22} /><span>Main USD account</span></div>
          <div className="home-status"><span className="dot" />Active</div>
        </div>
        <div className="home-balance">
          <span className="home-balance-num">${balance}</span>
          <span className="home-balance-ccy">USD</span>
        </div>
        <div className="home-actions">
          <button className="btn btn-lg" onClick={onAddMoney}><Icon.plus /> Deposit</button>
          {can(role, "pay") && <button className="btn btn-soft btn-lg" onClick={onSendPayment} disabled={accountSuspended}><Icon.paperplane /> Send money</button>}
        </div>
        <div className="home-divider" />
        <div className="home-rails-note">Fund with USD, GBP, EUR, NGN, or stablecoins — all deposits are held as USD</div>
      </div>
      {showCards && <CardsHomePanel onOpen={onOpenCards} cards={homeCards} />}
      </div>

      {cardsHome !== "off" && !wide && <CardsHomePanel onOpen={onOpenCards} cards={homeCards} />}

      <Records
        title="Recent activity"
        txns={recentTxns}
        onRowClick={onOpenTx}
        onViewAll={onViewAll}
        emptyHint="Money movements will appear here once your first payment lands or settles." />
    </Page>
  );
}

window.OBDashboard = { Dashboard };
