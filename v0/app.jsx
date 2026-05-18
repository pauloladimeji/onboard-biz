/* global React, ReactDOM */
const { useState, useEffect } = React;
const Icon = window.OBIcon;
const { SignUpScreen, SignInScreen, OtpScreen, TotpSetupScreen } = window.OBOnboarding;
const { AccountsDashboard, CurrencyDetailPage, Toast } = window.OBAccounts;
const { SendPayment } = window.OBSendPayment;
const { AddRecipientScreen, TransactionsScreen, TransactionDetailScreen, RecipientsScreen } = window.OBExtras;
const { SettingsScreen } = window.OBSettings;

// =====================================================
// App shell — Top nav + Sidebar
// =====================================================
function TopNav() {
  return (
    <header className="topnav">
      <div className="brand">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>
      <div style={{flex: 1}} />
      <div className="right">
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
      {item("dashboard", "Accounts",     <Icon.home />)}
      {item("payments",  "Send payment", <Icon.paperplane />)}
      {item("recipients","Recipients",   <Icon.people />)}
      {item("activity",  "Transactions", <Icon.list />)}
      <div className="sb-group">Workspace</div>
      {item("settings",  "Settings",     <Icon.cog />)}
      <div style={{flex: 1}} />
      {mockProps && <MockPanel {...mockProps} />}
      <div className="sb-foot">
        Onboard Business · v0.1<br/>
        <a style={{color: "var(--info-700)", textDecoration: "none", cursor: "pointer"}}>Help & docs</a>
      </div>
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
function MockPanel({ flow, onFlow, kyb, onKyb, accountsMode, onAccountsMode, payMode, onPayMode, route, nameLookupMock, onNameLookupMock, dataState, onDataState, accountStatus, onAccountStatus, complianceHold, onComplianceHold, fiatIssuance, onFiatIssuance, authLayout, onAuthLayout }) {
  const [open, setOpen] = useState(true);
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
            <div className="mockpanel-row">
              <button className={flow === "signup" ? "on" : ""} onClick={() => onFlow("signup")}>Sign-up</button>
              <button className={flow === "signin" ? "on" : ""} onClick={() => onFlow("signin")}>Sign-in</button>
              <button className={flow === "app"    ? "on" : ""} onClick={() => onFlow("app")}>App</button>
            </div>
          </div>
          {flow !== "app" && (
            <div className="mockpanel-group">
              <div className="mockpanel-label">Auth layout</div>
              <div className="mockpanel-row">
                <button className={authLayout === "centered" ? "on" : ""} onClick={() => onAuthLayout("centered")}>Full screen</button>
                <button className={authLayout === "split" ? "on" : ""} onClick={() => onAuthLayout("split")}>Two column</button>
              </div>
            </div>
          )}
          {flow === "app" && (
            <>
              <div className="mockpanel-group">
                <div className="mockpanel-label">Fiat funding details</div>
                <div className="mockpanel-row">
                  <button className={fiatIssuance === "in_progress" ? "on" : ""} onClick={() => onFiatIssuance("in_progress")}>Provisioning</button>
                  <button className={fiatIssuance === "ready"       ? "on" : ""} onClick={() => onFiatIssuance("ready")}>Ready</button>
                </div>
              </div>
              {route === "payments" && (
                <div className="mockpanel-group">
                  <div className="mockpanel-label">Send payment default order</div>
                  <div className="mockpanel-row wrap">
                    <button className={payMode === "recipient" ? "on" : ""} onClick={() => onPayMode("recipient")}>Recipient first</button>
                    <button className={payMode === "amount"    ? "on" : ""} onClick={() => onPayMode("amount")}>Amount first</button>
                  </div>

                </div>
              )}
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
                <div className="mockpanel-label">KYB status</div>
                <div className="mockpanel-row wrap">
                  {["not_submitted","in_review","approved","rejected"].map(s => (
                    <button key={s} className={(kyb === s || (s === "in_review" && kyb === "submitted")) ? "on" : ""} onClick={() => onKyb(s)}>
                      {s === "in_review" ? "in review" : s.replace("_"," ")}
                    </button>
                  ))}
                </div>
              </div>
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
  // Top-level flow: signup | signup-otp | signup-register | signin | signin-otp | app
  const [flow, setFlow] = useState("app"); // start in app for review
  const [authEmail, setAuthEmail] = useState("finance@acmetrading.com");
  const [authData, setAuthData] = useState({});

  // Sidebar route inside the app
  const [route, setRoute] = useState("dashboard");
  // 'dashboard' | 'currency'
  const [openCcy, setOpenCcy] = useState(null);

  // Architecture toggle
  const [accountsMode, setAccountsMode] = useState("v0"); // "v0" | "ref" | "named"

  // Fiat issuance state (v0 only): not_requested | in_progress | ready
  const [fiatIssuance, setFiatIssuance] = useState("ready");

  // Auth layout toggle
  const [authLayout, setAuthLayout] = useState("centered"); // "centered" | "split"

  // Send payment flow toggle
  const [payMode, setPayMode] = useState("recipient"); // "recipient" | "amount" — default order

  // KYB demo state
  const [kyb, setKyb] = useState("not_submitted");

  // Mock toggle: name-lookup behaviour for Add Recipient
  // "default" = rail decides, "on" = force-available, "off" = force-unsupported
  const [nameLookupMock, setNameLookupMock] = useState("default");

  const paymentApproval = "required";
  const paymentApprovalMethod = "totp";
  const [dataState, setDataState] = useState("full");   // "full" | "empty"
  const [accountStatus, setAccountStatus] = useState("active"); // "active" | "suspended"
  const [complianceHold, setComplianceHold] = useState(false);  // boolean — injects a held txn

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

  const mockProps = { flow, onFlow: setFlowAndReset, kyb, onKyb: setKyb, accountsMode, onAccountsMode: setAccountsMode, payMode, onPayMode: setPayMode, route, nameLookupMock, onNameLookupMock: setNameLookupMock, dataState, onDataState: setDataState, accountStatus, onAccountStatus: setAccountStatus, complianceHold, onComplianceHold: setComplianceHold, fiatIssuance, onFiatIssuance: setFiatIssuance, authLayout, onAuthLayout: setAuthLayout };

  // ---------- AUTH FLOWS ----------
  const { RegisterBusinessScreen } = window.OBOnboarding;
  if (flow === "signup") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SignUpScreen
          layout={authLayout}
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signup-otp"); }}
          onSwitchToSignIn={() => setFlow("signin")} />
      </>
    );
  }
  if (flow === "signup-otp") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <OtpScreen email={authEmail} mode="signup"
          layout={authLayout}
          step={1} totalSteps={3}
          onSubmit={() => setFlow("signup-register")}
          onChangeEmail={() => setFlow("signup")} />
      </>
    );
  }
  if (flow === "signup-register") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <RegisterBusinessScreen
          layout={authLayout}
          email={authEmail}
          onSubmit={(data) => { setAuthData(data); setFlow("signup-totp"); }} />
      </>
    );
  }
  if (flow === "signup-totp") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <TotpSetupScreen
          layout={authLayout}
          onSubmit={() => { setFlow("app"); setKyb("not_submitted"); }}
          onSkip={() => { setFlow("app"); setKyb("not_submitted"); }} />
      </>
    );
  }
  if (flow === "signin") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <SignInScreen
          layout={authLayout}
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signin-otp"); }}
          onSwitchToSignUp={() => setFlow("signup")} />
      </>
    );
  }
  if (flow === "signin-otp") {
    return (
      <>
        <FloatingMockPanel mockProps={mockProps} />
        <OtpScreen email={authEmail} mode="signin"
          layout={authLayout}
          onSubmit={() => setFlow("app")}
          onChangeEmail={() => setFlow("signin")} />
      </>
    );
  }

  // ---------- APP ----------
  let screen;
  if (route === "dashboard") {
    screen = (
      <AccountsDashboard
        kybStatus={kyb}
        accountsMode={accountsMode}
        dataState={dataState}
        accountSuspended={accountStatus === "suspended"}
        complianceHold={complianceHold}
        onOpenCurrency={goCurrency}
        onSubmitKyb={() => { showToast("Redirecting to KYB form…"); setTimeout(() => setKyb("in_review"), 800); }}
        onSendPayment={() => showToast("Send payment flow — phase 2")}
        onCreateAccount={(c) => showToast(`Create ${c} account — phase 2`)}
        onToast={showToast} />
    );
  } else if (route === "currency" && openCcy) {
    screen = <CurrencyDetailPage code={openCcy} onBack={backToAccounts} onToast={showToast} kybApproved={kyb === "approved"} fiatIssuance={fiatIssuance} accountSuspended={accountStatus === "suspended"} />;
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
  } else if (route === "settings") {
    screen = <SettingsScreen kyb={kyb} onKyb={setKyb} onToast={showToast} />;
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
        <div style={{flex:1, minWidth:0, display:"flex", flexDirection:"column"}}>
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
