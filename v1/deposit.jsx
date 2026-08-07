/* global React */
const { useState, useEffect } = React;
const Icon = window.OBIcon;
const NetworkIcon = window.OBNetworkIcon;
const { STABLECOIN_CHAINS } = window.OBData;
const { Page, Sheet, Banner, StatusPanel, FieldGrid, FeeGrid, RailTabs, TimingChip, QrCode, Flag, useIsDesktop, truncateMiddle, ErrorPanel } = window.OBPrimitives;
const Combobox = window.OBCombobox;

function CoinBadge({ coin, size = 26 }) {
  const colors = { USDC: "#2775CA", USDT: "#26A17B" };
  const labels = { USDC: "Ⓒ", USDT: "Ⓣ" };
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[coin] || "#888", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.62, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>
      {labels[coin] || "?"}
    </div>
  );
}

function PanelActions({ fields, onCopy, showPdf = true }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn btn-soft btn-sm" onClick={() => {
        const lines = fields.map(f => `${f.k}: ${f.v}`).join("\n");
        if (navigator.clipboard) navigator.clipboard.writeText(lines).catch(() => {});
        onCopy();
      }}><Icon.copy /> Copy account details</button>
      {showPdf && <button className="btn btn-ghost btn-sm"><Icon.doc /> Download as PDF</button>}
    </div>
  );
}

// The detail behind the two limit rows on each rail card. Lives in a Sheet rather than on the
// page: four lines per rail stay scannable, and anyone who actually needs the rules gets them
// in one tap. Same pattern as the Cards fee schedule.
function DepositLimitsSheet({ onClose }) {
  const row = (title, body) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.6 }}>{body}</div>
    </div>
  );
  return (
    <Sheet open onClose={onClose} title="About deposit limits">
      {row("From your own account",
        "A bank account in your registered business name. Highest limits apply.")}
      {row("From anyone else",
        "A customer, client, or any other payer. Lower limits apply.")}
      {row("What \"may need review\" means",
        "We may hold a third-party deposit briefly to check it, and ask for documents showing who sent the funds and why. We'll email your registered business address.")}
      {row("USD amounts",
        "Figures marked ≈ are approximate and move with the rate. Limits are enforced in the deposit currency.")}
      <div className="td-banner info" style={{ marginTop: 4 }}>
        <Icon.info />
        <div><div className="s">Limits are set per business. If you need higher limits, <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer">message your account manager</a>.</div></div>
      </div>
      <div className="set-modal-foot">
        <button className="btn btn-lg" onClick={onClose}>Got it</button>
      </div>
    </Sheet>
  );
}

// ---------- NGN (convert-on-deposit) ----------
const NGN_ACCOUNT = { bank: "Aella Microfinance Bank", name: "GFS / Acme Trading Co", number: "5200 0443 12" };
// One rail — Nigerian bank transfer. Third-party deposits are supported here; the restriction
// in the docs applies to cash deposits on OTA, not to this flow.
const NGN_FEES = [
  { rail: "Bank transfer", fee: "Free", timing: "Minutes",
    limits: {
      own: [
        { label: "Per transaction", local: "₦500,000,000", usd: "$357,000" },
        { label: "Per day", local: "₦2,000,000,000", usd: "$1,428,000" },
      ],
      other: [
        { label: "Per transaction", local: "₦50,000,000", usd: "$35,700" },
        { label: "Per day", local: "₦200,000,000", usd: "$142,800" },
      ],
      otherReview: true,
    } },
];

function NgnPanel({ issuance = "ready", onCopy }) {
  const [state, setState] = useState(issuance);
  const [showLimits, setShowLimits] = useState(false);
  useEffect(() => setState(issuance), [issuance]);

  const generate = () => { setState("processing"); setTimeout(() => setState("ready"), 2500); };

  if (state === "not_generated") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.plus />}
        title="Generate NGN account details"
        desc="We'll create a dedicated Naira virtual account for your business. NGN deposits are converted to USD at the live rate when they clear.">
        <button className="btn" onClick={generate}>Generate NGN account</button>
      </StatusPanel>
    );
  }
  if (state === "processing") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<span className="spin" style={{ width: 24, height: 24 }} />}
        title="Setting up your NGN account…" desc="This usually takes a few seconds">
        <div className="gen-progress"><span /></div>
      </StatusPanel>
    );
  }

  const fields = [
    { k: "Bank", v: NGN_ACCOUNT.bank },
    { k: "Account name", v: NGN_ACCOUNT.name },
    { k: "Account number", v: NGN_ACCOUNT.number, copy: true },
    { k: "Conversion rate", v: "1 USD = ₦1,400.50" },
  ];
  return (
    <div className="rail-panel">
      <div className="panel-intro">
        <div className="panel-intro-desc">Send NGN from any Nigerian bank to the details below. Your deposit is converted to USD at the live rate when it lands.</div>
        <TimingChip tone="fast" label="Minutes" />
      </div>
      <Banner tone="info" icon={<Icon.info />}>
        The exchange rate is locked at the moment your NGN deposit clears — not when you initiate the transfer.
      </Banner>
      <FieldGrid fields={fields} onCopy={onCopy} />
      <PanelActions fields={fields} onCopy={onCopy} showPdf={false} />
      <FeeGrid fees={NGN_FEES} onAbout={() => setShowLimits(true)} />
      {showLimits && <DepositLimitsSheet onClose={() => setShowLimits(false)} />}
    </div>
  );
}

// ---------- Stablecoins ----------
function StablecoinPanel({ coin, issuance = "ready", onCopy }) {
  const chains = STABLECOIN_CHAINS[coin] || [];
  const [activeChain, setActiveChain] = useState(0);
  const chain = chains[activeChain];
  const [state, setState] = useState(issuance);
  useEffect(() => setState(issuance), [issuance]);
  const isDesktop = useIsDesktop();

  const generate = () => { setState("processing"); setTimeout(() => setState("ready"), 2000); };

  if (state === "not_generated") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.plus />}
        title={`Generate ${coin} deposit address`}
        desc={`We'll provision a dedicated ${coin} wallet address for your business. Deposits are credited as USD at a 1:1 rate.`}>
        <button className="btn" onClick={generate}>Generate {coin} address</button>
      </StatusPanel>
    );
  }
  if (state === "processing") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<span className="spin" style={{ width: 24, height: 24 }} />}
        title={`Creating your ${coin} deposit address…`} desc="This usually takes a few seconds">
        <div className="gen-progress"><span /></div>
      </StatusPanel>
    );
  }

  const fields = chain ? [
    { k: "Minimum deposit", v: `${chain.min} ${coin}` },
    { k: "Conversion rate", v: `1 ${coin} = 1 USD` },
    { k: "Fee", v: "$1.00" },
  ] : [];

  const copyAddr = () => {
    if (chain && navigator.clipboard) navigator.clipboard.writeText(chain.address).catch(() => {});
    onCopy();
  };

  return (
    <div className="rail-panel">
      <div className="panel-intro">
        <div className="panel-intro-desc">
          {coin === "USDC" ? "USD Coin (USDC) is a regulated stablecoin pegged 1:1 to USD." : "Tether (USDT) is a stablecoin pegged 1:1 to USD."} Send {coin} on any supported network — credited as USD.
        </div>
        <TimingChip tone="fast" label="Minutes" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="field-k" style={{ marginBottom: 8 }}>Network</div>
        {isDesktop ? (
          <div className="chan-picker">
            {chains.map((c, i) => {
              const on = i === activeChain;
              const NIcon = NetworkIcon[c.id];
              return (
                <button key={c.id} className={`chan-btn ${on ? "on" : ""}`} onClick={() => setActiveChain(i)}>
                  {NIcon && <NIcon />}
                  {c.name}
                  <span style={{ fontSize: 11, opacity: .65, fontWeight: 400 }}>({c.short})</span>
                </button>
              );
            })}
          </div>
        ) : (
          // Lighter-weight than the currency selector (no card/avatar/search) — this is a
          // secondary choice nested under the coin, and a real backend can have ~10 networks,
          // too many to lay out as wrapping chips at phone width.
          <div className="net-select-wrap">
            {(() => { const NIcon = NetworkIcon[chain?.id]; return NIcon ? <span className="net-select-icon"><NIcon /></span> : null; })()}
            <select className="net-select" value={activeChain} onChange={(e) => setActiveChain(Number(e.target.value))}>
              {chains.map((c, i) => <option key={c.id} value={i}>{c.name} ({c.short})</option>)}
            </select>
            <Icon.arrowDown />
          </div>
        )}
      </div>

      {chain && (
        <>
          <Banner tone="danger" icon={<Icon.alert />}>
            Only send {coin} on the <strong>{chain.name}</strong> network to this address. Sending on the wrong network will result in permanent loss of funds.
          </Banner>
          <div className="qr-block">
            <div className="qr-frame"><QrCode value={chain.address} /></div>
            <div className="qr-side">
              <div className="qr-side-lbl">Deposit address · {chain.name}</div>
              <div className="qr-side-addr" title={chain.address}>{truncateMiddle(chain.address)}</div>
              <button className="btn btn-soft btn-sm" onClick={copyAddr}><Icon.copy /> Copy address</button>
              <div className="qr-side-hint">Scan the code with your wallet app, or copy the address to send {coin} on {chain.name}.</div>
            </div>
          </div>
          <FieldGrid fields={fields} onCopy={onCopy} />
        </>
      )}
    </div>
  );
}

// ---------- Fiat account provisioning (USD, EUR, GBP) ----------
// One shared pattern for all three, since all three are realistically partner-review processes,
// not instant provisioning: not_requested → submitting (brief, real API call, can fail fast) →
// under_review (days, with the partner — not a spinner, nothing is actively happening moment to
// moment) → ready, or declined after review. USD additionally gates on a whitelist before any
// request can even be made. If anything's needed mid-review, we reach out to the business's
// registered email — never a link out to the partner's own site.
const FIAT_ACCOUNT_DATA = {
  USD: {
    fields: [
      { k: "Account holder", v: "Acme Trading Co" },
      { k: "Bank name", v: "SSB Bank" },
      { k: "ABA / Routing number", v: "101019644" },
      { k: "Account number", v: "8841 0029 4471", copy: true },
      { k: "Account type", v: "Checking · Business" },
      { k: "SWIFT / BIC", v: "LEADUSAA" },
      { k: "Bank address", v: "1801 Main Street, Kansas City, MO 64108, USA" },
    ],
    fees: [
      { rail: "ACH", fee: "0.5% + $1", timing: "1–3 business days",
        limits: { own: { local: "$250,000" }, other: { local: "$50,000" }, otherReview: true } },
      { rail: "Domestic Fedwire", fee: "0.5% + $20", timing: "Same day",
        limits: { own: { local: "$1,000,000" }, other: { local: "$100,000" }, otherReview: true } },
      { rail: "International SWIFT", fee: "0.5% + $25", timing: "1–2 business days",
        limits: { own: { local: "$1,000,000" }, other: { local: "$100,000" }, otherReview: true } },
    ],
    rails: ["ACH", "Domestic Fedwire", "SWIFT"],
    readyDesc: "Receive USD via ACH, domestic wire (Fedwire), or international SWIFT transfer — all to the same account.",
    requestTitle: "Request your USD account",
    requestDesc: "We'll submit your business for USD account provisioning. This is reviewed by our banking partner and typically takes 1–3 business days.",
    reviewDesc: "Your USD account request is with our banking partner for review. If we need anything else while reviewing, we'll reach out to your registered business email — keep an eye on it, including spam.",
    reviewTiming: "1–3 business days",
  },
  EUR: {
    fields: [
      { k: "Account name", v: "Acme Trading Co", copy: true },
      { k: "IBAN", v: "GB11CLJU04130742056386", copy: true },
      { k: "Account type", v: "Checking", copy: true },
      { k: "Bank name", v: "Clear Junction Limited", copy: true },
      { k: "Bank address", v: "85 Great Portland Street, London, United Kingdom, W1W 7LT", copy: true },
      { k: "Conversion rate", v: "$1 = €0.88" },
    ],
    fees: [
      { rail: "SEPA", fee: "€0.50", timing: "1–2 business days",
        limits: { own: { local: "€500,000", usd: "$543,000" }, other: { local: "€50,000", usd: "$54,300" }, otherReview: true } },
    ],
    readyDesc: "Send EUR from any SEPA-connected bank to the details below. Your deposit is converted to USD at the live rate when received.",
    readyTiming: "1–2 business days",
    readyTimingTone: "med",
    readyBanner: "The exchange rate is locked when your EUR deposit is received — not when you initiate the transfer.",
    requestTitle: "Request your EUR account",
    requestDesc: "We'll allocate a dedicated EUR IBAN for your business. This is reviewed by our banking partner and typically takes 1–3 business days.",
    reviewDesc: "Your EUR IBAN is being allocated and approved by our banking partner. If we need anything else while reviewing, we'll reach out to your registered business email.",
    reviewTiming: "1–3 business days",
  },
  GBP: {
    fields: [
      { k: "Account name", v: "Acme Trading Co", copy: true },
      { k: "Account number", v: "42056386", copy: true },
      { k: "IBAN", v: "GB11CLJU04130742056386", copy: true },
      { k: "Sort code", v: "041307", copy: true },
      { k: "Account type", v: "Checking", copy: true },
      { k: "Bank name", v: "Clear Junction Limited", copy: true },
      { k: "Bank address", v: "85 Great Portland Street, London, United Kingdom, W1W 7LT", copy: true },
      { k: "Conversion rate", v: "$1 = £0.75" },
    ],
    fees: [
      { rail: "SEPA", fee: "£0.50 – £1.00", timing: "1–2 business days",
        limits: { own: { local: "£250,000", usd: "$316,000" }, other: { local: "£50,000", usd: "$63,300" }, otherReview: true } },
      { rail: "Faster Payments", fee: "£0.50 – £1.00", timing: "Under 2 hours",
        limits: { own: { local: "£250,000", usd: "$316,000" }, other: { local: "£50,000", usd: "$63,300" }, otherReview: true } },
    ],
    readyDesc: "Send GBP via SEPA or Faster Payments to the details below. Your deposit is converted to USD at the live rate when received.",
    readyBanner: "The exchange rate is locked when your GBP deposit is received — not when you initiate the transfer.",
    requestTitle: "Request your GBP account",
    requestDesc: "We'll allocate a dedicated GBP account number & sort code for your business. This is reviewed by our banking partner and typically takes 1–3 business days.",
    reviewDesc: "Your GBP account details are being allocated and approved by our banking partner. If we need anything else while reviewing, we'll reach out to your registered business email.",
    reviewTiming: "1–3 business days",
  },
};

function WhitelistRequestPanel({ ccy }) {
  return (
    <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.shield />}
      title={`${ccy} accounts are invite-only right now`}
      desc={`We're rolling out ${ccy} accounts to select businesses first, and expanding access over time.`}>
      <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer" className="btn btn-lg">Request access from your account manager</a>
    </StatusPanel>
  );
}

function FiatAccountPanel({ ccy, state: initialState, onCopy }) {
  const data = FIAT_ACCOUNT_DATA[ccy];
  const [state, setState] = useState(initialState);
  const [showLimits, setShowLimits] = useState(false);
  useEffect(() => setState(initialState), [initialState]);
  if (!data) return null;

  const submit = () => { setState("submitting"); setTimeout(() => setState("under_review"), 1400); };

  if (state === "not_whitelisted") return <WhitelistRequestPanel ccy={ccy} />;

  if (state === "not_requested") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.bank />}
        title={data.requestTitle} desc={data.requestDesc}>
        {data.rails && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {data.rails.map(r => <span key={r} className="usd-rail-badge">{r}</span>)}
          </div>
        )}
        <button className="btn btn-lg" onClick={submit}>Begin request</button>
      </StatusPanel>
    );
  }

  if (state === "submitting") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<span className="spin" style={{ width: 24, height: 24 }} />}
        title="Submitting your request…" desc="This only takes a moment — we're sending it for review." />
    );
  }

  if (state === "error") {
    return <ErrorPanel onRetry={submit} />;
  }

  if (state === "under_review") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.shield />}
        title={`${ccy} account under review`} desc={data.reviewDesc}>
        <TimingChip tone="slow" label={data.reviewTiming} />
        <div style={{ marginTop: 28, fontSize: 12.5, color: "var(--gray-600)" }}>
          Taking longer than expected? <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer" style={{ color: "var(--info-700)", textDecoration: "underline", fontWeight: 500 }}>Message your account manager</a>
        </div>
      </StatusPanel>
    );
  }

  if (state === "declined") {
    return (
      <StatusPanel iconBg="var(--danger-100)" iconColor="var(--danger-700)" icon={<Icon.alert />}
        title={`${ccy} account request declined`}
        desc={`Unfortunately, our banking partner was unable to approve your ${ccy} account at this time. You can still receive and send in your other supported currencies in the meantime.`}>
        <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer" className="btn btn-lg">Message your account manager</a>
      </StatusPanel>
    );
  }

  // ready
  const copyableFields = data.fields.filter(f => f.copy);
  return (
    <div className="rail-panel">
      <div className="panel-intro">
        <div className="panel-intro-desc">{data.readyDesc}</div>
        {data.readyTiming && <TimingChip tone={data.readyTimingTone} label={data.readyTiming} />}
      </div>
      {data.readyBanner && <Banner tone="info" icon={<Icon.info />}>{data.readyBanner}</Banner>}
      <FieldGrid fields={data.fields} onCopy={onCopy} />
      <PanelActions fields={copyableFields} onCopy={onCopy} />
      <FeeGrid fees={data.fees} onAbout={() => setShowLimits(true)} />
      {showLimits && <DepositLimitsSheet onClose={() => setShowLimits(false)} />}
    </div>
  );
}

// ---------- Deposit page ----------
function DepositPage({ onBack, onToast, usdAccountStatus = "ready", ngnIssuance = "ready", stablecoinIssuance = "ready", accountSuspended = false, fiatConvert = "ready" }) {
  const tabs = [
    { id: "ngn", name: "NGN", full: "Nigerian Naira", method: "Bank transfer", flag: "ng", type: "ngn" },
    { id: "usdc", name: "USDC", full: "USD Coin", method: "Stablecoin", coin: "USDC", type: "stablecoin" },
    { id: "usdt", name: "USDT", full: "Tether USD", method: "Stablecoin", coin: "USDT", type: "stablecoin" },
    { id: "usd-bank", name: "USD", full: "US Dollar", method: "Bank transfer", flag: "us", type: "usd" },
    { id: "eur-bank", name: "EUR", full: "Euro", method: "Bank transfer", flag: "eu", type: "fiat-convert", ccy: "EUR" },
    { id: "gbp-bank", name: "GBP", full: "Pound Sterling", method: "Bank transfer", flag: "gb", type: "fiat-convert", ccy: "GBP" },
  ];
  const [activeRail, setActiveRail] = useState(0);
  const activeTab = tabs[activeRail];
  const handleCopy = () => onToast("Copied");
  const isDesktop = useIsDesktop();

  return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><Icon.arrowLeft /> Back to Home</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Deposit</span>
      </div>

      <h1 className="title">Deposit</h1>
      <p className="subtitle">Fund your USD balance via global accounts, local currency accounts, or stablecoins.</p>

      {accountSuspended ? (
        <Banner tone="danger" icon={<Icon.alert />} title="Deposits disabled">
          Your account is currently suspended. Deposits are not available until the suspension is lifted. Contact support for next steps.
        </Banner>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="deposit-head">
            <div className="deposit-head-row">
              <h2>Choose a funding method</h2>
              <span className="deposit-head-note">All deposits are held as USD</span>
            </div>
            {isDesktop ? (
              <RailTabs tabs={tabs} active={activeRail} onChange={setActiveRail} />
            ) : (
              <div className="deposit-selector">
                <Combobox
                  value={activeTab.id}
                  onChange={(id) => setActiveRail(tabs.findIndex(t => t.id === id))}
                  options={tabs.map(t => ({
                    value: t.id,
                    label: t.name,
                    sub: `${t.full} · ${t.method}`,
                    leading: t.coin ? <CoinBadge coin={t.coin} size={26} /> : <Flag cc={t.flag} size={26} />,
                    search: `${t.name} ${t.full} ${t.method}`,
                  }))}
                  placeholder="Select a currency"
                  searchPlaceholder="Search currency…" />
              </div>
            )}
          </div>

          {activeTab.type === "ngn" && <NgnPanel issuance={ngnIssuance} onCopy={handleCopy} />}
          {activeTab.type === "stablecoin" && <StablecoinPanel coin={activeTab.coin} issuance={stablecoinIssuance} onCopy={handleCopy} />}
          {activeTab.type === "usd" && <FiatAccountPanel ccy="USD" state={usdAccountStatus} onCopy={handleCopy} />}
          {activeTab.type === "fiat-convert" && <FiatAccountPanel ccy={activeTab.ccy} state={fiatConvert} onCopy={handleCopy} />}
        </div>
      )}
    </Page>
  );
}

window.OBDeposit = { DepositPage };
