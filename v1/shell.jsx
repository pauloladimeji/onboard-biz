/* global React */
const Icon = window.OBIcon;
const { useIsDesktop, Sheet, isDemoMode, withDemoUtm, TALLY_URL } = window.OBPrimitives;
const { useState, useEffect } = React;

const AM = { wa: "https://wa.me/14313404484" };

const WaIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// Grid / "all sections" — reads as More more clearly than a rotated list (which looked like
// three loose bars), and matches the outline style of the other bottom-tab icons.
const MoreIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
  </svg>
);

// Primary destinations — bottom tabs (mobile) show these plus a "More" tab.
const NAV = [
  { id: "dashboard",  label: "Home",         icon: Icon.home },
  { id: "add-money",  label: "Deposit",      icon: Icon.arrowDownLeft },
  { id: "payments",   label: "Send",         icon: Icon.paperplane },
  { id: "recipients", label: "Recipients",   icon: Icon.people },
  { id: "activity",   label: "Transactions", icon: Icon.list },
];
// Cards sits inline in the desktop sidebar (not a 6th bottom tab — would crowd the tab bar);
// mobile reaches it through the "More" sheet instead.
const CARDS_NAV = { id: "cards", label: "Cards", icon: Icon.card };
const WORKSPACE_NAV = [
  { id: "settings",  label: "Settings",  icon: Icon.cog },
  { id: "developer", label: "Developer", icon: Icon.doc },
];
// Desktop puts these under a "Workspace" sidebar group; mobile's "More" tab opens them in a sheet.
const MORE_NAV = [CARDS_NAV, ...WORKSPACE_NAV];

function AccountManagerCard() {
  return (
    <div className="sb-am-card">
      <div className="sb-am-top">
        <div className="sb-am-ava"><Icon.people style={{ width: 16, height: 16 }} /></div>
        <div className="sb-am-meta">
          <div className="sb-am-name">Your Account Manager</div>
          <div className="sb-am-role">Here for your business</div>
        </div>
      </div>
      <a className="sb-am-cta" href={AM.wa} target="_blank" rel="noopener noreferrer">
        <WaIcon style={{ width: 14, height: 14 }} />
        Chat on WhatsApp
      </a>
    </div>
  );
}

// Persistent, non-dismissible — a public demo visitor should always have a way back to the
// real signup, not just on first load. Never rendered outside demo mode.
function DemoBanner() {
  return (
    <div className="demo-banner">
      <span>You're exploring the Onboard Business demo — nothing here is real.</span>
      <a href={withDemoUtm(TALLY_URL, { utm_campaign: "topbanner" })} target="_blank" rel="noopener noreferrer" className="demo-banner-cta">
        Open an account <Icon.arrowRight style={{ width: 12, height: 12 }} />
      </a>
    </div>
  );
}

// A checklist tour doubling as a CTA surface (Mercury-style) — nudges a demo visitor through
// the features worth seeing, tracks what they've already opened, and closes with the same
// "Open an account" conversion point as the rest of the demo chrome. Never rendered outside
// demo mode; state lives in Shell so it survives navigation but resets on reload (no persistence
// needed — same call as recipients-in-session).
const NUDGE_ITEMS = [
  { route: "dashboard",  label: "See your global USD account" },
  { route: "add-money",  label: "See how deposits work" },
  { route: "payments",   label: "Send a payment" },
  { route: "recipients", label: "Add a recipient" },
  { route: "cards",      label: "Create a virtual card" },
];

function GuidedNudges({ active, onNavigate }) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [visited, setVisited] = useState(() => new Set(["dashboard"]));

  useEffect(() => { setVisited((prev) => (prev.has(active) ? prev : new Set(prev).add(active))); }, [active]);

  if (dismissed) return null;
  const doneCount = NUDGE_ITEMS.filter((n) => visited.has(n.route)).length;
  const allDone = doneCount === NUDGE_ITEMS.length;

  if (collapsed) {
    return (
      <button className="nudges-fab" onClick={() => setCollapsed(false)} aria-label="Show demo tour">
        <span className="nudges-fab-ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="var(--gray-200)" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke="var(--brand-purple, #7C3AED)" strokeWidth="3" strokeDasharray={`${(doneCount / NUDGE_ITEMS.length) * 100.5} 100.5`} strokeLinecap="round" transform="rotate(-90 18 18)" /></svg></span>
        <span>{allDone ? "Tour complete" : "Explore the demo"}</span>
      </button>
    );
  }

  return (
    <div className="nudges-panel">
      <div className="nudges-head">
        <div>
          <div className="nudges-title">{allDone ? "You've seen it all" : "Try the demo"}</div>
          <div className="nudges-sub">{doneCount}/{NUDGE_ITEMS.length} explored</div>
        </div>
        <button className="nudges-min" onClick={() => setCollapsed(true)} aria-label="Minimize">–</button>
      </div>
      <div className="nudges-list">
        {NUDGE_ITEMS.map((n) => (
          <button key={n.route} className={`nudges-item ${visited.has(n.route) ? "done" : ""} ${active === n.route ? "active" : ""}`} onClick={() => onNavigate(n.route)}>
            <span className="nudges-check">{visited.has(n.route) ? <Icon.check style={{ width: 11, height: 11 }} /> : null}</span>
            {n.label}
          </button>
        ))}
      </div>
      <a className="nudges-cta" href={withDemoUtm(TALLY_URL, { utm_campaign: "nudges_panel" })} target="_blank" rel="noopener noreferrer">
        Open an account <Icon.arrowRight style={{ width: 12, height: 12 }} />
      </a>
      <button className="nudges-dismiss" onClick={() => setDismissed(true)}>Hide for this visit</button>
    </div>
  );
}

function TopBar({ onOpenMock, isDemo }) {
  return (
    <header className="topbar">
      <div className="brand"><img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard Business" /></div>
      <div style={{ flex: 1 }} />
      <div className="right">
        {!isDemo && <button className="gear" onClick={onOpenMock} aria-label="Mock controls"><Icon.cog style={{ width: 16, height: 16 }} /></button>}
        <div className="avatar">JN</div>
      </div>
    </header>
  );
}

function SidebarV1({ active, onNavigate }) {
  const item = (n) => (
    <div key={n.id} className={`sb-item ${active === n.id ? "active" : ""}`} onClick={() => onNavigate(n.id)}>
      <n.icon />
      <span>{n.label}</span>
    </div>
  );
  return (
    <aside className="sidebar-v1">
      {NAV.map(item)}
      {item(CARDS_NAV)}
      <div className="sb-group">Workspace</div>
      {WORKSPACE_NAV.map(item)}
      <div style={{ flex: 1 }} />
      <AccountManagerCard />
      <div className="sb-foot">Onboard Business · v1 (adaptive)</div>
    </aside>
  );
}

function TopBarMobile({ onOpenMock, isDemo }) {
  return (
    <header className="topbar-mobile">
      <div className="brand"><img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard Business" /></div>
      <div className="right">
        {!isDemo && <button className="gear" onClick={onOpenMock} aria-label="Mock controls"><Icon.cog style={{ width: 15, height: 15 }} /></button>}
        <a className="topnav-wa" href={AM.wa} target="_blank" rel="noopener noreferrer" aria-label="Chat with your Account Manager">
          <WaIcon style={{ width: 15, height: 15 }} />
        </a>
        <div className="avatar">JN</div>
      </div>
    </header>
  );
}

function BottomTabs({ active, onNavigate, onMore }) {
  const isMore = MORE_NAV.some(n => n.id === active);
  return (
    <nav className="bottom-tabs">
      {NAV.map(n => (
        <button key={n.id} className={`bt-item ${active === n.id ? "active" : ""}`} onClick={() => onNavigate(n.id)}>
          <span className="bt-ic"><n.icon /></span>
          <span className="lbl">{n.label}</span>
        </button>
      ))}
      <button className={`bt-item ${isMore ? "active" : ""}`} onClick={onMore}>
        <span className="bt-ic"><MoreIcon /></span>
        <span className="lbl">More</span>
      </button>
    </nav>
  );
}

function MoreSheet({ open, onClose, onNavigate }) {
  return (
    <Sheet open={open} onClose={onClose} title="More">
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {MORE_NAV.map(n => (
          <div key={n.id} className="sb-item" style={{ borderRight: "none", borderRadius: 8 }} onClick={() => { onNavigate(n.id); onClose(); }}>
            <n.icon />
            <span>{n.label}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// Adaptive shell: sidebar+topnav on desktop, bottom tabs+topbar on mobile. Same route state either way.
// Mock controls open from the same small gear icon in the top bar on both breakpoints, as a Sheet —
// except in demo mode, where the gear (and the whole harness) doesn't render at all. See HANDOFF.md.
function Shell({ active, onNavigate, mockControls, children }) {
  const isDesktop = useIsDesktop();
  const isDemo = isDemoMode();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className={`shell is-desktop ${isDemo ? "has-demo-banner" : ""}`}>
        {isDemo && <DemoBanner />}
        <TopBar onOpenMock={() => setMockOpen(true)} isDemo={isDemo} />
        <SidebarV1 active={active} onNavigate={onNavigate} />
        <div className="content-desktop">{children}</div>
        {isDemo && <GuidedNudges active={active} onNavigate={onNavigate} />}
        {!isDemo && <Sheet open={mockOpen} onClose={() => setMockOpen(false)} title="Mock controls">{mockControls}</Sheet>}
      </div>
    );
  }
  return (
    <div className="shell is-mobile">
      {isDemo && <DemoBanner />}
      <TopBarMobile onOpenMock={() => setMockOpen(true)} isDemo={isDemo} />
      <div className="content-mobile">{children}</div>
      <BottomTabs active={active} onNavigate={onNavigate} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onNavigate={onNavigate} />
      {isDemo && <GuidedNudges active={active} onNavigate={onNavigate} />}
      {!isDemo && <Sheet open={mockOpen} onClose={() => setMockOpen(false)} title="Mock controls">{mockControls}</Sheet>}
    </div>
  );
}

window.OBShell = { Shell, NAV, MORE_NAV };
