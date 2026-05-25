/* global React */
const { useState, useEffect, useRef } = React;
const Icon = window.OBIcon;

// =====================================================
// Centered auth shell
// =====================================================
function AuthShellCentered({ children, step, totalSteps }) {
  return (
    <div className="auth-centered">
      <div className="auth-centered-logo">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>

      {totalSteps > 1 && (
        <AuthStepper step={step} totalSteps={totalSteps} />
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
// Split auth shell — left = form, right = info panel
// =====================================================
function AuthInfoPanel() {
  return (
    <div className="auth-info-panel">
      <div className="auth-info-logo">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>
      <h2 className="auth-info-tagline" style={{margin: "auto 0"}}>
        The modern way to move <span>money</span>.
      </h2>
      <div className="auth-info-licenses" style={{marginBottom: "auto", paddingTop: 20}}>
        {["FinCEN", "VASP", "SEC", "CBN"].map(name => (
          <div key={name} className="auth-info-license">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthInfoPanelSignUp() {
  const steps = [
    { n: 1, title: "Apply", desc: "Fill in your details. We'll review within the hour." },
    { n: 2, title: "Verify", desc: "We'll send you a KYB link to confirm your business — typically done within a day." },
    { n: 3, title: "Access", desc: "Your Onboard account is ready. Fund in USD and pay out across borders." },
  ];
  return (
    <div className="auth-info-panel">
      <div className="auth-info-logo">
        <img src="design-system/assets/onboard-logo-lockup-purple.png?v=1778066455523" alt="Onboard Business" />
      </div>
      <h2 className="auth-info-tagline">
        Built for businesses moving money <span>across borders</span>.
      </h2>
      <p style={{fontSize: 13.5, color: "rgba(255,255,255,.55)", marginBottom: 36, lineHeight: 1.55}}>
        We&rsquo;re selective about who we work with. Here&rsquo;s what to expect.
      </p>
      <div className="auth-info-steps">
        {steps.map(({ n, title, desc }) => (
          <div key={n} className="auth-info-step">
            <div className="auth-info-step-num">{n}</div>
            <div>
              <div className="auth-info-step-title">{title}</div>
              <div className="auth-info-step-desc">{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="auth-info-licenses" style={{marginTop: "auto"}}>
        {["FinCEN", "VASP", "SEC", "CBN"].map(name => (
          <div key={name} className="auth-info-license">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthShellSplit({ children, step, totalSteps, variant }) {
  return (
    <div className="auth-split">
      <div className="auth-split-left">
        {totalSteps > 1 && (
          <AuthStepper step={step} totalSteps={totalSteps} />
        )}

        <div className="auth-card-wrap">
          {children}
        </div>

        <div className="auth-centered-legal">
          Onboard Payments Inc. is registered with FinCEN as an MSB (Rn: 31000231722151). Onboard Payments Ltd. is authorised by the FCA as an EMI under FRN 931425.
        </div>
      </div>
      <div className="auth-split-right">
        {variant === "signup" ? <AuthInfoPanelSignUp /> : <AuthInfoPanel />}
      </div>
    </div>
  );
}

// =====================================================
// Shared stepper
// =====================================================
function AuthStepper({ step, totalSteps }) {
  const labels = ["Account", "Business", "Security"];
  return (
    <div className="auth-stepper">
      {Array.from({ length: totalSteps }, (_, i) => {
        const s = i + 1;
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
  );
}

// =====================================================
// AuthShell — delegates to centered or split
// =====================================================
function AuthShell({ children, step, totalSteps, layout, variant }) {
  if (layout === "split") {
    return <AuthShellSplit step={step} totalSteps={totalSteps} variant={variant}>{children}</AuthShellSplit>;
  }
  return <AuthShellCentered step={step} totalSteps={totalSteps}>{children}</AuthShellCentered>;
}

// =====================================================
// Express interest (sign-up)
// =====================================================
const SIGNUP_SECTORS = [
  "Fintech & financial services",
  "E-commerce & retail",
  "Import / export & trade",
  "Professional services",
  "Media & entertainment",
  "Healthcare",
  "Education",
  "Technology",
  "Logistics & supply chain",
  "Real estate",
  "Agriculture",
  "Other",
];

const SIGNUP_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "Tanzania", "Mozambique", "Uganda", "Rwanda",
  "South Africa", "Egypt", "Ethiopia",
  "United Kingdom", "United States", "Canada", "Australia",
  "Germany", "France", "Netherlands", "Switzerland", "Sweden",
  "Singapore", "United Arab Emirates", "India", "Other",
];

function ExpressInterestScreen({ onSubmit, onSwitchToSignIn, layout }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [bizName, setBizName]     = useState("");
  const [bizSector, setBizSector] = useState("");
  const [bizCountry, setBizCountry] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");
  const [agreed, setAgreed]       = useState(false);

  const valid = firstName.trim() && lastName.trim()
    && email.includes("@") && email.includes(".")
    && bizName.trim() && bizSector && bizCountry && agreed;

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ firstName, lastName, email, phone, bizName, bizSector, bizCountry, bizWebsite }); };

  return (
    <AuthShell step={1} totalSteps={1} layout={layout} variant="signup">
      <h1>Apply for access</h1>
      <p className="auth-lede">Tell us about your business and we&rsquo;ll be in touch.</p>

      <form onSubmit={submit}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
          <div className="field" style={{marginBottom:0}}>
            <label className="lbl">First name</label>
            <input className="inp" placeholder="Adaeze" value={firstName} onChange={(e)=>setFirstName(e.target.value)} autoFocus />
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="lbl">Last name</label>
            <input className="inp" placeholder="Okafor" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="lbl">Work email</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>

        <div className="field">
          <label className="lbl">
            Phone <span style={{color:"var(--gray-500)", fontWeight:400}}>— optional</span>
          </label>
          <input className="inp" type="tel" placeholder="+234 801 234 5678" value={phone} onChange={(e)=>setPhone(e.target.value)} />
        </div>

        <div className="field">
          <label className="lbl">Business name</label>
          <input className="inp" placeholder="Acme Trading Co." value={bizName} onChange={(e)=>setBizName(e.target.value)} />
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
          <div className="field" style={{marginBottom:0}}>
            <label className="lbl">Sector</label>
            <select className="inp" value={bizSector} onChange={(e)=>setBizSector(e.target.value)} style={{appearance:"auto"}}>
              <option value="">Select sector</option>
              {SIGNUP_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label className="lbl">Country of registration</label>
            <select className="inp" value={bizCountry} onChange={(e)=>setBizCountry(e.target.value)} style={{appearance:"auto"}}>
              <option value="">Select country</option>
              {SIGNUP_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="lbl">
            Website <span style={{color:"var(--gray-500)", fontWeight:400}}>— optional</span>
          </label>
          <input className="inp" type="url" placeholder="https://acmetrading.com" value={bizWebsite} onChange={(e)=>setBizWebsite(e.target.value)} />
        </div>

        <label style={{display:"flex", gap:10, alignItems:"flex-start", margin:"4px 0 20px", fontSize:12.5, color:"var(--gray-700)", lineHeight:1.5, cursor:"pointer"}}>
          <input type="checkbox" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)}
                 style={{marginTop:2, width:16, height:16, accentColor:"#0F172A", flexShrink:0}} />
          <span>I&rsquo;m authorised to open an account for this business and agree to the <a style={{color:"var(--info-700)", textDecoration:"none"}}>Terms</a> and <a style={{color:"var(--info-700)", textDecoration:"none"}}>Privacy Notice</a>.</span>
        </label>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Submit application
        </button>
      </form>

      <div className="auth-foot">
        Already have access? <a onClick={onSwitchToSignIn}>Sign in</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-up confirmation
// =====================================================
function SignUpConfirmationScreen({ email, onSignIn, layout }) {
  return (
    <AuthShell step={1} totalSteps={1} layout={layout} variant="signup">
      <div style={{textAlign:"center", padding:"12px 0 20px"}}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"#ECFDF5", color:"var(--success-700)",
          display:"grid", placeItems:"center", margin:"0 auto 22px",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h1 style={{marginBottom:10}}>Application received</h1>
        <p className="auth-lede" style={{marginBottom:28}}>
          Thanks — we&rsquo;ve got your details. We&rsquo;ll review within the hour and reach out to{" "}
          <strong style={{color:"var(--gray-900)"}}>{email}</strong> with next steps.
        </p>

        <div style={{background:"var(--gray-50,#F8FAFC)", border:"1px solid var(--gray-200)", borderRadius:12, padding:"16px 20px", textAlign:"left", fontSize:13, color:"var(--gray-700)", lineHeight:1.6}}>
          <strong style={{color:"var(--gray-900)", display:"block", marginBottom:6}}>What happens next</strong>
          If your business is a good fit, we&rsquo;ll send a KYB verification link to confirm your identity and business details. The whole process typically takes under a day.
        </div>
      </div>

      <div className="auth-foot">
        Already verified? <a onClick={onSignIn}>Sign in</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in — email entry
// =====================================================
function SignInScreen({ onSubmit, onSwitchToSignUp, layout }) {
  const [email, setEmail] = useState("");
  const valid = email.includes("@") && email.includes(".");

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit({ email }); };

  return (
    <AuthShell step={1} totalSteps={1} layout={layout}>
      <h1>Sign in</h1>
      <p className="auth-lede">Enter your email to continue</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Email address</label>
          <input className="inp" type="email" placeholder="finance@acmetrading.com" autoFocus
                 value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Continue
        </button>
      </form>

      <div className="auth-foot">
        No account yet? <a onClick={onSwitchToSignUp}>Apply for access</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in status gate — shown after email lookup
// =====================================================
function SignInStatusScreen({ email, status, onSignUp, onChangeEmail, layout }) {
  const STATUS = {
    unknown: {
      bg: "var(--gray-100)", ic: "var(--gray-600)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ),
      title: "We don’t recognise this email",
      body: "This email isn’t associated with an Onboard Business account. To get access, submit an application and our team will review it.",
      primary: { label: "Apply for access", action: "signup" },
      secondary: { label: "Try Onboard for individuals →", action: "consumer" },
    },
    pending_review: {
      bg: "var(--info-100)", ic: "var(--info-700)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ),
      title: "Application under review",
      body: "We're reviewing whether Onboard is the right fit for your business - this usually takes under an hour. If it is, we'll send a KYB verification link to your email.",
      secondary: { label: "Contact support →", action: "support" },
    },
    rejected: {
      bg: "var(--danger-100)", ic: "var(--danger-700)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      ),
      title: "We’re unable to move forward",
      body: "Unfortunately we’re not able to open a business account for this email at this time. If you’re looking for personal international transfers, Onboard for individuals may be a better fit.",
      secondary: { label: "Try Onboard mobile app →", action: "consumer" },
    },
    sumsub_pending: {
      bg: "#FEF3C7", ic: "#B45309",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      ),
      title: "Verification in progress",
      body: "Check your inbox - we sent a link to complete your KYB verification with our compliance partner.\n\nHaven't received it, or filled it over 24 hours ago without getting a response? Get in touch and we'll sort it out.",
      secondary: { label: "Contact support →", action: "support" },
    },
    verified_no_password: {
      bg: "var(--info-100)", ic: "var(--info-700)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      ),
      title: "Check your inbox",
      body: `We sent an account setup link to ${email}. Click it to set your password and get started.\n\nCan’t find it? Check your spam folder first. If it’s still not there, contact support and we’ll send a new one.`,
      secondary: { label: "Contact support →", action: "support" },
    },
  };

  const cfg = STATUS[status] || STATUS.unknown;

  const handleAction = (action) => {
    if (action === "signup") onSignUp && onSignUp();
    // consumer, support, resend — mock only; no-op
  };

  return (
    <AuthShell step={1} totalSteps={1} layout={layout}>
      <div style={{textAlign:"center", padding:"8px 0 16px"}}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background: cfg.bg, color: cfg.ic,
          display:"grid", placeItems:"center", margin:"0 auto 20px",
        }}>
          {cfg.icon}
        </div>

        <h1 style={{marginBottom:10, fontSize:22}}>{cfg.title}</h1>
        <p className="auth-lede" style={{marginBottom:28, whiteSpace:"pre-line"}}>
          {cfg.body}
        </p>

        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {cfg.primary && (
            <button className="btn btn-lg btn-block btn-dark" onClick={() => handleAction(cfg.primary.action)}>
              {cfg.primary.label}
            </button>
          )}
          {cfg.secondary && (
            <a style={{fontSize:13.5, color:"var(--info-700)", cursor:"pointer", fontWeight:500}} onClick={() => handleAction(cfg.secondary.action)}>
              {cfg.secondary.label}
            </a>
          )}
        </div>
      </div>

      <div className="auth-foot" style={{marginTop:28}}>
        <a onClick={onChangeEmail} style={{color:"var(--gray-600)"}}>
          ← Use a different email
        </a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Sign-in password screen (verified_active path)
// =====================================================
function SignInPasswordScreen({ email, onSubmit, onBack, layout }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const valid = password.length >= 6;

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(); };

  return (
    <AuthShell step={1} totalSteps={1} layout={layout}>
      <h1>Welcome back</h1>
      <p className="auth-lede" style={{marginBottom:24}}>
        Signing in as{" "}
        <strong style={{color:"var(--gray-900)"}}>{email}</strong>
        {" · "}
        <a onClick={onBack} style={{color:"var(--info-700)", cursor:"pointer", fontWeight:500}}>Change</a>
      </p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl">Password</label>
          <div style={{position:"relative"}}>
            <input className="inp" type={show ? "text" : "password"} placeholder="••••••••" autoFocus
                   value={password} onChange={(e)=>setPassword(e.target.value)} style={{paddingRight:42}} />
            <button type="button" onClick={() => setShow(!show)}
                    style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--gray-500)", padding:4}}>
              {show
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        <button className="btn btn-lg btn-block btn-dark" type="submit" disabled={!valid}>
          Continue
        </button>
      </form>

      <div className="auth-foot">
        <a style={{color:"var(--info-700)", cursor:"pointer", fontWeight:500}}>Forgot password?</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// Set password (magic link activation)
// =====================================================
function SetPasswordScreen({ onSubmit, layout }) {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [show, setShow]           = useState(false);
  const mismatch = confirm && password !== confirm;
  const valid = password.length >= 8 && password === confirm;

  const submit = (e) => { e.preventDefault(); if (valid) onSubmit(); };

  return (
    <AuthShell step={1} totalSteps={1} layout={layout}>
      <h1>Set your password</h1>
      <p className="auth-lede">Create a password to secure your Onboard account.</p>

      <form onSubmit={submit}>
        <div className="field">
          <label className="lbl" style={{display:"flex", justifyContent:"space-between"}}>
            <span>Password</span>
            <span style={{fontSize:11.5, color:"var(--gray-500)", fontWeight:400}}>min 8 characters</span>
          </label>
          <div style={{position:"relative"}}>
            <input className="inp" type={show ? "text" : "password"} placeholder="••••••••" autoFocus
                   value={password} onChange={(e)=>setPassword(e.target.value)} style={{paddingRight:42}} />
            <button type="button" onClick={() => setShow(!show)}
                    style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--gray-500)", padding:4}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div className="field">
          <label className="lbl">Confirm password</label>
          <input className="inp" type={show ? "text" : "password"} placeholder="••••••••"
                 value={confirm} onChange={(e)=>setConfirm(e.target.value)}
                 style={{borderColor: mismatch ? "var(--danger-700)" : ""}} />
          {mismatch && (
            <div style={{fontSize:12, color:"var(--danger-700)", marginTop:5}}>Passwords don&rsquo;t match</div>
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
// OTP entry — used for sign-in 2FA
// =====================================================
function OtpScreen({ email, mode, step, totalSteps, onSubmit, onChangeEmail, onResend, layout }) {
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
    <AuthShell step={step || 1} totalSteps={totalSteps || 1} layout={layout}>
      <h1>Enter your code</h1>
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
          Sign in
        </button>
      </form>

      <div className="auth-foot">
        Wrong email? <a onClick={onChangeEmail}>Use a different one</a>
      </div>
    </AuthShell>
  );
}

// =====================================================
// TOTP setup — first sign-in (or settings)
// =====================================================
function TotpSetupScreen({ onSubmit, onSkip, layout }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef([]);
  const mockSecret = "JBSWY3DPEHPK3PXP";

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
    <AuthShell step={1} totalSteps={1} layout={layout}>
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

window.OBOnboarding = {
  ExpressInterestScreen,
  SignUpConfirmationScreen,
  SignInScreen,
  SignInStatusScreen,
  SignInPasswordScreen,
  SetPasswordScreen,
  OtpScreen,
  TotpSetupScreen,
};
