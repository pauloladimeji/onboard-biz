/* global React */
const Icon = window.OBIcon;
const { TXNS } = window.OBData;
const { useState: useStateD } = React;
const { CcyFlag, Page, Records, Sheet, can, ROLE_LABEL, SIGNED_IN, useIsDesktop } = window.OBPrimitives;
const { SubAccountsHomeSection } = window.OBSubAccounts;
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
  if (access === "no_txns") return all.slice(0, 1).map((c) => ({ ...c, balance: 0, spent: { today: 0, month: 0 } }));
  if (access === "low_balance") return all.map((c, i) => (i === 0 ? { ...c, status: "frozen", lowBalance: true, balance: 0.2 } : c));
  return all;
};
const sumSpend = (cards) => cards.reduce((s, c) => s + ((c.spent || {}).month || 0), 0);
const sumBalance = (cards) => cards.reduce((s, c) => s + (c.balance || 0), 0);

// A. One line. Cheapest possible footprint — a signpost, not a workspace.
function CardsHomeStrip({ onOpen, cards }) {
  const spend = sumSpend(cards);
  const summary = cards.length === 0
    ? "Virtual cards for subscriptions and online spend"
    : `${cards.length} card${cards.length > 1 ? "s" : ""} · $${fmtMoney(sumBalance(cards))} available${spend > 0 ? ` · $${fmtMoney(spend)} spent this month` : ""}`;
  return (
    <div className="home-cards-strip" onClick={onOpen}>
      <Icon.card />
      <span className="t">Cards</span>
      <span className="s">{summary}</span>
      <span className="go">{cards.length === 0 ? "Create →" : "View →"}</span>
    </div>
  );
}

// B. The sub-accounts pattern: header, spend, three rows. Familiar, scannable, ~150px.
function CardsHomeSection({ onOpen, cards }) {
  return (
    <div className="records-card" style={{ marginBottom: 18 }}>
      <div className="records-head">
        <h2>Cards</h2>
        <div className="records-head-right">
          <span className="meta">{sumSpend(cards) > 0 ? `$${fmtMoney(sumSpend(cards))} spent this month` : `$${fmtMoney(sumBalance(cards))} available`}</span>
          <a className="records-viewall" onClick={onOpen}>View all →</a>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--gray-100)" }}>
        {cards.slice(0, 3).map((c) => (
          <div key={c.id} className="home-card-row" onClick={onOpen}>
            <span className="ic"><Icon.card /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nm">{c.name}</div>
              <div className="sub">•• {c.last4}{c.status === "frozen" ? " · Frozen" : ""}</div>
            </div>
            <div className="bal">${fmtMoney(c.balance || 0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// C. Card art, the Revolut/Brex move. Most discoverable, biggest footprint, and the only one
// that makes cards look like a product rather than a row in a list.
function CardsHomeTiles({ onOpen, cards: all }) {
  const Visual = (window.OBCards || {}).CardVisual;
  const cards = all.slice(0, 3);
  return (
    <div className="records-card" style={{ marginBottom: 18 }}>
      <div className="records-head">
        <h2>Cards</h2>
        <div className="records-head-right">
          <span className="meta">{sumSpend(cards) > 0 ? `$${fmtMoney(sumSpend(cards))} spent this month` : `$${fmtMoney(sumBalance(cards))} available`}</span>
          <a className="records-viewall" onClick={onOpen}>View all →</a>
        </div>
      </div>
      <div className="home-cards-rail">
        {cards.map((c) => (
          <div key={c.id} className="home-card-tile" onClick={onOpen}>
            {Visual ? <Visual card={c} compact fillWidth /> : null}
            <div className="nm">{c.name}</div>
            <div className="bal">${fmtMoney(c.balance || 0)}</div>
          </div>
        ))}
        <div className="home-card-new" onClick={onOpen}><Icon.plus /><span>New card</span></div>
      </div>
    </div>
  );
}

// Three realities, not one: no cards, a single card, or several. The headline number follows —
// spend only once there is spend to report, otherwise what's actually on the cards.
function CardsHomePanel({ onOpen, cards }) {
  const spend = sumSpend(cards);
  const balance = sumBalance(cards);
  const none = cards.length === 0;
  const single = cards.length === 1;
  return (
    <div className="home-cards-panel">
      <div className="home-hero-top">
        <div className="home-acct-label"><Icon.card style={{ width: 17, height: 17, color: "var(--gray-500)" }} /><span>Cards</span></div>
        {!none && <a className="records-viewall" onClick={onOpen}>View all →</a>}
      </div>

      {none ? (
        <>
          <p className="home-cards-pitch">Create a virtual card for subscriptions, ad spend and anything else you pay for online — funded from your USD balance.</p>
          <div className="home-actions"><button className="btn btn-lg" onClick={onOpen}><Icon.plus /> Create card</button></div>
        </>
      ) : (
        <>
          <div className="home-balance">
            <span className="home-balance-num">${fmtMoney(spend > 0 ? spend : balance)}</span>
            <span className="home-balance-ccy">{spend > 0 ? "spent this month" : "available"}</span>
          </div>
          <div className="home-cards-panel-rows">
            {cards.slice(0, 3).map((c) => (
              <div key={c.id} className="r" onClick={onOpen}>
                <span className="nm">{c.name}</span>
                <span className="d">{c.status === "frozen" ? (c.lowBalance ? "Needs funding" : "Frozen") : `•• ${c.last4}`}</span>
                <span className="b">${fmtMoney(c.balance || 0)}</span>
              </div>
            ))}
          </div>
          <div className="home-actions">
            <button className="btn btn-soft btn-lg" onClick={onOpen}>{single ? "View card" : "View cards"}</button>
          </div>
        </>
      )}
    </div>
  );
}

function MoveToCardSheet({ cards, onClose, onPick, onCreate }) {
  return (
    <Sheet open onClose={onClose} title="Move money to a card">
      <p className="set-sheet-lede" style={{ marginTop: 0 }}>From your USD balance. Pick the card to fund.</p>
      <div className="home-pick-list">
        {cards.map((c) => (
          <div key={c.id} className="home-pick" onClick={() => onPick(c)}>
            <span className="ic"><Icon.card /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nm">{c.name}</div>
              <div className="sub">{c.status === "frozen" ? (c.lowBalance ? "Needs funding" : "Frozen") : `•• ${c.last4}`}</div>
            </div>
            <span className="b">${fmtMoney(c.balance || 0)}</span>
          </div>
        ))}
        <div className="home-pick new" onClick={onCreate}>
          <span className="ic"><Icon.plus /></span>
          <div style={{ flex: 1 }}><div className="nm">Create a new card</div></div>
        </div>
      </div>
    </Sheet>
  );
}

// D. Discovery only: shown until they have a card, then gone for good. Zero permanent cost.
function CardsHomeDiscovery({ onOpen }) {
  return (
    <div className="home-cards-discover">
      <div className="ic"><Icon.card /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">Virtual cards for online spend</div>
        <div className="s">Create a card for subscriptions and ad spend, funded from your USD balance.</div>
      </div>
      <button className="btn" onClick={onOpen}>Create card</button>
    </div>
  );
}

function Dashboard({ dataState = "full", accountSuspended = false, onAddMoney, onSendPayment, onOpenTx, onViewAll, subAccountsOn = false, onOpenSubAccounts, onOpenRole, role = "admin", cardsHome = "off", onOpenCards, cardsAccess = "active" }) {
  const isEmpty = dataState === "empty";
  const wide = useIsDesktop();
  const homeCards = liveCards(isEmpty ? "no_cards" : cardsAccess);
  const split = cardsHome === "split" && wide && !isEmpty;
  // With no cards there is nothing to list — the only version that still says something is the
  // pitch, so the list-shaped variants fall back to it.
  const noCards = homeCards.length === 0;
  const [picking, setPicking] = useStateD(false);
  // No cards yet means there's nothing to pick from — the button becomes the way in to making
  // one, which is the discovery case this variant is really for.
  const moveToCard = () => (noCards ? onOpenCards() : setPicking(true));
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

      <div className={split ? "home-split" : undefined}>
      <div className="home-hero">
        <div className="home-hero-top">
          <div className="home-acct-label"><CcyFlag code="USD" size={22} /><span>Global USD Account</span></div>
          <div className="home-status"><span className="dot" />Active</div>
        </div>
        <div className="home-balance">
          <span className="home-balance-num">${balance}</span>
          <span className="home-balance-ccy">USD</span>
        </div>
        <div className="home-actions">
          <button className="btn btn-lg" onClick={onAddMoney}><Icon.plus /> Deposit</button>
          {can(role, "pay") && <button className="btn btn-soft btn-lg" onClick={onSendPayment} disabled={accountSuspended}><Icon.paperplane /> Send money</button>}
          {cardsHome === "action" && <button className="btn btn-soft btn-lg" onClick={moveToCard} disabled={accountSuspended}><Icon.card /> Move to card</button>}
        </div>
        <div className="home-divider" />
        <div className="home-rails-note">Fund with USD, GBP, EUR, NGN, or stablecoins — all deposits are held as USD</div>
      </div>
      {split && <CardsHomePanel onOpen={onOpenCards} cards={homeCards} />}
      </div>

      {cardsHome === "split" && !wide && <CardsHomeStrip onOpen={onOpenCards} cards={homeCards} />}

      {cardsHome === "strip" && <CardsHomeStrip onOpen={onOpenCards} cards={homeCards} />}
      {cardsHome === "section" && (noCards ? <CardsHomeDiscovery onOpen={onOpenCards} /> : <CardsHomeSection onOpen={onOpenCards} cards={homeCards} />)}
      {cardsHome === "tiles" && (noCards ? <CardsHomeDiscovery onOpen={onOpenCards} /> : <CardsHomeTiles onOpen={onOpenCards} cards={homeCards} />)}
      {cardsHome === "discovery" && noCards && <CardsHomeDiscovery onOpen={onOpenCards} />}

      {subAccountsOn && !isEmpty && <SubAccountsHomeSection onOpen={onOpenSubAccounts} />}

      {picking && <MoveToCardSheet cards={homeCards} onClose={() => setPicking(false)} onPick={() => { setPicking(false); onOpenCards(); }} onCreate={() => { setPicking(false); onOpenCards(); }} />}

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
