/* global React */
const { useState: useStateR, useMemo: useMemoR, useRef: useRefR, useEffect: useEffectR } = React;
const RIcon = window.OBIcon;
const RNetworkIcon = window.OBNetworkIcon;
const { CURRENCIES: RCCY, RECIPIENTS_FULL, TXNS_FULL, PAYOUT_RAILS } = window.OBData;
const { Pill: RPill, TxRowDir: RTxRowDir, TxAmount: RTxAmount } = window.OBAccounts;
const RFlowShell = window.OBFlowShell;

const PAGE_SIZE_TX = 12;
const PAGE_SIZE_RC = 10;

// =====================================================
// Shared atoms
// =====================================================
function RFlag({ cc, size = 22 }) {
  return <div className="ccy-flag" style={{width: size, height: size, backgroundImage: `url(design-system/assets/flags/${cc}.svg)`}} />;
}

// =====================================================
// 1. ADD NEW RECIPIENT — wizard (3 steps inside the page)
// =====================================================
// Countries with the currencies that can be paid into them.
// USD is broadly available (most countries can receive a USD wire).
const COUNTRY_OPTIONS = [
  { cc: "ng", name: "Nigeria",        currencies: ["NGN", "USD"] },
  { cc: "gh", name: "Ghana",          currencies: ["GHS", "USD"] },
  { cc: "ke", name: "Kenya",          currencies: ["KES", "USD"] },
  { cc: "tz", name: "Tanzania",       currencies: ["TZS", "USD"] },
  { cc: "mz", name: "Mozambique",     currencies: ["MZN", "USD"] },
  { cc: "gb", name: "United Kingdom", currencies: ["GBP", "USD", "EUR"] },
  { cc: "us", name: "United States",  currencies: ["USD"] },
  { cc: "eu", name: "Eurozone",       currencies: ["EUR", "USD"] },
];

// Higher-risk jurisdictions that require enhanced due diligence — links to Tally.
const COMPLIANCE_REVIEW_COUNTRIES = new Set([]); // none for now in our list
// Higher-risk currencies for the same purpose (illustrative)
const COMPLIANCE_REVIEW_CCY = new Set([]);

// Methods available per currency. USD/GBP/EUR are bank-only here; African currencies have momo.
// Generic method descriptions — no per-rail copywriting overhead in real implementations
const METHOD_DESC = {
  bank: "Pay into a bank account",
  momo: "Pay into a mobile money wallet",
  card: "Send to a card",
};

function methodDescFor(ccy, methodId) {
  if (ccy === "USD" && methodId === "bank") return "Pay into a bank account (Wire / ACH / SWIFT)";
  return METHOD_DESC[methodId] || "";
}

const PAYOUT_METHODS = {
  NGN: [
    { id: "bank", label: "Bank account",  icon: "bank" },
    { id: "momo", label: "Mobile wallet", icon: "zap"  },
  ],
  GHS: [
    { id: "bank", label: "Bank account",  icon: "bank" },
    { id: "momo", label: "Mobile money",  icon: "zap"  },
  ],
  KES: [
    { id: "bank", label: "Bank account",  icon: "bank" },
    { id: "momo", label: "Mobile money",  icon: "zap"  },
  ],
  TZS: [
    { id: "bank", label: "Bank account",  icon: "bank" },
    { id: "momo", label: "Mobile money",  icon: "zap"  },
  ],
  MZN: [
    { id: "bank", label: "Bank account",  icon: "bank" },
    { id: "momo", label: "Mobile money",  icon: "zap"  },
  ],
  USD: [
    { id: "wire",  label: "Wire",             icon: "bank",  desc: "Fedwire · US domestic" },
    { id: "ach",   label: "ACH",              icon: "bank",  desc: "US domestic ACH" },
    { id: "swift", label: "SWIFT",            icon: "globe", desc: "International USD wire" },
  ],
  GBP: [
    { id: "fps",   label: "Faster Payments",  icon: "zap",   desc: "UK domestic · arrives in seconds" },
    { id: "swift", label: "SWIFT",            icon: "globe", desc: "International GBP wire" },
  ],
  EUR: [
    { id: "sepa",  label: "SEPA",             icon: "bank",  desc: "EU / EEA bank transfers" },
    { id: "swift", label: "SWIFT",            icon: "globe", desc: "International EUR wire" },
  ],
};

// Which rails support automated name lookup (i.e. we can verify the name from the account number)
const NAME_LOOKUP_SUPPORT = new Set(["NGN-bank", "GHS-bank", "KES-bank", "NGN-momo", "GHS-momo", "KES-momo", "GBP-fps"]);

// Field schema per currency + method combo.
// Each field: { k: stateKey, label, placeholder, kind: 'text'|'select'|'digits'|'iban', options?, maxLength?, hint? }
const FIELD_SCHEMA = {
  "NGN-bank": [
    { k: "bank",  label: "Bank",            kind: "select", options: ["GTBank","Access Bank","Zenith Bank","First Bank","UBA","Sterling Bank","Kuda","Wema Bank"] },
    { k: "accNo", label: "Account number",  kind: "digits", placeholder: "10-digit NUBAN", maxLength: 10 },
  ],
  "NGN-momo": [
    { k: "wallet", label: "Wallet provider", kind: "select", options: ["OPay","PalmPay","Moniepoint","Kuda"] },
    { k: "accNo",  label: "Wallet number",   kind: "digits", placeholder: "10–11 digits", maxLength: 11 },
  ],
  "GHS-bank": [
    { k: "bank",  label: "Bank",            kind: "select", options: ["Ecobank Ghana","GCB Bank","Standard Chartered","Fidelity Bank","ADB","Stanbic Ghana"] },
    { k: "accNo", label: "Account number",  kind: "digits", placeholder: "13 digits", maxLength: 16 },
  ],
  "GHS-momo": [
    { k: "wallet", label: "Provider",       kind: "select", options: ["MTN MoMo","Vodafone Cash","AirtelTigo Money"] },
    { k: "accNo",  label: "Phone number",   kind: "text",   placeholder: "+233 XX XXX XXXX" },
  ],
  "KES-bank": [
    { k: "bank",  label: "Bank",            kind: "select", options: ["Equity Bank","KCB Bank","Co-op Bank","ABSA","DTB","NCBA Bank","Stanbic Bank"] },
    { k: "accNo", label: "Account number",  kind: "digits", placeholder: "Account number", maxLength: 16 },
  ],
  "KES-momo": [
    { k: "accNo", label: "M-Pesa number",   kind: "text",   placeholder: "+254 7XX XXX XXX" },
  ],
  "TZS-bank": [
    { k: "bank",  label: "Bank",            kind: "select", options: ["CRDB Bank","NMB Bank","Stanbic Tanzania","NBC Bank"] },
    { k: "accNo", label: "Account number",  kind: "digits", placeholder: "Account number", maxLength: 16 },
  ],
  "TZS-momo": [
    { k: "wallet", label: "Provider",       kind: "select", options: ["M-Pesa","Tigo Pesa","Airtel Money"] },
    { k: "accNo",  label: "Phone number",   kind: "text",   placeholder: "+255 XX XXX XXXX" },
  ],
  "MZN-bank": [
    { k: "bank",  label: "Bank",            kind: "select", options: ["Banco BCI","Millennium BIM","Standard Bank","Banco Único"] },
    { k: "accNo", label: "Account number",  kind: "digits", placeholder: "NIB number", maxLength: 21 },
  ],
  "MZN-momo": [
    { k: "accNo", label: "M-Pesa Vodacom number", kind: "text", placeholder: "+258 XX XXX XXXX" },
  ],
  "USD-bank": [
    { k: "bank",      label: "Bank name",         kind: "text",   placeholder: "e.g. JPMorgan Chase" },
    { k: "routing",   label: "ABA / Routing",     kind: "digits", placeholder: "9-digit routing", maxLength: 9 },
    { k: "accNo",     label: "Account number",    kind: "digits", placeholder: "Account number", maxLength: 17 },
    { k: "swift",     label: "SWIFT / BIC",       kind: "text",   placeholder: "Optional · for international wires", optional: true },
  ],
  "GBP-bank": [
    { k: "bank",      label: "Bank name",         kind: "text",   placeholder: "e.g. Barclays" },
    { k: "sortCode",  label: "Sort code",         kind: "text",   placeholder: "00-00-00",     maxLength: 8 },
    { k: "accNo",     label: "Account number",    kind: "digits", placeholder: "8 digits",     maxLength: 8 },
  ],
  "EUR-bank": [
    { k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. ING" },
    { k: "iban", label: "IBAN",      kind: "iban", placeholder: "NL00 BANK 0000 0000 00" },
    { k: "bic",  label: "BIC / SWIFT", kind: "text", placeholder: "Optional", optional: true },
  ],
  // USD rails
  "USD-wire": [
    { k: "bank",    label: "Bank name",        kind: "text",   placeholder: "e.g. JPMorgan Chase" },
    { k: "routing", label: "ABA / Routing",    kind: "digits", placeholder: "9-digit routing number", maxLength: 9 },
    { k: "accNo",   label: "Account number",   kind: "digits", placeholder: "Account number", maxLength: 17 },
  ],
  "USD-ach": [
    { k: "bank",    label: "Bank name",        kind: "text",   placeholder: "e.g. Wells Fargo" },
    { k: "routing", label: "ABA / Routing",    kind: "digits", placeholder: "9-digit routing number", maxLength: 9 },
    { k: "accNo",   label: "Account number",   kind: "digits", placeholder: "Account number", maxLength: 17 },
  ],
  "USD-swift": [
    { k: "bank",    label: "Bank name",        kind: "text",   placeholder: "e.g. Citibank" },
    { k: "swift",   label: "SWIFT / BIC",      kind: "text",   placeholder: "e.g. CITIUS33XXX" },
    { k: "accNo",   label: "Account / IBAN",   kind: "text",   placeholder: "Account number or IBAN" },
    { k: "intBank", label: "Intermediary bank SWIFT", kind: "text", placeholder: "Optional", optional: true },
  ],
  // GBP rails
  "GBP-fps": [
    { k: "bank",     label: "Bank name",     kind: "text",   placeholder: "e.g. Barclays" },
    { k: "sortCode", label: "Sort code",     kind: "text",   placeholder: "00-00-00", maxLength: 8 },
    { k: "accNo",    label: "Account number",kind: "digits", placeholder: "8 digits", maxLength: 8 },
  ],
  "GBP-swift": [
    { k: "bank",  label: "Bank name",   kind: "text", placeholder: "e.g. HSBC" },
    { k: "swift", label: "SWIFT / BIC", kind: "text", placeholder: "e.g. HBUKGB4BXXX" },
    { k: "iban",  label: "IBAN",        kind: "iban", placeholder: "GB00 BANK 0000 0000 0000 00" },
  ],
  // EUR rails
  "EUR-sepa": [
    { k: "bank", label: "Bank name",   kind: "text", placeholder: "e.g. ING" },
    { k: "iban", label: "IBAN",        kind: "iban", placeholder: "DE00 0000 0000 0000 0000 00" },
    { k: "bic",  label: "BIC / SWIFT", kind: "text", placeholder: "Optional for SEPA", optional: true },
  ],
  "EUR-swift": [
    { k: "bank",  label: "Bank name",   kind: "text", placeholder: "e.g. Deutsche Bank" },
    { k: "swift", label: "SWIFT / BIC", kind: "text", placeholder: "e.g. DEUTDEDBXXX" },
    { k: "iban",  label: "IBAN",        kind: "iban", placeholder: "DE00 0000 0000 0000 0000 00" },
  ],
};

// Crypto coin icons (small circle badges)
function CoinBadge({ coin, size = 22 }) {
  const colors = { USDC: "#2775CA", USDT: "#26A17B" };
  const labels = { USDC: "Ⓒ", USDT: "Ⓣ" };
  return (
    <div style={{width: size, height: size, borderRadius: "50%", background: colors[coin] || "#888",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.7, fontWeight: 700, lineHeight: 1, flexShrink: 0}}>
      {labels[coin] || "?"}
    </div>
  );
}

function NetworkBadge({ network, size = 14 }) {
  const NetIc = RNetworkIcon[network];
  if (!NetIc) return null;
  return (
    <div className="ccy-flag" style={{width: size, height: size, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <NetIc style={{width: size * 0.8, height: size * 0.8}} />
    </div>
  );
}

// All supported payout networks (coin-agnostic — coin is chosen at send time, not recipient-save time)
const ALL_CRYPTO_NETWORKS = [
  { id: "eth",     name: "Ethereum", short: "ERC-20",  addressPlaceholder: "0x…",           maxLength: 42, arrival: "~2 min after 12 confirmations" },
  { id: "base",    name: "Base",     short: "Base",    addressPlaceholder: "0x…",           maxLength: 42, arrival: "~10 sec" },
  { id: "polygon", name: "Polygon",  short: "Polygon", addressPlaceholder: "0x…",           maxLength: 42, arrival: "~5 sec" },
  { id: "solana",  name: "Solana",   short: "SPL",     addressPlaceholder: "Base58 address",maxLength: 44, arrival: "~10 sec" },
  { id: "tron",    name: "Tron",     short: "TRC-20",  addressPlaceholder: "T… address",    maxLength: 34, arrival: "~1 min" },
];

// "Account identifier complete enough to attempt a name lookup"
function isLookupReady(railKey, fields) {
  switch (railKey) {
    case "NGN-bank":  return !!fields.bank   && (fields.accNo || "").length === 10;
    case "NGN-momo":  return !!fields.wallet && (fields.accNo || "").length >= 10;
    case "GHS-bank":  return !!fields.bank   && (fields.accNo || "").length >= 8;
    case "GHS-momo":  return !!fields.wallet && (fields.accNo || "").replace(/\D/g, "").length >= 9;
    case "KES-bank":  return !!fields.bank   && (fields.accNo || "").length >= 6;
    case "KES-momo":  return (fields.accNo || "").replace(/\D/g, "").length >= 9;
    case "GBP-bank":
    case "GBP-fps":   return !!fields.sortCode && (fields.accNo || "").length === 8;
    case "EUR-bank":
    case "EUR-sepa":  return (fields.iban || "").replace(/\s/g, "").length >= 15;
    case "USD-bank":
    case "USD-wire":
    case "USD-ach":   return (fields.routing || "").length === 9 && (fields.accNo || "").length >= 6;
    default:          return false;
  }
}

// The business' own legal name (would come from auth context)
const SELF_BUSINESS_NAME = "Acme Trading Co";

function AddRecipientScreen({ onBack, onSaved, onToast, nameLookupMock = "default" }) {
  const [recipientType, setRecipientType] = useStateR("cash"); // 'cash' | 'crypto'
  const [step, setStep] = useStateR(0); // 0 destination · 1 details · 2 review
  const [ccy, setCcy] = useStateR(null);
  const [party, setParty] = useStateR("third"); // 'self' | 'third'
  const [methodId, setMethodId] = useStateR(null);
  const [fields, setFields] = useStateR({}); // dynamic form
  const [thirdName, setThirdName] = useStateR(""); // 3rd-party fallback name (when lookup not supported)
  const [lookup, setLookup] = useStateR({ status: "idle", name: null }); // idle | loading | matched | mismatched | error | unsupported

  const [saving, setSaving] = useStateR(false);

  // Crypto-specific state (coin chosen at send time, not saved on the recipient)
  const [cryptoNetwork, setCryptoNetwork] = useStateR(null); // network id
  const [cryptoAddress, setCryptoAddress] = useStateR("");
  const [cryptoLabel, setCryptoLabel] = useStateR("");

  const isCrypto = recipientType === "crypto";

  const methods = ccy ? (PAYOUT_METHODS[ccy] || []) : [];
  const method  = methods.find(m => m.id === methodId);
  const railKey = ccy && methodId ? `${ccy}-${methodId}` : null;
  const schema  = railKey ? (FIELD_SCHEMA[railKey] || []) : [];

  // Crypto-derived values
  const cryptoChainMeta = cryptoNetwork ? ALL_CRYPTO_NETWORKS.find(c => c.id === cryptoNetwork) : null;

  const setField = (k, v) => setFields(prev => ({ ...prev, [k]: v }));

  // Resolve whether the chosen rail supports automated name lookup,
  // factoring in the reviewer mock override.
  const railSupportsLookup = railKey ? NAME_LOOKUP_SUPPORT.has(railKey) : false;
  const lookupAvailable =
    nameLookupMock === "on"  ? true  :
    nameLookupMock === "off" ? false :
    railSupportsLookup;

  // Trigger mock lookup when account identifier is ready
  useEffectR(() => {
    if (!railKey) return;
    if (!isLookupReady(railKey, fields)) {
      setLookup({ status: "idle", name: null });
      return;
    }
    if (!lookupAvailable) {
      setLookup({ status: "unsupported", name: null });
      return;
    }
    setLookup({ status: "loading", name: null });
    const t = setTimeout(() => {
      // Mock result: when first-party, we want the business name; when third-party, a plausible match
      if (party === "self") {
        // 70% match, 30% mismatch (different name returned)
        const match = Math.random() > 0.3 ? SELF_BUSINESS_NAME : "Acme Logistics LLC";
        setLookup({ status: match === SELF_BUSINESS_NAME ? "matched" : "mismatched", name: match });
      } else {
        // Resolve a plausible-looking name based on currency context
        const sample = {
          NGN: "Adaeze Okafor",
          GHS: "Kojo Mensah",
          KES: "Joseph Mwangi",
          TZS: "Aisha Komba",
          MZN: "Lucia Macamo",
          GBP: "Northwood Trading Ltd",
          EUR: "Berlin Verlag GmbH",
          USD: "Riverbend Imports Inc",
        }[ccy] || "Recipient";
        setLookup({ status: "matched", name: sample });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [railKey, JSON.stringify(fields), party, nameLookupMock]);

  // When the user switches party type or rail, clear partial state to avoid mismatched data
  useEffectR(() => {
    setFields({});
    setThirdName("");
    setLookup({ status: "idle", name: null });
  }, [railKey, party]);

  // Auto-select the only method when there is exactly one available
  useEffectR(() => {
    if (methods.length === 1 && methodId !== methods[0].id) setMethodId(methods[0].id);
    if (methods.length === 0 && methodId) setMethodId(null);
  }, [ccy]);

  const requireCompliance = ccy && COMPLIANCE_REVIEW_CCY.has(ccy);

  // Computed display name for the recipient strip and review
  const resolvedName = isCrypto
    ? cryptoLabel
    : (party === "self" ? SELF_BUSINESS_NAME :
       (lookup.status === "matched" ? lookup.name : thirdName));

  const stepLabels = ["Destination", "Details", "Review"];

  const canStep1 = isCrypto
    ? !!cryptoNetwork
    : (!!ccy && !!methodId);

  // Step 2 validity
  const fieldsComplete = schema.every(f => f.optional || (fields[f.k] && String(fields[f.k]).trim() !== ""));
  const lookupOk =
    lookup.status === "matched" ||
    (lookup.status === "unsupported" && (party === "self" ? true : thirdName.trim().length > 1));
  const canStep2 = isCrypto
    ? (cryptoAddress.trim().length >= 10 && cryptoLabel.trim().length > 1)
    : (!!method && fieldsComplete && lookupOk);

  const reset = () => {
    setStep(0); setCcy(null); setParty("third");
    setMethodId(null); setFields({}); setThirdName(""); setLookup({ status: "idle", name: null });
    setCryptoNetwork(null); setCryptoAddress(""); setCryptoLabel("");
  };

  const switchRecipientType = (t) => {
    if (t === recipientType) return;
    setRecipientType(t);
    reset();
  };

  // For the saved recipient strip / review
  const handle = isCrypto
    ? (cryptoChainMeta ? `${cryptoChainMeta.name} · ${cryptoAddress.slice(0, 6)}…${cryptoAddress.slice(-4)}` : "")
    : (method?.id === "bank"
      ? (fields.bank && fields.accNo ? `${fields.bank} · ****${String(fields.accNo).slice(-4)}` :
         fields.iban ? `IBAN · ${fields.iban.replace(/\s/g, "").slice(-4).padStart(4, "•")}` : "")
      : (fields.accNo ? `${method?.label || "Wallet"} · ${fields.accNo}` : ""));

  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><RIcon.arrowLeft /> Back to Recipients</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Add new</span>
      </div>

      <div className="page-head">
        <div>
          <h1 className="title">Add a new recipient</h1>
          <p className="subtitle">Save bank, wallet, or crypto details once — pay them in seconds after that.</p>
        </div>
      </div>

      <RFlowShell steps={stepLabels} current={step}>
      <div className="pay-flow-card">

        {/* STEP 0 — title, cash/crypto toggle, then destination pickers */}
        {step === 0 && (
          <>
            <div className="pay-panel-head" style={{paddingBottom: 0}}>
              <div className="pay-panel-title">Where are they receiving money?</div>
              <div className="pay-panel-sub">{isCrypto ? "Choose the blockchain network they receive on." : "Pick the currency and payment method."}</div>
            </div>

            <div className="ar-tabs" role="tablist" style={{marginBottom: 20}}>
              <button role="tab" aria-selected={recipientType === "cash"} className={`ar-tab ${recipientType === "cash" ? "on" : ""}`} onClick={() => switchRecipientType("cash")}>
                <div className="ic"><RIcon.bank /></div>
                <div className="meta">
                  <div className="t">Cash recipient</div>
                  <div className="s">Bank account or mobile money</div>
                </div>
              </button>
              <button role="tab" aria-selected={recipientType === "crypto"} className={`ar-tab ${recipientType === "crypto" ? "on" : ""}`} onClick={() => switchRecipientType("crypto")}>
                <div className="ic"><RIcon.globe /></div>
                <div className="meta">
                  <div className="t">Crypto recipient</div>
                  <div className="s">Send stablecoins to a wallet</div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 0 && !isCrypto && (
          <>
            {(() => {
              const Combobox = window.OBCombobox;
              const ccyOpts = Object.keys(PAYOUT_METHODS).map(c => {
                const meta = RCCY[c];
                return {
                  value: c,
                  label: c,
                  sub: meta?.name || c,
                  leading: meta?.flag ? <RFlag cc={meta.flag} size={22} /> : null,
                  search: `${c} ${meta?.name || ""}`,
                };
              });
              return (
                <div className="cbox-field">
                  <div className="cbox-field-lbl">Currency</div>
                  <Combobox
                    value={ccy}
                    onChange={(c) => { setCcy(c); setMethodId(null); }}
                    options={ccyOpts}
                    placeholder="Select a currency"
                    searchPlaceholder="Search currency…"
                  />
                </div>
              );
            })()}

            {ccy && methods.length > 0 && (() => {
              const Combobox = window.OBCombobox;
              const opts = methods.map(m => {
                const Ic = RIcon[m.icon] || RIcon.bank;
                const desc = m.desc || methodDescFor(ccy, m.id);
                return {
                  value: m.id,
                  label: m.label,
                  sub: desc,
                  leading: <div className="cbox-method-ic"><Ic /></div>,
                  search: `${m.label} ${desc}`,
                };
              });
              return (
                <div className="cbox-field" style={{marginTop: 16}}>
                  <div className="cbox-field-lbl">Payment method</div>
                  <Combobox
                    value={methodId}
                    onChange={(id) => setMethodId(id)}
                    options={opts}
                    placeholder={methods.length === 1 ? methods[0].label : "Select a payment method"}
                    searchPlaceholder="Search…"
                    locked={methods.length <= 1}
                  />
                </div>
              );
            })()}

            {requireCompliance && (
              <div className="ar-compliance" style={{marginTop: 22}}>
                <div className="ic"><RIcon.shield /></div>
                <div className="meta">
                  <div className="t">Extra info needed for this currency</div>
                  <div className="s">Payments in this currency require enhanced due diligence. Submit the short compliance form so we can review and unlock it.</div>
                </div>
                <a className="btn btn-soft btn-sm" href="https://tally.so/r/onboard-compliance" target="_blank" rel="noopener noreferrer">
                  Open form <RIcon.external />
                </a>
              </div>
            )}

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
              <button className="btn btn-lg" disabled={!canStep1} onClick={() => setStep(1)}>
                Continue <RIcon.arrowRight />
              </button>
            </div>
          </>
        )}

        {/* STEP 0 — CRYPTO: network only (coin chosen at send time) */}
        {step === 0 && isCrypto && (
          <>
            {(() => {
              const Combobox = window.OBCombobox;
              const NT = window.OBData.NETWORK_TOKENS || {};
              const opts = ALL_CRYPTO_NETWORKS.map(ch => {
                const NetIc = RNetworkIcon[ch.id];
                const tokens = (NT[ch.id] || []).join(", ");
                return {
                  value: ch.id,
                  label: ch.name,
                  sub: `${ch.short} · ${tokens}`,
                  leading: NetIc ? <NetIc style={{width: 22, height: 22}} /> : null,
                  search: `${ch.name} ${ch.short} ${tokens}`,
                };
              });
              return (
                <div className="cbox-field" style={{marginTop: 8}}>
                  <div className="cbox-field-lbl">Network</div>
                  <Combobox
                    value={cryptoNetwork}
                    onChange={(id) => setCryptoNetwork(id)}
                    options={opts}
                    placeholder="Select a network"
                    searchPlaceholder="Search network…"
                  />
                </div>
              );
            })()}

            {cryptoNetwork && cryptoChainMeta && (() => {
              const tokens = (window.OBData.NETWORK_TOKENS || {})[cryptoNetwork] || [];
              return (
                <div className="ar-namecheck idle" style={{marginTop: 16}}>
                  <div className="ic"><RIcon.info /></div>
                  <div className="meta">
                    <div className="t">{`${cryptoChainMeta.name} (${cryptoChainMeta.short})`}</div>
                    <div className="s">{`Supports ${tokens.join(" and ")}`}</div>
                  </div>
                </div>
              );
            })()}

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
              <button className="btn btn-lg" disabled={!canStep1} onClick={() => setStep(1)}>
                Continue <RIcon.arrowRight />
              </button>
            </div>
          </>
        )}

        {/* STEP 1 — CRYPTO: wallet address + label */}
        {step === 1 && isCrypto && cryptoNetwork && (
          <>
            <div className="pay-panel-head" style={{paddingBottom: 0}}>
              <div className="pay-panel-title">Wallet details</div>
              <div className="pay-panel-sub">{cryptoChainMeta?.name || cryptoNetwork}</div>
            </div>

            <div className="ar-form">
              <div className="field">
                <div className="lbl">Wallet address <span className="req">· required</span></div>
                <input
                  className="inp"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value.trim())}
                  placeholder={cryptoChainMeta?.addressPlaceholder || "Wallet address"}
                  maxLength={cryptoChainMeta?.maxLength || 64}
                  style={{fontFamily: "monospace, var(--font-body)", fontSize: 13}}
                />
                <div className="help">{`Make sure this is a valid ${cryptoChainMeta?.name} address. Sending on the wrong network will result in permanent loss of funds.`}</div>
              </div>

              <div className="field">
                <div className="lbl">Recipient label <span className="req">· required</span></div>
                <input
                  className="inp"
                  value={cryptoLabel}
                  onChange={(e) => setCryptoLabel(e.target.value)}
                  placeholder="e.g. Treasury wallet, Vendor — Acme Corp"
                />
                <div className="help">A name to help you identify this wallet later.</div>
              </div>
            </div>

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-lg" disabled={!canStep2} onClick={() => setStep(2)}>
                Continue <RIcon.arrowRight />
              </button>
            </div>
          </>
        )}

        {/* STEP 1 — CASH: details */}
        {step === 1 && !isCrypto && ccy && (
          <>
            <div className="pay-panel-head" style={{paddingBottom: 0}}>
              <div className="pay-panel-title">Account details</div>
              <div className="pay-panel-sub">{`${RCCY[ccy]?.name || ccy} · ${method?.label || ""}`}</div>
            </div>

            {/* Self vs Third-party tabs */}
            <div className="ar-tabs" role="tablist">
              <button role="tab" aria-selected={party === "third"} className={`ar-tab ${party === "third" ? "on" : ""}`} onClick={() => setParty("third")}>
                <div className="ic"><RIcon.people /></div>
                <div className="meta">
                  <div className="t">Pay someone else</div>
                  <div className="s">A supplier, contractor or partner</div>
                </div>
              </button>
              <button role="tab" aria-selected={party === "self"} className={`ar-tab ${party === "self" ? "on" : ""}`} onClick={() => setParty("self")}>
                <div className="ic"><RIcon.bank /></div>
                <div className="meta">
                  <div className="t">Pay myself</div>
                  <div className="s">Move funds to my own bank or wallet</div>
                </div>
              </button>
            </div>

            {/* If only one method available, auto-selected via effect */}

            {method && (
              <div className="ar-form">
                {schema.map(f => (
                  <div className="field" key={f.k}>
                    <div className="lbl">
                      {f.label}
                      {f.optional ? <span className="opt">· optional</span> : <span className="req">· required</span>}
                    </div>
                    {f.kind === "select" ? (
                      <select className="inp pay-select" value={fields[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)}>
                        <option value="">{`Select ${f.label.toLowerCase()}…`}</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        className="inp"
                        value={fields[f.k] || ""}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (f.kind === "digits") v = v.replace(/\D/g, "");
                          setField(f.k, v);
                        }}
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        inputMode={f.kind === "digits" ? "numeric" : undefined}
                      />
                    )}
                  </div>
                ))}

                {/* Self party — read-only business name shown after the rail-specific fields */}
                {party === "self" && (
                  <div className="field">
                    <div className="lbl">Account holder</div>
                    <input className="inp" value={SELF_BUSINESS_NAME} readOnly disabled />
                    <div className="help">First-party transfers move funds within your business. The destination account name must match.</div>
                  </div>
                )}

                {/* Name resolution panel — its content depends on lookup state + party */}
                {schema.length > 0 && (
                  <NameResolution
                    party={party}
                    lookup={lookup}
                    lookupAvailable={lookupAvailable}
                    selfName={SELF_BUSINESS_NAME}
                    thirdName={thirdName}
                    setThirdName={setThirdName}
                    railKey={railKey}
                  />
                )}
              </div>
            )}

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-lg" disabled={!canStep2} onClick={() => setStep(2)}>
                Continue <RIcon.arrowRight />
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — CRYPTO review */}
        {step === 2 && isCrypto && cryptoNetwork && (
          <>
            <div className="pay-panel-head" style={{paddingBottom: 0}}>
              <div className="pay-panel-title">Review and save</div>
              <div className="pay-panel-sub">Confirm everything looks right.</div>
            </div>

            <div className="pay-recip-strip" style={{margin: "16px 0 8px"}}>
              <div className="ava">
                <span>{(cryptoLabel || "??").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</span>
                <NetworkBadge network={cryptoNetwork} size={14} />
              </div>
              <div className="meta">
                <div className="t">{cryptoLabel || "Recipient"}</div>
                <div className="s">{handle}</div>
              </div>
              <div className="rt">{cryptoChainMeta?.name}</div>
            </div>

            <div className="pay-review-list" style={{marginTop: 8}}>
              <div className="row-item"><div className="k">Network</div><div className="v">{cryptoChainMeta?.name} ({cryptoChainMeta?.short})</div></div>
              <div className="row-item"><div className="k">Wallet address</div><div className="v" style={{wordBreak: "break-all"}}>{cryptoAddress}</div></div>
              <div className="row-item"><div className="k">Label</div><div className="v">{cryptoLabel}</div></div>
            </div>

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Back</button>
              <button className="btn btn-lg" disabled={saving} onClick={() => {
                setSaving(true);
                setTimeout(() => {
                  onToast && onToast(`${cryptoLabel} saved as a crypto recipient`);
                  if (onSaved) onSaved({ name: cryptoLabel, country: "crypto", handle, type: "Crypto", network: cryptoNetwork, networkLabel: cryptoChainMeta?.name, party: "third" });
                  reset();
                }, 900);
              }}>
                {saving ? <><span className="spin" style={{width:14,height:14,borderWidth:2}} /> Saving…</> : <><RIcon.check /> Save recipient</>}
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — CASH review */}
        {step === 2 && !isCrypto && ccy && method && (
          <>
            <div className="pay-panel-head" style={{paddingBottom: 0}}>
              <div className="pay-panel-title">Review and save</div>
              <div className="pay-panel-sub">Confirm everything looks right.</div>
            </div>

            <div className="pay-recip-strip" style={{margin: "16px 0 8px"}}>
              <div className="ava">
                <span>{(resolvedName || "??").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</span>
                {RCCY[ccy]?.flag && <RFlag cc={RCCY[ccy].flag} size={14} />}
              </div>
              <div className="meta">
                <div className="t">{resolvedName || "Recipient"}</div>
                <div className="s">{handle}</div>
              </div>
              <div className="rt">{ccy}</div>
            </div>

            <div className="pay-review-list" style={{marginTop: 8}}>
              <div className="row-item"><div className="k">Type</div><div className="v">{party === "self" ? "Pay myself · 1st party" : "Pay someone else · 3rd party"}</div></div>
              <div className="row-item"><div className="k">Currency</div><div className="v">{ccy}</div></div>
              <div className="row-item"><div className="k">Method</div><div className="v">{method.label}</div></div>
              <div className="row-item"><div className="k">Account holder</div><div className="v">{resolvedName}</div></div>
              {schema.map(f => fields[f.k] ? (
                <div className="row-item" key={f.k}>
                  <div className="k">{f.label}</div>
                  <div className="v">{f.k === "accNo" || f.k === "iban" ? maskAccount(fields[f.k]) : fields[f.k]}</div>
                </div>
              ) : null)}
            </div>

            <div className="pay-review-foot" style={{marginTop: 24}}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Back</button>
              <button className="btn btn-lg" disabled={saving} onClick={() => {
                setSaving(true);
                setTimeout(() => {
                  onToast && onToast(`${resolvedName} saved as a recipient`);
                  if (onSaved) onSaved({ name: resolvedName, ccy, country: RCCY[ccy]?.flag || "us", handle, type: method.id === "bank" ? "Bank" : "Mobile money", party });
                  reset();
                }, 900);
              }}>
                {saving ? <><span className="spin" style={{width:14,height:14,borderWidth:2}} /> Saving…</> : <><RIcon.check /> Save recipient</>}
              </button>
            </div>
          </>
        )}
      </div>
      </RFlowShell>
    </div>
  );
}

// Mask everything but last 4 chars of an account/IBAN
function maskAccount(v) {
  const s = String(v).replace(/\s/g, "");
  if (s.length <= 4) return s;
  return "••••" + s.slice(-4);
}

// Name resolution panel — covers lookup loading / matched / mismatched / unsupported, for both party types
function NameResolution({ party, lookup, lookupAvailable = true, selfName, thirdName, setThirdName, railKey }) {
  // Idle = identifier not complete enough yet — show a hint.
  // The hint copy depends on whether automated lookup is available for this rail.
  if (lookup.status === "idle") {
    if (!lookupAvailable) {
      // No auto-lookup on this rail — for third-party, show the manual name input
      // straight away so the user knows what's expected. For self, show a neutral hint.
      if (party === "self") {
        return (
          <div className="ar-namecheck idle">
            <div className="ic"><RIcon.bank /></div>
            <div className="meta">
              <div className="t">Account holder · your business</div>
              <div className="s strong">{selfName}</div>
              <div className="s">Funds will be sent to the account number above.</div>
            </div>
          </div>
        );
      }
      return (
        <div className="field">
          <div className="lbl">Recipient’s legal name <span className="req">· required</span></div>
          <input className="inp" value={thirdName} onChange={(e) => setThirdName(e.target.value)} placeholder="As shown on their account" />
          <div className="help">Enter the name exactly as it appears on their account.</div>
        </div>
      );
    }
    return (
      <div className="ar-namecheck idle">
        <div className="ic"><RIcon.shield /></div>
        <div className="meta">
          <div className="t">{party === "self" ? "We’ll match the account against your business name" : "We’ll look up the account holder’s name"}</div>
          <div className="s">Fill in the details above to continue.</div>
        </div>
      </div>
    );
  }

  if (lookup.status === "loading") {
    return (
      <div className="ar-namecheck loading">
        <div className="ic"><div className="spinner" /></div>
        <div className="meta">
          <div className="t">Verifying with the bank…</div>
          <div className="s">This usually takes a few seconds.</div>
        </div>
      </div>
    );
  }

  // Lookup unsupported by this rail — fall back to user-entered name (3rd party only; self stays read-only)
  if (lookup.status === "unsupported") {
    if (party === "self") {
      return (
        <div className="ar-namecheck idle">
          <div className="ic"><RIcon.bank /></div>
          <div className="meta">
            <div className="t">Account holder · your business</div>
            <div className="s strong">{selfName}</div>
            <div className="s">Funds will be sent to the account number above.</div>
          </div>
        </div>
      );
    }
    return (
      <div className="field">
        <div className="lbl">Recipient’s legal name <span className="req">· required</span></div>
        <input className="inp" value={thirdName} onChange={(e) => setThirdName(e.target.value)} placeholder="As shown on their account" />
        <div className="help">Enter the name exactly as it appears on their account.</div>
      </div>
    );
  }

  // Matched
  if (lookup.status === "matched") {
    if (party === "self") {
      const exact = lookup.name === selfName;
      return (
        <div className={`ar-namecheck ${exact ? "ok" : "warn"}`}>
          <div className="ic">{exact ? <RIcon.check /> : <RIcon.alert />}</div>
          <div className="meta">
            <div className="t">{exact ? "Account verified · matches your business" : "Name mismatch"}</div>
            <div className="s">
              <span className="strong">{lookup.name}</span>
              {!exact && <> · expected <span className="strong">{selfName}</span></>}
            </div>
            {!exact && <div className="s warn">First-party transfers must match your business name. Use a different account, or pay this as a third-party recipient.</div>}
          </div>
        </div>
      );
    }
    return (
      <div className="ar-namecheck ok">
        <div className="ic"><RIcon.check /></div>
        <div className="meta">
          <div className="t">Account holder verified</div>
          <div className="s strong">{lookup.name}</div>
          <div className="s">Returned by the bank for the account number you entered.</div>
        </div>
      </div>
    );
  }

  if (lookup.status === "mismatched") {
    return (
      <div className="ar-namecheck warn">
        <div className="ic"><RIcon.alert /></div>
        <div className="meta">
          <div className="t">Couldn’t verify this account</div>
          <div className="s">The bank didn’t return a name we recognise. Double-check the number and try again.</div>
        </div>
      </div>
    );
  }

  return null;
}

// =====================================================
// 2. TRANSACTIONS — full feed with filters + lazy load
// =====================================================
function TxListSkeleton() {
  return (
    <div className="tablecard" style={{marginTop: 0}}>
      {[62, 48, 55, 44, 58, 42, 50, 46].map((w, i) => (
        <div key={i} className="skel-row">
          <div className="skel" style={{width: 28, height: 28, borderRadius: 6, flexShrink: 0}} />
          <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 6}}>
            <div className="skel" style={{width: `${w}%`, height: 13}} />
            <div className="skel" style={{width: `${w - 18}%`, height: 11}} />
          </div>
          <div className="skel" style={{width: 56, height: 20, borderRadius: 99}} />
          <div className="skel" style={{width: 80, height: 14}} />
        </div>
      ))}
    </div>
  );
}

function TransactionsScreen({ onOpenTx, onToast, dataState = "full", complianceHold = false }) {
  const HOLD_TXN = { id: "PAY-2026-04901", date: "May 7, 11:24", direction: "out", type: "Payout", party: "Riverline Imports Ltd", ref: "PAY-2026-04901", amount: "84,500.00", ccy: "GBP", from: "USD", status: "ON HOLD", pillTone: "warn", hold: true };
  const baseList = complianceHold ? [HOLD_TXN, ...TXNS_FULL] : TXNS_FULL;
  const [q, setQ]           = useStateR("");
  const [direction, setDir] = useStateR("all"); // all | in | out
  const [statusF, setStatusF] = useStateR("all");
  const [ccyF, setCcyF]     = useStateR("all");
  const [visible, setVisible] = useStateR(PAGE_SIZE_TX);
  const sentinelRef = useRefR(null);

  const filtered = useMemoR(() => {
    if (dataState === "empty") return [];
    let res = baseList;
    if (direction !== "all") res = res.filter(t => t.direction === direction);
    if (statusF !== "all")   res = res.filter(t => t.status.toLowerCase() === statusF);
    if (ccyF !== "all")      res = res.filter(t => t.ccy === ccyF || t.from === ccyF);
    const t = q.trim().toLowerCase();
    if (t) res = res.filter(x =>
      x.party.toLowerCase().includes(t) ||
      x.ref.toLowerCase().includes(t) ||
      x.amount.toLowerCase().includes(t)
    );
    return res;
  }, [q, direction, statusF, ccyF, dataState, complianceHold]);

  useEffectR(() => { setVisible(PAGE_SIZE_TX); }, [q, direction, statusF, ccyF]);

  useEffectR(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) {
        setVisible(v => Math.min(v + PAGE_SIZE_TX, filtered.length));
      }
    }, { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const [loading, setLoading] = useStateR(true);
  useEffectR(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  // Top-level summary stats
  const stats = useMemoR(() => {
    if (dataState === "empty") return { total: 0, out: 0, inn: 0, pend: 0, fail: 0 };
    const all = baseList.filter(t => t.direction !== "fx");
    const out = all.filter(t => t.direction === "out").length;
    const inn = all.filter(t => t.direction === "in").length;
    const fail = all.filter(t => t.status === "FAILED").length;
    const pend = all.filter(t => t.status === "PROCESSING").length;
    return { out, inn, fail, pend, total: all.length };
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Transactions</h1>
          <p className="subtitle">Every payout and deposit across your accounts.</p>
        </div>
        <div className="row" style={{gap: 8}}>
          <button className="btn btn-soft" onClick={() => onToast && onToast("Export CSV — phase 2")}><RIcon.doc /> Export CSV</button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="tx-stats">
        <TxStat label="All transactions" value={stats.total} />
        <TxStat label="Money out" value={stats.out} />
        <TxStat label="Money in"  value={stats.inn} />
        <TxStat label="Processing" value={stats.pend} tone="warn" />
        <TxStat label="Failed"     value={stats.fail} tone="danger" />
      </div>

      {/* Filters */}
      <div className="tx-filterbar">
        <div className="tx-search">
          <RIcon.search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by recipient, reference, or amount…" />
        </div>
        <FilterSelect label="Direction" value={direction} onChange={setDir} options={[
          {v:"all", t:"All directions"}, {v:"out", t:"Money out"}, {v:"in", t:"Money in"},
        ]} />
        <FilterSelect label="Status" value={statusF} onChange={setStatusF} options={[
          {v:"all", t:"All statuses"}, {v:"completed", t:"Completed"}, {v:"processing", t:"Processing"}, {v:"failed", t:"Failed"},
        ]} />
        <FilterSelect label="Currency" value={ccyF} onChange={setCcyF} options={[
          {v:"all", t:"All currencies"}, {v:"USD", t:"USD"}, {v:"GBP", t:"GBP"}, {v:"EUR", t:"EUR"},
          {v:"NGN", t:"NGN"}, {v:"GHS", t:"GHS"}, {v:"KES", t:"KES"}, {v:"TZS", t:"TZS"}, {v:"MZN", t:"MZN"},
        ]} />
        {(direction !== "all" || statusF !== "all" || ccyF !== "all" || q) && (
          <button className="tx-clearfilters" onClick={() => { setDir("all"); setStatusF("all"); setCcyF("all"); setQ(""); }}>Clear filters</button>
        )}
      </div>

      {/* Table */}
      {loading ? <TxListSkeleton /> : <div className="tablecard">
        <div className="head">
          <h2>Activity</h2>
          <span className="meta">{`Showing ${list.length} of ${filtered.length}`}</span>
        </div>
        {filtered.length === 0 ? (
          dataState === "empty" ? (
            <div className="empty" style={{padding: "72px 16px"}}>
              <div className="ic"><RIcon.list /></div>
              <div style={{fontSize: 15, color: "var(--gray-900)", fontWeight: 600, marginBottom: 4}}>No transactions yet</div>
              <div style={{fontSize: 13, maxWidth: 360, margin: "0 auto", lineHeight: 1.55}}>
                Money in and out of your accounts will appear here. Send your first payment or share an account number to get started.
              </div>
            </div>
          ) : (
            <div className="empty" style={{padding: "60px 16px"}}>
              <div className="ic"><RIcon.search /></div>
              <div style={{fontSize: 14, color: "var(--gray-900)", fontWeight: 500}}>No transactions match these filters</div>
              <div style={{fontSize: 12.5, marginTop: 4}}>Try clearing a filter or searching for something else.</div>
            </div>
          )
        ) : (
          <>
            <table className="t">
              <thead><tr>
                <th>Counterparty</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr></thead>
              <tbody>
                {list.map(tx => (
                  <tr key={tx.id} onClick={() => onOpenTx(tx)}>
                    <td><RTxRowDir tx={tx} /></td>
                    <td className="mono">{tx.ref}</td>
                    <td style={{color:"var(--gray-600)", fontSize: 12.5}}>{tx.date}</td>
                    <td><RPill tone={tx.pillTone}>{tx.status}</RPill></td>
                    <td className="num"><RTxAmount tx={tx} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible < filtered.length && (
              <div ref={sentinelRef} className="tx-loader">
                <span className="spin" /> Loading more transactions…
              </div>
            )}
            {visible >= filtered.length && filtered.length > PAGE_SIZE_TX && (
              <div className="tx-end">All {filtered.length} transactions shown</div>
            )}
          </>
        )}
      </div>}
    </div>
  );
}

function TxStat({ label, value, tone }) {
  return (
    <div className={`tx-stat ${tone || ""}`}>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="tx-filtergroup">
      <div className="lbl">{label}</div>
      <div className="tx-select-wrap">
        <select className="tx-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
        </select>
        <RIcon.arrowDown />
      </div>
    </div>
  );
}

// =====================================================
// 3. TRANSACTION DETAILS
// =====================================================
function TransactionDetailScreen({ tx, onBack, onToast }) {
  const isOut = tx.direction === "out";
  const isIn  = tx.direction === "in";

  const dstMeta = RCCY[tx.ccy];
  const srcMeta = RCCY[tx.from || tx.ccy];

  const copy = (v, label) => {
    if (navigator.clipboard) navigator.clipboard.writeText(v).catch(() => {});
    onToast && onToast(`Copied ${label}`);
  };

  // Minimal initiated → settled markers
  const settledLabel = tx.status === "COMPLETED" ? "Settled" : tx.status === "PROCESSING" ? "Settling" : "Failed";
  const settledTone  = tx.status === "COMPLETED" ? "done" : tx.status === "PROCESSING" ? "active" : "fail";

  const [loading, setLoading] = useStateR(true);
  useEffectR(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, [tx.id]);

  const txHashShort = tx.txHash ? (tx.txHash.length > 16 ? `${tx.txHash.slice(0, 8)}…${tx.txHash.slice(-6)}` : tx.txHash) : null;
  const explorerUrl = tx.chain && tx.txHash ? ({
    eth:     `https://etherscan.io/tx/${tx.txHash}`,
    base:    `https://basescan.org/tx/${tx.txHash}`,
    tron:    `https://tronscan.org/#/transaction/${tx.txHash}`,
    polygon: `https://polygonscan.com/tx/${tx.txHash}`,
    solana:  `https://solscan.io/tx/${tx.txHash}`,
  })[tx.chain] : null;

  if (loading) return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><RIcon.arrowLeft /> Back to Transactions</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{tx.ref}</span>
      </div>
      <div className="page-head" style={{alignItems: "flex-start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div className="skel" style={{width: 140, height: 26}} />
          <div className="skel" style={{width: 220, height: 14}} />
        </div>
      </div>
      <div className="card" style={{padding: "26px 30px", marginBottom: 22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:32}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
            <div className="skel" style={{width: 80, height: 12}} />
            <div className="skel" style={{width: "60%", height: 32}} />
            <div className="skel" style={{width: "40%", height: 12}} />
          </div>
          <div className="skel" style={{width: 28, height: 28, borderRadius: 99}} />
          <div style={{display:"flex",flexDirection:"column",gap:10,flex:1,alignItems:"flex-end"}}>
            <div className="skel" style={{width: 80, height: 12}} />
            <div className="skel" style={{width: "60%", height: 32}} />
            <div className="skel" style={{width: "40%", height: 12}} />
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {[5,4].map((rows,ci) => (
          <div key={ci} className="card" style={{padding:"24px 28px"}}>
            <div className="skel" style={{width:110,height:16,marginBottom:20}} />
            {[...Array(rows)].map((_,i) => (
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--gray-100)"}}>
                <div className="skel" style={{width:80,height:13}} />
                <div className="skel" style={{width:120,height:13}} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><RIcon.arrowLeft /> Back to Transactions</a>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{tx.ref}</span>
      </div>

      <div className="page-head" style={{alignItems: "flex-start"}}>
        <div>
          <h1 className="title" style={{marginBottom: 6}}>
            {isOut ? "Payout" : "Funding"}
            <span style={{marginLeft: 12}}><RPill tone={tx.pillTone}>{tx.status}</RPill></span>
          </h1>
          <p className="subtitle">{`${tx.ref} · ${tx.date.replace(/,/, ", 2026,")}`}</p>
        </div>
        <div className="row" style={{gap: 8}}>
          {tx.status === "FAILED" && (
            <button className="btn btn-soft" onClick={() => onToast && onToast("Retry — phase 2")}><RIcon.refresh /> Retry payment</button>
          )}
          <button className="btn btn-soft" onClick={() => onToast && onToast("Receipt download — phase 2")}><RIcon.doc /> Download receipt</button>
        </div>
      </div>

      {/* HERO — flow card with proper sender/receiver flags */}
      <div className="card" style={{padding: "26px 30px", marginBottom: 22}}>
        <div className="td-flow">
          <div className="leg">
            <div className="lbl-row">
              {!tx.chain && <RFlag cc={srcMeta?.flag || "us"} size={20} />}
              <div className="lbl">{isOut ? "You paid" : tx.chain ? "Deposited" : "Received from"}</div>
            </div>
            <div className="big">{tx.chain ? `${tx.amount} ${tx.party.split("·")[0].trim()}` : isIn && tx.fromAmount ? `${tx.from} ${tx.fromAmount}` : `${tx.from || tx.ccy} ${tx.amount}`}</div>
            <div className="sub">
              {isOut && tx.from && <>From your <strong>{tx.from}</strong> balance</>}
              {isIn && !tx.chain && <>{tx.party.includes(" — ") ? tx.party.split(" — ")[1] : tx.party}</>}
              {isIn && tx.chain && <>{tx.party}</>}
            </div>
          </div>

          <div className="td-arrow"><RIcon.arrowRight /></div>

          <div className="leg right">
            <div className="lbl-row">
              <div className="lbl">{isOut ? `${tx.party} received` : "Into"}</div>
              <RFlag cc={dstMeta?.flag || "us"} size={20} />
            </div>
            <div className="big">{`${tx.ccy} ${tx.amount}`}</div>
            <div className="sub">
              {isOut && <>{tx.party}</>}
              {isIn && <>Your <strong>{tx.ccy}</strong> balance</>}
            </div>
          </div>
        </div>

        {/* Minimal inline timeline — payout only (we don't know when funding was initiated) */}
        {isOut && (
        <div className="td-stamps">
          <div className="td-stamp done">
            <RIcon.check />
            <span className="t">Initiated</span>
            <span className="s">{tx.date}</span>
          </div>
          <div className="td-stamp-bar" />
          <div className={`td-stamp ${settledTone}`}>
            {settledTone === "done" && <RIcon.check />}
            {settledTone === "active" && <span className="pulse" />}
            {settledTone === "fail" && <RIcon.alert />}
            <span className="t">{settledLabel}</span>
            <span className="s">{tx.status === "COMPLETED" ? tx.date : tx.status === "PROCESSING" ? "In progress" : tx.date}</span>
          </div>
        </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="td-grid">
        {/* Left — payment details */}
        <div className="td-col">
          <div className="card" style={{padding: "24px 28px"}}>
            <h2 style={{margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)"}}>Payment details</h2>
            <div className="pay-review-list" style={{paddingTop: 0, paddingBottom: 0}}>
              <div className="row-item"><div className="k">Reference</div><div className="v"><span>{tx.ref}</span><button className="copy-inline" onClick={() => copy(tx.ref, "reference")}><RIcon.copy /></button></div></div>
              <div className="row-item"><div className="k">Type</div><div className="v">{tx.type}{tx.chain ? " · Stablecoin" : !isOut && tx.party && tx.party.includes(" — ") ? ` · ${tx.party.split(" — ")[0]}` : ""}</div></div>
              <div className="row-item"><div className="k">Counterparty</div><div className="v" style={tx.chain ? {wordBreak: "break-all"} : {}}>{tx.chain ? tx.txHash : !isOut && tx.party && tx.party.includes(" — ") ? tx.party.split(" — ")[1] : tx.party}</div></div>
              {tx.chain && (
                <div className="row-item"><div className="k">Network</div><div className="v" style={{display:"flex",alignItems:"center",gap:6}}>{RNetworkIcon[tx.chain] && React.createElement(RNetworkIcon[tx.chain], {style:{width:16,height:16,flexShrink:0}})}{({eth:"Ethereum (ERC-20)",base:"Base",polygon:"Polygon",solana:"Solana (SPL)",tron:"Tron (TRC-20)"})[tx.chain] || tx.chain}</div></div>
              )}
              {tx.chain && (
                <div className="row-item"><div className="k">Conversion rate</div><div className="v">1 {tx.party.split("·")[0].trim()} = 1 USD</div></div>
              )}
              {tx.txHash && (
                <div className="row-item"><div className="k">Tx hash</div><div className="v">
                  {explorerUrl
                    ? <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color:"var(--info-700)",textDecoration:"none",fontVariantNumeric:"tabular-nums"}}>{txHashShort}</a>
                    : <span style={{fontVariantNumeric:"tabular-nums"}}>{txHashShort}</span>
                  }
                  <button className="copy-inline" onClick={() => copy(tx.txHash, "tx hash")}><RIcon.copy /></button>
                </div></div>
              )}
              {tx.from && tx.from !== tx.ccy && !tx.chain && (
                <div className="row-item"><div className="k">FX rate</div><div className="v">{tx.rate || `${tx.from} → ${tx.ccy}`}</div></div>
              )}
              {tx.convFee && (
                <div className="row-item"><div className="k">Conversion fee</div><div className="v">{tx.convFee}</div></div>
              )}
              <div className="row-item"><div className="k">Initiated</div><div className="v">{tx.date.replace(/,/, ", 2026,")}</div></div>
              {isOut && <div className="row-item"><div className="k">Memo</div><div className="v">{`Invoice #${tx.ref.slice(-5)} · ${tx.party}`}</div></div>}
            </div>

            {tx.status === "PROCESSING" && (
              <div className="td-banner info" style={{marginTop: 20}}>
                <RIcon.clock />
                <div>
                  <div className="t">Settling now</div>
                  <div className="s">Most {tx.ccy} payments arrive within 0–10 minutes. We’ll email when this one lands.</div>
                </div>
              </div>
            )}
            {tx.status === "FAILED" && (
              <div className="td-banner danger" style={{marginTop: 20}}>
                <RIcon.alert />
                <div>
                  <div className="t">Payment was rejected by the receiving bank</div>
                  <div className="s">Reason: <strong>account name mismatch</strong>. Funds were returned to your {tx.from} balance — no charge applied. You can edit the recipient and retry.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — money + actions */}
        <div className="td-col">
          <div className="card" style={{padding: "24px 28px", marginBottom: 22}}>
            <h2 style={{margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)"}}>Money breakdown</h2>
            {(() => {
              // FX & fees mirror the send-payment flow
              const FX = { USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1485.5, GHS: 14.2, KES: 129.4, TZS: 2640.0, MZN: 63.8 };
              const FEE = { USD: 4.50, GBP: 3.60, EUR: 4.10 };
              const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const parseAmt = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

              const dstAmt = parseAmt(tx.amount);          // amount in tx.ccy (destination/credited)
              const srcCcy = tx.from || tx.ccy;
              const dstCcy = tx.ccy;
              const isCrossCcy = !!tx.from && tx.from !== tx.ccy;
              const fee = isOut ? (FEE[srcCcy] ?? 0) : 0;
              const rate = isCrossCcy ? (FX[dstCcy] / FX[srcCcy]) : 1;

              // total debited (in source ccy) = dstAmt / rate
              // amount sent = total debited - fee
              const totalDebited = isCrossCcy ? (dstAmt / rate) : dstAmt;
              const amountSent = isOut ? Math.max(0, totalDebited - fee) : dstAmt;

              if (isIn) {
                return (
                  <div className="td-money">
                    <div className="row"><div className="k">Amount received</div><div className="v">{`${dstCcy}\u00A0${fmt(dstAmt)}`}</div></div>
                    <div className="row"><div className="k">Onboard fee</div><div className="v">{`${dstCcy}\u00A00.00`}</div></div>
                    <div className="row total"><div className="k">Total credited</div><div className="v">{`${dstCcy}\u00A0${fmt(dstAmt)}`}</div></div>
                  </div>
                );
              }

              return (
                <div className="td-breakdown">
                  <div className="bd-row">
                    <div className="bd-k">Amount sent</div>
                    <div className="bd-v">{`${srcCcy}\u00A0${fmt(amountSent)}`}</div>
                  </div>
                  <div className="bd-op">
                    <span className="op">−</span>
                    <span className="op-lbl">Onboard fee</span>
                    <span className="bd-v op-v">{`${srcCcy}\u00A0${fmt(fee)}`}</span>
                  </div>
                  <div className="bd-eq">
                    <div className="bd-k">Total debited</div>
                    <div className="bd-v strong">{`${srcCcy}\u00A0${fmt(totalDebited)}`}</div>
                  </div>
                  {isCrossCcy ? (
                    <>
                      <div className="bd-op">
                        <span className="op">×</span>
                        <span className="op-lbl">FX rate</span>
                        <span className="bd-v op-v">{`1\u00A0${srcCcy} = ${rate.toFixed(rate < 5 ? 4 : 2)}\u00A0${dstCcy}`}</span>
                      </div>
                      <div className="bd-eq final">
                        <div className="bd-k">Recipient gets</div>
                        <div className="bd-v strong">{`${dstCcy}\u00A0${fmt(dstAmt)}`}</div>
                      </div>
                    </>
                  ) : (
                    <div className="bd-eq final">
                      <div className="bd-k">Recipient gets</div>
                      <div className="bd-v strong">{`${dstCcy}\u00A0${fmt(dstAmt)}`}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="card" style={{padding: "24px 28px"}}>
            <h2 style={{margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)"}}>Actions</h2>
            <div className="td-actions">
              {isOut && (
                <button className="td-action" onClick={() => onToast && onToast(`Send another payment to ${tx.party}`)}>
                  <span className="ic"><RIcon.paperplane /></span>
                  <span className="t">Send again to {tx.party}</span>
                  <RIcon.arrowRight />
                </button>
              )}
              <button className="td-action" onClick={() => onToast && onToast("Receipt download — phase 2")}>
                <span className="ic"><RIcon.doc /></span>
                <span className="t">Download PDF receipt</span>
                <RIcon.arrowRight />
              </button>
              <button className="td-action" onClick={() => onToast && onToast("Receipt emailed")}>
                <span className="ic"><RIcon.email /></span>
                <span className="t">Email receipt to recipient</span>
                <RIcon.arrowRight />
              </button>
              <button className="td-action" onClick={() => onToast && onToast("Support — phase 2")}>
                <span className="ic"><RIcon.shield /></span>
                <span className="t">Report a problem</span>
                <RIcon.arrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 4. RECIPIENTS LIST PAGE — also lazy-loads
// =====================================================
function DeleteRecipientModal({ recipient, onConfirm, onCancel }) {
  const [confirming, setConfirming] = useStateR(false);
  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(onConfirm, 900);
  };
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:"#fff", borderRadius:16, padding:"28px 28px 24px", maxWidth:400, width:"90%",
        boxShadow:"0 20px 60px rgba(0,0,0,.2)"}} onClick={e => e.stopPropagation()}>
        <div style={{width:44, height:44, borderRadius:"50%", background:"#FEF2F2",
          display:"grid", placeItems:"center", marginBottom:16}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h2 style={{fontSize:17, fontWeight:700, color:"var(--gray-900)", margin:"0 0 8px"}}>Remove recipient?</h2>
        <p style={{fontSize:13.5, color:"var(--gray-600)", lineHeight:1.55, margin:"0 0 24px"}}>
          <strong style={{color:"var(--gray-900)"}}>{recipient.name}</strong> will be removed from your saved recipients. You can add them again at any time.
        </p>
        <div style={{display:"flex", gap:10, justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={confirming}>Cancel</button>
          <button className="btn" style={{background:"#DC2626", borderColor:"#DC2626", color:"#fff", minWidth:90}}
            disabled={confirming} onClick={handleConfirm}>
            {confirming
              ? <><span className="spin" style={{width:13,height:13,borderWidth:2,borderColor:"rgba(255,255,255,.3)",borderTopColor:"#fff"}} /> Removing…</>
              : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipientsScreen({ onAddNew, onPay, onToast, dataState = "full" }) {
  const [tab, setTab]   = useStateR("fiat"); // "fiat" | "crypto"
  const [q, setQ]       = useStateR("");
  const [ccyF, setCcyF] = useStateR("all");
  const [visible, setVisible] = useStateR(PAGE_SIZE_RC);
  const sentinelRef = useRefR(null);

  const fiatCount   = RECIPIENTS_FULL.filter(r => r.country !== "crypto").length;
  const cryptoCount = RECIPIENTS_FULL.filter(r => r.country === "crypto").length;

  const filtered = useMemoR(() => {
    if (dataState === "empty") return [];
    let res = RECIPIENTS_FULL.filter(r => tab === "fiat" ? r.country !== "crypto" : r.country === "crypto");
    if (tab === "fiat" && ccyF !== "all") res = res.filter(r => r.ccy === ccyF);
    const t = q.trim().toLowerCase();
    if (t) res = res.filter(r =>
      r.name.toLowerCase().includes(t) ||
      r.handle.toLowerCase().includes(t) ||
      (r.ccy || "").toLowerCase().includes(t) ||
      (r.networkLabel || "").toLowerCase().includes(t)
    );
    return res;
  }, [q, ccyF, tab, dataState]);

  useEffectR(() => { setVisible(PAGE_SIZE_RC); }, [q, ccyF, tab]);

  useEffectR(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) {
        setVisible(v => Math.min(v + PAGE_SIZE_RC, filtered.length));
      }
    }, { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const [loadingRc, setLoadingRc] = useStateR(true);
  useEffectR(() => { const t = setTimeout(() => setLoadingRc(false), 700); return () => clearTimeout(t); }, []);

  const [deleteTarget, setDeleteTarget] = useStateR(null);
  const [menuTarget, setMenuTarget]     = useStateR(null);

  return (
    <>
    {menuTarget && <div style={{position:"fixed", inset:0, zIndex:99}} onClick={() => setMenuTarget(null)} />}
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="title">Recipients</h1>
          <p className="subtitle">{dataState === "empty" ? "Save people and businesses you pay regularly so it’s one tap next time." : tab === "fiat" ? `${fiatCount} fiat recipients` : `${cryptoCount} crypto wallets`}</p>
        </div>
        <div className="row" style={{gap: 8}}>
          <button className="btn" onClick={onAddNew}><RIcon.plus /> Add recipient</button>
        </div>
      </div>

      <div style={{display:"inline-flex", background:"var(--gray-100)", borderRadius:10, padding:3, gap:2, marginBottom:16}}>
        {[["fiat","Fiat", fiatCount],["crypto","Crypto", cryptoCount]].map(([id, label, count]) => (
          <button key={id} onClick={() => { setTab(id); setQ(""); setCcyF("all"); }}
            style={{
              padding:"5px 14px", borderRadius:8, fontSize:13, fontWeight:500,
              border:"none", cursor:"pointer", transition:"background .12s, box-shadow .12s",
              background: tab === id ? "#fff" : "transparent",
              color:       tab === id ? "var(--gray-900)" : "var(--gray-500)",
              boxShadow:   tab === id ? "0 1px 3px rgba(0,0,0,.1)" : "none",
            }}>
            {label}
            <span style={{marginLeft:6, fontSize:11, fontWeight:600, opacity: tab === id ? .5 : .4}}>{count}</span>
          </button>
        ))}
      </div>

      <div className="tx-filterbar">
        <div className="tx-search">
          <RIcon.search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "fiat" ? "Search by name or bank…" : "Search by name or network…"} />
        </div>
        {tab === "fiat" && (
          <FilterSelect label="Currency" value={ccyF} onChange={setCcyF} options={[
            {v:"all", t:"All currencies"}, {v:"NGN", t:"NGN"}, {v:"GHS", t:"GHS"}, {v:"KES", t:"KES"}, {v:"TZS", t:"TZS"}, {v:"MZN", t:"MZN"},
          ]} />
        )}
        {(ccyF !== "all" || q) && (
          <button className="tx-clearfilters" onClick={() => { setCcyF("all"); setQ(""); }}>Clear filters</button>
        )}
      </div>

      {loadingRc ? (
        <div className="tablecard">
          {[58, 44, 62, 40, 52].map((w, i) => (
            <div key={i} className="skel-row">
              <div className="skel" style={{width: 40, height: 40, borderRadius: 99, flexShrink: 0}} />
              <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 6}}>
                <div className="skel" style={{width: `${w}%`, height: 13}} />
                <div className="skel" style={{width: `${w - 15}%`, height: 11}} />
              </div>
              <div className="skel" style={{width: 36, height: 14}} />
            </div>
          ))}
        </div>
      ) : <div className="tablecard">
        <div className="head">
          <h2>{tab === "fiat" ? "Fiat recipients" : "Crypto wallets"}</h2>
          <span className="meta">{`${list.length} of ${filtered.length}`}</span>
        </div>

        <div className="rc-list">
          {list.map(r => (
            <div key={r.id} className="rc-row" onClick={() => onPay(r)}>
              <div className="ava">
                <span>{r.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
                {r.country === "crypto" ? <NetworkBadge network={r.network} size={14} /> : <RFlag cc={r.country} size={14} />}
              </div>
              <div className="meta">
                <div className="t">{r.name}</div>
                <div className="s">{`${r.handle} · ${r.type}`}</div>
              </div>
              <div className="ccy-cell">
                {r.country === "crypto" ? <NetworkBadge network={r.network} size={18} /> : <RFlag cc={r.country} size={18} />}
                <span>{r.country === "crypto" ? r.networkLabel : r.ccy}</span>
              </div>
              <div className="last-cell">{`Last paid ${r.last}`}</div>
              <div className="actions">
                <button className="rc-pay" onClick={(e) => { e.stopPropagation(); onPay(r); }}>
                  <RIcon.paperplane /> Pay
                </button>
                <div style={{position:"relative"}}>
                  <button className="rc-iconbtn" title="More options"
                    onClick={(e) => { e.stopPropagation(); setMenuTarget(menuTarget?.id === r.id ? null : r); }}>
                    <span className="dots">···</span>
                  </button>
                  {menuTarget?.id === r.id && (
                    <div style={{position:"absolute", right:0, top:"calc(100% + 4px)", zIndex:100,
                      background:"#fff", borderRadius:8, padding:"4px 0", minWidth:160,
                      boxShadow:"0 4px 20px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)"}}>
                      <button style={{display:"flex", alignItems:"center", gap:8, width:"100%",
                        padding:"8px 14px", background:"none", border:"none", cursor:"pointer",
                        fontSize:13.5, color:"#DC2626", fontWeight:500, textAlign:"left"}}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); setMenuTarget(null); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                        Delete recipient
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {visible < filtered.length && (
          <div ref={sentinelRef} className="tx-loader">
            <span className="spin" /> Loading more recipients…
          </div>
        )}
        {visible >= filtered.length && filtered.length > PAGE_SIZE_RC && (
          <div className="tx-end">All {filtered.length} recipients shown</div>
        )}
        {filtered.length === 0 && (
          dataState === "empty" ? (
            <div className="empty" style={{padding: "72px 16px"}}>
              <div className="ic"><RIcon.people /></div>
              <div style={{fontSize: 15, color: "var(--gray-900)", fontWeight: 600, marginBottom: 4}}>No recipients yet</div>
              <div style={{fontSize: 13, maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.55}}>
                Save the people and businesses you pay regularly. After your first save, paying again is one tap.
              </div>
              <button className="btn" onClick={onAddNew}><RIcon.plus /> Add your first recipient</button>
            </div>
          ) : (
            <div className="empty" style={{padding: "60px 16px"}}>
              <div className="ic"><RIcon.people /></div>
              <div style={{fontSize: 14, color: "var(--gray-900)", fontWeight: 500}}>No recipients match</div>
              <div style={{fontSize: 12.5, marginTop: 4}}>Try clearing the filter or adding a new recipient.</div>
            </div>
          )
        )}
      </div>}
    </div>

    {deleteTarget && (
      <DeleteRecipientModal
        recipient={deleteTarget}
        onConfirm={() => { onToast && onToast(`${deleteTarget.name} removed`); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    )}
    </>
  );
}

window.OBExtras = {
  AddRecipientScreen,
  TransactionsScreen,
  TransactionDetailScreen,
  RecipientsScreen,
};
