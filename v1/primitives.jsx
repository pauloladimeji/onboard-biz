/* global React */
/* Adaptive primitives shared across v1 screens — desktop scales up, mobile is native-feel. */
const { useState, useEffect } = React;
const Icon = window.OBIcon;
const { CURRENCIES, displayActivityLabel } = window.OBData;

const XIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const shortRef = r => r.length > 22 ? r.slice(0, 22) + "…" : r;

// Public apply page — where every outbound "Open an account" CTA sends the visitor (demo chrome,
// nudges, completion moments). Shared so they never drift apart.
const APPLY_URL = "https://business.onboard.xyz/apply";
// Raw Tally form — used only as the embedded iframe in the real "Apply for access" auth flow
// (the apply page above is a full page, not embeddable), so keep it separate.
const TALLY_URL = "https://tally.so/r/5BMoRP";
// The reverse direction of APPLY_URL — from the real "Apply for access" screen, a "not ready yet"
// visitor can try the interactive demo instead of committing to KYB.
const DEMO_URL = "https://demo.business.onboard.xyz";
const CONSUMER_APP_LINKS = {
  android: "https://play.google.com/store/apps/details?id=com.onboard.wallet&hl=en",
  ios: "https://apps.apple.com/us/app/onboard-global/id1665198778",
};
const SALES_CALL_URL = "https://calendar.app.google/u5Nx8oTyomazzE1h7";

// ---------- Demo mode ----------
// Public lead-gen surface — on when `?demo=1` (local/preview testing) or the deployed demo
// hostname. Everything gated on this must degrade safely: hide the mock-controls harness
// (never expose the QA panel publicly), skip auth, add conversion chrome. See HANDOFF.md.
function isDemoMode() {
  if (typeof window === "undefined" || !window.location) return false;
  try {
    if (new URLSearchParams(window.location.search).get("demo") === "1") return true;
  } catch (e) { /* ignore */ }
  return window.location.hostname.indexOf("demo.") === 0;
}

// Appends UTM params to an outbound CTA so a later analytics pass (e.g. Google Analytics) can
// attribute conversions back to the demo with zero code changes then — no tracking SDK now.
function withDemoUtm(url, extra = {}) {
  try {
    const u = new URL(url);
    const params = { utm_source: "onboard_demo", utm_medium: "cta", ...extra };
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  } catch (e) {
    return url;
  }
}

// Reusable conversion prompt for "completion moments" (send confirmation, card created, etc).
// Renders nothing outside demo mode — safe to drop into any screen unconditionally.
function DemoCta({ message, campaign }) {
  if (!isDemoMode()) return null;
  return (
    <div className="demo-cta">
      <span>{message}</span>
      <a href={withDemoUtm(APPLY_URL, { utm_campaign: campaign })} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">
        Open an account
      </a>
    </div>
  );
}

// Shows most of the string — only elides a small chunk in the middle — so an address never
// wraps but is still recognizable/eyeball-checkable at both ends.
function truncateMiddle(str, front = 16, back = 10) {
  if (!str || str.length <= front + back + 1) return str;
  return `${str.slice(0, front)}…${str.slice(-back)}`;
}

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isDesktop;
}

function CcyFlag({ code, size = 32 }) {
  const flag = CURRENCIES[code]?.flag || "us";
  return <div className="ccy-flag" style={{ width: size, height: size, backgroundImage: `url(../v0/design-system/assets/flags/${flag}.svg)` }} />;
}

// Renders straight from a raw flag/country code (e.g. "ng") — for data like RECIPIENTS_FULL that
// isn't keyed by currency. CcyFlag stays currency-keyed; don't conflate the two.
function Flag({ cc, size = 22 }) {
  return <div className="ccy-flag" style={{ width: size, height: size, backgroundImage: `url(../v0/design-system/assets/flags/${cc}.svg)` }} />;
}

// ---------- Roles / ACL ----------
// Four fixed roles against the business's single main account (see ACL-SPEC.md). Deliberately
// coarse: no per-account scoping, no approval engine. `recipients` gates the whole screen rather
// than just add/edit — transactions already carry the counterparty, so a read-only directory of
// every payee earns nothing for the seats that can't pay them.
const ROLES = [
  { id: "viewer",    label: "Viewer",    blurb: "Accounts and transactions, read-only" },
  { id: "developer", label: "Developer", blurb: "Viewer access plus API keys" },
  { id: "operator",  label: "Operator",  blurb: "Recipients and payments, plus API keys" },
  { id: "admin",     label: "Admin",     blurb: "Everything, including the team" },
];
const ROLE_LABEL = ROLES.reduce((m, r) => { m[r.id] = r.label; return m; }, {});
const CAN = {
  //           pay    recipients  apiKeys  team   provision
  viewer:    { pay: false, recipients: false, apiKeys: false, team: false, provision: false },
  developer: { pay: false, recipients: false, apiKeys: true,  team: false, provision: false },
  operator:  { pay: true,  recipients: true,  apiKeys: true,  team: false, provision: true  },
  admin:     { pay: true,  recipients: true,  apiKeys: true,  team: true,  provision: true  },
};
function can(role, action) {
  const set = CAN[role] || CAN.admin;
  return !!set[action];
}

// Landing state for a gated route reached by back button, bookmark, or a stale link. Never a
// blank screen — say which role is missing and who can grant it.
function NoAccess({ what = "this" }) {
  return (
    <Page>
      <div className="card">
        <div className="noaccess">
          <div className="noaccess-ic"><Icon.lock /></div>
          <div className="noaccess-t">You don't have access to {what}</div>
          <div className="noaccess-s">Your role doesn't include this. Ask an admin on your team if you need it.</div>
        </div>
      </div>
    </Page>
  );
}

// Inline replacement for an action a role can't take, used where the button's absence would
// read as a bug rather than a restriction (a list with nothing to add to it).
function NoAccessNote({ children }) {
  return <div className="noaccess-note"><Icon.lock />{children}</div>;
}

function Page({ children }) {
  const isDesktop = useIsDesktop();
  return <div className={`page ${isDesktop ? "" : "page-mobile"}`}>{children}</div>;
}

// Decorative QR — a real-looking pattern (three finder corners + deterministic noise seeded
// by `value`, so each address renders a distinct code) rather than a scannable encoding, since
// every address in the prototype is a mock. Swap the noise for a CDN QR encoder if a demo ever
// needs it to actually scan; the markup/sizing stays the same.
function QrCode({ value = "", size = 148 }) {
  const N = 25;
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  const isFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let on;
      if (isFinder(r, c)) {
        const lr = r < 7 ? r : r - (N - 7);
        const lc = c < 7 ? c : c - (N - 7);
        on = (lr === 0 || lr === 6 || lc === 0 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        let x = (seed ^ (r * 73856093) ^ (c * 19349663)) >>> 0;
        x = (x ^ (x >>> 13)) >>> 0;
        on = (x % 100) < 46;
      }
      if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
    }
  }
  return (
    <svg className="qr" viewBox={`0 0 ${N} ${N}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="Deposit address QR code">
      <rect width={N} height={N} fill="#fff" />
      <g fill="#0F172A">{cells}</g>
    </svg>
  );
}

// Multi-step flow stepper — vertical sidebar on desktop, compact dots on mobile.
function FlowShell({ steps, current, children }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) {
    return (
      <div>
        <div className="flow-mobile-bar">
          {steps.map((label, i) => (
            <span key={label + i} className={`flow-mobile-dot ${i < current ? "done" : i === current ? "active" : ""}`} />
          ))}
          <span className="flow-mobile-label">{steps[Math.min(current, steps.length - 1)]}</span>
        </div>
        <div className="flow-content">{children}</div>
      </div>
    );
  }
  return (
    <div className="flow-shell">
      <div className="flow-steps">
        {steps.map((label, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <React.Fragment key={label + i}>
              {i > 0 && <div className="flow-step-connector" />}
              <div className={`flow-step ${state}`}>
                <div className="flow-step-dot">{state === "done" ? <Icon.check /> : i + 1}</div>
                <div className="flow-step-lbl">{label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flow-content">{children}</div>
    </div>
  );
}

// Bottom sheet on mobile, centered modal on desktop — same API either way.
function Sheet({ open, onClose, title, children }) {
  const isDesktop = useIsDesktop();
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className={`sheet ${isDesktop ? "sheet-modal" : "sheet-bottom"}`} onClick={(e) => e.stopPropagation()}>
        {!isDesktop && <div className="sheet-handle" />}
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="sheet-close" onClick={onClose} aria-label="Close"><XIcon style={{ width: 14, height: 14 }} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function Pill({ tone = "neutral", children }) {
  return <span className={`pill ${tone}`}><span className="dot" />{children}</span>;
}

// Table on desktop, card list on mobile — one dataset, two renderings.
function Records({ title, txns, onRowClick, emptyHint, onViewAll }) {
  const isDesktop = useIsDesktop();
  return (
    <div className="records-card">
      <div className="records-head">
        <h2>{title}</h2>
        <div className="records-head-right">
          <span className="meta">Showing {txns.length}</span>
          {onViewAll && <a className="records-viewall" onClick={onViewAll}>View all →</a>}
        </div>
      </div>
      {txns.length === 0 ? (
        <div className="empty">
          <div className="ic"><Icon.list /></div>
          <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500, marginBottom: 4 }}>No activity yet</div>
          <div style={{ fontSize: 12.5, maxWidth: 320, margin: "0 auto" }}>{emptyHint}</div>
        </div>
      ) : isDesktop ? (
        <table className="records-table">
          <thead><tr>
            <th>Counterparty</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Status</th>
            <th className="num">Amount</th>
          </tr></thead>
          <tbody>
            {txns.map(tx => {
              const isIn = tx.direction === "in";
              const ref = tx.ref.length > 22 ? tx.ref.slice(0, 22) + "…" : tx.ref;
              return (
                <tr key={tx.id} onClick={() => onRowClick && onRowClick(tx)}>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--gray-900)" }}>{tx.party}</div>
                    <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{displayActivityLabel(tx.activityType) || tx.type}{tx.from ? ` · From ${tx.from}` : ""}</div>
                  </td>
                  <td title={tx.ref}>{ref}</td>
                  <td style={{ color: "var(--gray-600)", fontSize: 12.5 }}>{tx.date}</td>
                  <td><Pill tone={tx.pillTone}>{tx.status}</Pill></td>
                  <td className="num">
                    <span className={isIn ? "dir-in" : "dir-out"} style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {isIn ? "+" : "−"}{tx.amount} <span style={{ color: "var(--gray-600)", fontWeight: 500, fontSize: 12 }}>{tx.ccy}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="records-list">
          {txns.map(tx => {
            const isIn = tx.direction === "in";
            return (
              <div key={tx.id} className="records-row" onClick={() => onRowClick && onRowClick(tx)}>
                <div className={`ic ${isIn ? "in" : "out"}`}>
                  {isIn ? <Icon.arrowDownLeft /> : <Icon.arrowUpRight />}
                  {tx.pillTone === "warn" && <span className="ic-dot" />}
                  {tx.pillTone === "danger" && <span className="ic-badge" aria-label="Failed" />}
                </div>
                <div className="mid">
                  <div className="party">{tx.party}</div>
                  <div className="sub">{tx.date} · {tx.status}</div>
                </div>
                <div className="amt">
                  <div className={`n ${isIn ? "in" : "out"}`}>{isIn ? "+" : "−"}{tx.amount}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{tx.ccy}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CopyInline({ value, onCopy }) {
  const click = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(value).catch(() => {});
    onCopy && onCopy(value);
  };
  return <button className="copyinline" onClick={click} title="Copy"><Icon.copy /></button>;
}

function TimingChip({ tone, label }) {
  return <span className={`timechip ${tone || ""}`}><Icon.clock /> {label}</span>;
}

// tone: "info" | "warn" | "danger" | "success" | "neutral"
function Banner({ tone = "neutral", icon, title, children }) {
  return (
    <div className={`banner ${tone} ${title ? "" : "banner-notitle"}`}>
      <div className="icw">{icon}</div>
      <div className="body">
        {title && <div className="ttl">{title}</div>}
        <div className="copy">{children}</div>
      </div>
    </div>
  );
}

// Centered icon + title + description block — used for empty/apply/waiting states.
function StatusPanel({ iconBg, iconColor, icon, title, desc, children }) {
  return (
    <div className="status-panel">
      <div className="status-panel-ic" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="status-panel-title">{title}</div>
      {desc && <div className="status-panel-desc">{desc}</div>}
      {children}
    </div>
  );
}

// Error-code → friendly-copy registry — empty for now, deliberately. We have no visibility into
// which backend error actually occurred in a way we could act on (nothing logs it anywhere we'd
// see it to follow up), so promising "we'll reach out to you" would be a promise we can't keep.
// Every error, whatever the code, gets the same honest message: something went wrong, and it's on
// the business to reach out to us — not the other way round — plus a retry. Add a real entry here
// only once a specific error becomes something we can reliably detect and act on ourselves.
const ERROR_REGISTRY = {};

function ErrorPanel({ code, onRetry }) {
  const known = ERROR_REGISTRY[code];
  const title = known ? known.title : "Something went wrong";
  const desc = known ? known.desc : "Please try again, or reach out to your dedicated account team and we'll help resolve it.";
  return (
    <StatusPanel iconBg="var(--danger-100)" iconColor="var(--danger-700)" icon={<Icon.alert />} title={title} desc={desc}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {onRetry && <button className="btn btn-lg" onClick={onRetry}><Icon.refresh /> Try again</button>}
        <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-soft">Message your account manager</a>
      </div>
    </StatusPanel>
  );
}

// 2-col grid on desktop, stacked single column on mobile.
function FieldGrid({ fields, onCopy }) {
  const isDesktop = useIsDesktop();
  return (
    <div className={`field-grid ${isDesktop ? "" : "field-grid-mobile"}`}>
      {fields.map((f) => (
        <div key={f.k} className="field-item">
          <div className="field-k">{f.k}</div>
          <div className="field-v">
            <span>{f.v}</span>
            {f.copy && <CopyInline value={f.v} onCopy={onCopy} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// 3-col fee/timeline cards on desktop, stacked on mobile.
// A limit is `{ usd, local }`, or an array of them when a currency has more than one kind of cap
// (NGN has per-transaction *and* daily; everything else is per-transaction only). Every limit is
// held in USD, so `usd` leads; `local` is an approximate conversion for orientation, marked "≈"
// because it drifts with FX, and omitted for USD itself. `null` means the limit doesn't apply —
// NGN has no first-party limit at all.
function LimitValue({ v }) {
  if (!v) return <span className="fee-limit-none">No limits apply</span>;
  const rows = Array.isArray(v) ? v : [v];
  return (
    <span className={rows.length > 1 ? "fee-limit-lines" : null}>
      {rows.map(r => (
        <span key={r.label || "one"}>
          {r.usd}{r.local ? <em> (≈ {r.local})</em> : null} <span className="lbl">{r.label || "per transaction"}</span>
        </span>
      ))}
    </span>
  );
}

// Limits sit at the currency level, not the rail level — they're identical across a currency's
// rails, so repeating them per card was pure noise. Rails carry fee + timeline only.
function FeeGrid({ fees, limits, onAbout, onSeeAll, aboutLabel = "About deposit limits" }) {
  const isDesktop = useIsDesktop();
  return (
    <div className="fee-section">
      <div className="fee-section-label">Fees & timelines by payment method</div>
      <div className={`fee-grid ${isDesktop ? "" : "fee-grid-mobile"}`}>
        {fees.map(r => (
          <div key={r.rail} className="fee-card">
            <div className="fee-rail">{r.rail}</div>
            <div className="fee-line">Fee: <span>{r.fee}</span></div>
            <div className="fee-line">Arrives: <span>{r.timing}</span></div>
            {r.note && <div className="fee-note"><Icon.info /><span>{r.note}</span></div>}
          </div>
        ))}
      </div>

      {limits && (
        <div className="fee-limits">
          <div className="fee-section-label" style={{ marginBottom: 10 }}>Deposit limits</div>
          <div className="fee-limit-row">
            <div className="k">From your own account</div>
            <div className="v"><LimitValue v={limits.first} /></div>
          </div>
          <div className="fee-limit-row">
            <div className="k">From anyone else</div>
            <div className="v"><LimitValue v={limits.third} /></div>
          </div>
        </div>
      )}

      {(onAbout || onSeeAll) && (
        <div className="fee-links">
          {onAbout && <a className="fee-about" onClick={onAbout}>{aboutLabel} <Icon.arrowRight /></a>}
          {onSeeAll && <a className="fee-about" onClick={onSeeAll}>See all limits <Icon.arrowRight /></a>}
        </div>
      )}
    </div>
  );
}

// Horizontal tabs — wraps and scrolls on mobile instead of overflowing.
function RailTabs({ tabs, active, onChange }) {
  return (
    <div className="rail-tabs">
      {tabs.map((t, i) => (
        <button key={t.id} className={`rail-tab ${i === active ? "on" : ""}`} onClick={() => onChange(i)}>{t.name}</button>
      ))}
    </div>
  );
}

// Labeled select used in list filter bars (recipients, transactions).
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="tx-filtergroup">
      <div className="lbl">{label}</div>
      <div className="tx-select-wrap">
        <select className="tx-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
        </select>
        <Icon.arrowDown />
      </div>
    </div>
  );
}

const FilterIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

// Search + filter controls, driven by a `filters` array: [{ key, label, value, onChange, options: [{v,t}] }].
// Desktop lays each out inline as a FilterSelect dropdown (room to spare). Mobile collapses them behind
// one icon button (a badge shows how many are active) opening a Sheet — where options render as tappable
// pills, NOT native <select>s, since native select popups misposition badly inside a fixed bottom sheet.
function FilterBar({ searchValue, onSearchChange, searchPlaceholder, filters = [], activeCount = 0, onClear }) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const hasFilters = filters.length > 0;

  const search = (
    <div className="tx-search">
      <Icon.search />
      <input value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} />
    </div>
  );

  if (isDesktop) {
    return (
      <div className="tx-filterbar">
        {search}
        {filters.map(f => <FilterSelect key={f.key} label={f.label} value={f.value} onChange={f.onChange} options={f.options} />)}
        {activeCount > 0 && <button className="tx-clearfilters" onClick={onClear}>Clear filters</button>}
      </div>
    );
  }

  return (
    <>
      <div className="tx-filterbar tx-filterbar-mobile">
        {search}
        {hasFilters && (
          <button className="filter-fab" onClick={() => setOpen(true)} aria-label="Filters">
            <FilterIcon />
            {activeCount > 0 && <span className="filter-fab-badge">{activeCount}</span>}
          </button>
        )}
      </div>
      {hasFilters && (
        <Sheet open={open} onClose={() => setOpen(false)} title="Filters">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {filters.map(f => (
              <div key={f.key} className="filter-group">
                <div className="filter-group-lbl">{f.label}</div>
                <div className="filter-pills">
                  {f.options.map(o => (
                    <button key={o.v} className={`filter-pill ${f.value === o.v ? "on" : ""}`} onClick={() => f.onChange(o.v)}>{o.t}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {activeCount > 0 && (
            <button className="btn btn-ghost" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} onClick={() => { onClear(); setOpen(false); }}>
              Clear filters
            </button>
          )}
        </Sheet>
      )}
    </>
  );
}

function Toast({ msg, onDone }) {
  const isDesktop = useIsDesktop();
  useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }, [msg]);
  return <div className={`toast ${isDesktop ? "" : "toast-mobile"}`}><Icon.check /> {msg}</div>;
}

window.OBPrimitives = {
  useIsDesktop, CcyFlag, Flag, Page, QrCode, FlowShell, Sheet, Records, Pill, CopyInline, TimingChip,
  Banner, StatusPanel, FieldGrid, FeeGrid, RailTabs, FilterSelect, FilterBar, Toast, shortRef, truncateMiddle, XIcon,
  TALLY_URL, APPLY_URL, DEMO_URL, CONSUMER_APP_LINKS, SALES_CALL_URL, isDemoMode, withDemoUtm, DemoCta, ErrorPanel,
  ROLES, ROLE_LABEL, can, NoAccess, NoAccessNote,
};
