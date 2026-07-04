/* global React, ReactDOM */
const { useState, useEffect } = React;
const Icon = window.OBIcon;
const {
  ApplyForAccessScreen,
  SignInScreen, SignInPasswordScreen, ForgotPasswordScreen,
  TotpVerifyScreen, TotpSetupScreen, SetPasswordScreen,
  ExpressInterestScreen, SignUpConfirmationScreen,
} = window.OBOnboarding;
const { AccountsDashboard, AddMoneyPage, CurrencyDetailPage, Toast } = window.OBAccounts;
const { SendPayment } = window.OBSendPayment;
const { AddRecipientScreen, TransactionsScreen, TransactionDetailScreen, RecipientsScreen } = window.OBExtras;
const { SettingsScreen } = window.OBSettings;
const { CardsScreen } = window.OBCards;

// =====================================================
// App shell — Top nav + Sidebar
// =====================================================

const WaIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const AM = { name: "Temi Adeyemi", initials: "TA", role: "Account manager", wa: "https://wa.me/+2348000000000" };

function AccountManagerCard() {
  return (
    <div className="sb-am-card">
      <div className="sb-am-top">
        <div className="sb-am-ava">{AM.initials}</div>
        <div className="sb-am-meta">
          <div className="sb-am-name">{AM.name}</div>
          <div className="sb-am-role">Your {AM.role.toLowerCase()}</div>
        </div>
      </div>
      <a className="sb-am-cta" href={AM.wa} target="_blank" rel="noopener noreferrer">
        <WaIcon style={{width: 14, height: 14}} />
        Chat on WhatsApp
      </a>
    </div>
  );
}

function TopNav() {
  return (
    <header className="topnav">
      <div className="brand">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>
      <div style={{flex: 1}} />
      <div className="right">
        <a className="topnav-wa" href={AM.wa} target="_blank" rel="noopener noreferrer" title={`Chat with ${AM.name} · ${AM.role}`}>
          <WaIcon style={{width: 17, height: 17}} />
        </a>
        <div className="avatar">JN</div>
      </div>
    </header>
  );
}

function Sidebar({ active, onNavigate, mockProps }) {
  const item = (id, label, icon) => (
    <div className={`sb-item ${active === id ? "active" : ""}`} onClick={() => onNavigate(id)}>
      {icon}<span>{label}</span>
    </div>
  );
  return (
    <aside className="sidebar" style={{display: "flex", flexDirection: "column"}}>
      {item("dashboard", "Home",          <Icon.home />)}
      {item("add-money", "Deposit",      <Icon.arrowDownLeft />)}
      {item("payments",  "Send payment", <Icon.paperplane />)}
      {item("recipients","Recipients",   <Icon.people />)}
      {item("activity",  "Transactions", <Icon.list />)}
      {item("cards",     "Cards",        <Icon.card />)}
      <div className="sb-group">Workspace</div>
      {item("settings",  "Settings",     <Icon.cog />)}
      {item("developer", "Developer",    <Icon.doc />)}
      <div style={{flex: 1}} />
      <AccountManagerCard />
      {mockProps && <MockPanel {...mockProps} />}
      <div className="sb-foot">Onboard Business · v0.1</div>
    </aside>
  );
}

// =====================================================
// "Coming up" placeholder for screens not yet mocked
// =====================================================
function PlaceholderScreen({ title, blurb, planned = [] }) {
  return (
    <div className="page">
      <h1 className="title">{title}</h1>
      <p className="subtitle">{blurb}</p>
      <div className="card">
        <div className="empty">
          <div className="ic"><Icon.inbox /></div>
          <div style={{fontWeight: 500, color: "var(--gray-900)", marginBottom: 4, fontSize: 14}}>Coming in the next batch</div>
          <div style={{fontSize: 12.5, maxWidth: 420, margin: "8px auto 0", lineHeight: 1.6}}>
            We&rsquo;re building Accounts first. {planned.length > 0 && (
              <>Planned for the next round: {planned.join(", ")}.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Mock-router — lives inside the sidebar so it never overlaps the UI
// =====================================================
function MockPanel({ flow, onFlow, signinAccountStatus, onSigninAccountStatus, totpState, onTotpState, payMode, onPayMode, route, nameLookupMock, onNameLookupMock, dataState, onDataState, accountStatus, onAccountStatus, complianceHold, onComplianceHold, usdAccountStatus, onUsdAccountStatus, authLayout, onAuthLayout, apiAccess, onApiAccess, ngnIssuance, onNgnIssuance, stablecoinIssuance, onStablecoinIssuance, cardsAccess, onCardsAccess, dashLayout, onDashLayout }) {
  const [open, setOpen] = useState(true);
  const inAuth = flow !== "app";
  const inSignin = flow.startsWith("signin") || flow === "forgot-password";
  return (
    <div className="mockpanel">
      <button className="mockpanel-toggle" onClick={() => setOpen(!open)}>
        <span style={{display:"inline-flex", alignItems:"center", gap:8}}>
          <span className="mockpanel-dot" />
          Mock controls
        </span>
        <Icon.arrowDown style={{width: 12, height: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s"}} />
      </button>
      {open && (
        <div className="mockpanel-body">
          <div className="mockpanel-group">
            <div className="mockpanel-label">Flow</div>
            <div className="mockpanel-row wrap">
              <button className={flow === "signin" ? "on" : ""} onClick={() => onFlow("signin")}>Sign-in</button>
              <button className={flow === "app"    ? "on" : ""} onClick={() => onFlow("app")}>App</button>
              <button className={flow === "signup" ? "on" : ""} onClick={() => onFlow("signup")} style={{opacity:.55}} title="Reference only — sign-up is via Tally">Sign-up (ref)</button>
              <button className={flow === "signin-set-password" ? "on" : ""} onClick={() => onFlow("signin-set-password")} style={{opacity:.55}} title="Password reset landing page — reached via email link in real app">Set pw (ref)</button>
            </div>
          </div>
          {inAuth && (
            <div className="mockpanel-group">
              <div className="mockpanel-label">Auth layout</div>
              <div className="mockpanel-row">
                <button className={authLayout === "centered" ? "on" : ""} onClick={() => onAuthLayout("centered")}>Full screen</button>
                <button className={authLayout === "split" ? "on" : ""} onClick={() => onAuthLayout("split")}>Two column</button>
              </div>
            </div>
          )}
          {inSignin && (
            <>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Password result</div>
                <div className="mockpanel-row">
                  <button className={signinAccountStatus === "verified_active" ? "on" : ""} onClick={() => onSigninAccountStatus("verified_active")}>Correct</button>
                  <button className={signinAccountStatus === "wrong_password"  ? "on" : ""} onClick={() => onSigninAccountStatus("wrong_password")}>Wrong</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">After password</div>
                <div className="mockpanel-row">
                  <button className={totpState === "setup"  ? "on" : ""} onClick={() => onTotpState("setup")}>Setup 2FA</button>
                  <button className={totpState === "verify" ? "on" : ""} onClick={() => onTotpState("verify")}>Verify 2FA</button>
                </div>
              </div>
            </>
          )}
          {flow === "app" && (
            <>
              <div className="mockpanel-group">
                <div className="mockpanel-label">USD account status</div>
                <div className="mockpanel-row wrap">
                  <button className={usdAccountStatus === "not_applied"   ? "on" : ""} onClick={() => onUsdAccountStatus("not_applied")}>Not applied</button>
                  <button className={usdAccountStatus === "incomplete"    ? "on" : ""} onClick={() => onUsdAccountStatus("incomplete")}>Incomplete</button>
                  <button className={usdAccountStatus === "under_review"  ? "on" : ""} onClick={() => onUsdAccountStatus("under_review")}>Under review</button>
                  <button className={usdAccountStatus === "approved"      ? "on" : ""} onClick={() => onUsdAccountStatus("approved")}>Approved</button>
                  <button className={usdAccountStatus === "declined"      ? "on" : ""} onClick={() => onUsdAccountStatus("declined")}>Declined</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">NGN account details</div>
                <div className="mockpanel-row">
                  <button className={ngnIssuance === "not_generated" ? "on" : ""} onClick={() => onNgnIssuance("not_generated")}>Not generated</button>
                  <button className={ngnIssuance === "ready"         ? "on" : ""} onClick={() => onNgnIssuance("ready")}>Ready</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Stablecoin addresses</div>
                <div className="mockpanel-row">
                  <button className={stablecoinIssuance === "not_generated" ? "on" : ""} onClick={() => onStablecoinIssuance("not_generated")}>Not generated</button>
                  <button className={stablecoinIssuance === "ready"         ? "on" : ""} onClick={() => onStablecoinIssuance("ready")}>Ready</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Cards</div>
                <div className="mockpanel-row">
                  <button className={cardsAccess === "not_applied" ? "on" : ""} onClick={() => onCardsAccess("not_applied")}>Not applied</button>
                  <button className={cardsAccess === "active"      ? "on" : ""} onClick={() => onCardsAccess("active")}>Active</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Homepage layout</div>
                <div className="mockpanel-row">
                  <button className={dashLayout === "default"      ? "on" : ""} onClick={() => onDashLayout("default")}>Default</button>
                  <button className={dashLayout === "cards-split"  ? "on" : ""} onClick={() => onDashLayout("cards-split")}>Cards split</button>
                </div>
              </div>
{route === "add-recipient" && (
                <div className="mockpanel-group">
                  <div className="mockpanel-label">Name lookup</div>
                  <div className="mockpanel-row wrap">
                    <button className={nameLookupMock === "default" ? "on" : ""} onClick={() => onNameLookupMock("default")}>Default</button>
                    <button className={nameLookupMock === "on"      ? "on" : ""} onClick={() => onNameLookupMock("on")}>Force on</button>
                    <button className={nameLookupMock === "off"     ? "on" : ""} onClick={() => onNameLookupMock("off")}>Force off</button>
                  </div>
                </div>
              )}

              <div className="mockpanel-group">
                <div className="mockpanel-label">Data state</div>
                <div className="mockpanel-row">
                  <button className={dataState === "full"  ? "on" : ""} onClick={() => onDataState("full")}>Populated</button>
                  <button className={dataState === "empty" ? "on" : ""} onClick={() => onDataState("empty")}>Empty (new user)</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Account status</div>
                <div className="mockpanel-row">
                  <button className={accountStatus === "active"    ? "on" : ""} onClick={() => onAccountStatus("active")}>Active</button>
                  <button className={accountStatus === "suspended" ? "on" : ""} onClick={() => onAccountStatus("suspended")}>Suspended</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Compliance hold</div>
                <div className="mockpanel-row">
                  <button className={!complianceHold ? "on" : ""} onClick={() => onComplianceHold(false)}>Off</button>
                  <button className={complianceHold ? "on" : ""}  onClick={() => onComplianceHold(true)}>Txn on hold</button>
                </div>
              </div>
              <div className="mockpanel-group">
                <div className="mockpanel-label">API access</div>
                <div className="mockpanel-row">
                  <button className={apiAccess === "granted" ? "on" : ""} onClick={() => onApiAccess("granted")}>Granted</button>
                  <button className={apiAccess === "pending" ? "on" : ""} onClick={() => onApiAccess("pending")}>Pending</button>
                  <button className={apiAccess === "none" ? "on" : ""}    onClick={() => onApiAccess("none")}>Not requested</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// App
// =====================================================
function App() {
  // Top-level flow: signin | signin-password | forgot-password | signin-totp-setup | signin-totp-verify | signin-set-password | app
  // Sign-up is off-app via Tally (https://tally.so/r/5BMoRP); signup/signup-confirm kept for reference only.
  const [flow, setFlow] = useState("app"); // start in app for review
  const [authEmail, setAuthEmail] = useState("finance@acmetrading.com");

  // Sidebar route inside the app
  const [route, setRoute] = useState("dashboard");
  // 'dashboard' | 'currency'
  const [openCcy, setOpenCcy] = useState(null);

  const [usdAccountStatus, setUsdAccountStatus] = useState("approved");

  // Auth layout toggle
  const [authLayout, setAuthLayout] = useState("centered"); // "centered" | "split"

  // Send payment flow toggle
  const [payMode, setPayMode] = useState("recipient"); // "recipient" | "amount" — default order

  // Sign-in mock state: "verified_active" | "wrong_password"
  const [signinAccountStatus, setSigninAccountStatus] = useState("verified_active");
  // TOTP mock: "setup" = first-time (show QR), "verify" = returning (enter code)
  const [totpState, setTotpState] = useState("verify");

  // Mock toggle: name-lookup behaviour for Add Recipient
  // "default" = rail decides, "on" = force-available, "off" = force-unsupported
  const [nameLookupMock, setNameLookupMock] = useState("default");

  const paymentApproval = "required";
  const paymentApprovalMethod = "totp";
  const [dataState, setDataState] = useState("full");   // "full" | "empty"
  const [accountStatus, setAccountStatus] = useState("active"); // "active" | "suspended"
  const [complianceHold, setComplianceHold] = useState(false);  // boolean — injects a held txn
  const [apiAccess, setApiAccess] = useState("granted"); // "granted" | "none" | "pending"
  const [ngnIssuance, setNgnIssuance] = useState("ready"); // "not_generated" | "ready"
  const [stablecoinIssuance, setStablecoinIssuance] = useState("ready"); // "not_generated" | "ready"
  const [cardsAccess, setCardsAccess] = useState("active"); // "not_applied" | "active"
  const [dashLayout, setDashLayout] = useState("default"); // "default" | "cards-split"

  // Active transaction (for detail page)
  const [openTx, setOpenTx] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (m) => setToast(m);

  // Helpers
  const goCurrency = (code) => { setOpenCcy(code); setRoute("currency"); };
  const backToAccounts = () => { setOpenCcy(null); setRoute("dashboard"); };
  const setFlowAndReset = (f) => {
    setFlow(f);
    if (f === "app") { setRoute("dashboard"); setOpenCcy(null); }
  };

  const mockProps = { flow, onFlow: setFlowAndReset, signinAccountStatus, onSigninAccountStatus: setSigninAccountStatus, totpState, onTotpState: setTotpState, payMode, onPayMode: setPayMode, route, nameLookupMock, onNameLookupMock: setNameLookupMock, dataState, onDataState: setDataState, accountStatus, onAccountStatus: setAccountStatus, complianceHold, onComplianceHold: setComplianceHold, usdAccountStatus, onUsdAccountStatus: setUsdAccountStatus, authLayout, onAuthLayout: setAuthLayout, apiAccess, onApiAccess: setApiAccess, ngnIssuance, onNgnIssuance: setNgnIssuance, stablecoinIssuance, onStablecoinIssuance: setStablecoinIssuance, cardsAccess, onCardsAccess: setCardsAccess, dashLayout, onDashLayout: setDashLayout };

  // ---------- AUTH FLOWS ----------

  // [Reference] Sign-up is off-app via Tally — these flows kept for design review only
  if (flow === "signup") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <ExpressInterestScreen
          layout={authLayout}
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signup-confirm"); }}
          onSwitchToSignIn={() => setFlow("signin")} />
      </>
    );
  }
  if (flow === "signup-confirm") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SignUpConfirmationScreen
          layout={authLayout}
          email={authEmail}
          onSignIn={() => setFlow("signin")} />
      </>
    );
  }

  if (flow === "apply-for-access") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <ApplyForAccessScreen
          layout={authLayout}
          onSignIn={() => setFlow("signin")} />
      </>
    );
  }

  // Active sign-in flow: email → password → TOTP (setup or verify)
  if (flow === "signin") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SignInScreen
          layout={authLayout}
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signin-password"); }}
          onApplyForAccess={() => setFlow("apply-for-access")} />
      </>
    );
  }
  if (flow === "signin-password") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SignInPasswordScreen
          layout={authLayout}
          email={authEmail}
          error={signinAccountStatus === "wrong_password" ? "Incorrect password." : null}
          onSubmit={() => {
            if (signinAccountStatus !== "wrong_password") {
              setFlow(totpState === "setup" ? "signin-totp-setup" : "signin-totp-verify");
            }
          }}
          onBack={() => setFlow("signin")}
          onForgotPassword={() => setFlow("forgot-password")}
          onApplyForAccess={() => setFlow("apply-for-access")} />
      </>
    );
  }
  if (flow === "forgot-password") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <ForgotPasswordScreen
          layout={authLayout}
          onBack={() => setFlow("signin-password")} />
      </>
    );
  }
  if (flow === "signin-totp-verify") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <TotpVerifyScreen
          layout={authLayout}
          onSubmit={() => setFlow("app")}
          onBack={() => setFlow("signin")} />
      </>
    );
  }
  if (flow === "signin-totp-setup") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <TotpSetupScreen
          layout={authLayout}
          onSubmit={() => setFlow("app")} />
      </>
    );
  }
  // Password reset — reached via email link in real app; accessible here for design review
  if (flow === "signin-set-password") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SetPasswordScreen
          layout={authLayout}
          onSubmit={() => setFlow("signin-totp-setup")} />
      </>
    );
  }

  // ---------- APP ----------
  let screen;
  if (route === "dashboard") {
    screen = (
      <AccountsDashboard
        dataState={dataState}
        accountSuspended={accountStatus === "suspended"}
        complianceHold={complianceHold}
        onOpenCurrency={goCurrency}
        onAddMoney={() => setRoute("add-money")}
        onSendPayment={() => setRoute("payments")}
        onGoToCards={() => setRoute("cards")}
        dashLayout={dashLayout}
        onToast={showToast} />
    );
  } else if (route === "add-money") {
    screen = <AddMoneyPage onBack={() => setRoute("dashboard")} onToast={showToast} usdAccountStatus={usdAccountStatus} ngnIssuance={ngnIssuance} stablecoinIssuance={stablecoinIssuance} accountSuspended={accountStatus === "suspended"} />;
  } else if (route === "currency" && openCcy) {
    screen = <CurrencyDetailPage code={openCcy} onBack={backToAccounts} onToast={showToast} usdAccountStatus={usdAccountStatus} stablecoinIssuance={stablecoinIssuance} accountSuspended={accountStatus === "suspended"} />;
  } else if (route === "payments") {
    screen = <SendPayment
      key={payMode}
      defaultMode={payMode}
      paymentApproval={paymentApproval}
      paymentApprovalMethod={paymentApprovalMethod}
      accountSuspended={accountStatus === "suspended"}
      dataState={dataState}
      onAddRecipient={() => setRoute("add-recipient")}
      onToast={showToast} />;
  } else if (route === "add-recipient") {
    screen = <AddRecipientScreen
      nameLookupMock={nameLookupMock}
      onBack={() => setRoute("recipients")}
      onSaved={(name) => { showToast(`${name} saved`); setRoute("recipients"); }}
      onToast={showToast} />;
  } else if (route === "recipients") {
    screen = <RecipientsScreen
      dataState={dataState}
      onAddNew={() => setRoute("add-recipient")}
      onPay={() => { setRoute("payments"); }}
      onToast={showToast} />;
  } else if (route === "activity" && openTx) {
    screen = <TransactionDetailScreen tx={openTx} onBack={() => setOpenTx(null)} onToast={showToast} />;
  } else if (route === "activity") {
    screen = <TransactionsScreen dataState={dataState} complianceHold={complianceHold} onOpenTx={setOpenTx} onToast={showToast} />;
  } else if (route === "cards") {
    screen = <CardsScreen onToast={showToast} cardsAccess={cardsAccess} />;
  } else if (route === "developer") {
    const { DeveloperSection } = window.OBSettings;
    screen = (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="title">Developer</h1>
            <p className="subtitle">API keys, webhooks, and integration settings.</p>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <DeveloperSection onToast={showToast} apiAccess={apiAccess} />
        </div>
      </div>
    );
  } else if (route === "settings") {
    screen = <SettingsScreen onToast={showToast} />;
  } else {
    screen = <PlaceholderScreen title="Settings" blurb="Business profile, statements, FX preferences." />;
  }

  return (
    <>
      <div className="app">
        <TopNav />
        <Sidebar active={
          route === "currency" ? "dashboard"
          : route === "add-recipient" ? "recipients"
          : route
        } onNavigate={(r) => { setRoute(r); setOpenCcy(null); setOpenTx(null); }} mockProps={mockProps} />
        <div style={{flex:1, minWidth:0, minHeight:0, display:"flex", flexDirection:"column", overflowY:"auto"}}>
          {complianceHold && route !== "activity" && <ComplianceBanner onView={() => setRoute("activity")} />}
          {screen}
        </div>
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}


function ComplianceBanner({ onView }) {
  return (
    <div style={{
      background: "#FFFBEB", borderBottom: "1px solid #FDE68A",
      padding: "10px 28px", display: "flex", alignItems: "center", gap: 12,
      fontSize: 13, color: "#92400E"
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", background: "#F59E0B", color: "#fff",
        display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0
      }}>⚠</span>
      <div style={{flex: 1}}>
        <strong style={{fontWeight: 600, color: "#78350F"}}>1 transaction on compliance hold.</strong>{" "}
        Funds are held pending document review. We&rsquo;ll email you once cleared.
      </div>
      <a href="#" onClick={(e) => { e.preventDefault(); onView(); }} style={{color: "#78350F", fontWeight: 500, textDecoration: "underline"}}>Review</a>
    </div>
  );
}

function FloatingMockPanel({ mockProps }) {
  return (
    <div className="mockpanel-floating">
      <MockPanel {...mockProps} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
