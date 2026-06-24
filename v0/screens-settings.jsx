/* global React */
const { useState: useStateS, useEffect: useEffectS } = React;
const SIcon = window.OBIcon;
const { BUSINESS_PROFILE } = window.OBData;

// =====================================================
// SETTINGS — simplified to: Business profile · Security
// =====================================================

const SECTIONS = [
  { id: "profile",   label: "Business profile", icon: "bank",   blurb: "Business name, contact, verification" },
  { id: "security",  label: "Security",         icon: "shield", blurb: "Authentication and password" },
];

const SUPPORT_EMAIL = "support@onboard.xyz";

function SettingsBodySkeleton() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {[4,3].map((rows,ci) => (
        <div key={ci} className="set-card">
          <div className="set-card-head">
            <div className="skel" style={{width:130,height:16}} />
          </div>
          {[...Array(rows)].map((_,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"1px solid var(--gray-100)"}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div className="skel" style={{width:90,height:12}} />
                <div className="skel" style={{width:160,height:14}} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SettingsScreen({ onToast, apiAccess = "granted" }) {
  const [active, setActive] = useStateS("profile");
  const [bodyLoading, setBodyLoading] = useStateS(true);
  useEffectS(() => { const t = setTimeout(() => setBodyLoading(false), 700); return () => clearTimeout(t); }, []);
  const switchSection = (id) => { if (id === active) return; setActive(id); setBodyLoading(true); setTimeout(() => setBodyLoading(false), 350); };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Settings</h1>
          <p className="subtitle">Manage your business profile and account security.</p>
        </div>
      </div>

      <div className="settings-shell">
        <nav className="settings-rail" aria-label="Settings sections">
          {SECTIONS.map((s) => {
            const Ic = SIcon[s.icon] || SIcon.cog;
            return (
              <button
                key={s.id}
                className={`settings-rail-item ${active === s.id ? "on" : ""}`}
                onClick={() => switchSection(s.id)}
              >
                <span className="ic"><Ic /></span>
                <span className="meta">
                  <span className="t">{s.label}</span>
                  <span className="s">{s.blurb}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="settings-body">
          {bodyLoading ? <SettingsBodySkeleton /> : (
            <>
              {active === "profile"   && <ProfileSection onToast={onToast} />}
              {active === "security"  && <SecuritySection onToast={onToast} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Section · Profile ----------
function ProfileSection({ onToast }) {
  const p = BUSINESS_PROFILE;

  const supportNote = (
    <div className="set-support-note">
      <SIcon.email />
      <div>
        Need to update your business details? Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and our team will help you make changes.
      </div>
    </div>
  );

  return (
    <>
      {/* Business profile */}
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">
              Business
              {true && (
                <span className="set-chip ok" style={{marginLeft: 10, verticalAlign: "middle"}}>
                  <SIcon.check /> Verified
                </span>
              )}
            </h2>
            <p className="set-card-sub">
              {true
                ? "Used on receipts, statements, and shown to recipients."
                : "Limited details until your business is verified."}
            </p>
          </div>
        </div>
        <div className="set-list">
          <ReadOnlyRow label="Business name" value={p.legalName} />
          {true && (
            <>
              <ReadOnlyRow label="Trading name"        value={p.tradingName} />
              <ReadOnlyRow label="Registration number" value={p.rcNumber} />
              <ReadOnlyRow label="Tax identification"  value={p.taxId} />
              <ReadOnlyRow label="Industry"            value={p.industry} />
              <ReadOnlyRow label="Website"             value={p.website} />
            </>
          )}
        </div>
      </div>

      {/* Registered address — only when verified */}
      {true && (
        <div className="set-card">
          <div className="set-card-head">
            <div>
              <h2 className="set-card-title">Registered address</h2>
              <p className="set-card-sub">From your incorporation documents.</p>
            </div>
          </div>
          <div className="set-address">
            <div>{p.registeredAddress.line1}</div>
            {p.registeredAddress.line2 && <div>{p.registeredAddress.line2}</div>}
            <div>{p.registeredAddress.city}, {p.registeredAddress.region} {p.registeredAddress.postalCode}</div>
            <div>{p.registeredAddress.country}</div>
          </div>
        </div>
      )}

      {/* Personal contact — always shown, name + email only */}
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Your contact details</h2>
            <p className="set-card-sub">We&rsquo;ll reach out here for verification, security, and account updates.</p>
          </div>
        </div>
        <div className="set-list">
          <ReadOnlyRow label="Name"  value={p.primaryContact.name} />
          <ReadOnlyRow label="Email" value={p.primaryContact.email} />
        </div>
      </div>

      {supportNote}
    </>
  );
}

function ReadOnlyRow({ label, value, sub }) {
  return (
    <div className="set-row">
      <div className="set-row-k">{label}</div>
      <div className="set-row-v">
        <div className="strong">{value}</div>
        {sub && <div className="set-row-help">{sub}</div>}
      </div>
    </div>
  );
}

// ---------- Section · Security ----------
function SecuritySection({ onToast }) {
  const totpSetUp = true;

  const [pwFields, setPwFields] = useStateS({ current: "", next: "", confirm: "" });
  const [pwVisible, setPwVisible] = useStateS({});
  const togglePwVis = (k) => setPwVisible(prev => ({ ...prev, [k]: !prev[k] }));
  const setPw = (k, v) => setPwFields(prev => ({ ...prev, [k]: v }));
  const pwValid = pwFields.current.length > 0 && pwFields.next.length >= 8 && pwFields.next === pwFields.confirm;

  const EyeBtn = ({ field }) => (
    <button onClick={() => togglePwVis(field)} style={{position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: 4, display: "grid", placeItems: "center"}}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width: 16, height: 16}}>
        {pwVisible[field]
          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
      </svg>
    </button>
  );

  return (
    <>
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">
              Authenticator app
              <span className={`set-chip ${totpSetUp ? "ok" : "warn"}`} style={{marginLeft: 10, verticalAlign: "middle"}}>
                {totpSetUp ? <><SIcon.check /> Set up</> : "Not set up"}
              </span>
            </h2>
            <p className="set-card-sub">
              Two-factor authentication is required for sign-in and outbound payments. Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app to generate 6-digit codes.
            </p>
          </div>
        </div>

        <div className="set-totp-status">
          <div className="ic"><SIcon.shield /></div>
          <div className="meta">
            <div className="t">Authenticator app connected</div>
            <div className="s">Set up on Jun 5, 2024</div>
          </div>
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Change password</h2>
            <p className="set-card-sub">Use a strong password you don&rsquo;t reuse on other sites.</p>
          </div>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", maxWidth: 520}}>
          <div className="field" style={{gridColumn: "1 / -1"}}>
            <div className="lbl">Current password</div>
            <div style={{position: "relative"}}>
              <input className="inp" type={pwVisible.current ? "text" : "password"} value={pwFields.current} onChange={(e) => setPw("current", e.target.value)} placeholder="Enter current password" style={{paddingRight: 40}} />
              <EyeBtn field="current" />
            </div>
          </div>
          <div className="field">
            <div className="lbl">New password</div>
            <div style={{position: "relative"}}>
              <input className="inp" type={pwVisible.next ? "text" : "password"} value={pwFields.next} onChange={(e) => setPw("next", e.target.value)} placeholder="At least 8 characters" style={{paddingRight: 40}} />
              <EyeBtn field="next" />
            </div>
          </div>
          <div className="field">
            <div className="lbl">Confirm new password</div>
            <div style={{position: "relative"}}>
              <input className="inp" type={pwVisible.confirm ? "text" : "password"} value={pwFields.confirm} onChange={(e) => setPw("confirm", e.target.value)} placeholder="Re-enter new password" style={{paddingRight: 40}} />
              <EyeBtn field="confirm" />
            </div>
          </div>
        </div>
        <div style={{marginTop: 16}}>
          <button className="btn" disabled={!pwValid} onClick={() => { setPwFields({ current: "", next: "", confirm: "" }); onToast && onToast("Password updated"); }}>Update password</button>
        </div>
      </div>

    </>
  );
}

// Mock TOTP setup with a fake QR + verify-code field.
function TotpSetupModal({ onClose, onDone }) {
  const [code, setCode] = useStateS("");
  const valid = /^\d{6}$/.test(code);
  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <h3>Set up authenticator app</h3>
          <button className="set-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <ol className="set-modal-steps">
          <li>Open your authenticator app (Google Authenticator, 1Password, Authy, etc.).</li>
          <li>Scan the QR code below, or enter the setup key manually.</li>
          <li>Enter the 6-digit code your app shows to confirm.</li>
        </ol>
        <div className="set-totp-qr">
          <FakeQR />
          <div className="set-totp-key">
            <div className="set-row-help">Setup key</div>
            <div className="mono strong">JBSWY3DPEH PK3PXP K2NA</div>
          </div>
        </div>
        <div className="field" style={{marginTop: 16}}>
          <div className="lbl">Code from your app</div>
          <input
            className="inp"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123 456"
            inputMode="numeric"
            maxLength={6}
          />
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-lg" disabled={!valid} onClick={onDone}>Verify and enable</button>
        </div>
      </div>
    </div>
  );
}

function RevokeTotpModal({ onClose, onConfirm }) {
  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 420}}>
        <div className="set-modal-head">
          <h3>Revoke authenticator?</h3>
          <button className="set-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{padding: "0 24px 12px", fontSize: 13.5, color: "var(--gray-700)", lineHeight: 1.55}}>
          We&rsquo;ll fall back to email one-time codes for sign-in and every outbound payment.
          You can set up an authenticator again at any time.
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-lg" onClick={onConfirm}>Yes, revoke</button>
        </div>
      </div>
    </div>
  );
}

function FakeQR() {
  const N = 21;
  const cells = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inMarker = (
        (r < 7 && c < 7) ||
        (r < 7 && c >= N - 7) ||
        (r >= N - 7 && c < 7)
      );
      let on;
      if (inMarker) {
        const lr = r < 7 ? r : r - (N - 7);
        const lc = c < 7 ? c : c - (N - 7);
        const onRing = (lr === 0 || lr === 6 || lc === 0 || lc === 6);
        const onCore = (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        on = onRing || onCore;
      } else {
        on = ((r * 7 + c * 13 + r * c) % 3) === 0;
      }
      if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" />);
    }
  }
  return (
    <svg className="set-qr" viewBox="0 0 21 21" width="160" height="160" shapeRendering="crispEdges">
      <rect x="0" y="0" width="21" height="21" fill="#fff" />
      {cells}
    </svg>
  );
}

// ---------- Verify TOTP modal (reusable for sensitive actions) ----------
function VerifyTotpModal({ title, description, onClose, onVerified }) {
  const [code, setCode] = useStateS("");
  const [busy, setBusy] = useStateS(false);
  const [error, setError] = useStateS("");

  const handleSubmit = () => {
    setBusy(true);
    setError("");
    setTimeout(() => {
      if (code === "123456" || (/^\d{6}$/.test(code) && parseInt(code[5], 10) % 2 === 0)) {
        setBusy(false);
        onVerified();
      } else {
        setBusy(false);
        setError("Invalid code. Try again.");
        setCode("");
      }
    }, 600);
  };

  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 400}}>
        <div className="set-modal-head">
          <h3>{title || "Verify your identity"}</h3>
          <button className="set-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{fontSize: 13, color: "var(--gray-700)", lineHeight: 1.55, marginBottom: 16}}>
          {description || "Enter the 6-digit code from your authenticator app to continue."}
        </div>
        <div className="field">
          <div className="lbl">Code</div>
          <input
            className="inp"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            style={{textAlign: "center", fontSize: 18, letterSpacing: "0.2em", fontWeight: 600}}
          />
        </div>
        {error && <div style={{fontSize: 12, color: "var(--danger-600, #DC2626)", marginTop: 8}}>{error}</div>}
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-lg" onClick={handleSubmit} disabled={busy || code.length < 6}>
            {busy ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Section · Developer ----------
function DeveloperSection({ onToast, apiAccess = "granted" }) {
  if (apiAccess !== "granted") {
    return (
      <div className="set-card" style={{textAlign: "center", padding: "48px 32px"}}>
        <div style={{display: "flex", justifyContent: "center", marginBottom: 16}}>
          <div style={{width: 56, height: 56, borderRadius: 14, background: "var(--info-100)", color: "var(--info-700)", display: "grid", placeItems: "center"}}>
            <SIcon.doc style={{width: 26, height: 26}} />
          </div>
        </div>
        <h2 style={{margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "var(--gray-900)"}}>
          {apiAccess === "pending" ? "API access request in review" : "Get started with the Onboard API"}
        </h2>
        <p style={{margin: "0 auto 20px", fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6, maxWidth: 420}}>
          {apiAccess === "pending"
            ? "We're reviewing your request for API access. You'll receive an email once your credentials are ready — this usually takes 1–2 business days."
            : "Integrate cross-border payouts, stablecoin wallet infrastructure, and multi-currency deposits directly into your product via our REST API."}
        </p>
        {apiAccess === "pending" ? (
          <div style={{display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#FEF3C7", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#92400E"}}>
            <SIcon.clock style={{width: 15, height: 15}} /> Request pending
          </div>
        ) : (
          <div style={{display: "flex", justifyContent: "center", gap: 10}}>
            <button className="btn" onClick={() => onToast && onToast("API access requested — we'll be in touch")}>
              Request API access
            </button>
            <a href="https://docs.onboard.xyz" target="_blank" rel="noopener" className="btn btn-ghost" style={{textDecoration: "none"}}>
              Read the docs <SIcon.external style={{width: 13, height: 13}} />
            </a>
          </div>
        )}
        {apiAccess !== "pending" && (
          <p style={{margin: "20px auto 0", fontSize: 12, color: "var(--gray-500)", maxWidth: 360, lineHeight: 1.5}}>
            Need help? Reach out to <a href="mailto:support@onboard.xyz" style={{color: "var(--info-700)", fontWeight: 500, textDecoration: "none"}}>support@onboard.xyz</a> and we'll get you set up.
          </p>
        )}
      </div>
    );
  }

  const [apiKeys, setApiKeys] = useStateS([
    {
      id: "k1",
      label: "Production",
      key: "onb_live_a7cdf7928fd2ce7300e37f94cd1ac556",
      secret: "03lHBHZl$XMffvzEsnTTZwtavmTvlQUm",
      ips: "203.0.113.10, 203.0.113.20",
      created: "Jun 2, 2026",
      secretVisible: false,
    },
  ]);
  const [createOpen, setCreateOpen] = useStateS(false);
  const [deleteTarget, setDeleteTarget] = useStateS(null);

  const [webhookUrl, setWebhookUrl] = useStateS("https://api.acmetrading.co/webhooks/onboard");
  const [webhookEditing, setWebhookEditing] = useStateS(false);
  const [webhookDraft, setWebhookDraft] = useStateS("");
  const [authUrl, setAuthUrl] = useStateS("");
  const [authEditing, setAuthEditing] = useStateS(false);
  const [authDraft, setAuthDraft] = useStateS("");
  const [webhookSecret, setWebhookSecret] = useStateS("whsec_k9Xp2mRvL4nT8qYbA3wJcE6fH0dG5sU7");
  const [secretVisible, setSecretVisible] = useStateS(false);

  // 2FA gate: stores { title, description, onVerified } when a sensitive action needs TOTP
  const [totpChallenge, setTotpChallenge] = useStateS(null);

  const requireTotp = (title, description, onVerified) => {
    setTotpChallenge({ title, description, onVerified });
  };

  const toggleKeySecret = (id) => {
    const key = apiKeys.find(k => k.id === id);
    if (key && key.secretVisible) {
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, secretVisible: false } : k));
    } else {
      requireTotp("Reveal API secret", "Verify your identity to view this secret.", () => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, secretVisible: true } : k));
        setTotpChallenge(null);
      });
    }
  };

  const copyText = (text, label) => {
    navigator.clipboard && navigator.clipboard.writeText(text);
    onToast && onToast(`${label} copied`);
  };

  const handleCreate = (label, ips) => {
    const newKey = {
      id: "k" + (Date.now()),
      label: label || "Untitled",
      key: "onb_test_" + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18),
      secret: Array.from({length: 32}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#"[Math.floor(Math.random()*64)]).join(""),
      ips: ips || "",
      created: "Just now",
      secretVisible: true,
    };
    setApiKeys(prev => [...prev, newKey]);
    setCreateOpen(false);
    onToast && onToast("API key created");
  };

  const handleRevoke = (id) => {
    requireTotp("Revoke API key", "Verify your identity to revoke this key. This action cannot be undone.", () => {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      setDeleteTarget(null);
      setTotpChallenge(null);
      onToast && onToast("API key revoked");
    });
  };

  const toggleWebhookSecret = () => {
    if (secretVisible) {
      setSecretVisible(false);
    } else {
      requireTotp("Reveal webhook secret", "Verify your identity to view the webhook secret.", () => {
        setSecretVisible(true);
        setTotpChallenge(null);
      });
    }
  };

  const regenerateSecret = () => {
    requireTotp("Regenerate webhook secret", "Verify your identity to regenerate the webhook secret. The current secret will stop working immediately.", () => {
      setWebhookSecret("whsec_" + Array.from({length: 30}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*62)]).join(""));
      setTotpChallenge(null);
      onToast && onToast("Webhook secret regenerated");
    });
  };

  return (
    <>
      {/* Environment + Overview */}
      <div className="set-banner info">
        <div className="ic"><SIcon.doc /></div>
        <div className="meta">
          <div className="t" style={{display: "flex", alignItems: "center", gap: 8}}>
            Onboard API
            <span style={{display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", background: "var(--success-100, #DCFCE7)", color: "var(--success-700, #15803D)", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em"}}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: "currentColor"}} /> PRODUCTION
            </span>
          </div>
          <div className="s">
            Programmatic access to cross-border payouts, stablecoin wallet infrastructure, and multi-currency deposits — everything you need to embed payments into your product. This is your live environment — contact <a href="mailto:support@onboard.xyz" style={{color: "var(--info-700)", fontWeight: 500, textDecoration: "none"}}>support@onboard.xyz</a> to provision a sandbox for development.
          </div>
          <div style={{marginTop: 10}}>
            <a href="https://docs.onboard.xyz" target="_blank" rel="noopener" style={{fontSize: 13, fontWeight: 500, color: "var(--info-700)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4}}>
              Read the docs <SIcon.external style={{width: 13, height: 13}} />
            </a>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="set-card">
        <div className="set-card-head">
          <div style={{flex: 1}}>
            <h2 className="set-card-title">API keys</h2>
            <p className="set-card-sub">Keys authenticate your server-side API calls. Keep secrets secure — never expose them client-side.</p>
          </div>
          <button className="btn btn-sm" onClick={() => setCreateOpen(true)}><SIcon.plus /> Create key</button>
        </div>

        {apiKeys.length === 0 ? (
          <div style={{padding: "40px 0", textAlign: "center"}}>
            <div style={{color: "var(--gray-400)", marginBottom: 8, display: "flex", justifyContent: "center"}}><SIcon.doc style={{width: 32, height: 32}} /></div>
            <div style={{fontSize: 13, color: "var(--gray-600)"}}>No API keys yet</div>
            <div style={{fontSize: 12, color: "var(--gray-500)", marginTop: 4}}>Create one to start integrating with the Onboard API.</div>
          </div>
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 4}}>
            {apiKeys.map((k) => (
              <div key={k.id} className="set-apikey-card">
                <div className="set-apikey-header">
                  <div className="set-apikey-label">{k.label}</div>
                  <div style={{display: "flex", gap: 6}}>
                    <button className="set-apikey-action" title="Revoke" onClick={() => setDeleteTarget(k.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>

                <div className="set-apikey-field">
                  <div className="set-apikey-field-label">Key</div>
                  <div className="set-apikey-field-value">
                    <code>{k.key}</code>
                    <button className="set-apikey-copy" onClick={() => copyText(k.key, "API key")}><SIcon.copy /></button>
                  </div>
                </div>

                <div className="set-apikey-field">
                  <div className="set-apikey-field-label">Secret</div>
                  <div className="set-apikey-field-value">
                    <code>{k.secretVisible ? k.secret : "••••••••••••••••••••••••••••••••"}</code>
                    {k.secretVisible && <button className="set-apikey-copy" onClick={() => copyText(k.secret, "Secret")}><SIcon.copy /></button>}
                    <button className="set-apikey-toggle" onClick={() => toggleKeySecret(k.id)}>
                      {k.secretVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {k.ips && (
                  <div className="set-apikey-field">
                    <div className="set-apikey-field-label">Allowed IPs</div>
                    <div className="set-apikey-field-value"><code>{k.ips}</code></div>
                  </div>
                )}

                <div className="set-apikey-meta">Created {k.created}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Webhooks</h2>
            <p className="set-card-sub">We'll send event notifications to your webhook URL. Use the secret to verify signatures.</p>
          </div>
        </div>

        <div className="set-list">
          <div className="set-row">
            <div className="set-row-k">Webhook URL</div>
            <div className="set-row-v" style={{display: "flex", alignItems: "center", gap: 8}}>
              {webhookEditing ? (
                <>
                  <input className="inp" style={{flex: 1, fontSize: 13}} value={webhookDraft} onChange={(e) => setWebhookDraft(e.target.value)} placeholder="https://your-server.com/webhooks" />
                  <button className="btn btn-sm" onClick={() => { setWebhookUrl(webhookDraft); setWebhookEditing(false); onToast && onToast("Webhook URL updated"); }}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setWebhookEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="strong" style={{flex: 1, fontSize: 13, wordBreak: "break-all"}}>{webhookUrl || <span style={{color: "var(--gray-400)"}}>Not set</span>}</div>
                  <button className="set-row-edit" onClick={() => { setWebhookDraft(webhookUrl); setWebhookEditing(true); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}><path d="M17 3l4 4L7 21H3v-4L17 3z"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-k">Authorization URL</div>
            <div className="set-row-v" style={{display: "flex", alignItems: "center", gap: 8}}>
              {authEditing ? (
                <>
                  <input className="inp" style={{flex: 1, fontSize: 13}} value={authDraft} onChange={(e) => setAuthDraft(e.target.value)} placeholder="https://your-server.com/auth/callback" />
                  <button className="btn btn-sm" onClick={() => { setAuthUrl(authDraft); setAuthEditing(false); onToast && onToast("Authorization URL updated"); }}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAuthEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="strong" style={{flex: 1, fontSize: 13, wordBreak: "break-all"}}>{authUrl || <span style={{color: "var(--gray-400)"}}>Not set</span>}</div>
                  <button className="set-row-edit" onClick={() => { setAuthDraft(authUrl); setAuthEditing(true); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}><path d="M17 3l4 4L7 21H3v-4L17 3z"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-k">Webhook secret</div>
            <div className="set-row-v" style={{display: "flex", alignItems: "center", gap: 8}}>
              <code style={{flex: 1, fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all", color: "var(--gray-900)"}}>
                {secretVisible ? webhookSecret : "••••••••••••••••••••••••••••••••••••••••"}
              </code>
              {secretVisible && <button className="set-apikey-copy" onClick={() => copyText(webhookSecret, "Webhook secret")}><SIcon.copy /></button>}
              <button className="set-apikey-toggle" onClick={toggleWebhookSecret}>
                {secretVisible ? "Hide" : "Show"}
              </button>
              <button className="set-apikey-action" title="Regenerate" onClick={regenerateSecret}>
                <SIcon.refresh />
              </button>
            </div>
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateApiKeyModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {deleteTarget && (
        <RevokeApiKeyModal
          keyLabel={apiKeys.find(k => k.id === deleteTarget)?.label}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleRevoke(deleteTarget)}
        />
      )}

      {totpChallenge && (
        <VerifyTotpModal
          title={totpChallenge.title}
          description={totpChallenge.description}
          onClose={() => setTotpChallenge(null)}
          onVerified={totpChallenge.onVerified}
        />
      )}
    </>
  );
}

// ---------- Create API Key modal (label + IPs → TOTP → done) ----------
function CreateApiKeyModal({ onClose, onCreate }) {
  const [step, setStep] = useStateS(0); // 0=form, 1=totp
  const [label, setLabel] = useStateS("");
  const [ips, setIps] = useStateS("");
  const [code, setCode] = useStateS("");
  const [busy, setBusy] = useStateS(false);
  const [error, setError] = useStateS("");

  const handleContinue = () => setStep(1);
  const handleSubmit = () => {
    setBusy(true);
    setError("");
    setTimeout(() => {
      if (code === "123456" || (/^\d{6}$/.test(code) && parseInt(code[5], 10) % 2 === 0)) {
        setBusy(false);
        onCreate(label, ips);
      } else {
        setBusy(false);
        setError("Invalid code. Try again.");
        setCode("");
      }
    }, 600);
  };

  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="set-modal-head">
          <h3>{step === 0 ? "Create API key" : "Verify with authenticator"}</h3>
          <button className="set-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {step === 0 && (
          <>
            <div className="field" style={{marginBottom: 16}}>
              <div className="lbl">Label <span className="opt">· optional</span></div>
              <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Production, Staging" />
            </div>
            <div className="field">
              <div className="lbl">Allowed IP addresses</div>
              <input className="inp" value={ips} onChange={(e) => setIps(e.target.value)} placeholder="Comma-separated, e.g. 203.0.113.10, 10.0.0.1" />
              <div className="help" style={{marginTop: 6, fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5}}>
                IP restriction is required for withdrawal-enabled keys. Leave blank if this key won't initiate withdrawals.
              </div>
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-lg" onClick={handleContinue}>Continue</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{fontSize: 13, color: "var(--gray-700)", lineHeight: 1.55, marginBottom: 16}}>
              Enter the 6-digit code from your authenticator app to confirm.
            </div>
            <div className="field">
              <div className="lbl">Code</div>
              <input
                className="inp"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                style={{textAlign: "center", fontSize: 18, letterSpacing: "0.2em", fontWeight: 600}}
              />
            </div>
            {error && <div style={{fontSize: 12, color: "var(--danger-600, #DC2626)", marginTop: 8}}>{error}</div>}
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={() => setStep(0)} disabled={busy}>← Back</button>
              <button className="btn btn-lg" onClick={handleSubmit} disabled={busy || code.length < 6}>
                {busy ? "Verifying…" : "Create key"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Revoke API Key confirmation modal ----------
function RevokeApiKeyModal({ keyLabel, onClose, onConfirm }) {
  const [busy, setBusy] = useStateS(false);
  const handleConfirm = () => { setBusy(true); setTimeout(() => { setBusy(false); onConfirm(); }, 600); };

  return (
    <div className="set-modal-bg" onClick={onClose}>
      <div className="set-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 420}}>
        <div className="set-modal-head">
          <h3>Revoke API key?</h3>
          <button className="set-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{padding: "0 0 12px", fontSize: 13.5, color: "var(--gray-700)", lineHeight: 1.55}}>
          <strong>{keyLabel}</strong> will be permanently revoked. Any integrations using this key will stop working immediately.
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-lg" style={{background: "var(--danger-600, #DC2626)"}} onClick={handleConfirm} disabled={busy}>
            {busy ? "Revoking…" : "Revoke key"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.OBSettings = { SettingsScreen, DeveloperSection };
