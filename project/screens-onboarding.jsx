/* global React */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;

// =====================================================
// Sign-up — single email field
// =====================================================
function AuthShell({ children }) {
  return (
    <div className="auth-split">
      <div className="auth-hero">
        <div className="auth-hero-logo">
          <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
        </div>
        <div className="auth-hero-body">
          <h2>Beyond Borders.<br />Built for Business.</h2>
          <p>Take control of global payments with an all-in-one multi-currency account designed for growth, security, and efficiency.</p>
        </div>
        <div className="auth-hero-quote">
          <p>“Settlement that used to take days now lands the same morning. Onboard cleaned up our entire treasury workflow.”</p>
          <div className="auth-hero-cite">
            <span className="f" style={{backgroundImage: "url(design-system/assets/flags/ng.svg)"}} />
            <strong>Adaeze Okafor</strong> · CFO, Mensah Holdings
          </div>
        </div>
      </div>
      <div className="auth-form-pane">
        <div className="auth-form-wrap">{children}</div>
        <div className="auth-foot-legal">
          Onboard Payments Inc. is registered with FinCEN as an MSB (Rn: 31000231722151). Onboard Payments Ltd. is authorised by the FCA as an EMI under FRN 931425.
        </div>
      </div>
    </div>
  );
}

function SignUpScreen({ onSubmit, onSwitchToSignIn }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell>
      <h1>Create your account</h1>
      <p className="lede">Enter your work email to get started</p>

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
// Register business — step 3 of sign-up (after OTP)
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
    <AuthShell>
      <h1>Set up your business</h1>
      <p className="lede">A few details to open your account</p>

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
          Create account
        </button>
      </form>

      <div className="auth-foot" style={{fontSize: 12, color: "var(--gray-500)"}}>
        Signing up as <strong style={{color: "var(--gray-700)"}}>{email}</strong>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in — email field, then OTP
// =====================================================
function SignInScreen({ onSubmit, onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell>
      <h1>Welcome back</h1>
      <p className="lede">Sign in below to continue</p>

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
function OtpScreen({ email, mode, onSubmit, onChangeEmail, onResend }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secs, setSecs] = useState(30);
  const refs = useRef([]);

  useEffect(() => {
    if (refs.current[0]) refs.current[0].focus();
  }, []);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const setAt = (i, v) => {
    const clean = v.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      // paste handling
      const arr = clean.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      arr.forEach((ch, idx) => { next[idx] = ch; });
      setDigits(next);
      const lastIdx = Math.min(arr.length, 5);
      if (refs.current[lastIdx]) refs.current[lastIdx].focus();
      return;
    }
    const next = [...digits]; next[i] = clean; setDigits(next);
    if (clean && i < 5 && refs.current[i+1]) refs.current[i+1].focus();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i-1].focus();
  };

  const code = digits.join("");
  const valid = code.length === 6;
  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(code); };

  const resend = () => { onResend && onResend(); setSecs(30); };

  return (
    <AuthShell>
      <h1>{mode === "signup" ? "Verify your email" : "Enter your code"}</h1>
        <p className="lede">
          We sent a 6-digit code to <strong style={{color:"var(--gray-900)"}}>{email}</strong>.<br />
          It expires in 10 minutes.
        </p>

        <form onSubmit={submit}>
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

window.OBOnboarding = { SignUpScreen, SignInScreen, OtpScreen, RegisterBusinessScreen };
