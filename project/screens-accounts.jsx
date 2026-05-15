/* global React */
const { useState, useMemo } = React;
const Icon = window.OBIcon;
const { CURRENCIES, ACCOUNTS_A, TXNS, RAILS_REF, RAILS_NAMED, STABLECOIN_CHAINS, WAITLIST_CURRENCIES } = window.OBData;

// =====================================================
// Atoms used across account screens
// =====================================================
function CcyFlag({ code, size = 32 }) {
  const meta = CURRENCIES[code];
  const flag = meta?.flag || "us";
  return (
    <div className="ccy-flag" style={{width: size, height: size, backgroundImage: `url(design-system/assets/flags/${flag}.svg)`}} />
  );
}

function Pill({ tone = "neutral", children }) {
  return <span className={`pill ${tone}`}><span className="dot" />{children}</span>;
}

function Toast({ msg, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }, [msg]);
  return <div className="toast"><Icon.check /> {msg}</div>;
}

function CopyField({ value, big = false, highlight = false, onCopy }) {
  const click = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(value).catch(()=>{});
    onCopy && onCopy(value);
  };
  return (
      <div className={`copyfield ${big ? "lg" : ""} ${highlight ? "highlight" : ""}`}>
      <div className="v">{value}</div>
      <button className="copybtn" onClick={click} title="Copy"><Icon.copy /></button>
    </div>
  );
}

function CopyInline({ value, onCopy }) {
  const click = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(value).catch(()=>{});
    onCopy && onCopy(value);
  };
  return <button className="copyinline" onClick={click} title="Copy"><Icon.copy /></button>;
}

// Direction icon for tx tables
function TxRowDir({ tx }) {
  const isIn = tx.direction === "in";
  return (
    <div className="dir-cell">
      <span className={`dir-ic ${isIn ? "in" : "out"}`}>
        {isIn ? <Icon.arrowDownLeft /> : <Icon.arrowUpRight />}
      </span>
      <div className="meta">
        <div className="t">{tx.party}</div>
        <div className="s">{tx.type}{tx.from ? ` · From ${tx.from}` : ""}</div>
      </div>
    </div>
  );
}

function TxAmount({ tx }) {
  const isIn = tx.direction === "in";
  return (
    <div style={{textAlign:"right"}}>
      <div className={isIn ? "dir-in" : "dir-out"} style={{fontWeight:600, fontVariantNumeric:"tabular-nums", fontSize:13.5}}>
        {isIn ? "+" : "−"}{tx.amount} <span style={{color:"var(--gray-600)", fontWeight:500, fontSize:12, marginLeft:4}}>{tx.ccy}</span>
      </div>
    </div>
  );
}

function TimingChip({ tone, label }) {
  return <span className={`timechip ${tone || ""}`}><Icon.clock /> {label}</span>;
}

// =====================================================
// KYB banner — used on the dashboard
// =====================================================
function KybBanner({ status, onSubmitKyb }) {
  if (status === "approved") return null;

  if (status === "not_submitted") {
    return (
      <div className="banner warn">
        <div className="icw"><Icon.shield /></div>
        <div className="body">
          <div className="ttl">Verify your business to start making payments</div>
          <div className="copy">Funding and payouts are paused until your KYB is approved. The form takes about 8 minutes.</div>
          <div className="actions">
            <button className="btn btn-sm" onClick={onSubmitKyb}>Start KYB <Icon.external /></button>
            <button className="btn btn-sm btn-ghost">What we&rsquo;ll ask for</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "submitted" || status === "in_review") {
    return (
      <div className="banner info">
        <div className="icw"><Icon.clock /></div>
        <div className="body">
          <div className="ttl">KYB under review</div>
          <div className="copy">
            Our compliance team is reviewing your documents — usually 1–2 business days. We may reach out if we need anything else.
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="banner danger">
        <div className="icw"><Icon.alert /></div>
        <div className="body">
          <div className="ttl">KYB couldn&rsquo;t be approved</div>
          <div className="copy">We weren&rsquo;t able to verify your business. If you think this is a mistake, reach out to <strong>compliance@onboard.xyz</strong>.</div>
        </div>
      </div>
    );
  }
  return null;
}

// =====================================================
// Dashboard — Accounts overview
// =====================================================
const V0_ACCOUNTS = [
  { code: "USD", balance: "84,231.50", status: "active", lastUpdated: "2 min ago", hint: "Wire · ACH · USDC · USDT" },
  { code: "REQUEST", balance: null, status: "not_created" },
];

function AccountsDashboard({ kybStatus, accountsMode = "v0", onOpenCurrency, onSubmitKyb, onSendPayment, onCreateAccount, onToast, dataState = "full" }) {
  const isApproved = kybStatus === "approved";
  const isEmpty = dataState === "empty";
  const isV0 = accountsMode === "v0";
  const [addOpen, setAddOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const baseAccounts = isV0 ? V0_ACCOUNTS : ACCOUNTS_A;
  const accounts = isEmpty
    ? baseAccounts.map(a => ({ ...a, status: a.code === "REQUEST" ? "not_created" : "not_created", balance: "0.00" }))
    : baseAccounts;
  const totalUsd = isEmpty ? "0.00" : isV0 ? "84,231.50" : "106,361.70";
  const totalLabel = isV0 ? "Total balance" : "Total balance · approx";
  const recentTxns = isEmpty ? [] : TXNS.slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Accounts</h1>
          <p className="subtitle">
            {isApproved
              ? "Funding balances and recent activity across Acme Trading Co."
              : "Your accounts unlock as soon as we verify your business."}
          </p>
        </div>
        {isApproved && (
          <div style={{display:"flex", gap:8}}>
            <button className="btn btn-soft"><Icon.refresh /> Refresh</button>
            <button className="btn" onClick={onSendPayment}><Icon.paperplane /> Send payment</button>
          </div>
        )}
      </div>

      <KybBanner status={kybStatus} onSubmitKyb={onSubmitKyb} />

      {!isApproved
        ? <DashboardLockedState status={kybStatus} onSubmitKyb={onSubmitKyb} />
        : (
          <>
            {/* Total + currency tiles */}
            <div className="card" style={{marginBottom: 22, padding: "28px 32px"}}>
              <div className="row between" style={{marginBottom: 28, alignItems: "flex-end"}}>
                <div>
                  <div style={{fontSize:11.5, fontWeight:700, letterSpacing:"0.06em", color:"var(--gray-600)", textTransform:"uppercase", marginBottom: 10}}>
                    {totalLabel}
                  </div>
                  <div style={{fontSize: 38, fontWeight: 600, color:"var(--gray-900)", fontVariantNumeric:"tabular-nums", letterSpacing:"-0.015em", lineHeight:1}}>
                    ${totalUsd} <span style={{fontSize: 15, color:"var(--gray-600)", fontWeight: 500, marginLeft: 6}}>USD</span>
                  </div>
                </div>
                <div style={{textAlign:"right", fontSize: 12, color:"var(--gray-600)"}}>
                  <div style={{display:"inline-flex", alignItems:"center", gap:6}}>
                    <span style={{width:6, height:6, borderRadius:999, background:"#22C55E"}} />
                    Last updated 2 minutes ago
                  </div>
                  <div style={{marginTop: 4}}>FX rates from open of business · indicative</div>
                </div>
              </div>

              <div className="grid-4">
                {accounts.map((a) => (
                  <CurrencyTile key={a.code} acct={a}
                    isV0={isV0}
                    onOpen={() => onOpenCurrency(a.code)}
                    onCreate={() => isV0 ? setRequestOpen(true) : setAddOpen(true)} />
                ))}
              </div>
            </div>

            <RecentTransactions txns={recentTxns} onRowClick={() => onToast("Transaction details — phase 2")} />
          </>
        )}
      {addOpen && <AddCurrencyModal onClose={() => setAddOpen(false)} onDone={(c) => { setAddOpen(false); onToast && onToast(`${c} account opened`); }} />}
      {requestOpen && <RequestCurrenciesModal onClose={() => setRequestOpen(false)} onDone={(ccys) => { setRequestOpen(false); onToast && onToast(`Request sent for ${ccys.join(", ")}`); }} />}
    </div>
  );
}

function DashboardLockedState({ status, onSubmitKyb }) {
  const isPending = status === "submitted" || status === "in_review";
  return (
    <div className="card" style={{padding: 0}}>
      <div style={{padding: "56px 32px 60px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center"}}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: isPending ? "var(--info-100)" : "#FFF6E5",
          color: isPending ? "var(--info-700)" : "#A16207",
          display: "grid", placeItems: "center", marginBottom: 18,
        }}>
          {isPending ? <Icon.clock style={{width: 26, height: 26}} /> : <Icon.shield style={{width: 26, height: 26}} />}
        </div>
        <div style={{fontSize: 18, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6}}>
          {isPending
            ? "Your accounts are almost ready"
            : status === "rejected"
              ? "Verification couldn\u2019t be completed"
              : "Verify your business to open accounts"}
        </div>
        <div style={{fontSize: 13.5, color: "var(--gray-600)", maxWidth: 460, lineHeight: 1.6, marginBottom: 22}}>
          {isPending
            ? "Our compliance team is reviewing your documents \u2014 usually 1\u20132 business days. We may reach out if we need anything else."
            : status === "rejected"
              ? <>We weren&rsquo;t able to verify your business. If you think this is a mistake, reach out to <strong>compliance@onboard.xyz</strong>.</>
              : "USD, GBP and EUR accounts open the moment your KYB is approved \u2014 usually within 1\u20132 business days."}
        </div>
        {!isPending && status !== "rejected" && (
          <button className="btn" onClick={onSubmitKyb}>
            Start KYB <Icon.external />
          </button>
        )}
      </div>

      {/* Decorative locked tiles preview */}
      <div style={{padding: "0 24px 28px"}}>
        <div className="grid-3" style={{opacity: 0.55, pointerEvents: "none"}}>
          {["USD","GBP","EUR"].map((c) => (
            <div key={c} className="ccy-tile" style={{cursor: "default", filter: "grayscale(0.4)"}}>
              <div className="head">
                <div className="meta"><div className="name">{c}</div></div>
                <CcyFlag code={c} />
              </div>
              <div className="bal" style={{color:"var(--gray-400)"}}>—</div>
              <div className="foot">Pending verification</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrencyTile({ acct, onOpen, onCreate, isV0 = false }) {
  if (acct.status === "not_created") {
    return (
      <div className="ccy-tile empty-state" onClick={onCreate} role="button" tabIndex={0}>
        <div className="add-icon"><Icon.plus /></div>
        <div className="add-label">{isV0 ? "Request other currencies" : "Add currency"}</div>
        <div className="add-sub">{isV0 ? "GBP, EUR, NGN and more" : "Open a new funding account"}</div>
      </div>
    );
  }
  if (acct.status === "pending") {
    return (
      <div className="ccy-tile pending" onClick={onOpen} role="button" tabIndex={0}>
        <div className="open-arrow"><Icon.arrowRight /></div>
        <div className="head">
          <div className="meta"><div className="name">{acct.code}</div></div>
          <CcyFlag code={acct.code} />
        </div>
        <div className="bal"><span className="pending-pulse"></span>Opening in progress</div>
      </div>
    );
  }
  const meta = CURRENCIES[acct.code];
  return (
    <div className="ccy-tile" onClick={onOpen} role="button" tabIndex={0}>
      <div className="open-arrow"><Icon.arrowRight /></div>
      <div className="head">
        <div className="meta">
          <div className="name">{acct.code}</div>
        </div>
        <CcyFlag code={acct.code} />
      </div>
      <div className="bal">
        <span className="ccy-symbol">{meta.symbol}</span>{acct.balance}
      </div>
      <div className="foot">{acct.hint}</div>
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap: 12, padding: "10px 12px",
      borderRadius: 8, cursor: "pointer", marginLeft: -12, marginRight: -12,
      transition: "background-color .12s ease",
    }}
    onMouseEnter={(e)=> e.currentTarget.style.background = "#F4F8FB"}
    onMouseLeave={(e)=> e.currentTarget.style.background = "transparent"}>
      <div style={{width: 34, height: 34, borderRadius: 8, background: "var(--info-100)", color: "var(--info-700)", display:"grid", placeItems:"center"}}>
        {icon}
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 13, fontWeight: 500, color:"var(--gray-900)"}}>{label}</div>
        <div style={{fontSize: 11.5, color:"var(--gray-600)"}}>{desc}</div>
      </div>
      <Icon.arrowRight />
    </div>
  );
}

function MonthRow({ label, value, sub }) {
  return (
    <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize: 12, color:"var(--gray-600)"}}>{label}</div>
        <div style={{fontSize: 11, color:"var(--gray-500)"}}>{sub}</div>
      </div>
      <div style={{fontSize: 16, fontWeight: 600, color:"var(--gray-900)", fontVariantNumeric:"tabular-nums"}}>{value}</div>
    </div>
  );
}

// =====================================================
// Recent transactions table
// =====================================================
function RecentTransactions({ txns, title = "Recent activity", onRowClick, dense = true, emptyHint }) {
  return (
    <div className="tablecard">
      <div className="head">
        <h2>{title}</h2>
        <div className="row" style={{gap: 8}}>
          <span className="meta">Showing {txns.length}</span>
          <a style={{fontSize: 12, color:"var(--info-700)", cursor:"pointer", fontWeight:500}}>View all →</a>
        </div>
      </div>
      {txns.length === 0 ? (
        <div className="empty" style={{padding: "48px 16px"}}>
          <div className="ic"><Icon.list /></div>
          <div style={{fontSize: 14, color: "var(--gray-900)", fontWeight: 500, marginBottom: 4}}>No activity yet</div>
          <div style={{fontSize: 12.5, maxWidth: 360, margin: "0 auto"}}>
            {emptyHint || "Money movements will appear here once your first payment lands or settles."}
          </div>
        </div>
      ) : (
        <table className="t">
          <thead><tr>
            <th>Counterparty</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Status</th>
            <th className="num">Amount</th>
          </tr></thead>
          <tbody>
            {txns.map((tx) => (
              <tr key={tx.id} onClick={onRowClick}>
                <td><TxRowDir tx={tx} /></td>
                <td className="mono">{tx.ref}</td>
                <td style={{color:"var(--gray-600)", fontSize: 12.5}}>{tx.date}</td>
                <td><Pill tone={tx.pillTone}>{tx.status}</Pill></td>
                <td className="num"><TxAmount tx={tx} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// =====================================================
// Per-currency detail page — Version A: REFERENCE-BASED
// =====================================================
function CurrencyDetailRefBased({ code, onBack, onToast, kybApproved = true, accountsMode = "ref", fiatIssuance = "ready" }) {
  const meta = CURRENCIES[code];
  const acct = ACCOUNTS_A.find(a => a.code === code);
  if (acct && acct.status === "pending") return <CurrencyPendingState code={code} onBack={onBack} hint={acct.hint} />;
  const isV0 = accountsMode === "v0";

  // V0 balance (USD only)
  const v0Acct = isV0 ? V0_ACCOUNTS.find(a => a.code === "USD") : null;
  const balance = isV0 ? (v0Acct?.balance || "0.00") : (acct?.balance || "0.00");

  const rails = RAILS_REF[code] || [];
  const ccyTxns = TXNS.filter(t => t.ccy === code || t.from === code).slice(0, 8);

  // Build tab list for v0 (stablecoins first)
  const v0Tabs = [
    { id: "usdc", name: "USDC", type: "stablecoin", coin: "USDC" },
    { id: "usdt", name: "USDT", type: "stablecoin", coin: "USDT" },
    ...(fiatIssuance === "not_requested"
      ? [{ id: "fiat-request", name: "Wire · ACH · SWIFT", type: "fiat-request" }]
      : fiatIssuance === "in_progress"
        ? rails.map(r => ({ ...r, type: "fiat-pending" }))
        : rails.map(r => ({ ...r, type: "fiat" }))
    ),
  ];

  const tabs = isV0 ? v0Tabs : null;
  const [activeRail, setActiveRail] = useState(0);
  const rail = rails[activeRail];
  const activeTab = tabs ? tabs[activeRail] : null;

  if (!kybApproved) return <CurrencyLockedState code={code} onBack={onBack} />;

  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Back to Accounts</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{code} · {meta.name}</span>
      </div>

      <div className="page-head">
        <div className="row" style={{gap: 14}}>
          <CcyFlag code={code} size={44} />
          <div>
            <h1 className="title">{code} · {meta.name}</h1>
            <p className="subtitle">
              {isV0
                ? "Fund your USD balance via stablecoins or bank transfer"
                : "Funding into your shared USD account · receive with reference"}
            </p>
          </div>
        </div>
        <button className="btn">Send {code}</button>
      </div>

      {/* Balance card */}
      <div className="card" style={{marginBottom: 22, padding: "30px 32px"}}>
        <div className="row between" style={{alignItems: "flex-start", gap: 32}}>
          <div>
            <div style={{fontSize:11.5, fontWeight:700, letterSpacing:"0.06em", color:"var(--gray-600)", textTransform:"uppercase", marginBottom: 10}}>
              Available balance
            </div>
            <div style={{fontSize: 38, fontWeight: 600, color:"var(--gray-900)", fontVariantNumeric:"tabular-nums", letterSpacing:"-0.015em", lineHeight: 1}}>
              <span style={{fontWeight: 500}}>{meta.symbol}</span>{balance}<span style={{fontSize: 16, color:"var(--gray-600)", fontWeight: 500, marginLeft: 6}}>{code}</span>
            </div>
            <div style={{fontSize:12, color:"var(--gray-600)", marginTop: 12, display:"inline-flex", alignItems:"center", gap:6}}>
              <span style={{width:6, height:6, borderRadius:999, background:"#22C55E"}} />
              Last updated 2 minutes ago
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: 16, fontSize: 12.5, color: "var(--gray-600)", minWidth: 180}}>
            <div>
              <div style={{textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 11, color: "var(--gray-500)", marginBottom: 4}}>Pending in</div>
              <div style={{fontSize: 15, color:"var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums"}}>0.00<span style={{color:"var(--gray-500)", fontWeight: 400, fontSize: 12, marginLeft: 4}}>{code}</span></div>
            </div>
            <div>
              <div style={{textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 11, color: "var(--gray-500)", marginBottom: 4}}>Pending out</div>
              <div style={{fontSize: 15, color:"var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums"}}>1,250.00<span style={{color:"var(--gray-500)", fontWeight: 400, fontSize: 12, marginLeft: 4}}>{code}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Funding details — tabs per rail */}
      <div className="card" style={{marginBottom: 22, padding: 0, overflow: "hidden"}}>
        <div style={{padding: "22px 28px 0"}}>
          <div className="row between" style={{alignItems: "baseline", marginBottom: 18}}>
            <h2 style={{margin: 0, fontSize: 16, fontWeight: 600, color:"var(--gray-900)"}}>Fund this account</h2>
            <span style={{fontSize: 12.5, color:"var(--gray-600)"}}>Choose a method to view its instructions</span>
          </div>
          {isV0 ? (
            <div className="rail-tabs">
              {v0Tabs.map((t, i) => (
                <button key={t.id} className={`rail-tab ${i === activeRail ? "on" : ""}`} onClick={() => setActiveRail(i)}>
                  {t.name}
                </button>
              ))}
            </div>
          ) : rails.length > 1 && (
            <div className="rail-tabs">
              {rails.map((r, i) => (
                <button key={r.id} className={`rail-tab ${i === activeRail ? "on" : ""}`} onClick={() => setActiveRail(i)}>
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {isV0 && activeTab ? (
          activeTab.type === "stablecoin"
            ? <StablecoinRailPanel coin={activeTab.coin} onCopy={(v) => onToast(`Copied`)} />
            : activeTab.type === "fiat-request"
              ? <FiatRequestPanel onRequest={() => onToast("Fiat funding request sent — we'll be in touch")} />
              : activeTab.type === "fiat-pending"
                ? <FiatPendingPanel rail={activeTab} />
                : <RailRefPanel rail={activeTab} ccy={code} onCopy={(v) => onToast(`Copied ${v.length > 18 ? v.slice(0, 18) + "…" : v}`)} />
        ) : (
          rail && <RailRefPanel rail={rail} ccy={code} onCopy={(v) => onToast(`Copied ${v.length > 18 ? v.slice(0, 18) + "…" : v}`)} />
        )}
      </div>

      {/* Transactions */}
      <RecentTransactions title={`${code} activity`} txns={ccyTxns} onRowClick={() => onToast("Transaction details — phase 2")} />
    </div>
  );
}

function RailRefPanel({ rail, ccy, onCopy }) {
  return (
    <div style={{padding: "24px 28px 28px"}}>
      <div className="row between" style={{marginBottom: 18, gap: 12, flexWrap: "wrap"}}>
        <div style={{fontSize: 12.5, color:"var(--gray-700)", lineHeight: 1.55, flex: "1 1 auto", minWidth: 0, paddingRight: 16}}>
          {rail.desc}. Always include the reference code below — funds without a reference can be delayed 2–5 days.
        </div>
        <TimingChip tone={rail.timingTone} label={rail.timing} />
      </div>

      {/* Reference — prominent for this architecture */}
      <div style={{marginBottom: 22}}>
        <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-700)", textTransform: "uppercase", marginBottom: 10, display:"flex", alignItems:"center", gap: 8}}>
          Reference code · required
          <span className="pill purple" style={{padding:"2px 8px"}}><span className="dot" />Always include</span>
        </div>
        <CopyField value={rail.reference} big highlight onCopy={onCopy} />
      </div>

      <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-700)", textTransform: "uppercase", marginBottom: 4}}>
        Send to
      </div>
      <div className="def-list">
        {rail.fields.map((f, i) => (
          <div className="def-row" key={i}>
            <div className="k">{f.k}</div>
            <div className="v">{f.v}</div>
            <CopyInline value={f.v} onCopy={onCopy} />
          </div>
        ))}
      </div>

      <div className="row" style={{gap: 8, marginTop: 20}}>
        <button className="btn btn-soft btn-sm" onClick={() => {
          const lines = [`Reference: ${rail.reference}`, ...rail.fields.map(f => `${f.k}: ${f.v}`)].join("\n");
          if (navigator.clipboard) navigator.clipboard.writeText(lines).catch(()=>{});
          onCopy("all funding details");
        }}><Icon.copy /> Copy all details</button>
        <button className="btn btn-ghost btn-sm"><Icon.doc /> Download as PDF</button>
      </div>
    </div>
  );
}

// =====================================================
// Per-currency detail page — Version B: NAMED ACCOUNTS
// =====================================================
function CurrencyDetailNamedAccounts({ code, onBack, onToast, kybApproved = true }) {
  const meta = CURRENCIES[code];
  const acct = ACCOUNTS_A.find(a => a.code === code);
  if (acct && acct.status === "pending") return <CurrencyPendingState code={code} onBack={onBack} hint={acct.hint} />;
  const balance = acct?.balance || "0.00";
  const rails = RAILS_NAMED[code] || [];
  const ccyTxns = TXNS.filter(t => t.ccy === code || t.from === code).slice(0, 8);
  const [activeRail, setActiveRail] = useState(0);
  const rail = rails[activeRail];

  if (!kybApproved) return <CurrencyLockedState code={code} onBack={onBack} />;

  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Back to Accounts</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{code} · {meta.name}</span>
      </div>

      <div className="page-head">
        <div className="row" style={{gap: 14}}>
          <CcyFlag code={code} size={44} />
          <div>
            <h1 className="title">{code} · {meta.name}</h1>
            <p className="subtitle">Your dedicated {code} account at Acme Trading Co</p>
          </div>
        </div>
        <button className="btn">Send {code}</button>
      </div>

      {/* Balance card */}
      <div className="card" style={{marginBottom: 22, padding: "30px 32px"}}>
        <div className="row between" style={{alignItems: "flex-start", gap: 32}}>
          <div>
            <div style={{fontSize:11.5, fontWeight:700, letterSpacing:"0.06em", color:"var(--gray-600)", textTransform:"uppercase", marginBottom: 10}}>
              Available balance
            </div>
            <div style={{fontSize: 38, fontWeight: 600, color:"var(--gray-900)", fontVariantNumeric:"tabular-nums", letterSpacing:"-0.015em", lineHeight: 1}}>
              <span style={{fontWeight: 500}}>{meta.symbol}</span>{balance}<span style={{fontSize: 16, color:"var(--gray-600)", fontWeight: 500, marginLeft: 6}}>{code}</span>
            </div>
            <div style={{fontSize:12, color:"var(--gray-600)", marginTop: 12, display:"inline-flex", alignItems:"center", gap:6}}>
              <span style={{width:6, height:6, borderRadius:999, background:"#22C55E"}} />
              Last updated 2 minutes ago
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: 16, fontSize: 12.5, color: "var(--gray-600)", minWidth: 180}}>
            <div>
              <div style={{textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 11, color: "var(--gray-500)", marginBottom: 4}}>Pending in</div>
              <div style={{fontSize: 15, color:"var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums"}}>0.00<span style={{color:"var(--gray-500)", fontWeight: 400, fontSize: 12, marginLeft: 4}}>{code}</span></div>
            </div>
            <div>
              <div style={{textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 11, color: "var(--gray-500)", marginBottom: 4}}>Pending out</div>
              <div style={{fontSize: 15, color:"var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums"}}>1,250.00<span style={{color:"var(--gray-500)", fontWeight: 400, fontSize: 12, marginLeft: 4}}>{code}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Account details — tabs per rail */}
      <div className="card" style={{marginBottom: 22, padding: 0, overflow: "hidden"}}>
        <div style={{padding: "22px 28px 0"}}>
          <div className="row between" style={{alignItems: "baseline", marginBottom: 18}}>
            <h2 style={{margin: 0, fontSize: 16, fontWeight: 600, color:"var(--gray-900)"}}>Account details</h2>
            <span style={{fontSize: 12.5, color:"var(--gray-600)"}}>Receive {code} via any of these channels</span>
          </div>
          {rails.length > 1 && (
            <div className="rail-tabs">
              {rails.map((r, i) => (
                <button key={r.id} className={`rail-tab ${i === activeRail ? "on" : ""}`} onClick={() => setActiveRail(i)}>
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {rail && <RailNamedPanel rail={rail} ccy={code} onCopy={(v) => onToast(`Copied ${v.length > 18 ? v.slice(0, 18) + "…" : v}`)} />}
      </div>

      {/* Transactions */}
      <RecentTransactions title={`${code} activity`} txns={ccyTxns} onRowClick={() => onToast("Transaction details — phase 2")} />
    </div>
  );
}

function RailNamedPanel({ rail, ccy, onCopy }) {
  return (
    <div style={{padding: "24px 28px 28px"}}>
      <div className="row between" style={{marginBottom: 18, gap: 12, flexWrap: "wrap"}}>
        <div style={{fontSize: 12.5, color:"var(--gray-700)", lineHeight: 1.55, flex: "1 1 auto", minWidth: 0, paddingRight: 16}}>
          {rail.desc}. Senders pay this account directly — no reference code required.
        </div>
        <TimingChip tone={rail.timingTone} label={rail.timing} />
      </div>

      <div className="def-list">
        {rail.fields.map((f, i) => (
          <div className="def-row" key={i}>
            <div className="k">{f.k}</div>
            <div className="v">{f.v}</div>
            <CopyInline value={f.v} onCopy={onCopy} />
          </div>
        ))}
      </div>

      <div className="row" style={{gap: 8, marginTop: 20}}>
        <button className="btn btn-soft btn-sm" onClick={() => {
          const lines = rail.fields.map(f => `${f.k}: ${f.v}`).join("\n");
          if (navigator.clipboard) navigator.clipboard.writeText(lines).catch(()=>{});
          onCopy("all account details");
        }}><Icon.copy /> Copy all details</button>
        <button className="btn btn-ghost btn-sm"><Icon.doc /> Download as PDF</button>
      </div>
    </div>
  );
}

function CurrencyPendingState({ code, onBack, hint }) {
  const meta = CURRENCIES[code] || { name: code, country: "", flag: "us" };
  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Back to Accounts</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{code}</span>
      </div>
      <div className="page-head">
        <div className="row" style={{gap: 14}}>
          <CcyFlag code={code} size={44} />
          <div>
            <h1 className="title">{code} · {meta.name}</h1>
            <div className="sub">{meta.country}</div>
          </div>
        </div>
        <button className="btn" disabled style={{opacity: 0.5, cursor: "not-allowed"}}>{`Send ${code}`}</button>
      </div>

      <div className="card" style={{padding: "56px 32px", textAlign: "center", maxWidth: 560, marginInline: "auto"}}>
        <div className="addccy-success" style={{padding: 0}}>
          <div className="ic processing" style={{width: 64, height: 64}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width: 30, height: 30}}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/></svg>
          </div>
          <h3 style={{fontSize: 20}}>{`Opening your ${code} account`}</h3>
          <p style={{fontSize: 13.5}}>
            We&rsquo;re provisioning your {meta.name} account with our partner bank. Account details and inbound rails will appear here once ready — usually within a few minutes.
          </p>
          <div className="addccy-progress"><span></span></div>
          <div style={{fontSize: 12, color: "var(--gray-500)", marginTop: 14}}>
            {hint || "Provisioning"} · You&rsquo;ll receive an email when complete
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencyLockedState({ code, onBack }) {
  const meta = CURRENCIES[code];
  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Back to Accounts</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{code}</span>
      </div>
      <div className="card" style={{padding: "64px 32px", textAlign: "center"}}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "#FFF6E5", color: "#A16207",
          display: "grid", placeItems: "center", marginBottom: 18, marginInline: "auto",
        }}><Icon.shield style={{width: 26, height: 26}} /></div>
        <div style={{fontSize: 18, fontWeight: 600, color: "var(--gray-900)", marginBottom: 6}}>
          {code} account isn&rsquo;t open yet
        </div>
        <div style={{fontSize: 13.5, color: "var(--gray-600)", maxWidth: 440, lineHeight: 1.6, marginInline: "auto"}}>
          Your {meta.name} account opens once Onboard finishes verifying your business. We&rsquo;ll email you the moment it&rsquo;s ready.
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Add Currency Modal — pick → confirm → success
// =====================================================
const ADD_CCY_OPTIONS = [
  { code: "CAD", symbol: "$",  flag: "ca", name: "Canadian Dollar",   country: "Canada",          rails: "EFT · Wire", timing: "1–2 business days" },
  { code: "AUD", symbol: "$",  flag: "au", name: "Australian Dollar", country: "Australia",       rails: "BECS · OSKO",  timing: "Within minutes" },
  { code: "JPY", symbol: "¥",  flag: "jp", name: "Japanese Yen",      country: "Japan",           rails: "Zengin · SWIFT", timing: "1–2 business days" },
  { code: "CHF", symbol: "Fr", flag: "ch", name: "Swiss Franc",       country: "Switzerland",     rails: "SIC · SWIFT",  timing: "1–2 business days" },
  { code: "SGD", symbol: "$",  flag: "sg", name: "Singapore Dollar",  country: "Singapore",       rails: "FAST · MEPS+", timing: "Within minutes" },
  { code: "HKD", symbol: "$",  flag: "hk", name: "Hong Kong Dollar",  country: "Hong Kong SAR",   rails: "FPS · CHATS",  timing: "Within minutes" },
  { code: "AED", symbol: "د.إ",flag: "ae", name: "UAE Dirham",        country: "United Arab Emirates", rails: "UAEFTS · SWIFT", timing: "Same day" },
  { code: "ZAR", symbol: "R",  flag: "za", name: "South African Rand",country: "South Africa",    rails: "EFT · SWIFT",  timing: "1 business day" },
];

function AddCurrencyModal({ onClose, onDone }) {
  const [step, setStep] = useState(0); // 0 pick | 1 confirm | 2 success
  const [picked, setPicked] = useState(null);
  const [q, setQ] = useState("");
  const filtered = ADD_CCY_OPTIONS.filter(c =>
    !q || c.code.toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase()) || c.country.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="addccy-bg" onClick={onClose}>
      <div className="addccy" onClick={(e) => e.stopPropagation()}>
        <button className="addccy-x" onClick={onClose} aria-label="Close">×</button>
        {step === 0 && (
          <>
            <div className="addccy-head">
              <h3>Add a currency account</h3>
              <p>Open a new funding account to receive payments in another currency. Funds settle into a dedicated account for that currency.</p>
            </div>
            <div className="addccy-search">
              <Icon.search />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by currency, code, or country" autoFocus />
            </div>
            <div className="addccy-list">
              {filtered.map((c) => (
                <button key={c.code} className="addccy-opt" onClick={() => { setPicked(c); setStep(1); }}>
                  <span className="addccy-flag" style={{backgroundImage:`url(https://flagcdn.com/w80/${c.flag}.png)`}}></span>
                  <span className="meta">
                    <span className="t">{c.name}</span>
                    <span className="s">{c.rails}</span>
                  </span>
                  <Icon.arrowRight />
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="addccy-empty">No currencies match “{q}”.</div>
              )}
            </div>
            <div className="addccy-foot-note">
              Don&rsquo;t see what you need? <a href="#" onClick={(e)=>{e.preventDefault(); onClose();}}>Request a currency</a>
            </div>
          </>
        )}
        {step === 1 && picked && (
          <>
            <div className="addccy-head">
              <h3>{`Open a ${picked.code} account?`}</h3>
              <p>{`You'll get a dedicated ${picked.country} account number for receiving ${picked.name} (${picked.code}) payments.`}</p>
            </div>
            <div className="addccy-confirm">
              <div className="row">
                <span className="addccy-flag lg" style={{backgroundImage:`url(https://flagcdn.com/w80/${picked.flag}.png)`}}></span>
                <div>
                  <div className="t">{`${picked.name} · ${picked.code}`}</div>
                  <div className="s">{picked.country}</div>
                </div>
              </div>
              <div className="addccy-list-rows">
                <div><span>Receive via</span><strong>{picked.rails}</strong></div>
                <div><span>Settlement</span><strong>{picked.timing}</strong></div>
                <div><span>Setup fee</span><strong>Free</strong></div>
                <div><span>Monthly fee</span><strong>Free</strong></div>
              </div>
              <div className="addccy-tip">
                <Icon.info />
                <span>{`Account details typically appear within minutes. We'll email you when your ${picked.code} account is ready.`}</span>
              </div>
            </div>
            <div className="addccy-actions">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn" onClick={() => setStep(2)}>{`Open ${picked.code} account`}</button>
            </div>
          </>
        )}
        {step === 2 && picked && (
          <div className="addccy-success">
            <div className="ic processing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/></svg>
            </div>
            <h3>{`Opening your ${picked.code} account`}</h3>
            <p>{`We're provisioning your ${picked.name} account now. This usually takes a few minutes — we'll email you the moment account details are ready.`}</p>
            <div className="addccy-progress"><span></span></div>
            <div className="addccy-actions" style={{justifyContent:"center"}}>
              <button className="btn" onClick={() => onDone(picked.code)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Stablecoin rail panel (v0 only)
// =====================================================
function StablecoinRailPanel({ coin, onCopy }) {
  const chains = STABLECOIN_CHAINS[coin] || [];
  const [activeChain, setActiveChain] = useState(0);
  const chain = chains[activeChain];

  return (
    <div style={{padding: "24px 28px 28px"}}>
      <div style={{fontSize: 12.5, color:"var(--gray-700)", lineHeight: 1.55, marginBottom: 18}}>
        {coin === "USDC" ? "USD Coin (USDC) is a regulated stablecoin pegged 1:1 to USD." : "Tether (USDT) is a stablecoin pegged 1:1 to USD."} Send {coin} from any supported network below — your balance is credited in USD.
      </div>

      {/* Network selector */}
      <div style={{marginBottom: 20}}>
        <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-700)", textTransform: "uppercase", marginBottom: 10}}>
          Network
        </div>
        <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
          {chains.map((c, i) => (
            <button key={c.id}
              onClick={() => setActiveChain(i)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: i === activeChain ? "1.5px solid var(--info-600)" : "1.5px solid var(--gray-200)",
                background: i === activeChain ? "var(--info-50)" : "#fff",
                color: i === activeChain ? "var(--info-700)" : "var(--gray-700)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
              {c.name}
              <span style={{marginLeft: 6, fontSize: 11, opacity: 0.75, fontWeight: 400}}>({c.short})</span>
            </button>
          ))}
        </div>
      </div>

      {chain && (
        <>
          <div style={{marginBottom: 20}}>
            <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-700)", textTransform: "uppercase", marginBottom: 10}}>
              Deposit address · {chain.name}
            </div>
            <CopyField value={chain.address} big highlight onCopy={onCopy} />
          </div>

          <div className="def-list" style={{marginBottom: 20}}>
            <div className="def-row">
              <div className="k">Minimum deposit</div>
              <div className="v">{chain.min} {coin}</div>
              <div style={{width: 28}} />
            </div>
            <div className="def-row">
              <div className="k">Expected arrival</div>
              <div className="v">{chain.arrival}</div>
              <div style={{width: 28}} />
            </div>
          </div>

          <div className="banner info" style={{borderRadius: 8, padding: "12px 16px"}}>
            <div className="icw" style={{width: 20, height: 20}}><Icon.info /></div>
            <div className="body" style={{fontSize: 12.5}}>
              Only send {coin} on the <strong>{chain.name}</strong> network to this address. Sending on the wrong network will result in permanent loss of funds.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FiatRequestPanel({ onRequest }) {
  return (
    <div style={{padding: "32px 28px 36px", textAlign: "center"}}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "var(--info-50)", color: "var(--info-700)",
        display: "grid", placeItems: "center", marginBottom: 16, marginInline: "auto",
      }}>
        <Icon.bank style={{width: 24, height: 24}} />
      </div>
      <div style={{fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 8}}>
        Request fiat funding details
      </div>
      <div style={{fontSize: 13, color: "var(--gray-600)", maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6}}>
        Get dedicated Wire, ACH, and SWIFT account details issued through our banking partner. This usually takes 1–2 business days. We'll email you when ready and may reach out if we need anything else.
      </div>
      <button className="btn" onClick={onRequest}>
        <Icon.arrowRight /> Request fiat account details
      </button>
    </div>
  );
}

function FiatPendingPanel({ rail }) {
  return (
    <div style={{padding: "32px 28px 36px", textAlign: "center"}}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "#FFF6E5", color: "#A16207",
        display: "grid", placeItems: "center", marginBottom: 16, marginInline: "auto",
      }}>
        <Icon.clock style={{width: 24, height: 24}} />
      </div>
      <div style={{fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 8}}>
        {rail.name} details in progress
      </div>
      <div style={{fontSize: 13, color: "var(--gray-600)", maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6}}>
        We're provisioning your account details with our banking partner. We'll email you when ready, and may reach out if the partner needs anything else from you.
      </div>
      <div className="addccy-progress" style={{maxWidth: 320, margin: "0 auto"}}><span /></div>
    </div>
  );
}

// =====================================================
// Request Other Currencies Modal (v0)
// =====================================================
function RequestCurrenciesModal({ onClose, onDone }) {
  const [selected, setSelected] = useState([]);
  const [other, setOther] = useState("");
  const [volume, setVolume] = useState("");
  const [done, setDone] = useState(false);

  const toggle = (code) => setSelected(s => s.includes(code) ? s.filter(c => c !== code) : [...s, code]);

  if (done) {
    const names = selected.map(c => c);
    return (
      <div className="addccy-bg" onClick={onClose}>
        <div className="addccy" onClick={(e) => e.stopPropagation()}>
          <button className="addccy-x" onClick={onClose}>×</button>
          <div className="addccy-success">
            <div className="ic" style={{background: "var(--success-100)", color: "var(--success-700)"}}>
              <Icon.check style={{width: 26, height: 26}} />
            </div>
            <h3>Request received</h3>
            <p>We'll email you at <strong>finance@acmetrading.com</strong> when {names.length > 0 ? names.join(", ") : "these currencies"} {names.length === 1 ? "is" : "are"} available on Onboard.</p>
            <div className="addccy-actions" style={{justifyContent:"center"}}>
              <button className="btn" onClick={() => onDone(selected)}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="addccy-bg" onClick={onClose}>
      <div className="addccy" onClick={(e) => e.stopPropagation()}>
        <button className="addccy-x" onClick={onClose}>×</button>
        <div className="addccy-head">
          <h3>Request other currencies</h3>
          <p>Let us know which currencies you need. We'll prioritise based on demand and email you when they're available.</p>
        </div>

        <div style={{padding: "0 24px 8px"}}>
          <div style={{fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--gray-600)", textTransform: "uppercase", marginBottom: 12}}>
            Currencies
          </div>
          <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20}}>
            {WAITLIST_CURRENCIES.map((c) => {
              const on = selected.includes(c.code);
              return (
                <button key={c.code} onClick={() => toggle(c.code)} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "7px 14px", borderRadius: 8,
                  border: on ? "1.5px solid var(--info-600)" : "1.5px solid var(--gray-200)",
                  background: on ? "var(--info-50)" : "#fff",
                  color: on ? "var(--info-700)" : "var(--gray-700)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>
                  <span className="ccy-flag" style={{width: 18, height: 18, backgroundImage: `url(design-system/assets/flags/${c.flag}.svg)`, borderRadius: "50%", flexShrink: 0}} />
                  {c.code}
                  <span style={{fontSize: 11, opacity: 0.7, fontWeight: 400}}>{c.name}</span>
                </button>
              );
            })}
          </div>

          <div style={{marginBottom: 16}}>
            <label style={{fontSize: 12.5, fontWeight: 500, color: "var(--gray-700)", display: "block", marginBottom: 6}}>
              Other currencies (optional)
            </label>
            <input className="inp" placeholder="e.g. CNY, ZAR, MXN" value={other} onChange={(e) => setOther(e.target.value)} />
          </div>

          <div style={{marginBottom: 8}}>
            <label style={{fontSize: 12.5, fontWeight: 500, color: "var(--gray-700)", display: "block", marginBottom: 6}}>
              Expected monthly volume (optional)
            </label>
            <select className="inp" value={volume} onChange={(e) => setVolume(e.target.value)} style={{appearance: "auto"}}>
              <option value="">Select range</option>
              <option value="<10k">Under $10,000</option>
              <option value="10-50k">$10,000 – $50,000</option>
              <option value="50-250k">$50,000 – $250,000</option>
              <option value=">250k">Over $250,000</option>
            </select>
          </div>
        </div>

        <div className="addccy-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={selected.length === 0 && !other.trim()} onClick={() => setDone(true)}>
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}

window.OBAccounts = {
  AccountsDashboard,
  CurrencyDetailRefBased,
  CurrencyDetailNamedAccounts,
  Toast,
  // re-exports for other screens
  Pill,
  TxRowDir,
  TxAmount,
  CopyInline,
  CcyFlag,
};
