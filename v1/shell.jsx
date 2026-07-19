/* global React */
const Icon = window.OBIcon;
const { useIsDesktop, Sheet } = window.OBPrimitives;
const { useState } = React;

const AM = { wa: "https://wa.me/+2348000000000" };

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

function TopBar({ onOpenMock }) {
  return (
    <header className="topbar">
      <div className="brand"><img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard Business" /></div>
      <div style={{ flex: 1 }} />
      <div className="right">
        <button className="gear" onClick={onOpenMock} aria-label="Mock controls"><Icon.cog style={{ width: 16, height: 16 }} /></button>
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

function TopBarMobile({ onOpenMock }) {
  return (
    <header className="topbar-mobile">
      <div className="brand"><img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard Business" /></div>
      <div className="right">
        <button className="gear" onClick={onOpenMock} aria-label="Mock controls"><Icon.cog style={{ width: 15, height: 15 }} /></button>
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
// Mock controls open from the same small gear icon in the top bar on both breakpoints, as a Sheet.
function Shell({ active, onNavigate, mockControls, children }) {
  const isDesktop = useIsDesktop();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className="shell is-desktop">
        <TopBar onOpenMock={() => setMockOpen(true)} />
        <SidebarV1 active={active} onNavigate={onNavigate} />
        <div className="content-desktop">{children}</div>
        <Sheet open={mockOpen} onClose={() => setMockOpen(false)} title="Mock controls">{mockControls}</Sheet>
      </div>
    );
  }
  return (
    <div className="shell is-mobile">
      <TopBarMobile onOpenMock={() => setMockOpen(true)} />
      <div className="content-mobile">{children}</div>
      <BottomTabs active={active} onNavigate={onNavigate} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onNavigate={onNavigate} />
      <Sheet open={mockOpen} onClose={() => setMockOpen(false)} title="Mock controls">{mockControls}</Sheet>
    </div>
  );
}

window.OBShell = { Shell, NAV, MORE_NAV };
