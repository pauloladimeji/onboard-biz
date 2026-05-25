/* global React */
const { useState: useStateS, useEffect: useEffectS } = React;
const SIcon = window.OBIcon;
const { BUSINESS_PROFILE } = window.OBData;

// =====================================================
// SETTINGS — simplified to: Business profile · Security
// =====================================================

const SECTIONS = [
  { id: "profile",  label: "Business profile", icon: "bank",   blurb: "Business name, contact, verification" },
  { id: "security", label: "Security",         icon: "shield", blurb: "Authenticator app for 2FA" },
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

function SettingsScreen({ onToast }) {
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
              {active === "profile"  && <ProfileSection onToast={onToast} />}
              {active === "security" && <SecuritySection onToast={onToast} />}
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
  // Mock state for the prototype: whether the user has set up an authenticator
  const [totpSetUp, setTotpSetUp] = useStateS(true);
  const [setupOpen, setSetupOpen] = useStateS(false);
  const [confirmRevoke, setConfirmRevoke] = useStateS(false);

  return (
    <>
      <div className="set-banner info">
        <div className="ic"><SIcon.shield /></div>
        <div className="meta">
          <div className="t">Two-factor authentication is required</div>
          <div className="s">
            Onboard prompts you for a 6-digit code on sign-in and on every outbound payment.
            Set up your authenticator app for the smoothest experience — we&rsquo;ll fall back to email codes if you can&rsquo;t access it.
          </div>
        </div>
      </div>

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
              Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app to generate 6-digit codes.
            </p>
          </div>
        </div>

        <div className="set-totp-status">
          <div className="ic"><SIcon.shield /></div>
          {totpSetUp ? (
            <div className="meta">
              <div className="t">Authenticator app connected</div>
              <div className="s">Set up · last used 2 hours ago</div>
            </div>
          ) : (
            <div className="meta">
              <div className="t">No authenticator app set up</div>
              <div className="s">You&rsquo;re currently falling back to email codes for every sign-in and payment.</div>
            </div>
          )}
          <div style={{display: "flex", gap: 8}}>
            {totpSetUp ? (
              <button className="btn btn-soft btn-sm" onClick={() => setConfirmRevoke(true)}>
                Revoke
              </button>
            ) : (
              <button className="btn btn-sm" onClick={() => setSetupOpen(true)}>
                <SIcon.shield /> Set up app
              </button>
            )}
          </div>
        </div>
      </div>

      {setupOpen && (
        <TotpSetupModal
          onClose={() => setSetupOpen(false)}
          onDone={() => { setSetupOpen(false); setTotpSetUp(true); onToast && onToast("Authenticator app set up"); }}
        />
      )}

      {confirmRevoke && (
        <RevokeTotpModal
          onClose={() => setConfirmRevoke(false)}
          onConfirm={() => {
            setConfirmRevoke(false);
            setTotpSetUp(false);
            onToast && onToast("Authenticator revoked. You’ll receive email codes until you set it up again.");
          }}
        />
      )}
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

window.OBSettings = { SettingsScreen };
