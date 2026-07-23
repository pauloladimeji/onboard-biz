/* global React */
const { useState, useEffect } = React;
const Icon = window.OBIcon;
const NetworkIcon = window.OBNetworkIcon;
const { STABLECOIN_CHAINS } = window.OBData;
const { Page, Banner, StatusPanel, FieldGrid, FeeGrid, RailTabs, TimingChip, QrCode, Flag, useIsDesktop, truncateMiddle } = window.OBPrimitives;
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
      }}><Icon.copy /> Copy all details</button>
      {showPdf && <button className="btn btn-ghost btn-sm"><Icon.doc /> Download as PDF</button>}
    </div>
  );
}

// ---------- NGN (convert-on-deposit) ----------
const NGN_ACCOUNT = { bank: "Aella Microfinance Bank", name: "GFS / Acme Trading Co", number: "5200 0443 12" };

function NgnPanel({ issuance = "ready", onCopy }) {
  const [state, setState] = useState(issuance);
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
    { k: "Deposit fee", v: "Free" },
    { k: "Minimum deposit", v: "₦50,000" },
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

// ---------- USD account application ----------
function UsdStepper({ step }) {
  const steps = ["Initiate application", "Verify with partner", "Review"];
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="stepper-line" style={{ background: done || active ? "var(--gray-400)" : "var(--gray-200)" }} />}
            <div className="stepper-node">
              <div className="stepper-dot" style={{
                background: done || active ? "var(--gray-900)" : "transparent",
                border: done || active ? "none" : "1.5px solid var(--gray-300)",
                color: done || active ? "#fff" : "var(--gray-400)",
              }}>
                {done ? <Icon.check /> : i + 1}
              </div>
              <span className="stepper-label" style={{ fontWeight: active ? 600 : 400, color: done || active ? "var(--gray-900)" : "var(--gray-400)" }}>{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const USD_RAILS = ["ACH", "Domestic Fedwire", "SWIFT"];
const USD_BANK_DETAILS_FIELDS = [
  { k: "Account holder", v: "Acme Trading Co" },
  { k: "Bank name", v: "SSB Bank" },
  { k: "ABA / Routing number", v: "101019644" },
  { k: "Account number", v: "8841 0029 4471", copy: true },
  { k: "Account type", v: "Checking · Business" },
  { k: "SWIFT / BIC", v: "LEADUSAA" },
  { k: "Bank address", v: "1801 Main Street, Kansas City, MO 64108, USA" },
];
const USD_BANK_FEES = [
  { rail: "ACH", fee: "0.5% + $1", timing: "1–3 business days" },
  { rail: "Domestic Fedwire", fee: "0.5% + $20", timing: "Same day" },
  { rail: "International SWIFT", fee: "0.5% + $25", timing: "1–2 business days" },
];

function UsdPanel({ status, onCopy }) {
  const [localStep, setLocalStep] = useState(null); // null | "submitting" | "ready" | "opened"
  useEffect(() => setLocalStep(null), [status]);

  if (status === "approved") {
    return (
      <div className="rail-panel">
        <div className="panel-intro-desc" style={{ marginBottom: 18 }}>
          Receive USD via ACH, domestic wire (Fedwire), or international SWIFT transfer — all to the same account.
        </div>
        <FieldGrid fields={USD_BANK_DETAILS_FIELDS} onCopy={onCopy} />
        <FeeGrid fees={USD_BANK_FEES} />
        <PanelActions fields={USD_BANK_DETAILS_FIELDS} onCopy={onCopy} />
      </div>
    );
  }

  if (status === "not_applied" && localStep === "submitting") {
    return (
      <div className="rail-panel">
        <UsdStepper step={0} />
        <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<span className="spin" style={{ width: 24, height: 24 }} />}
          title="Submitting your details" desc="We're sending your business information to our banking partner. This only takes a moment.">
          <div className="gen-progress"><span /></div>
        </StatusPanel>
      </div>
    );
  }

  if (status === "not_applied" && localStep === "ready") {
    return (
      <div className="rail-panel">
        <UsdStepper step={1} />
        <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.external />}
          title="One more step" desc="Complete a short verification with our banking partner to activate your USD account. This opens in a new tab.">
          <button className="btn btn-lg" onClick={() => setLocalStep("opened")}><Icon.external /> Open verification</button>
        </StatusPanel>
      </div>
    );
  }

  if (status === "not_applied" && localStep === "opened") {
    return (
      <div className="rail-panel">
        <UsdStepper step={1} />
        <StatusPanel iconBg="#FFF6E5" iconColor="#A16207" icon={<Icon.clock />}
          title="Verification incomplete" desc="You started the verification process but didn't finish. Pick up where you left off — our banking partner still needs a few details from you.">
          <button className="btn btn-lg"><Icon.external /> Continue verification</button>
        </StatusPanel>
      </div>
    );
  }

  if (status === "not_applied") {
    const apply = () => { setLocalStep("submitting"); setTimeout(() => setLocalStep("ready"), 2000); };
    return (
      <div className="rail-panel">
        <UsdStepper step={0} />
        <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.bank />}
          title="Apply for USD banking" desc="Receive USD deposits into your Onboard account. We'll submit your business details to our banking partner — you'll then complete a short verification with them.">
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {USD_RAILS.map(r => <span key={r} className="usd-rail-badge">{r}</span>)}
          </div>
          <button className="btn btn-lg" onClick={apply}>Apply for USD account</button>
        </StatusPanel>
      </div>
    );
  }

  if (status === "incomplete") {
    return (
      <div className="rail-panel">
        <UsdStepper step={1} />
        <StatusPanel iconBg="#FFF6E5" iconColor="#A16207" icon={<Icon.clock />}
          title="Verification incomplete" desc="You started the verification process but didn't finish. Pick up where you left off — our banking partner still needs a few details from you.">
          <button className="btn btn-lg"><Icon.external /> Continue verification</button>
        </StatusPanel>
      </div>
    );
  }

  if (status === "under_review") {
    return (
      <div className="rail-panel">
        <UsdStepper step={2} />
        <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.shield />}
          title="Application under review" desc="Your application is being reviewed — this usually takes 1–2 business days. We'll email you when your account is ready, or if we need any additional info. Keep an eye on your email, including spam.">
          <TimingChip tone="slow" label="1–2 business days" />
        </StatusPanel>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="rail-panel">
        <UsdStepper step={2} />
        <StatusPanel iconBg="var(--danger-100)" iconColor="var(--danger-700)" icon={<Icon.alert />}
          title="Application declined"
          desc={<>Unfortunately, our banking partner was unable to approve your USD account at this time. <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer">Message your dedicated account team on WhatsApp</a> for more information.</>} />
      </div>
    );
  }

  return null;
}

// ---------- EUR / GBP (dedicated receiving account, convert-on-deposit) ----------
// Both created via the same account-details endpoint as the USD VA. GBP returns a
// CashLocalBankAccount (account number + sort code = bankCode); EUR returns a
// CashSepaBankAccount (IBAN = accountNumber, + BIC). Allocation isn't instant — details come
// back null for <1 min, so creation goes: create → allocating → ready (or error).
const FIAT_CONVERT_DATA = {
  EUR: {
    fields: [
      { k: "Account name", v: "Acme Trading Co", copy: true },
      { k: "IBAN", v: "GB11CLJU04130742056386", copy: true },
      { k: "Account type", v: "Checking", copy: true },
      { k: "Bank name", v: "Clear Junction Limited", copy: true },
      { k: "Bank address", v: "85 Great Portland Street, London, United Kingdom, W1W 7LT", copy: true },
      { k: "Conversion rate", v: "$1 = €0.88" },
    ],
    createDesc: "We'll allocate a dedicated EUR IBAN for your business. EUR deposits are converted to USD at the live rate when they clear.",
    desc: "Send EUR from any SEPA-connected bank to the details below. Your deposit is converted to USD at the live rate when received.",
    timingTone: "med",
    timing: "1–2 business days",
    banner: "The exchange rate is locked when your EUR deposit is received — not when you initiate the transfer.",
    fees: [{ rail: "SEPA", fee: "€0.50", timing: "1–2 business days" }],
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
    createDesc: "We'll allocate a dedicated GBP account number & sort code for your business. GBP deposits are converted to USD at the live rate when they clear.",
    desc: "Send GBP via SEPA or Faster Payments to the details below. Your deposit is converted to USD at the live rate when received.",
    timingTone: null,
    timing: null,
    banner: "The exchange rate is locked when your GBP deposit is received — not when you initiate the transfer.",
    fees: [
      { rail: "SEPA", fee: "£0.50 – £1.00", timing: "1–2 business days" },
      { rail: "Faster Payments", fee: "£0.50 – £1.00", timing: "Under 2 hours" },
    ],
  },
};

function FiatConvertPanel({ ccy, state: initialState = "ready", onCopy }) {
  const data = FIAT_CONVERT_DATA[ccy];
  const [state, setState] = useState(initialState);
  useEffect(() => setState(initialState), [initialState]);
  if (!data) return null;

  // Mirrors the real create → poll-until-allocated flow. Details are null while allocating;
  // 10s here stands in for the <1 min staging allocation.
  const create = () => { setState("processing"); setTimeout(() => setState("ready"), 10000); };

  if (state === "not_generated") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<Icon.bank />}
        title={`Create your ${ccy} account`} desc={data.createDesc}>
        <button className="btn btn-lg" onClick={create}>Create {ccy} account</button>
      </StatusPanel>
    );
  }
  if (state === "processing") {
    return (
      <StatusPanel iconBg="var(--info-100)" iconColor="var(--info-700)" icon={<span className="spin" style={{ width: 24, height: 24 }} />}
        title={`Setting up your ${ccy} account…`}
        desc={`Your ${ccy === "EUR" ? "IBAN is" : "account details are"} being allocated by our banking partner. This usually takes under a minute — you can leave this page and come back.`}>
        <div className="gen-progress"><span /></div>
      </StatusPanel>
    );
  }
  if (state === "error") {
    return (
      <StatusPanel iconBg="var(--danger-100)" iconColor="var(--danger-700)" icon={<Icon.alert />}
        title={`Couldn't set up your ${ccy} account`}
        desc={<>Something went wrong while allocating your {ccy} account details. Please try again — if it keeps happening, <a href="https://wa.me/14313404484" target="_blank" rel="noopener noreferrer">message your dedicated account team on WhatsApp</a>.</>}>
        <button className="btn btn-lg" onClick={create}><Icon.refresh /> Try again</button>
      </StatusPanel>
    );
  }

  const copyableFields = data.fields.filter(f => f.copy);
  return (
    <div className="rail-panel">
      <div className="panel-intro">
        <div className="panel-intro-desc">{data.desc}</div>
        {data.timing && <TimingChip tone={data.timingTone} label={data.timing} />}
      </div>
      <Banner tone="info" icon={<Icon.info />}>{data.banner}</Banner>
      <FieldGrid fields={data.fields} onCopy={onCopy} />
      <FeeGrid fees={data.fees} />
      <PanelActions fields={copyableFields} onCopy={onCopy} />
    </div>
  );
}

// ---------- Deposit page ----------
function DepositPage({ onBack, onToast, usdAccountStatus = "approved", ngnIssuance = "ready", stablecoinIssuance = "ready", accountSuspended = false, fiatConvert = "ready" }) {
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
          {activeTab.type === "usd" && <UsdPanel status={usdAccountStatus} onCopy={handleCopy} />}
          {activeTab.type === "fiat-convert" && <FiatConvertPanel ccy={activeTab.ccy} state={fiatConvert} onCopy={handleCopy} />}
        </div>
      )}
    </Page>
  );
}

window.OBDeposit = { DepositPage };
