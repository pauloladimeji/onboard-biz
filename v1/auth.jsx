/* global React */
/* Auth / sign-in — adaptive port of v0/screens-onboarding.jsx (active flow only).
   Sign-up is off-app via Tally, so the signup/express-interest/status-gate screens
   stay v0-only reference material and are not ported here. */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;
const { useIsDesktop, QrCode, TALLY_URL } = window.OBPrimitives;

const SUPPORT_WA = "https://wa.me/14313404484";
const TOS_URL = "https://www.onboard.xyz/terms";
const PP_URL = "https://www.onboard.xyz/privacy-policy";
const LEGAL_TEXT = "Gopay Financial Services Inc. (dba Onboard Pay) is registered with FINTRAC as an MSB (RN: C100000565). Onboard Digital is registered with FinCEN as an MSB (RN: 31000293152346).";

function LegalConsent({ action = "continuing" }) {
  const link = (href, label) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gray-500)", textDecoration: "underline" }}>{label}</a>
  );
  return (
    <p style={{ fontSize: 11.5, color: "var(--gray-500)", textAlign: "center", lineHeight: 1.55, margin: "10px 0 0" }}>
      By {action}, you agree to our {link(TOS_URL, "Terms of Service")} and {link(PP_URL, "Privacy Policy")}.
    </p>
  );
}

function AuthInfoPanel() {
  const badges = [
    { flag: "🇺🇸", label: "FinCEN MSB" },
    { flag: "🇨🇦", label: "FINTRAC MSB" },
  ];
  return (
    <div className="auth-info-panel">
      <div style={{ marginTop: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
        <img src="../v0/design-system/assets/onboard-icon-512.png" alt="" style={{ width: 32, height: 32, mixBlendMode: "screen", display: "block" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 className="auth-info-tagline" style={{ margin: 0, textAlign: "center" }}>
            The modern way to move <span>money</span> across borders.
          </h2>
          <p className="auth-info-sub" style={{ margin: 0, textAlign: "center" }}>
            Fund in USD, GBP, EUR, NGN, or stablecoins. Pay out globally.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 }}>
            {["USD", "GBP", "EUR", "USDC", "USDT", "NGN", "GHS", "KES"].map(code => (
              <span key={code} style={{
                fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: 4, padding: "3px 7px", letterSpacing: "0.02em",
              }}>{code}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {badges.map(({ flag, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{flag}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop: split two-column (form left, marketing panel right). Mobile: single centered
// column, no right panel — same shell v0 used for its "centered" variant, tuned for phone widths.
function AuthShell({ children }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <div className="auth-split">
        <div className="auth-split-left">
          <div className="auth-centered-body">
            <div className="auth-card-wrap">{children}</div>
          </div>
          <div className="auth-centered-legal">{LEGAL_TEXT}</div>
        </div>
        <div className="auth-split-right"><AuthInfoPanel /></div>
      </div>
    );
  }
  return (
    <div className="auth-centered">
      <div className="auth-centered-logo">
        <img src="../v0/design-system/assets/onboard-logo-lockup-purple.png" alt="Onboard Business" />
      </div>
      <div className="auth-centered-body">
        <div className="auth-card-wrap">{children}</div>
      </div>
      <div className="auth-centered-legal">{LEGAL_TEXT}</div>
    </div>
  );
}

// =====================================================
// Apply for access — info page (no form; form is on Tally)
// =====================================================
function ApplyForAccessScreen({ onSignIn }) {
  const [showForm, setShowForm] = useState(false);
  const isDesktop = useIsDesktop();
  const steps = [
    { n: 1, title: "Complete the KYB form", desc: "Tell us about your business and use case. Takes about 5 minutes." },
    { n: 2, title: "Review & verification", desc: "We review your application and send KYC links to each UBO." },
    { n: 3, title: "Account provisioned", desc: "Once approved, your account is ready. Sign-in credentials arrive by email." },
  ];

  if (showForm) {
    const closeBtn = (
      <button onClick={() => setShowForm(false)} className="auth-iframe-close">✕ Close form</button>
    );
    const iframe = (
      <iframe
        src={`${TALLY_URL}?transparentBackground=1`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
        title="Onboard Business KYB Onboarding" />
    );
    if (!isDesktop) {
      return (
        <div className="auth-iframe-mobile">
          {closeBtn}
          {iframe}
        </div>
      );
    }
    return (
      <div className="auth-split">
        <div className="auth-split-left" style={{ padding: 0, overflow: "hidden", display: "block", position: "relative" }}>
          {closeBtn}
          {iframe}
        </div>
        <div className="auth-split-right"><AuthInfoPanel /></div>
      </div>
    );
  }

  return (
    <AuthShell>
      <h1>Apply for access</h1>
      <p className="auth-lede" style={{ marginBottom: 22 }}>
        Onboard Business is invite only. Apply to get started.
      </p>

      <button
        onClick={() => setShowForm(true)}
        className="btn btn-lg btn-block btn-dark"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
        Start your application
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><polyline points="9 18 15 12 9 6" /></svg>
      </button>
      <LegalConsent action="starting your application" />
      <div style={{ marginBottom: 26 }} />

      <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-800)", marginBottom: 14 }}>
          Here&rsquo;s how it works
        </div>
        {steps.map(({ n, title, desc }) => (
          <div key={n} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "var(--gray-100)", color: "var(--gray-600)",
              display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
            }}>{n}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-900)", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.55 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 18, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-800)", marginBottom: 10 }}>
          Have a question?
        </div>
        <a href={SUPPORT_WA} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 14px", borderRadius: 10,
          border: "1px solid #BBF7D0", background: "#F0FDF4",
          color: "#16A34A", fontSize: 13, fontWeight: 500, textDecoration: "none",
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          Chat with our team on WhatsApp
        </a>
      </div>

      <div className="auth-foot">
        Already have an account? <a onClick={onSignIn}>Sign in</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in — email entry
// =====================================================
function SignInScreen({ onSubmit, onApplyForAccess }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell>
      <h1>Sign in</h1>
      <p className="auth-lede">Sign in to your Onboard Business account</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Email address</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" autoFocus
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Continue
        </button>
        <LegalConsent action="continuing" />
      </form>

      <div className="auth-foot">
        No account? <a onClick={onApplyForAccess}>Apply for access →</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in password screen
// =====================================================
function SignInPasswordScreen({ email, onSubmit, onBack, onForgotPassword, onApplyForAccess, error }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const valid = password.length >= 1;

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(); };

  const EyeOff = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
  const EyeOn = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

  return (
    <AuthShell>
      <h1>Welcome back</h1>
      <p className="auth-lede" style={{ marginBottom: 24 }}>
        Signing in as{" "}
        <strong style={{ color: "var(--gray-900)" }}>{email}</strong>
        {" · "}
        <a onClick={onBack} style={{ color: "var(--info-700)", cursor: "pointer", fontWeight: 500 }}>Change</a>
      </p>

      <form onSubmit={submit}>
        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <label className="lbl" style={{ margin: 0 }}>Password</label>
            <a onClick={onForgotPassword} style={{ fontSize: 12.5, color: "var(--info-700)", cursor: "pointer", fontWeight: 500 }}>Forgot password?</a>
          </div>
          <div style={{ position: "relative" }}>
            <input className="inp" type={show ? "text" : "password"} placeholder="••••••••" autoFocus
                   value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 42 }} />
            <button type="button" onClick={() => setShow(!show)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-500)", padding: 4 }}>
              {show ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--danger-50,#FEF2F2)", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--danger-700,#B91C1C)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span>{error} <a onClick={onForgotPassword} style={{ color: "var(--danger-700,#B91C1C)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>Reset password</a></span>
          </div>
        )}

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Sign in
        </button>
      </form>

      <div className="auth-foot">
        No account? <a onClick={onApplyForAccess}>Apply for access</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Set password (magic-link activation)
// =====================================================
function SetPasswordScreen({ onSubmit }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const mismatch = confirm && password !== confirm;
  const valid = password.length >= 8 && password === confirm;

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(); };

  return (
    <AuthShell>
      <h1>Set your password</h1>
      <p className="auth-lede">Create a password to secure your Onboard account.</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Password</span>
            <span style={{ fontSize: 11.5, color: "var(--gray-500)", fontWeight: 400 }}>min 8 characters</span>
          </label>
          <div style={{ position: "relative" }}>
            <input className="inp" type={show ? "text" : "password"} placeholder="••••••••" autoFocus
                   value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 42 }} />
            <button type="button" onClick={() => setShow(!show)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-500)", padding: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>

        <div className="field">
          <label className="lbl">Confirm password</label>
          <input className="inp" type={show ? "text" : "password"} placeholder="••••••••"
                 value={confirm} onChange={(e) => setConfirm(e.target.value)}
                 style={{ borderColor: mismatch ? "var(--danger-700)" : "" }} />
          {mismatch && (
            <div style={{ fontSize: 12, color: "var(--danger-700)", marginTop: 5 }}>Passwords don&rsquo;t match</div>
          )}
        </div>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Set password and continue
        </button>
      </form>
    </AuthShell>
  );
}

// =====================================================
// Forgot password
// =====================================================
function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const valid = email.includes("@") && email.includes(".");
  const submit = (e) => { e.preventDefault(); if (valid) setSent(true); };

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#EFF6FF", color: "var(--info-700)",
            display: "grid", placeItems: "center", margin: "0 auto 22px",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
          </div>
          <h1 style={{ marginBottom: 10 }}>Check your email</h1>
          <p className="auth-lede" style={{ marginBottom: 28 }}>
            If <strong style={{ color: "var(--gray-900)" }}>{email}</strong> is registered, you'll find a reset link in your inbox. It expires in 30 minutes.
          </p>
          <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 12, padding: "14px 18px", textAlign: "left", fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6 }}>
            Didn&rsquo;t get it? Check your spam folder, or{" "}
            <a onClick={() => setSent(false)} style={{ color: "var(--info-700)", cursor: "pointer", fontWeight: 500 }}>try a different email</a>.
          </div>
        </div>
        <div className="auth-foot">
          <a onClick={onBack} style={{ color: "var(--gray-600)" }}>← Back to sign in</a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1>Reset your password</h1>
      <p className="auth-lede">Enter your email and we&rsquo;ll send a reset link.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Email address</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" autoFocus
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Send reset link
        </button>
      </form>
      <div className="auth-foot">
        <a onClick={onBack} style={{ color: "var(--gray-600)" }}>← Back to sign in</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Shared 6-digit code input — TOTP verify + TOTP setup
// =====================================================
function OtpBoxes({ digits, setDigits }) {
  const refs = useRef([]);
  useEffect(() => { if (refs.current[0]) refs.current[0].focus(); }, []);

  const setAt = (i, v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      arr.forEach((ch, idx) => { next[idx] = ch; });
      setDigits(next);
      const lastIdx = Math.min(arr.length, 5);
      if (refs.current[lastIdx]) refs.current[lastIdx].focus();
      return;
    }
    const next = [...digits]; next[i] = clean; setDigits(next);
    if (clean && i < 5 && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1].focus();
  };

  return (
    <div className="otp-row">
      {digits.map((d, i) => (
        <input key={i}
               ref={(el) => refs.current[i] = el}
               className={`otp-cell ${d ? "filled" : ""}`}
               inputMode="numeric" maxLength={1}
               value={d}
               onChange={(e) => setAt(i, e.target.value)}
               onKeyDown={(e) => onKey(i, e)} />
      ))}
    </div>
  );
}

// =====================================================
// TOTP verify — returning users, 2FA already set up
// =====================================================
function TotpVerifyScreen({ onSubmit, onBack, onLostAccess }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeStr = code.join("");
  const valid = codeStr.length === 6;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(codeStr); };

  return (
    <AuthShell>
      <h1>Two-factor authentication</h1>
      <p className="auth-lede">Open your authenticator app and enter the 6-digit code for Onboard.</p>

      <form onSubmit={submit}>
        <div style={{ margin: "8px 0 20px" }}>
          <OtpBoxes digits={code} setDigits={setCode} />
        </div>
        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Verify
        </button>
      </form>

      <div className="auth-foot">
        <a onClick={onBack} style={{ color: "var(--gray-600)" }}>← Use a different account</a>
      </div>
      {onLostAccess && (
        <div className="auth-foot" style={{ marginTop: 14 }}>
          <a onClick={onLostAccess} style={{ color: "var(--info-700)", textDecoration: "underline" }}>I have lost access to my authenticator app</a>
        </div>
      )}
    </AuthShell>
  );
}

// =====================================================
// TOTP recovery — lost-access flow
// =====================================================

// Upfront disclosure (Paul's flag): tell the user about the 24h withdrawal hold BEFORE they
// commit, not just after re-setup — so a business can decide whether to reset now or wait.
function AuthHoldNotice({ tone = "warning", title, children }) {
  const iconMap = { warning: <Icon.shield />, done: <Icon.clock /> };
  return (
    <div className={`auth-hold-notice ${tone}`}>
      <div className="auth-hold-notice-ic">{iconMap[tone]}</div>
      <div>
        <div className="auth-hold-notice-title">{title}</div>
        <div className="auth-hold-notice-body">{children}</div>
      </div>
    </div>
  );
}

function TotpRecoveryStartScreen({ onContinue, onBack }) {
  return (
    <AuthShell>
      <h1>Reset your authenticator</h1>
      <p className="auth-lede">We'll email a recovery link to your registered email so you can set up a new authenticator.</p>

      <AuthHoldNotice tone="warning" title="This will pause withdrawals for 24 hours">
        This is a security measure to protect your account — deposits and everything else continue as normal.
      </AuthHoldNotice>

      <button className="btn btn-lg btn-block btn-dark" onClick={onContinue} style={{ marginTop: 20 }}>
        Email me a recovery link
      </button>
      <div className="auth-foot">
        <a onClick={onBack} style={{ color: "var(--gray-600)" }}>← Back</a>
      </div>
    </AuthShell>
  );
}

function TotpRecoverySentScreen({ onBack }) {
  return (
    <AuthShell>
      <h1>Check your email</h1>
      <p className="auth-lede">A recovery link has been sent to your registered email. Follow the instructions to set up a new authenticator.</p>

      <div className="auth-hold-reminder">
        Reminder: withdrawals are held for 24 hours once your new authenticator is set up.
      </div>

      <div className="auth-foot" style={{ marginTop: 20 }}>
        <a onClick={onBack} style={{ color: "var(--gray-600)" }}>← Back to sign in</a>
      </div>
    </AuthShell>
  );
}

function TotpRecoveryInvalidScreen({ onRequestNew, onBackToSignIn }) {
  return (
    <AuthShell>
      <div className="auth-status-icon danger"><Icon.alert /></div>
      <h1>This recovery link is invalid</h1>
      <p className="auth-lede">It may have expired or already been used. Request a new one below — no need to sign in again.</p>
      <button className="btn btn-lg btn-block btn-dark" onClick={onRequestNew} style={{ marginTop: 20 }}>
        Send me a new recovery link
      </button>
      <div className="auth-foot">
        <a onClick={onBackToSignIn} style={{ color: "var(--gray-600)" }}>← Back to sign in</a>
      </div>
    </AuthShell>
  );
}

function TotpRecoveryDoneScreen({ onContinue, holdUntilLabel }) {
  return (
    <AuthShell>
      <div className="auth-status-icon success"><Icon.check /></div>
      <h1>Authenticator reset</h1>
      <p className="auth-lede">Your new authenticator is set up — use it to sign in from now on.</p>

      <AuthHoldNotice tone="done" title={`Withdrawals paused until ${holdUntilLabel}`}>
        As a security measure after an authenticator reset, withdrawals are on hold for 24 hours.
        Everything else on your account works as normal.
      </AuthHoldNotice>

      <button className="btn btn-lg btn-block btn-dark" onClick={onContinue} style={{ marginTop: 20 }}>
        Continue to dashboard
      </button>
    </AuthShell>
  );
}

// =====================================================
// TOTP setup — first sign-in
// =====================================================
// Reused as-is for TOTP recovery (setting up a replacement authenticator) — same component,
// same copy, no recovery-specific variant. Keeps the two flows visually and behaviourally
// identical, which is the point: recovery is "do the setup screen again," not a different screen.
function TotpSetupScreen({ onSubmit, onSkip, email }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const mockSecret = "JBSWY3DPEHPK3PXP";
  const otpauth = `otpauth://totp/Onboard:${email || "you@company.com"}?secret=${mockSecret}&issuer=Onboard`;

  const codeStr = code.join("");
  const valid = codeStr.length === 6;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(codeStr); };

  return (
    <AuthShell>
      <h1>Secure your account</h1>
      <p className="auth-lede">Set up two-factor authentication with an authenticator app</p>

      <div className="totp-setup-body">
        <div className="totp-steps">
          <div className="totp-instruction">
            <div className="totp-instruction-num">1</div>
            <div>
              <div className="totp-instruction-text">Download an authenticator app</div>
              <div className="totp-instruction-sub">Google Authenticator, Authy, or 1Password</div>
            </div>
          </div>
          <div className="totp-instruction">
            <div className="totp-instruction-num">2</div>
            <div>
              <div className="totp-instruction-text">Scan the QR code or enter the key manually</div>
            </div>
          </div>
        </div>

        <div className="totp-qr-section">
          <div className="totp-qr-placeholder">
            <QrCode value={otpauth} size={120} />
          </div>

          <div className="totp-manual-key">
            <div className="totp-manual-label">Or enter this key manually</div>
            <div className="totp-manual-value">
              <span>{mockSecret}</span>
              <button className="totp-copy-btn" onClick={() => {}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="totp-verify-section">
          <div className="totp-instruction">
            <div className="totp-instruction-num">3</div>
            <div>
              <div className="totp-instruction-text">Enter the 6-digit code from your app</div>
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ margin: "12px 0 20px" }}>
              <OtpBoxes digits={code} setDigits={setCode} />
            </div>
            <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
              Verify and finish
            </button>
          </form>
        </div>
      </div>

      {onSkip && (
        <div className="auth-foot">
          <a onClick={onSkip} style={{ color: "var(--gray-600)" }}>Skip for now</a>
        </div>
      )}
    </AuthShell>
  );
}

window.OBAuth = {
  ApplyForAccessScreen,
  SignInScreen,
  SignInPasswordScreen,
  ForgotPasswordScreen,
  TotpVerifyScreen,
  TotpSetupScreen,
  SetPasswordScreen,
  TotpRecoveryStartScreen,
  TotpRecoverySentScreen,
  TotpRecoveryInvalidScreen,
  TotpRecoveryDoneScreen,
};
