/* global React */
const { useState, useMemo } = React;
const Icon = window.OBIcon;
const NetworkIcon = window.OBNetworkIcon;
const { CURRENCIES, TXNS, FIAT_RAILS, STABLECOIN_CHAINS, WAITLIST_CURRENCIES } = window.OBData;

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

function AccountsDashboard({ kybStatus, onOpenCurrency, onSubmitKyb, onSendPayment, onCreateAccount, onToast, dataState = "full", accountSuspended = false }) {
  const isApproved = kybStatus === "approved";
  const isEmpty = dataState === "empty";
  const [requestOpen, setRequestOpen] = useState(false);

  const accounts = isEmpty
    ? V0_ACCOUNTS.map(a => a.code === "REQUEST" ? a : { ...a, balance: "0.00" })
    : V0_ACCOUNTS;
  const totalUsd = isEmpty ? "0.00" : "84,231.50";
  const totalLabel = "Total balance";
  const recentTxns = isEmpty ? [] : TXNS.slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Accounts</h1>
          <p className="subtitle">
            {isApproved
              ? "Funding balances and recent activity across Acme Trading Co."
              : "Complete verification to unlock your account and start making payments."}
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

      {accountSuspended && (
        <div className="banner danger">
          <div className="icw"><Icon.alert /></div>
          <div className="body">
            <div className="ttl">Account suspended</div>
            <div className="copy">Deposits and withdrawals are not supported while your account is suspended. Contact <strong>support@onboard.xyz</strong> to resolve this.</div>
          </div>
        </div>
      )}

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
                    onOpen={() => onOpenCurrency(a.code)}
                    onCreate={() => setRequestOpen(true)} />
                ))}
              </div>
            </div>

            <RecentTransactions txns={recentTxns} onRowClick={() => onToast("Transaction details — phase 2")} />
          </>
        )}
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
              : "Complete verification to unlock your account and start making payments \u2014 usually takes 1\u20132 business days."}
        </div>
        {!isPending && status !== "rejected" && (
          <button className="btn" onClick={onSubmitKyb}>
            Start KYB <Icon.external />
          </button>
        )}
      </div>

      {/* Decorative locked tile preview */}
      <div style={{padding: "0 24px 28px"}}>
        <div className="grid-3" style={{opacity: 0.55, pointerEvents: "none"}}>
          <div className="ccy-tile" style={{cursor: "default", filter: "grayscale(0.4)"}}>
            <div className="head">
              <div className="meta"><div className="name">USD</div></div>
              <CcyFlag code="USD" />
            </div>
            <div className="bal" style={{color:"var(--gray-400)"}}>—</div>
            <div className="foot">Pending verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencyTile({ acct, onOpen, onCreate }) {
  if (acct.status === "not_created") {
    return (
      <div className="ccy-tile empty-state" onClick={onCreate} role="button" tabIndex={0}>
        <div className="add-icon"><Icon.plus /></div>
        <div className="add-label">Request other currencies</div>
        <div className="add-sub">GBP, EUR, NGN and more</div>
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
// Per-currency detail page (USD only in v0)
// =====================================================
function CurrencyDetailPage({ code, onBack, onToast, kybApproved = true, fiatIssuance = "ready", accountSuspended = false }) {
  const meta = CURRENCIES[code];
  const balance = V0_ACCOUNTS.find(a => a.code === "USD")?.balance || "0.00";
  const ccyTxns = TXNS.filter(t => t.ccy === code || t.from === code).slice(0, 8);

  const tabs = [
    { id: "usdc", name: "USDC", type: "stablecoin", coin: "USDC" },
    { id: "usdt", name: "USDT", type: "stablecoin", coin: "USDT" },
    ...(fiatIssuance === "in_progress"
      ? FIAT_RAILS.map(r => ({ ...r, type: "fiat-pending" }))
      : FIAT_RAILS.map(r => ({ ...r, type: "fiat" }))
    ),
  ];

  const [activeRail, setActiveRail] = useState(0);
  const activeTab = tabs[activeRail];

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
            <p className="subtitle">Fund your USD balance via stablecoins or bank transfer</p>
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
      {accountSuspended ? (
        <div className="banner danger" style={{marginBottom: 22}}>
          <div className="icw"><Icon.alert /></div>
          <div className="body">
            <div className="ttl">Deposit details unavailable</div>
            <div className="copy">Deposits and withdrawals are not supported while your account is suspended. Contact support to resolve this.</div>
          </div>
        </div>
      ) : (
      <div className="card" style={{marginBottom: 22, padding: 0, overflow: "hidden"}}>
        <div style={{padding: "22px 28px 0"}}>
          <div className="row between" style={{alignItems: "baseline", marginBottom: 18}}>
            <h2 style={{margin: 0, fontSize: 16, fontWeight: 600, color:"var(--gray-900)"}}>Fund this account</h2>
            <span style={{fontSize: 12.5, color:"var(--gray-600)"}}>Choose a method to view its instructions</span>
          </div>
          <div className="rail-tabs">
            {tabs.map((t, i) => (
              <button key={t.id} className={`rail-tab ${i === activeRail ? "on" : ""}`} onClick={() => setActiveRail(i)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {activeTab && (
          activeTab.type === "stablecoin"
            ? <StablecoinRailPanel coin={activeTab.coin} onCopy={(v) => onToast(`Copied`)} />
            : activeTab.type === "fiat-pending"
              ? <FiatPendingPanel rail={activeTab} />
              : <FiatRailPanel rail={activeTab} ccy={code} onCopy={(v) => onToast(`Copied ${v.length > 18 ? v.slice(0, 18) + "…" : v}`)} />
        )}
      </div>
      )}

      {/* Transactions */}
      <RecentTransactions title={`${code} activity`} txns={ccyTxns} onRowClick={() => onToast("Transaction details — phase 2")} />
    </div>
  );
}

// =====================================================
// Fiat rail panel (named accounts — shown when fiat issuance is ready)
// =====================================================
function FiatRailPanel({ rail, ccy, onCopy }) {
  return (
    <div style={{padding: "24px 28px 28px"}}>
      <div className="row between" style={{marginBottom: 18, gap: 12, flexWrap: "wrap"}}>
        <div style={{fontSize: 12.5, color:"var(--gray-700)", lineHeight: 1.55, flex: "1 1 auto", minWidth: 0, paddingRight: 16}}>
          {rail.desc}. Senders pay this account directly — no reference code required.
        </div>
        <TimingChip tone={rail.timingTone} label={rail.timing} />
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20}}>
        {rail.fields.map((f, i) => (
          <div key={i} style={{minWidth: 0}}>
            <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>{f.k}</div>
            <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 6}}>
              <span style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{f.v}</span>
              <CopyInline value={f.v} onCopy={onCopy} />
            </div>
          </div>
        ))}
        <div>
          <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>Deposit fee</div>
          <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500}}>0.1% + $0.50</div>
        </div>
      </div>

      <div className="row" style={{gap: 8}}>
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
// Stablecoin rail panel
// =====================================================
function StablecoinRailPanel({ coin, onCopy }) {
  const chains = STABLECOIN_CHAINS[coin] || [];
  const [activeChain, setActiveChain] = useState(0);
  const chain = chains[activeChain];

  return (
    <div style={{padding: "24px 28px 28px"}}>
      <div className="row between" style={{marginBottom: 18, gap: 12, flexWrap: "wrap"}}>
        <div style={{fontSize: 12.5, color:"var(--gray-700)", lineHeight: 1.55, flex: "1 1 auto", minWidth: 0, paddingRight: 16}}>
          {coin === "USDC" ? "USD Coin (USDC) is a regulated stablecoin pegged 1:1 to USD." : "Tether (USDT) is a stablecoin pegged 1:1 to USD."} Send {coin} on any supported network — credited as USD.
        </div>
        <TimingChip tone="fast" label="Minutes" />
      </div>

      {/* Network selector */}
      <div style={{marginBottom: 14}}>
        <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 8}}>
          Network
        </div>
        <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
          {chains.map((c, i) => {
            const on = i === activeChain;
            const NIcon = NetworkIcon[c.id];
            return (
              <button key={c.id}
                onClick={() => setActiveChain(i)}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  border: "1.5px solid var(--gray-200)",
                  background: on ? "var(--info-100)" : "#fff",
                  color: on ? "var(--info-700)" : "var(--gray-700)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "all .12s ease",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}>
                {NIcon && <NIcon style={{width: 16, height: 16, flexShrink: 0}} />}
                {c.name}
                <span style={{fontSize: 11, opacity: 0.65, fontWeight: 400}}>({c.short})</span>
              </button>
            );
          })}
        </div>
      </div>

      {chain && (
        <>
          <div className="banner info" style={{borderRadius: 8, padding: "12px 16px", marginBottom: 20}}>
            <Icon.info style={{width: 16, height: 16, flexShrink: 0, color: "var(--info-600)"}} />
            <div className="body" style={{fontSize: 12.5}}>
              Only send {coin} on the <strong>{chain.name}</strong> network to this address. Sending on the wrong network will result in permanent loss of funds.
            </div>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20}}>
            <div style={{minWidth: 0}}>
              <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>Deposit address · {chain.name}</div>
              <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 6, wordBreak: "break-all"}}>
                <span>{chain.address}</span>
                <CopyInline value={chain.address} onCopy={onCopy} />
              </div>
            </div>
            <div>
              <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>Minimum deposit</div>
              <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500, fontVariantNumeric: "tabular-nums"}}>{chain.min} {coin}</div>
            </div>
            <div>
              <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>Conversion rate</div>
              <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500}}>1 {coin} = 1 USD</div>
            </div>
            <div>
              <div style={{fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 5}}>Fee</div>
              <div style={{fontSize: 13.5, color: "var(--gray-900)", fontWeight: 500}}>$1.00</div>
            </div>
          </div>

          <div className="row" style={{gap: 8}}>
            <button className="btn btn-soft btn-sm" onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(chain.address).catch(()=>{});
              onCopy(chain.address);
            }}><Icon.copy /> Copy address</button>
          </div>
        </>
      )}
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
// Request Other Currencies Modal
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
                  background: on ? "var(--info-100)" : "#fff",
                  color: on ? "var(--info-700)" : "var(--gray-700)",
                  boxShadow: on ? "0 0 0 2px var(--info-200)" : "none",
                  fontSize: 13, fontWeight: on ? 600 : 500, cursor: "pointer",
                  transition: "all .12s ease",
                }}>
                  {on && <Icon.check style={{width: 14, height: 14, strokeWidth: 2.5, flexShrink: 0}} />}
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
  CurrencyDetailPage,
  Toast,
  Pill,
  TxRowDir,
  TxAmount,
  CopyInline,
  CcyFlag,
};
