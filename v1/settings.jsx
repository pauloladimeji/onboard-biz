/* global React */
const { useState: useStateS, useEffect: useEffectS } = React;
const SIcon = window.OBIcon;
const { BUSINESS_PROFILE } = window.OBData;
const { Page, Sheet } = window.OBPrimitives;
const { WaIcon } = window.OBShell;

const SECTIONS = [
  { id: "profile", label: "Business profile", icon: "bank", blurb: "Business name, contact, verification" },
  { id: "limits", label: "Limits", icon: "swap", blurb: "Deposit and withdrawal limits" },
  { id: "security", label: "Security", icon: "shield", blurb: "Authentication and password" },
];
const SUPPORT_EMAIL = "support@onboard.xyz";
const ACCOUNT_MANAGER_WA = "https://wa.me/14313404484";

// Outbound limits don't vary by rail or by who you're paying — one set covers everything.
// (They are affected by liquidity in practice, which isn't something we surface.)
const WITHDRAWAL_LIMITS = [
  { label: "Per transaction", value: "$50,000" },
  { label: "Per day", value: "$100,000" },
];

function SettingsBodySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[4, 3].map((rows, ci) => (
        <div key={ci} className="set-card">
          <div className="set-card-head"><div className="skel" style={{ width: 130, height: 16 }} /></div>
          {[...Array(rows)].map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--gray-100)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skel" style={{ width: 90, height: 12 }} />
                <div className="skel" style={{ width: 160, height: 14 }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SettingsScreen({ onToast, apiAccess = "granted", initialSection = "profile" }) {
  const [active, setActive] = useStateS(initialSection);
  const [bodyLoading, setBodyLoading] = useStateS(true);
  useEffectS(() => { const t = setTimeout(() => setBodyLoading(false), 700); return () => clearTimeout(t); }, []);
  const switchSection = (id) => { if (id === active) return; setActive(id); setBodyLoading(true); setTimeout(() => setBodyLoading(false), 350); };

  return (
    <Page>
      <div className="page-head">
        <div><h1 className="title">Settings</h1><p className="subtitle">Manage your business profile and account security.</p></div>
      </div>

      <div className="settings-shell">
        <nav className="settings-rail" aria-label="Settings sections">
          {SECTIONS.map((s) => {
            const Ic = SIcon[s.icon] || SIcon.cog;
            return (
              <button key={s.id} className={`settings-rail-item ${active === s.id ? "on" : ""}`} onClick={() => switchSection(s.id)}>
                <span className="ic"><Ic /></span>
                <span className="meta"><span className="t">{s.label}</span><span className="s">{s.blurb}</span></span>
              </button>
            );
          })}
        </nav>

        <div className="settings-body">
          {bodyLoading ? <SettingsBodySkeleton /> : (
            <>
              {active === "profile" && <ProfileSection onToast={onToast} />}
              {active === "limits" && <LimitsSection />}
              {active === "security" && <SecuritySection onToast={onToast} />}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

function ProfileSection({ onToast }) {
  const p = BUSINESS_PROFILE;
  const supportNote = (
    <div className="set-support-note">
      <SIcon.email />
      <div>Need to update your business details? Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and our team will help you make changes.</div>
    </div>
  );

  return (
    <>
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Business<span className="set-chip ok" style={{ marginLeft: 10, verticalAlign: "middle" }}><SIcon.check /> Verified</span></h2>
            <p className="set-card-sub">Used on receipts, statements, and shown to recipients.</p>
          </div>
        </div>
        <div className="set-list">
          <ReadOnlyRow label="Business name" value={p.legalName} />
          <ReadOnlyRow label="Trading name" value={p.tradingName} />
          <ReadOnlyRow label="Registration number" value={p.rcNumber} />
          <ReadOnlyRow label="Tax identification" value={p.taxId} />
          <ReadOnlyRow label="Industry" value={p.industry} />
          <ReadOnlyRow label="Website" value={p.website} />
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-head"><div><h2 className="set-card-title">Registered address</h2><p className="set-card-sub">From your incorporation documents.</p></div></div>
        <div className="set-address">
          <div>{p.registeredAddress.line1}</div>
          {p.registeredAddress.line2 && <div>{p.registeredAddress.line2}</div>}
          <div>{p.registeredAddress.city}, {p.registeredAddress.region} {p.registeredAddress.postalCode}</div>
          <div>{p.registeredAddress.country}</div>
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-head"><div><h2 className="set-card-title">Your contact details</h2><p className="set-card-sub">We'll reach out here for verification, security, and account updates.</p></div></div>
        <div className="set-list">
          <ReadOnlyRow label="Name" value={p.primaryContact.name} />
          <ReadOnlyRow label="Email" value={p.primaryContact.email} />
        </div>
      </div>

      {supportNote}
    </>
  );
}

// Renders the same `{ usd, local }` / array-of-them shape the deposit rail cards use. Every limit
// is held in USD; `local` is only ever an approximate conversion for orientation.
function LimitAmount({ v }) {
  if (!v) return <span className="lim-none">No limits apply</span>;
  const rows = Array.isArray(v) ? v : [v];
  // Amount first, period after — a bare number reads ambiguously next to NGN, which has both a
  // per-transaction and a daily cap. Unlabelled limits are always per-transaction.
  return (
    <span className={rows.length > 1 ? "lim-multi" : null}>
      {rows.map(r => (
        <span key={r.label || "one"}>
          {r.usd}{r.local ? <em> (≈ {r.local})</em> : null} <span className="lbl">{r.label || "per transaction"}</span>
        </span>
      ))}
    </span>
  );
}

function LimitsSection() {
  const [requestFor, setRequestFor] = useStateS(null);
  const deposits = (window.OBDeposit && window.OBDeposit.DEPOSIT_LIMITS) || [];

  return (
    <>
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Deposit limits</h2>
            <p className="set-card-sub">How much you can receive, by currency and who's sending.</p>
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setRequestFor("deposit")}>Request an increase</button>
        </div>

        <div className="lim-list">
          {deposits.map(group => (
            <div key={group.ccy} className="lim-ccy">
              <div className="lim-ccy-head">{group.ccy}</div>
              <div className="lim-line">
                <span className="k">From your own account</span>
                <span className="v"><LimitAmount v={group.limits && group.limits.first} /></span>
              </div>
              <div className="lim-line">
                <span className="k">From anyone else</span>
                <span className="v"><LimitAmount v={group.limits && group.limits.third} /></span>
              </div>
            </div>
          ))}
          <div className="lim-ccy">
            <div className="lim-ccy-head">Stablecoins</div>
            <div className="lim-line">
              <span className="k">USDC and USDT</span>
              <span className="v">No limit</span>
            </div>
          </div>
        </div>
        <p className="lim-note">No monthly cap. Deposits may be reviewed by our systems before they clear.</p>
      </div>

      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Withdrawal limits</h2>
            <p className="set-card-sub">The same limits apply to every payout currency and recipient.</p>
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setRequestFor("withdrawal")}>Request an increase</button>
        </div>
        <div className="lim-list">
          <div className="lim-ccy">
            {WITHDRAWAL_LIMITS.map(l => (
              <div key={l.label} className="lim-line">
                <span className="k">{l.label}</span>
                <span className="v">{l.value}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="lim-note">No monthly cap. Transfers may be reviewed by our systems before they're sent.</p>
      </div>

      {requestFor && <RequestLimitSheet kind={requestFor} onClose={() => setRequestFor(null)} />}
    </>
  );
}

// Pre-filled with which limit is being asked about, so ops doesn't have to chase the two things
// they always need — which limit, and what target.
function RequestLimitSheet({ kind, onClose }) {
  const waHref = ACCOUNT_MANAGER_WA + "?text=" + encodeURIComponent(
    `Hi, I'd like to request a higher ${kind} limit for ${BUSINESS_PROFILE.legalName}.`
  );
  return (
    <Sheet open onClose={onClose} title={`Request a higher ${kind} limit`}>
      <p className="set-sheet-lede">Your account team reviews increases case by case. Have these ready and it'll move faster:</p>
      <ul className="lim-need-list">
        <li>The limit you need — per transaction and per day</li>
        <li>Your expected monthly volume, and what the {kind}s are for</li>
        <li>Recent statements or source-of-funds documents, if we ask for them</li>
      </ul>
      <a className="btn btn-lg btn-block" href={waHref} target="_blank" rel="noopener noreferrer">
        <WaIcon style={{ width: 16, height: 16 }} />
        Message your account team
      </a>
    </Sheet>
  );
}

function ReadOnlyRow({ label, value, sub }) {
  return (
    <div className="set-row">
      <div className="set-row-k">{label}</div>
      <div className="set-row-v"><div className="strong">{value}</div>{sub && <div className="set-row-help">{sub}</div>}</div>
    </div>
  );
}

function SecuritySection({ onToast }) {
  const totpSetUp = true;
  const [pwFields, setPwFields] = useStateS({ current: "", next: "", confirm: "" });
  const [pwVisible, setPwVisible] = useStateS({});
  const togglePwVis = (k) => setPwVisible(prev => ({ ...prev, [k]: !prev[k] }));
  const setPw = (k, v) => setPwFields(prev => ({ ...prev, [k]: v }));
  const pwValid = pwFields.current.length > 0 && pwFields.next.length >= 8 && pwFields.next === pwFields.confirm;

  const EyeBtn = ({ field }) => (
    <button onClick={() => togglePwVis(field)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: 4, display: "grid", placeItems: "center" }}>
      {pwVisible[field] ? <SIcon.eyeOff style={{ width: 16, height: 16 }} /> : <SIcon.eye style={{ width: 16, height: 16 }} />}
    </button>
  );

  return (
    <>
      <div className="set-card">
        <div className="set-card-head">
          <div>
            <h2 className="set-card-title">Authenticator app<span className={`set-chip ${totpSetUp ? "ok" : "warn"}`} style={{ marginLeft: 10, verticalAlign: "middle" }}>{totpSetUp ? <><SIcon.check /> Set up</> : "Not set up"}</span></h2>
            <p className="set-card-sub">Two-factor authentication is required for sign-in and outbound payments. Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app to generate 6-digit codes.</p>
          </div>
        </div>
        <div className="set-totp-status">
          <div className="ic"><SIcon.shield /></div>
          <div className="meta"><div className="t">Authenticator app connected</div><div className="s">Set up on Jun 5, 2024</div></div>
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-head"><div><h2 className="set-card-title">Change password</h2><p className="set-card-sub">Use a strong password you don't reuse on other sites.</p></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", maxWidth: 520 }}>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="lbl">Current password</div>
            <div style={{ position: "relative" }}>
              <input className="inp" type={pwVisible.current ? "text" : "password"} value={pwFields.current} onChange={(e) => setPw("current", e.target.value)} placeholder="Enter current password" style={{ paddingRight: 40 }} />
              <EyeBtn field="current" />
            </div>
          </div>
          <div className="field">
            <div className="lbl">New password</div>
            <div style={{ position: "relative" }}>
              <input className="inp" type={pwVisible.next ? "text" : "password"} value={pwFields.next} onChange={(e) => setPw("next", e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 40 }} />
              <EyeBtn field="next" />
            </div>
          </div>
          <div className="field">
            <div className="lbl">Confirm new password</div>
            <div style={{ position: "relative" }}>
              <input className="inp" type={pwVisible.confirm ? "text" : "password"} value={pwFields.confirm} onChange={(e) => setPw("confirm", e.target.value)} placeholder="Re-enter new password" style={{ paddingRight: 40 }} />
              <EyeBtn field="confirm" />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={!pwValid} onClick={() => { setPwFields({ current: "", next: "", confirm: "" }); onToast && onToast("Password updated"); }}>Update password</button>
        </div>
      </div>
    </>
  );
}

// Reusable 2FA challenge — a Sheet instead of v0's bespoke fixed-overlay modal.
function VerifyTotpSheet({ open, title, description, onClose, onVerified }) {
  const [code, setCode] = useStateS("");
  const [busy, setBusy] = useStateS(false);
  const [error, setError] = useStateS("");

  const handleSubmit = () => {
    setBusy(true); setError("");
    setTimeout(() => {
      if (code === "123456" || (/^\d{6}$/.test(code) && parseInt(code[5], 10) % 2 === 0)) { setBusy(false); onVerified(); }
      else { setBusy(false); setError("Invalid code. Try again."); setCode(""); }
    }, 600);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title || "Verify your identity"}>
      <div style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.55, marginBottom: 16 }}>{description || "Enter the 6-digit code from your authenticator app to continue."}</div>
      <div className="field">
        <div className="lbl">Code</div>
        <input className="inp" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" inputMode="numeric" maxLength={6} style={{ textAlign: "center", fontSize: 18, letterSpacing: "0.2em", fontWeight: 600 }} />
      </div>
      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{error}</div>}
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-lg" onClick={handleSubmit} disabled={busy || code.length < 6}>{busy ? "Verifying…" : "Confirm"}</button>
      </div>
    </Sheet>
  );
}

function DeveloperSection({ onToast, apiAccess = "granted" }) {
  const [apiKeys, setApiKeys] = useStateS([{ id: "k1", label: "Production", key: "onb_live_a7cdf7928fd2ce7300e37f94cd1ac556", secret: "03lHBHZl$XMffvzEsnTTZwtavmTvlQUm", ips: "203.0.113.10, 203.0.113.20", created: "Jun 2, 2026", secretVisible: false }]);
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
  const [totpChallenge, setTotpChallenge] = useStateS(null);

  if (apiAccess !== "granted") {
    return (
      <div className="set-card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--info-100)", color: "var(--info-700)", display: "grid", placeItems: "center" }}><SIcon.doc style={{ width: 26, height: 26 }} /></div>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "var(--gray-900)" }}>{apiAccess === "pending" ? "API access request in review" : "Get started with the Onboard API"}</h2>
        <p style={{ margin: "0 auto 20px", fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.6, maxWidth: 420 }}>
          {apiAccess === "pending" ? "We're reviewing your request for API access. You'll receive an email once your credentials are ready — this usually takes 1–2 business days." : "Integrate cross-border payouts, stablecoin wallet infrastructure, and multi-currency deposits directly into your product via our REST API."}
        </p>
        {apiAccess === "pending" ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#FEF3C7", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#92400E" }}><SIcon.clock style={{ width: 15, height: 15 }} /> Request pending</div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => onToast && onToast("API access requested — we'll be in touch")}>Request API access</button>
            <a href="https://docs.onboard.xyz" target="_blank" rel="noopener" className="btn btn-ghost" style={{ textDecoration: "none" }}>Read the docs <SIcon.external style={{ width: 13, height: 13 }} /></a>
          </div>
        )}
        {apiAccess !== "pending" && <p style={{ margin: "20px auto 0", fontSize: 12, color: "var(--gray-500)", maxWidth: 360, lineHeight: 1.5 }}>Need help? Reach out to <a href="mailto:support@onboard.xyz" style={{ color: "var(--info-700)", fontWeight: 500, textDecoration: "none" }}>support@onboard.xyz</a> and we'll get you set up.</p>}
      </div>
    );
  }

  const requireTotp = (title, description, onVerified) => setTotpChallenge({ title, description, onVerified });

  const toggleKeySecret = (id) => {
    const key = apiKeys.find(k => k.id === id);
    if (key && key.secretVisible) setApiKeys(prev => prev.map(k => k.id === id ? { ...k, secretVisible: false } : k));
    else requireTotp("Reveal API secret", "Verify your identity to view this secret.", () => { setApiKeys(prev => prev.map(k => k.id === id ? { ...k, secretVisible: true } : k)); setTotpChallenge(null); });
  };

  const copyText = (text, label) => { navigator.clipboard && navigator.clipboard.writeText(text); onToast && onToast(`${label} copied`); };

  const handleCreate = (label, ips) => {
    const newKey = { id: "k" + Date.now(), label: label || "Untitled", key: "onb_test_" + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18), secret: Array.from({ length: 32 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#"[Math.floor(Math.random() * 64)]).join(""), ips: ips || "", created: "Just now", secretVisible: true };
    setApiKeys(prev => [...prev, newKey]);
    setCreateOpen(false);
    onToast && onToast("API key created");
  };

  const handleRevoke = (id) => {
    requireTotp("Revoke API key", "Verify your identity to revoke this key. This action cannot be undone.", () => {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      setDeleteTarget(null); setTotpChallenge(null);
      onToast && onToast("API key revoked");
    });
  };

  const toggleWebhookSecret = () => {
    if (secretVisible) setSecretVisible(false);
    else requireTotp("Reveal webhook secret", "Verify your identity to view the webhook secret.", () => { setSecretVisible(true); setTotpChallenge(null); });
  };

  const regenerateSecret = () => {
    requireTotp("Regenerate webhook secret", "Verify your identity to regenerate the webhook secret. The current secret will stop working immediately.", () => {
      setWebhookSecret("whsec_" + Array.from({ length: 30 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join(""));
      setTotpChallenge(null);
      onToast && onToast("Webhook secret regenerated");
    });
  };

  return (
    <>
      <div className="set-banner info">
        <div className="ic"><SIcon.doc /></div>
        <div className="meta">
          <div className="t" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Onboard API
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", background: "var(--success-100)", color: "var(--success-700)", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /> PRODUCTION
            </span>
          </div>
          <div className="s">Programmatic access to cross-border payouts, stablecoin wallet infrastructure, and multi-currency deposits — everything you need to embed payments into your product. This is your live environment — contact <a href="mailto:support@onboard.xyz" style={{ color: "var(--info-700)", fontWeight: 500, textDecoration: "none" }}>support@onboard.xyz</a> to provision a sandbox for development.</div>
          <div style={{ marginTop: 10 }}><a href="https://docs.onboard.xyz" target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 500, color: "var(--info-700)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>Read the docs <SIcon.external style={{ width: 13, height: 13 }} /></a></div>
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-head">
          <div style={{ flex: 1 }}><h2 className="set-card-title">API keys</h2><p className="set-card-sub">Keys authenticate your server-side API calls. Keep secrets secure — never expose them client-side.</p></div>
          <button className="btn btn-sm" onClick={() => setCreateOpen(true)}><SIcon.plus /> Create key</button>
        </div>

        {apiKeys.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ color: "var(--gray-400)", marginBottom: 8, display: "flex", justifyContent: "center" }}><SIcon.doc style={{ width: 32, height: 32 }} /></div>
            <div style={{ fontSize: 13, color: "var(--gray-600)" }}>No API keys yet</div>
            <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>Create one to start integrating with the Onboard API.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {apiKeys.map((k) => (
              <div key={k.id} className="set-apikey-card">
                <div className="set-apikey-header">
                  <div className="set-apikey-label">{k.label}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="set-apikey-action" title="Revoke" onClick={() => setDeleteTarget(k.id)}><SIcon.trash /></button>
                  </div>
                </div>
                <div className="set-apikey-field">
                  <div className="set-apikey-field-label">Key</div>
                  <div className="set-apikey-field-value"><code>{k.key}</code><button className="set-apikey-copy" onClick={() => copyText(k.key, "API key")}><SIcon.copy /></button></div>
                </div>
                <div className="set-apikey-field">
                  <div className="set-apikey-field-label">Secret</div>
                  <div className="set-apikey-field-value">
                    <code>{k.secretVisible ? k.secret : "••••••••••••••••••••••••••••••••"}</code>
                    {k.secretVisible && <button className="set-apikey-copy" onClick={() => copyText(k.secret, "Secret")}><SIcon.copy /></button>}
                    <button className="set-apikey-toggle" onClick={() => toggleKeySecret(k.id)}>{k.secretVisible ? "Hide" : "Show"}</button>
                  </div>
                </div>
                {k.ips && <div className="set-apikey-field"><div className="set-apikey-field-label">Allowed IPs</div><div className="set-apikey-field-value"><code>{k.ips}</code></div></div>}
                <div className="set-apikey-meta">Created {k.created}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="set-card">
        <div className="set-card-head"><div><h2 className="set-card-title">Webhooks</h2><p className="set-card-sub">We'll send event notifications to your webhook URL. Use the secret to verify signatures.</p></div></div>
        <div className="set-list">
          <div className="set-row">
            <div className="set-row-k">Webhook URL</div>
            <div className="set-row-v" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {webhookEditing ? (
                <>
                  <input className="inp" style={{ flex: 1, fontSize: 13, minWidth: 200 }} value={webhookDraft} onChange={(e) => setWebhookDraft(e.target.value)} placeholder="https://your-server.com/webhooks" />
                  <button className="btn btn-sm" onClick={() => { setWebhookUrl(webhookDraft); setWebhookEditing(false); onToast && onToast("Webhook URL updated"); }}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setWebhookEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="strong" style={{ flex: 1, fontSize: 13, wordBreak: "break-all" }}>{webhookUrl || <span style={{ color: "var(--gray-400)" }}>Not set</span>}</div>
                  <button className="set-row-edit" onClick={() => { setWebhookDraft(webhookUrl); setWebhookEditing(true); }}><SIcon.pencil style={{ width: 13, height: 13 }} /></button>
                </>
              )}
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-k">Authorization URL</div>
            <div className="set-row-v" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {authEditing ? (
                <>
                  <input className="inp" style={{ flex: 1, fontSize: 13, minWidth: 200 }} value={authDraft} onChange={(e) => setAuthDraft(e.target.value)} placeholder="https://your-server.com/auth/callback" />
                  <button className="btn btn-sm" onClick={() => { setAuthUrl(authDraft); setAuthEditing(false); onToast && onToast("Authorization URL updated"); }}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAuthEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="strong" style={{ flex: 1, fontSize: 13, wordBreak: "break-all" }}>{authUrl || <span style={{ color: "var(--gray-400)" }}>Not set</span>}</div>
                  <button className="set-row-edit" onClick={() => { setAuthDraft(authUrl); setAuthEditing(true); }}><SIcon.pencil style={{ width: 13, height: 13 }} /></button>
                </>
              )}
            </div>
          </div>

          <div className="set-row">
            <div className="set-row-k">Webhook secret</div>
            <div className="set-row-v" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <code style={{ flex: 1, fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", wordBreak: "break-all", color: "var(--gray-900)" }}>{secretVisible ? webhookSecret : "••••••••••••••••••••••••••••••••••••••••"}</code>
              {secretVisible && <button className="set-apikey-copy" onClick={() => copyText(webhookSecret, "Webhook secret")}><SIcon.copy /></button>}
              <button className="set-apikey-toggle" onClick={toggleWebhookSecret}>{secretVisible ? "Hide" : "Show"}</button>
              <button className="set-apikey-action" title="Regenerate" onClick={regenerateSecret}><SIcon.refresh /></button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Create API key">
        <CreateApiKeyForm onCancel={() => setCreateOpen(false)} onCreate={handleCreate} />
      </Sheet>

      <Sheet open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Revoke API key?">
        {deleteTarget && (
          <>
            <div style={{ fontSize: 13.5, color: "var(--gray-700)", lineHeight: 1.55, marginBottom: 12 }}>
              <strong>{apiKeys.find(k => k.id === deleteTarget)?.label}</strong> will be permanently revoked. Any integrations using this key will stop working immediately.
            </div>
            <div className="set-modal-foot">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-lg" style={{ background: "#DC2626" }} onClick={() => handleRevoke(deleteTarget)}>Revoke key</button>
            </div>
          </>
        )}
      </Sheet>

      <VerifyTotpSheet
        open={!!totpChallenge}
        title={totpChallenge?.title}
        description={totpChallenge?.description}
        onClose={() => setTotpChallenge(null)}
        onVerified={() => totpChallenge && totpChallenge.onVerified()} />
    </>
  );
}

// Create-key form lives inside the Sheet — step 0 (form) then step 1 (2FA confirm).
function CreateApiKeyForm({ onCancel, onCreate }) {
  const [step, setStep] = useStateS(0);
  const [label, setLabel] = useStateS("");
  const [ips, setIps] = useStateS("");
  const [code, setCode] = useStateS("");
  const [busy, setBusy] = useStateS(false);
  const [error, setError] = useStateS("");

  const handleSubmit = () => {
    setBusy(true); setError("");
    setTimeout(() => {
      if (code === "123456" || (/^\d{6}$/.test(code) && parseInt(code[5], 10) % 2 === 0)) { setBusy(false); onCreate(label, ips); }
      else { setBusy(false); setError("Invalid code. Try again."); setCode(""); }
    }, 600);
  };

  if (step === 0) {
    return (
      <>
        <div className="field" style={{ marginBottom: 16 }}>
          <div className="lbl">Label <span className="opt">· optional</span></div>
          <input className="inp" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Production, Staging" />
        </div>
        <div className="field">
          <div className="lbl">Allowed IP addresses</div>
          <input className="inp" value={ips} onChange={(e) => setIps(e.target.value)} placeholder="Comma-separated, e.g. 203.0.113.10, 10.0.0.1" />
          <div className="help" style={{ marginTop: 6, fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>IP restriction is required for withdrawal-enabled keys. Leave blank if this key won't initiate withdrawals.</div>
        </div>
        <div className="set-modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-lg" onClick={() => setStep(1)}>Continue</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.55, marginBottom: 16 }}>Enter the 6-digit code from your authenticator app to confirm.</div>
      <div className="field">
        <div className="lbl">Code</div>
        <input className="inp" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" inputMode="numeric" maxLength={6} style={{ textAlign: "center", fontSize: 18, letterSpacing: "0.2em", fontWeight: 600 }} />
      </div>
      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{error}</div>}
      <div className="set-modal-foot">
        <button className="btn btn-ghost" onClick={() => setStep(0)} disabled={busy}>← Back</button>
        <button className="btn btn-lg" onClick={handleSubmit} disabled={busy || code.length < 6}>{busy ? "Verifying…" : "Create key"}</button>
      </div>
    </>
  );
}

window.OBSettings = { SettingsScreen, DeveloperSection };
