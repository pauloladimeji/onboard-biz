/* global React, ReactDOM */
const { useState } = React;
const Icon = window.OBIcon;
const { Shell } = window.OBShell;
const { Dashboard } = window.OBDashboard;
const { DepositPage } = window.OBDeposit;
const { SendPayment } = window.OBSendPayment;
const { RecipientsScreen } = window.OBRecipients;
const { AddRecipientScreen } = window.OBAddRecipient;
const { TransactionsScreen, TransactionDetailScreen } = window.OBTransactions;
const { SettingsScreen, DeveloperSection } = window.OBSettings;
const { CardsScreen } = window.OBCards;
const {
  ApplyForAccessScreen, SignInScreen, SignInPasswordScreen, ForgotPasswordScreen,
  TotpVerifyScreen, TotpSetupScreen, SetPasswordScreen,
} = window.OBAuth;
const { Page, Toast, Sheet, isDemoMode, withDemoUtm, TALLY_URL, CONSUMER_APP_LINKS } = window.OBPrimitives;
const { RECIPIENTS_FULL } = window.OBData;

// ---------- Demo entry gate (demo mode only) ----------
// The only screen a demo visitor sees before the app itself. Not a real auth step — it never
// asks for anything, just routes personal-use visitors to the consumer app instead of the
// business demo. Skipped entirely outside demo mode.
const DEMO_ENTRY_FEATURES = [
  { icon: "globe", label: "Hold a global USD balance" },
  { icon: "paperplane", label: "Pay out to 5+ currencies" },
  { icon: "zap", label: "Real-time FX, transparent fees" },
];

function DemoEntryScreen({ onEnterBusiness }) {
  return (
    <div className="demo-entry">
      <div className="demo-entry-logo"><img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard" /></div>
      <div className="demo-entry-card">
        <span className="demo-entry-eyebrow">Live product demo</span>
        <h1>Business payments, without the friction</h1>
        <p className="demo-entry-lede">Onboard gives businesses a global USD balance and fast payouts to suppliers, contractors, and teams abroad. Explore the real product below — nothing to sign up for.</p>

        <div className="demo-entry-features">
          {DEMO_ENTRY_FEATURES.map((f) => (
            <div key={f.label} className="demo-entry-feature">
              {React.createElement(Icon[f.icon], { style: { width: 15, height: 15 } })}
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-lg btn-block btn-dark" onClick={onEnterBusiness}>For my business</button>
        <div className="demo-entry-divider"><span>or</span></div>
        <div className="demo-entry-personal">
          <div className="demo-entry-personal-lbl">Looking for the personal app?</div>
          <div className="demo-entry-stores">
            <a href={withDemoUtm(CONSUMER_APP_LINKS.ios, { utm_campaign: "entry_personal" })} target="_blank" rel="noopener noreferrer" className="demo-entry-store">App Store</a>
            <a href={withDemoUtm(CONSUMER_APP_LINKS.android, { utm_campaign: "entry_personal" })} target="_blank" rel="noopener noreferrer" className="demo-entry-store">Google Play</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auth screens render outside the app Shell (no sidebar/topbar yet), so mock controls
// get a small floating gear instead of the one built into TopBar/TopBarMobile.
function AuthMockWrap({ mockControls, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="auth-mock-gear" onClick={() => setOpen(true)} aria-label="Mock controls"><Icon.cog style={{ width: 15, height: 15 }} /></button>
      {children}
      <Sheet open={open} onClose={() => setOpen(false)} title="Mock controls">{mockControls}</Sheet>
    </>
  );
}

function MockControls({
  dataState, onDataState, accountStatus, onAccountStatus,
  usdAccountStatus, onUsdAccountStatus, ngnIssuance, onNgnIssuance,
  stablecoinIssuance, onStablecoinIssuance, fiatConvert, onFiatConvert,
  payMode, onPayMode, paymentApproval, onPaymentApproval, paymentApprovalMethod, onPaymentApprovalMethod,
  complianceHold, onComplianceHold, route, nameLookupMock, onNameLookupMock,
  apiAccess, onApiAccess, cardsAccess, onCardsAccess,
  flow, onFlow, signinAccountStatus, onSigninAccountStatus, totpState, onTotpState,
}) {
  const inSignin = flow.startsWith("signin") || flow === "forgot-password";
  return (
    <>
      <div className="mock-group">
        <div className="mock-label">Flow</div>
        <div className="mock-row">
          <button className={flow === "signin" ? "on" : ""} onClick={() => onFlow("signin")}>Sign-in</button>
          <button className={flow === "app" ? "on" : ""} onClick={() => onFlow("app")}>App</button>
          <button className={flow === "apply-for-access" ? "on" : ""} onClick={() => onFlow("apply-for-access")}>Apply for access</button>
          <button className={flow === "signin-set-password" ? "on" : ""} onClick={() => onFlow("signin-set-password")} style={{ opacity: .55 }} title="Password reset landing page — reached via email link in real app">Set pw (ref)</button>
        </div>
      </div>
      {inSignin && (
        <>
          <div className="mock-group">
            <div className="mock-label">Password result</div>
            <div className="mock-row">
              <button className={signinAccountStatus === "verified_active" ? "on" : ""} onClick={() => onSigninAccountStatus("verified_active")}>Correct</button>
              <button className={signinAccountStatus === "wrong_password" ? "on" : ""} onClick={() => onSigninAccountStatus("wrong_password")}>Wrong</button>
            </div>
          </div>
          <div className="mock-group">
            <div className="mock-label">After password</div>
            <div className="mock-row">
              <button className={totpState === "setup" ? "on" : ""} onClick={() => onTotpState("setup")}>Setup 2FA</button>
              <button className={totpState === "verify" ? "on" : ""} onClick={() => onTotpState("verify")}>Verify 2FA</button>
            </div>
          </div>
        </>
      )}
      <div className="mock-group">
        <div className="mock-label">Data state</div>
        <div className="mock-row">
          <button className={dataState === "full" ? "on" : ""} onClick={() => onDataState("full")}>Populated</button>
          <button className={dataState === "empty" ? "on" : ""} onClick={() => onDataState("empty")}>Empty</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Account status</div>
        <div className="mock-row">
          <button className={accountStatus === "active" ? "on" : ""} onClick={() => onAccountStatus("active")}>Active</button>
          <button className={accountStatus === "suspended" ? "on" : ""} onClick={() => onAccountStatus("suspended")}>Suspended</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">USD account status</div>
        <div className="mock-row">
          <button className={usdAccountStatus === "not_applied" ? "on" : ""} onClick={() => onUsdAccountStatus("not_applied")}>Not applied</button>
          <button className={usdAccountStatus === "incomplete" ? "on" : ""} onClick={() => onUsdAccountStatus("incomplete")}>Incomplete</button>
          <button className={usdAccountStatus === "under_review" ? "on" : ""} onClick={() => onUsdAccountStatus("under_review")}>Under review</button>
          <button className={usdAccountStatus === "approved" ? "on" : ""} onClick={() => onUsdAccountStatus("approved")}>Approved</button>
          <button className={usdAccountStatus === "declined" ? "on" : ""} onClick={() => onUsdAccountStatus("declined")}>Declined</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">NGN account details</div>
        <div className="mock-row">
          <button className={ngnIssuance === "not_generated" ? "on" : ""} onClick={() => onNgnIssuance("not_generated")}>Not generated</button>
          <button className={ngnIssuance === "ready" ? "on" : ""} onClick={() => onNgnIssuance("ready")}>Ready</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Stablecoin addresses</div>
        <div className="mock-row">
          <button className={stablecoinIssuance === "not_generated" ? "on" : ""} onClick={() => onStablecoinIssuance("not_generated")}>Not generated</button>
          <button className={stablecoinIssuance === "ready" ? "on" : ""} onClick={() => onStablecoinIssuance("ready")}>Ready</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">EUR / GBP deposits</div>
        <div className="mock-row">
          <button className={fiatConvert === "available" ? "on" : ""} onClick={() => onFiatConvert("available")}>Available</button>
          <button className={fiatConvert === "waitlist" ? "on" : ""} onClick={() => onFiatConvert("waitlist")}>Waitlist</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Send payment order</div>
        <div className="mock-row">
          <button className={payMode === "recipient" ? "on" : ""} onClick={() => onPayMode("recipient")}>Recipient first</button>
          <button className={payMode === "amount" ? "on" : ""} onClick={() => onPayMode("amount")}>Amount first</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">2FA on payments</div>
        <div className="mock-row">
          <button className={paymentApproval === "required" ? "on" : ""} onClick={() => onPaymentApproval("required")}>Required</button>
          <button className={paymentApproval === "off" ? "on" : ""} onClick={() => onPaymentApproval("off")}>Off</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">2FA method</div>
        <div className="mock-row">
          <button className={paymentApprovalMethod === "totp" ? "on" : ""} onClick={() => onPaymentApprovalMethod("totp")}>Authenticator</button>
          <button className={paymentApprovalMethod === "email" ? "on" : ""} onClick={() => onPaymentApprovalMethod("email")}>Email OTP</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Compliance hold</div>
        <div className="mock-row">
          <button className={!complianceHold ? "on" : ""} onClick={() => onComplianceHold(false)}>Off</button>
          <button className={complianceHold ? "on" : ""} onClick={() => onComplianceHold(true)}>Txn on hold</button>
        </div>
      </div>
      {route === "add-recipient" && (
        <div className="mock-group">
          <div className="mock-label">Name lookup</div>
          <div className="mock-row">
            <button className={nameLookupMock === "default" ? "on" : ""} onClick={() => onNameLookupMock("default")}>Default</button>
            <button className={nameLookupMock === "on" ? "on" : ""} onClick={() => onNameLookupMock("on")}>Force on</button>
            <button className={nameLookupMock === "off" ? "on" : ""} onClick={() => onNameLookupMock("off")}>Force off</button>
          </div>
        </div>
      )}
      <div className="mock-group">
        <div className="mock-label">API access</div>
        <div className="mock-row">
          <button className={apiAccess === "granted" ? "on" : ""} onClick={() => onApiAccess("granted")}>Granted</button>
          <button className={apiAccess === "pending" ? "on" : ""} onClick={() => onApiAccess("pending")}>Pending</button>
          <button className={apiAccess === "none" ? "on" : ""} onClick={() => onApiAccess("none")}>Not requested</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Cards</div>
        <div className="mock-row">
          <button className={cardsAccess === "not_applied" ? "on" : ""} onClick={() => onCardsAccess("not_applied")}>Not applied</button>
          <button className={cardsAccess === "active" ? "on" : ""} onClick={() => onCardsAccess("active")}>Active</button>
        </div>
      </div>
    </>
  );
}

// Defensive fallback for any unrouted screen. No nav item currently reaches it.
function PlaceholderScreen({ title }) {
  return (
    <Page>
      <h1 className="title">{title}</h1>
      <div className="card">
        <div className="empty">
          <div className="ic"><Icon.inbox /></div>
          <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500, marginBottom: 4 }}>Not part of the prototype</div>
          <div style={{ fontSize: 12.5, maxWidth: 320, margin: "0 auto" }}>This screen hasn't been built in the adaptive prototype.</div>
        </div>
      </div>
    </Page>
  );
}

function App() {
  // Top-level flow: signin | signin-password | forgot-password | signin-totp-setup |
  // signin-totp-verify | signin-set-password | apply-for-access | app.
  // Sign-up is off-app via Tally, so it's not part of this state machine.
  const [flow, setFlow] = useState("app"); // start in app for review
  // Demo mode only: gates everything behind a Personal/Business choice first. Non-demo
  // builds skip it entirely (starts true) since it's not part of the real product flow.
  const [demoEntryDone, setDemoEntryDone] = useState(() => !isDemoMode());
  const [authEmail, setAuthEmail] = useState("finance@acmetrading.com");
  const [signinAccountStatus, setSigninAccountStatus] = useState("verified_active");
  const [totpState, setTotpState] = useState("verify"); // "setup" = first sign-in, "verify" = returning

  const [route, setRoute] = useState("dashboard");
  const [dataState, setDataState] = useState("full");
  const [accountStatus, setAccountStatus] = useState("active");
  const [usdAccountStatus, setUsdAccountStatus] = useState("approved");
  const [ngnIssuance, setNgnIssuance] = useState("ready");
  const [stablecoinIssuance, setStablecoinIssuance] = useState("ready");
  const [fiatConvert, setFiatConvert] = useState("available");
  const [payMode, setPayMode] = useState("recipient");
  const [paymentApproval, setPaymentApproval] = useState("required");
  const [paymentApprovalMethod, setPaymentApprovalMethod] = useState("totp");
  const [complianceHold, setComplianceHold] = useState(false);
  const [nameLookupMock, setNameLookupMock] = useState("default");
  const [apiAccess, setApiAccess] = useState("granted");
  const [cardsAccess, setCardsAccess] = useState("active");
  const [openTx, setOpenTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [recipients, setRecipients] = useState(() => [...RECIPIENTS_FULL]);

  const mockControls = (
    <MockControls
      dataState={dataState} onDataState={setDataState}
      accountStatus={accountStatus} onAccountStatus={setAccountStatus}
      usdAccountStatus={usdAccountStatus} onUsdAccountStatus={setUsdAccountStatus}
      ngnIssuance={ngnIssuance} onNgnIssuance={setNgnIssuance}
      stablecoinIssuance={stablecoinIssuance} onStablecoinIssuance={setStablecoinIssuance}
      fiatConvert={fiatConvert} onFiatConvert={setFiatConvert}
      payMode={payMode} onPayMode={setPayMode}
      paymentApproval={paymentApproval} onPaymentApproval={setPaymentApproval}
      paymentApprovalMethod={paymentApprovalMethod} onPaymentApprovalMethod={setPaymentApprovalMethod}
      complianceHold={complianceHold} onComplianceHold={setComplianceHold}
      route={route} nameLookupMock={nameLookupMock} onNameLookupMock={setNameLookupMock}
      apiAccess={apiAccess} onApiAccess={setApiAccess}
      cardsAccess={cardsAccess} onCardsAccess={setCardsAccess}
      flow={flow} onFlow={setFlow}
      signinAccountStatus={signinAccountStatus} onSigninAccountStatus={setSigninAccountStatus}
      totpState={totpState} onTotpState={setTotpState} />
  );

  // ---------- DEMO ENTRY GATE (demo mode only, ahead of everything else) ----------
  if (!demoEntryDone) {
    return <DemoEntryScreen onEnterBusiness={() => setDemoEntryDone(true)} />;
  }

  // ---------- AUTH FLOWS (pre-app — no Shell yet) ----------
  if (flow === "apply-for-access") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <ApplyForAccessScreen onSignIn={() => setFlow("signin")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SignInScreen
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signin-password"); }}
          onApplyForAccess={() => setFlow("apply-for-access")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SignInPasswordScreen
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
      </AuthMockWrap>
    );
  }
  if (flow === "forgot-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <ForgotPasswordScreen onBack={() => setFlow("signin-password")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-verify") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpVerifyScreen onSubmit={() => setFlow("app")} onBack={() => setFlow("signin")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-setup") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpSetupScreen email={authEmail} onSubmit={() => setFlow("app")} />
      </AuthMockWrap>
    );
  }
  // Password reset — reached via email link in the real app; accessible here for design review
  if (flow === "signin-set-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SetPasswordScreen onSubmit={() => setFlow("signin-totp-setup")} />
      </AuthMockWrap>
    );
  }

  // ---------- APP ----------
  let screen;
  if (route === "dashboard") {
    screen = (
      <Dashboard
        dataState={dataState}
        accountSuspended={accountStatus === "suspended"}
        onAddMoney={() => setRoute("add-money")}
        onSendPayment={() => setRoute("payments")}
        onOpenTx={() => {}}
        onViewAll={() => setRoute("activity")} />
    );
  } else if (route === "add-money") {
    screen = (
      <DepositPage
        onBack={() => setRoute("dashboard")}
        onToast={setToast}
        usdAccountStatus={usdAccountStatus}
        ngnIssuance={ngnIssuance}
        stablecoinIssuance={stablecoinIssuance}
        accountSuspended={accountStatus === "suspended"}
        fiatConvert={fiatConvert} />
    );
  } else if (route === "payments") {
    screen = (
      <SendPayment
        key={payMode}
        recipients={recipients}
        defaultMode={payMode}
        paymentApproval={paymentApproval}
        paymentApprovalMethod={paymentApprovalMethod}
        accountSuspended={accountStatus === "suspended"}
        dataState={dataState}
        onAddRecipient={() => setRoute("add-recipient")}
        onToast={setToast} />
    );
  } else if (route === "recipients") {
    screen = (
      <RecipientsScreen
        recipients={recipients}
        onDelete={(id) => setRecipients((prev) => prev.filter((r) => r.id !== id))}
        dataState={dataState}
        onAddNew={() => setRoute("add-recipient")}
        onPay={() => setRoute("payments")}
        onToast={setToast} />
    );
  } else if (route === "add-recipient") {
    screen = (
      <AddRecipientScreen
        nameLookupMock={nameLookupMock}
        onBack={() => setRoute("recipients")}
        onSaved={(newRecipient) => {
          setRecipients((prev) => [{ ...newRecipient, id: `r${Date.now()}`, last: "Never" }, ...prev]);
          setRoute("recipients");
        }}
        onToast={setToast} />
    );
  } else if (route === "activity" && openTx) {
    screen = <TransactionDetailScreen tx={openTx} onBack={() => setOpenTx(null)} onToast={setToast} />;
  } else if (route === "activity") {
    screen = (
      <TransactionsScreen
        dataState={dataState}
        complianceHold={complianceHold}
        onOpenTx={setOpenTx}
        onToast={setToast} />
    );
  } else if (route === "cards") {
    screen = <CardsScreen onToast={setToast} cardsAccess={cardsAccess} />;
  } else if (route === "settings") {
    screen = <SettingsScreen onToast={setToast} />;
  } else if (route === "developer") {
    screen = (
      <Page>
        <div className="page-head">
          <div><h1 className="title">Developer</h1><p className="subtitle">API keys, webhooks, and integration settings.</p></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DeveloperSection onToast={setToast} apiAccess={apiAccess} />
        </div>
      </Page>
    );
  } else {
    screen = <PlaceholderScreen title={route} />;
  }

  const navigate = (r) => { setRoute(r); setOpenTx(null); };

  return (
    <>
      <Shell active={route} onNavigate={navigate} mockControls={mockControls}>
        {screen}
      </Shell>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
