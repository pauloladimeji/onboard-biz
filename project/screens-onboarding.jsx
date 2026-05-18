/* global React */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;

// =====================================================
// Centered auth shell — no card, Stripe/Linear style
// =====================================================
function AuthShell({ children, step, totalSteps }) {
  return (
    <div className="auth-centered">
      <div className="auth-centered-logo">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>

      {totalSteps > 1 && (
        <div className="auth-stepper">
          {Array.from({ length: totalSteps }, (_, i) => {
            const s = i + 1;
            const labels = ["Account", "Business", "Security"];
            return (
              <React.Fragment key={s}>
                {i > 0 && <div className={`auth-stepper-line ${s <= step ? "done" : ""}`} />}
                <div className={`auth-stepper-step ${s === step ? "active" : s < step ? "done" : ""}`}>
                  <div className="auth-stepper-dot">
                    {s < step ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : s}
                  </div>
                  <span className="auth-stepper-label">{labels[i]}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="auth-card-wrap">
        {children}
      </div>

      <div className="auth-centered-legal">
        Onboard Payments Inc. is registered with FinCEN as an MSB (Rn: 31000231722151). Onboard Payments Ltd. is authorised by the FCA as an EMI under FRN 931425.
      </div>
    </div>
  );
}

// =====================================================
// Sign-up — email field (step 1)
// =====================================================
function SignUpScreen({ onSubmit, onSwitchToSignIn }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell step={1} totalSteps={3}>
      <h1>Create your account</h1>
      <p className="auth-lede">Enter your work email to get started</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Work email</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" value={email} onChange={(e)=>setEmail(e.target.value)} autoFocus />
        </div>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Continue
        </button>
      </form>

      <div className="auth-foot">
        Already have an account? <a onClick={onSwitchToSignIn}>Sign in</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Register business — step 2 of sign-up (after OTP)
// =====================================================
const SIGNUP_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "Tanzania", "Mozambique",
  "United Kingdom", "United States", "Canada", "Australia",
  "South Africa", "Germany", "France", "Netherlands", "Singapore",
  "United Arab Emirates", "Other",
];

function RegisterBusinessScreen({ email, onSubmit }) {
  const [fullName, setFullName] = useState("");
  const [bizName, setBizName] = useState("");
  const [country, setCountry] = useState("");
  const [agreed, setAgreed] = useState(false);

  const valid = fullName.trim().length > 1 && bizName.trim().length > 1 && country && agreed;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ fullName, bizName, country }); };

  return (
    <AuthShell step={2} totalSteps={3}>
      <h1>Set up your business</h1>
      <p className="auth-lede">A few details to open your account</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Your full name</label>
          <input className="inp" placeholder="Adaeze Okafor" value={fullName} onChange={(e)=>setFullName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label className="lbl">Business name</label>
          <input className="inp" placeholder="Acme Trading Co" value={bizName} onChange={(e)=>setBizName(e.target.value)} />
        </div>
        <div className="field">
          <label className="lbl">Country of registration</label>
          <select className="inp" value={country} onChange={(e)=>setCountry(e.target.value)} style={{appearance:"auto"}}>
            <option value="">Select country</option>
            {SIGNUP_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <label style={{display:"flex", gap:10, alignItems:"flex-start", margin:"6px 0 18px", fontSize: 12.5, color: "var(--gray-700)", lineHeight: 1.5, cursor:"pointer"}}>
          <input type="checkbox" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)}
                 style={{marginTop: 2, width: 16, height: 16, accentColor: "#0F172A"}} />
          <span>I&rsquo;m authorised to open an account for this business and agree to the <a style={{color:"var(--info-700)", textDecoration:"none"}}>Terms</a> and <a style={{color:"var(--info-700)", textDecoration:"none"}}>Privacy Notice</a>.</span>
        </label>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Continue
        </button>
      </form>

      <div className="auth-foot" style={{fontSize: 12, color: "var(--gray-500)"}}>
        Signing up as <strong style={{color: "var(--gray-700)"}}>{email}</strong>
      </div>
    </AuthShell>
  );
}

// =====================================================
// TOTP setup — step 3 of sign-up
// =====================================================
function TotpSetupScreen({ onSubmit, onSkip }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);
  const mockSecret = "JBSWY3DPEHPK3PXP";
  const mockQR = null; // placeholder — we'll render a visual stand-in

  useEffect(() => {
    if (refs.current[0]) refs.current[0].focus();
  }, []);

  const setAt = (i, v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      arr.forEach((ch, idx) => { next[idx] = ch; });
      setCode(next);
      const lastIdx = Math.min(arr.length, 5);
      if (refs.current[lastIdx]) refs.current[lastIdx].focus();
      return;
    }
    const next = [...code]; next[i] = clean; setCode(next);
    if (clean && i < 5 && refs.current[i+1]) refs.current[i+1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i-1].focus();
  };

  const codeStr = code.join("");
  const valid = codeStr.length === 6;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(codeStr); };

  return (
    <AuthShell step={3} totalSteps={3}>
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
            <svg width="120" height="120" viewBox="0 0 120 120">
              <rect width="120" height="120" rx="8" fill="#F1F5F9"/>
              <g transform="translate(20,20)" fill="#94A3B8">
                <rect x="0" y="0" width="8" height="8"/><rect x="10" y="0" width="8" height="8"/><rect x="20" y="0" width="8" height="8"/><rect x="30" y="0" width="8" height="8"/><rect x="40" y="0" width="8" height="8"/><rect x="50" y="0" width="8" height="8"/><rect x="60" y="0" width="8" height="8"/><rect x="70" y="0" width="8" height="8"/>
                <rect x="0" y="10" width="8" height="8"/><rect x="20" y="10" width="8" height="8"/><rect x="30" y="10" width="8" height="8"/><rect x="50" y="10" width="8" height="8"/><rect x="70" y="10" width="8" height="8"/>
                <rect x="0" y="20" width="8" height="8"/><rect x="10" y="20" width="8" height="8"/><rect x="40" y="20" width="8" height="8"/><rect x="60" y="20" width="8" height="8"/><rect x="70" y="20" width="8" height="8"/>
                <rect x="0" y="30" width="8" height="8"/><rect x="20" y="30" width="8" height="8"/><rect x="40" y="30" width="8" height="8"/><rect x="50" y="30" width="8" height="8"/><rect x="70" y="30" width="8" height="8"/>
                <rect x="10" y="40" width="8" height="8"/><rect x="30" y="40" width="8" height="8"/><rect x="50" y="40" width="8" height="8"/><rect x="60" y="40" width="8" height="8"/>
                <rect x="0" y="50" width="8" height="8"/><rect x="20" y="50" width="8" height="8"/><rect x="30" y="50" width="8" height="8"/><rect x="40" y="50" width="8" height="8"/><rect x="60" y="50" width="8" height="8"/><rect x="70" y="50" width="8" height="8"/>
                <rect x="0" y="60" width="8" height="8"/><rect x="10" y="60" width="8" height="8"/><rect x="30" y="60" width="8" height="8"/><rect x="50" y="60" width="8" height="8"/><rect x="60" y="60" width="8" height="8"/><rect x="70" y="60" width="8" height="8"/>
                <rect x="0" y="70" width="8" height="8"/><rect x="20" y="70" width="8" height="8"/><rect x="40" y="70" width="8" height="8"/><rect x="60" y="70" width="8" height="8"/><rect x="70" y="70" width="8" height="8"/>
              </g>
            </svg>
          </div>

          <div className="totp-manual-key">
            <div className="totp-manual-label">Or enter this key manually</div>
            <div className="totp-manual-value">
              <span>{mockSecret}</span>
              <button className="totp-copy-btn" onClick={() => {}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
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
            <div className="otp-row" style={{margin: "12px 0 20px"}}>
              {code.map((d, i) => (
                <input key={i}
                       ref={(el) => refs.current[i] = el}
                       className={`otp-cell ${d ? "filled" : ""}`}
                       inputMode="numeric" maxLength={1}
                       value={d}
                       onChange={(e) => setAt(i, e.target.value)}
                       onKeyDown={(e) => onKey(i, e)} />
              ))}
            </div>

            <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
              Verify and finish
            </button>
          </form>
        </div>
      </div>

      {onSkip && (
        <div className="auth-foot">
          <a onClick={onSkip} style={{color: "var(--gray-600)"}}>Skip for now</a>
        </div>
      )}
    </AuthShell>
  );
}

// =====================================================
// Sign-in — email field, no stepper
// =====================================================
function SignInScreen({ onSubmit, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell step={1} totalSteps={1}>
      <h1>Welcome back</h1>
      <p className="auth-lede">Sign in below to continue</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Email Address</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" autoFocus
                 value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Sign in
        </button>
      </form>

      <div className="auth-foot">
        New to Onboard? <a onClick={onSwitchToSignUp}>Create account</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// OTP entry — used for both sign-up + sign-in
// =====================================================
function OtpScreen({ email, mode, step, totalSteps, onSubmit, onChangeEmail, onResend }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secs, setSecs] = useState(30);
  const refsArr = useRef([]);

  useEffect(() => {
    if (refsArr.current[0]) refsArr.current[0].focus();
  }, []);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const setAt = (i, v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      arr.forEach((ch, idx) => { next[idx] = ch; });
      setDigits(next);
      const lastIdx = Math.min(arr.length, 5);
      if (refsArr.current[lastIdx]) refsArr.current[lastIdx].focus();
      return;
    }
    const next = [...digits]; next[i] = clean; setDigits(next);
    if (clean && i < 5 && refsArr.current[i+1]) refsArr.current[i+1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refsArr.current[i-1].focus();
  };

  const codeVal = digits.join("");
  const valid = codeVal.length === 6;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(codeVal); };
  const resend = () => { onResend && onResend(); setSecs(30); };

  return (
    <AuthShell step={step || 1} totalSteps={totalSteps || 1}>
      <h1>{mode === "signup" ? "Verify your email" : "Enter your code"}</h1>
      <p className="auth-lede">
        We sent a 6-digit code to <strong style={{color:"var(--gray-900)"}}>{email}</strong>.<br />
        It expires in 10 minutes.
      </p>

      <form onSubmit={submit}>
        <div className="otp-row">
          {digits.map((d, i) => (
            <input key={i}
                   ref={(el) => refsArr.current[i] = el}
                   className={`otp-cell ${d ? "filled" : ""}`}
                   inputMode="numeric" maxLength={1}
                   value={d}
                   onChange={(e) => setAt(i, e.target.value)}
                   onKeyDown={(e) => onKey(i, e)} />
          ))}
        </div>

        <div style={{textAlign:"center", margin:"18px 0 22px", fontSize: 12.5, color:"var(--gray-600)"}}>
          {secs > 0
            ? <>Didn&rsquo;t get it? Resend in <strong style={{color:"var(--gray-900)"}}>0:{String(secs).padStart(2,"0")}</strong></>
            : <a onClick={resend} style={{color:"var(--info-700)", cursor:"pointer", fontWeight: 500, textDecoration:"none"}}>Resend code</a>
          }
        </div>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          {mode === "signup" ? "Verify and continue" : "Sign in"}
        </button>
      </form>

      <div className="auth-foot">
        Wrong email? <a onClick={onChangeEmail}>Use a different one</a>
      </div>
    </AuthShell>
  );
}

window.OBOnboarding = { SignUpScreen, SignInScreen, OtpScreen, RegisterBusinessScreen, TotpSetupScreen };
