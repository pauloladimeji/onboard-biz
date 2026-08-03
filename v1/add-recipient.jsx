/* global React */
const { useState: useStateA, useEffect: useEffectA } = React;
const AIcon = window.OBIcon;
const ANetworkIcon = window.OBNetworkIcon;
const { CURRENCIES: ACCY, NETWORK_TOKENS } = window.OBData;
const { Page, FlowShell, Flag: AFlag } = window.OBPrimitives;
const Combobox = window.OBCombobox;

function NetworkBadge({ network, size = 14 }) {
  const NetIc = ANetworkIcon[network];
  if (!NetIc) return null;
  return (
    <div className="ccy-flag" style={{ width: size, height: size, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <NetIc style={{ width: size * 0.8, height: size * 0.8 }} />
    </div>
  );
}

const METHOD_DESC = { bank: "Pay into a bank account", momo: "Pay into a mobile money wallet", card: "Send to a card" };
function methodDescFor(ccy, methodId) {
  if (ccy === "USD" && methodId === "bank") return "Pay into a bank account (Wire / ACH / SWIFT)";
  return METHOD_DESC[methodId] || "";
}

const PAYOUT_METHODS = {
  NGN: [{ id: "bank", label: "Bank account", icon: "bank" }, { id: "momo", label: "Mobile wallet", icon: "zap" }],
  GHS: [{ id: "bank", label: "Bank account", icon: "bank" }, { id: "momo", label: "Mobile money", icon: "zap" }],
  KES: [{ id: "bank", label: "Bank account", icon: "bank" }, { id: "momo", label: "Mobile money", icon: "zap" }],
  TZS: [{ id: "bank", label: "Bank account", icon: "bank" }, { id: "momo", label: "Mobile money", icon: "zap" }],
  MZN: [{ id: "bank", label: "Bank account", icon: "bank" }, { id: "momo", label: "Mobile money", icon: "zap" }],
  USD: [{ id: "wire", label: "Wire", icon: "bank", desc: "Fedwire · US domestic" }, { id: "ach", label: "ACH", icon: "bank", desc: "US domestic ACH" }, { id: "swift", label: "SWIFT", icon: "globe", desc: "International USD wire" }],
  GBP: [{ id: "fps", label: "Faster Payments", icon: "zap", desc: "UK domestic · arrives in seconds" }, { id: "swift", label: "SWIFT", icon: "globe", desc: "International GBP wire" }],
  EUR: [{ id: "sepa", label: "SEPA", icon: "bank", desc: "EU / EEA bank transfers" }, { id: "swift", label: "SWIFT", icon: "globe", desc: "International EUR wire" }],
};

const NAME_LOOKUP_SUPPORT = new Set(["NGN-bank", "GHS-bank", "KES-bank", "NGN-momo", "GHS-momo", "KES-momo", "GBP-fps"]);

const FIELD_SCHEMA = {
  "NGN-bank": [{ k: "bank", label: "Bank", kind: "select", options: ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "Sterling Bank", "Kuda", "Wema Bank"] }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "10-digit NUBAN", maxLength: 10 }],
  "NGN-momo": [{ k: "wallet", label: "Wallet provider", kind: "select", options: ["OPay", "PalmPay", "Moniepoint", "Kuda"] }, { k: "accNo", label: "Wallet number", kind: "digits", placeholder: "10–11 digits", maxLength: 11 }],
  "GHS-bank": [{ k: "bank", label: "Bank", kind: "select", options: ["Ecobank Ghana", "GCB Bank", "Standard Chartered", "Fidelity Bank", "ADB", "Stanbic Ghana"] }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "13 digits", maxLength: 16 }],
  "GHS-momo": [{ k: "wallet", label: "Provider", kind: "select", options: ["MTN MoMo", "Vodafone Cash", "AirtelTigo Money"] }, { k: "accNo", label: "Phone number", kind: "text", placeholder: "+233 XX XXX XXXX" }],
  "KES-bank": [{ k: "bank", label: "Bank", kind: "select", options: ["Equity Bank", "KCB Bank", "Co-op Bank", "ABSA", "DTB", "NCBA Bank", "Stanbic Bank"] }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "Account number", maxLength: 16 }],
  "KES-momo": [{ k: "accNo", label: "M-Pesa number", kind: "text", placeholder: "+254 7XX XXX XXX" }],
  "TZS-bank": [{ k: "bank", label: "Bank", kind: "select", options: ["CRDB Bank", "NMB Bank", "Stanbic Tanzania", "NBC Bank"] }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "Account number", maxLength: 16 }],
  "TZS-momo": [{ k: "wallet", label: "Provider", kind: "select", options: ["M-Pesa", "Tigo Pesa", "Airtel Money"] }, { k: "accNo", label: "Phone number", kind: "text", placeholder: "+255 XX XXX XXXX" }],
  "MZN-bank": [{ k: "bank", label: "Bank", kind: "select", options: ["Banco BCI", "Millennium BIM", "Standard Bank", "Banco Único"] }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "NIB number", maxLength: 21 }],
  "MZN-momo": [{ k: "accNo", label: "M-Pesa Vodacom number", kind: "text", placeholder: "+258 XX XXX XXXX" }],
  "USD-wire": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. JPMorgan Chase" }, { k: "routing", label: "ABA / Routing", kind: "digits", placeholder: "9-digit routing number", maxLength: 9 }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "Account number", maxLength: 17 }],
  "USD-ach": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. Wells Fargo" }, { k: "routing", label: "ABA / Routing", kind: "digits", placeholder: "9-digit routing number", maxLength: 9 }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "Account number", maxLength: 17 }],
  "USD-swift": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. Citibank" }, { k: "swift", label: "SWIFT / BIC", kind: "text", placeholder: "e.g. CITIUS33XXX" }, { k: "accNo", label: "Account / IBAN", kind: "text", placeholder: "Account number or IBAN" }, { k: "intBank", label: "Intermediary bank SWIFT", kind: "text", placeholder: "Optional", optional: true }],
  "GBP-fps": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. Barclays" }, { k: "sortCode", label: "Sort code", kind: "text", placeholder: "00-00-00", maxLength: 8 }, { k: "accNo", label: "Account number", kind: "digits", placeholder: "8 digits", maxLength: 8 }],
  "GBP-swift": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. HSBC" }, { k: "swift", label: "SWIFT / BIC", kind: "text", placeholder: "e.g. HBUKGB4BXXX" }, { k: "iban", label: "IBAN", kind: "iban", placeholder: "GB00 BANK 0000 0000 0000 00" }],
  "EUR-sepa": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. ING" }, { k: "iban", label: "IBAN", kind: "iban", placeholder: "DE00 0000 0000 0000 0000 00" }, { k: "bic", label: "BIC / SWIFT", kind: "text", placeholder: "Optional for SEPA", optional: true }],
  "EUR-swift": [{ k: "bank", label: "Bank name", kind: "text", placeholder: "e.g. Deutsche Bank" }, { k: "swift", label: "SWIFT / BIC", kind: "text", placeholder: "e.g. DEUTDEDBXXX" }, { k: "iban", label: "IBAN", kind: "iban", placeholder: "DE00 0000 0000 0000 0000 00" }],
};

const ALL_CRYPTO_NETWORKS = [
  { id: "eth", name: "Ethereum", short: "ERC-20", addressPlaceholder: "0x…", maxLength: 42, arrival: "~2 min after 12 confirmations" },
  { id: "base", name: "Base", short: "Base", addressPlaceholder: "0x…", maxLength: 42, arrival: "~10 sec" },
  { id: "polygon", name: "Polygon", short: "Polygon", addressPlaceholder: "0x…", maxLength: 42, arrival: "~5 sec" },
  { id: "solana", name: "Solana", short: "SPL", addressPlaceholder: "Base58 address", maxLength: 44, arrival: "~10 sec" },
  { id: "tron", name: "Tron", short: "TRC-20", addressPlaceholder: "T… address", maxLength: 34, arrival: "~1 min" },
];

// "Ready" = enough entered to move past the account fields — for lookup rails that means enough
// to actually attempt the lookup; for every other rail it just means the required fields are in,
// at which point the flow falls through to manual name entry. Returning false by default here
// used to strand those rails (EUR, SWIFT, TZS, MZN) with Continue permanently disabled.
function isLookupReady(railKey, fields, schema = []) {
  switch (railKey) {
    case "NGN-bank": return !!fields.bank && (fields.accNo || "").length === 10;
    case "NGN-momo": return !!fields.wallet && (fields.accNo || "").length >= 10;
    case "GHS-bank": return !!fields.bank && (fields.accNo || "").length >= 8;
    case "GHS-momo": return !!fields.wallet && (fields.accNo || "").replace(/\D/g, "").length >= 9;
    case "KES-bank": return !!fields.bank && (fields.accNo || "").length >= 6;
    case "KES-momo": return (fields.accNo || "").replace(/\D/g, "").length >= 9;
    case "GBP-fps": return !!fields.sortCode && (fields.accNo || "").length === 8;
    case "USD-wire":
    case "USD-ach": return (fields.routing || "").length === 9 && (fields.accNo || "").length >= 6;
    default:
      return schema.length > 0 && schema.every(f => f.optional || (fields[f.k] && String(fields[f.k]).trim() !== ""));
  }
}

const SELF_BUSINESS_NAME = "Acme Trading Co";

function maskAccount(v) {
  const s = String(v).replace(/\s/g, "");
  if (s.length <= 4) return s;
  return "••••" + s.slice(-4);
}

function NameResolution({ party, lookup, lookupAvailable = true, selfName, thirdName, setThirdName }) {
  if (lookup.status === "idle") {
    if (!lookupAvailable) {
      if (party === "self") {
        return (
          <div className="ar-namecheck idle">
            <div className="ic"><AIcon.bank /></div>
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
          <div className="lbl">Recipient's legal name <span className="req">· required</span></div>
          <input className="inp" value={thirdName} onChange={(e) => setThirdName(e.target.value)} placeholder="As shown on their account" />
          <div className="help">Enter the name exactly as it appears on their account.</div>
        </div>
      );
    }
    return (
      <div className="ar-namecheck idle">
        <div className="ic"><AIcon.shield /></div>
        <div className="meta">
          <div className="t">{party === "self" ? "We'll match the account against your business name" : "We'll look up the account holder's name"}</div>
          <div className="s">Fill in the details above to continue.</div>
        </div>
      </div>
    );
  }

  if (lookup.status === "loading") {
    return (
      <div className="ar-namecheck loading">
        <div className="ic"><div className="spinner" /></div>
        <div className="meta"><div className="t">Verifying with the bank…</div><div className="s">This usually takes a few seconds.</div></div>
      </div>
    );
  }

  if (lookup.status === "unsupported") {
    if (party === "self") {
      return (
        <div className="ar-namecheck idle">
          <div className="ic"><AIcon.bank /></div>
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
        <div className="lbl">Recipient's legal name <span className="req">· required</span></div>
        <input className="inp" value={thirdName} onChange={(e) => setThirdName(e.target.value)} placeholder="As shown on their account" />
        <div className="help">Enter the name exactly as it appears on their account.</div>
      </div>
    );
  }

  if (lookup.status === "matched") {
    if (party === "self") {
      const exact = lookup.name === selfName;
      return (
        <div className={`ar-namecheck ${exact ? "ok" : "warn"}`}>
          <div className="ic">{exact ? <AIcon.check /> : <AIcon.alert />}</div>
          <div className="meta">
            <div className="t">{exact ? "Account verified · matches your business" : "Name mismatch"}</div>
            <div className="s"><span className="strong">{lookup.name}</span>{!exact && <> · expected <span className="strong">{selfName}</span></>}</div>
            {!exact && <div className="s warn">First-party transfers must match your business name. Use a different account, or pay this as a third-party recipient.</div>}
          </div>
        </div>
      );
    }
    return (
      <div className="ar-namecheck ok">
        <div className="ic"><AIcon.check /></div>
        <div className="meta"><div className="t">Account holder verified</div><div className="s strong">{lookup.name}</div><div className="s">Returned by the bank for the account number you entered.</div></div>
      </div>
    );
  }

  if (lookup.status === "mismatched") {
    return (
      <div className="ar-namecheck warn">
        <div className="ic"><AIcon.alert /></div>
        <div className="meta"><div className="t">Couldn't verify this account</div><div className="s">The bank didn't return a name we recognise. Double-check the number and try again.</div></div>
      </div>
    );
  }

  return null;
}

function AddRecipientScreen({ onBack, onSaved, onToast, nameLookupMock = "default" }) {
  const [recipientType, setRecipientType] = useStateA("cash");
  const [step, setStep] = useStateA(0);
  const [ccy, setCcy] = useStateA(null);
  const [party, setParty] = useStateA("third");
  const [entityType, setEntityType] = useStateA("business");
  const [methodId, setMethodId] = useStateA(null);
  const [fields, setFields] = useStateA({});
  const [thirdName, setThirdName] = useStateA("");
  const [lookup, setLookup] = useStateA({ status: "idle", name: null });
  const [saving, setSaving] = useStateA(false);
  const [cryptoNetwork, setCryptoNetwork] = useStateA(null);
  const [cryptoAddress, setCryptoAddress] = useStateA("");
  const [cryptoLabel, setCryptoLabel] = useStateA("");

  const isCrypto = recipientType === "crypto";
  const methods = ccy ? (PAYOUT_METHODS[ccy] || []) : [];
  const method = methods.find(m => m.id === methodId);
  const railKey = ccy && methodId ? `${ccy}-${methodId}` : null;
  const schema = railKey ? (FIELD_SCHEMA[railKey] || []) : [];
  const cryptoChainMeta = cryptoNetwork ? ALL_CRYPTO_NETWORKS.find(c => c.id === cryptoNetwork) : null;

  const setField = (k, v) => setFields(prev => ({ ...prev, [k]: v }));

  const railSupportsLookup = railKey ? NAME_LOOKUP_SUPPORT.has(railKey) : false;
  const lookupAvailable = nameLookupMock === "on" ? true : nameLookupMock === "off" ? false : railSupportsLookup;

  useEffectA(() => {
    if (!railKey) return;
    if (!isLookupReady(railKey, fields, schema)) { setLookup({ status: "idle", name: null }); return; }
    if (!lookupAvailable) { setLookup({ status: "unsupported", name: null }); return; }
    setLookup({ status: "loading", name: null });
    const t = setTimeout(() => {
      if (party === "self") {
        const match = Math.random() > 0.3 ? SELF_BUSINESS_NAME : "Acme Logistics LLC";
        setLookup({ status: match === SELF_BUSINESS_NAME ? "matched" : "mismatched", name: match });
      } else {
        const sample = { NGN: "Adaeze Okafor", GHS: "Kojo Mensah", KES: "Joseph Mwangi", TZS: "Aisha Komba", MZN: "Lucia Macamo", GBP: "Northwood Trading Ltd", EUR: "Berlin Verlag GmbH", USD: "Riverbend Imports Inc" }[ccy] || "Recipient";
        setLookup({ status: "matched", name: sample });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [railKey, JSON.stringify(fields), party, nameLookupMock]);

  useEffectA(() => { setFields({}); setThirdName(""); setLookup({ status: "idle", name: null }); }, [railKey, party]);

  useEffectA(() => {
    if (methods.length === 1 && methodId !== methods[0].id) setMethodId(methods[0].id);
    if (methods.length === 0 && methodId) setMethodId(null);
  }, [ccy]);

  const resolvedName = isCrypto ? cryptoLabel : (party === "self" ? SELF_BUSINESS_NAME : (lookup.status === "matched" ? lookup.name : thirdName));
  const stepLabels = ["Destination", "Details", "Review"];
  const canStep1 = isCrypto ? !!cryptoNetwork : (!!ccy && !!methodId);
  const fieldsComplete = schema.every(f => f.optional || (fields[f.k] && String(fields[f.k]).trim() !== ""));
  const lookupOk = lookup.status === "matched" || (lookup.status === "unsupported" && (party === "self" ? true : thirdName.trim().length > 1));
  const canStep2 = isCrypto ? (cryptoAddress.trim().length >= 10 && cryptoLabel.trim().length > 1) : (!!method && fieldsComplete && lookupOk);

  const reset = () => {
    setStep(0); setCcy(null); setParty("third"); setMethodId(null); setFields({}); setThirdName(""); setLookup({ status: "idle", name: null });
    setCryptoNetwork(null); setCryptoAddress(""); setCryptoLabel("");
  };

  const switchRecipientType = (t) => { if (t === recipientType) return; setRecipientType(t); reset(); };

  const handle = isCrypto
    ? (cryptoChainMeta ? `${cryptoChainMeta.name} · ${cryptoAddress.slice(0, 6)}…${cryptoAddress.slice(-4)}` : "")
    : (method?.id === "bank"
      ? (fields.bank && fields.accNo ? `${fields.bank} · ****${String(fields.accNo).slice(-4)}` : fields.iban ? `IBAN · ${fields.iban.replace(/\s/g, "").slice(-4).padStart(4, "•")}` : "")
      : (fields.accNo ? `${method?.label || "Wallet"} · ${fields.accNo}` : ""));

  return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><AIcon.arrowLeft /> Back to Recipients</a>
        <span className="crumb-sep">/</span><span className="crumb-current">Add new</span>
      </div>

      <h1 className="title">Add a new recipient</h1>
      <p className="subtitle">Save bank, wallet, or crypto details once — pay them in seconds after that.</p>

      <FlowShell steps={stepLabels} current={step}>
        <div className="pay-flow-card">

          {step === 0 && (
            <>
              <div className="pay-panel-head" style={{ paddingBottom: 0 }}>
                <div className="pay-panel-title">Where are they receiving money?</div>
                <div className="pay-panel-sub">{isCrypto ? "Choose the blockchain network they receive on." : "Pick the currency and payment method."}</div>
              </div>

              <div className="ar-tabs" role="tablist" style={{ marginBottom: 20 }}>
                <button role="tab" aria-selected={recipientType === "cash"} className={`ar-tab ${recipientType === "cash" ? "on" : ""}`} onClick={() => switchRecipientType("cash")}>
                  <div className="ic"><AIcon.bank /></div>
                  <div className="meta"><div className="t">Cash recipient</div><div className="s">Bank account or mobile money</div></div>
                </button>
                <button role="tab" aria-selected={recipientType === "crypto"} className={`ar-tab ${recipientType === "crypto" ? "on" : ""}`} onClick={() => switchRecipientType("crypto")}>
                  <div className="ic"><AIcon.globe /></div>
                  <div className="meta"><div className="t">Crypto recipient</div><div className="s">Send stablecoins to a wallet</div></div>
                </button>
              </div>
            </>
          )}

          {step === 0 && !isCrypto && (
            <>
              <div className="cbox-field">
                <div className="cbox-field-lbl">Currency</div>
                <Combobox
                  value={ccy}
                  onChange={(c) => { setCcy(c); setMethodId(null); }}
                  options={Object.keys(PAYOUT_METHODS).map(c => {
                    const meta = ACCY[c];
                    return { value: c, label: c, sub: meta?.name || c, leading: meta?.flag ? <AFlag cc={meta.flag} size={22} /> : null, search: `${c} ${meta?.name || ""}` };
                  })}
                  placeholder="Select a currency"
                  searchPlaceholder="Search currency…" />
              </div>

              {ccy && methods.length > 0 && (
                <div className="cbox-field" style={{ marginTop: 16 }}>
                  <div className="cbox-field-lbl">Payment method</div>
                  <Combobox
                    value={methodId}
                    onChange={(id) => setMethodId(id)}
                    options={methods.map(m => {
                      const Ic = AIcon[m.icon] || AIcon.bank;
                      const desc = m.desc || methodDescFor(ccy, m.id);
                      return { value: m.id, label: m.label, sub: desc, leading: <div className="cbox-method-ic"><Ic /></div>, search: `${m.label} ${desc}` };
                    })}
                    placeholder={methods.length === 1 ? methods[0].label : "Select a payment method"}
                    searchPlaceholder="Search…"
                    locked={methods.length <= 1} />
                </div>
              )}

              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
                <button className="btn btn-lg" disabled={!canStep1} onClick={() => setStep(1)}>Continue <AIcon.arrowRight /></button>
              </div>
            </>
          )}

          {step === 0 && isCrypto && (
            <>
              <div className="cbox-field" style={{ marginTop: 8 }}>
                <div className="cbox-field-lbl">Network</div>
                <Combobox
                  value={cryptoNetwork}
                  onChange={(id) => setCryptoNetwork(id)}
                  options={ALL_CRYPTO_NETWORKS.map(ch => {
                    const NetIc = ANetworkIcon[ch.id];
                    const tokens = (NETWORK_TOKENS[ch.id] || []).join(", ");
                    return { value: ch.id, label: ch.name, sub: `${ch.short} · ${tokens}`, leading: NetIc ? <NetIc style={{ width: 22, height: 22 }} /> : null, search: `${ch.name} ${ch.short} ${tokens}` };
                  })}
                  placeholder="Select a network"
                  searchPlaceholder="Search network…" />
              </div>

              {cryptoNetwork && cryptoChainMeta && (
                <div className="ar-namecheck idle" style={{ marginTop: 16 }}>
                  <div className="ic"><AIcon.info /></div>
                  <div className="meta">
                    <div className="t">{`${cryptoChainMeta.name} (${cryptoChainMeta.short})`}</div>
                    <div className="s">{`Supports ${(NETWORK_TOKENS[cryptoNetwork] || []).join(" and ")}`}</div>
                  </div>
                </div>
              )}

              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
                <button className="btn btn-lg" disabled={!canStep1} onClick={() => setStep(1)}>Continue <AIcon.arrowRight /></button>
              </div>
            </>
          )}

          {step === 1 && isCrypto && cryptoNetwork && (
            <>
              <div className="pay-panel-head" style={{ paddingBottom: 0 }}>
                <div className="pay-panel-title">Wallet details</div>
                <div className="pay-panel-sub">{cryptoChainMeta?.name || cryptoNetwork}</div>
              </div>
              <div className="ar-form">
                <div className="field">
                  <div className="lbl">Wallet address <span className="req">· required</span></div>
                  <input className="inp" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value.trim())} placeholder={cryptoChainMeta?.addressPlaceholder || "Wallet address"} maxLength={cryptoChainMeta?.maxLength || 64} style={{ fontFamily: "monospace, var(--font-sans)", fontSize: 13 }} />
                  <div className="help">{`Make sure this is a valid ${cryptoChainMeta?.name} address. Sending on the wrong network will result in permanent loss of funds.`}</div>
                </div>
                <div className="field">
                  <div className="lbl">Recipient label <span className="req">· required</span></div>
                  <input className="inp" value={cryptoLabel} onChange={(e) => setCryptoLabel(e.target.value)} placeholder="e.g. Treasury wallet, Vendor — Acme Corp" />
                  <div className="help">A name to help you identify this wallet later.</div>
                </div>
              </div>
              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn btn-lg" disabled={!canStep2} onClick={() => setStep(2)}>Continue <AIcon.arrowRight /></button>
              </div>
            </>
          )}

          {step === 1 && !isCrypto && ccy && (
            <>
              <div className="pay-panel-head" style={{ paddingBottom: 0 }}>
                <div className="pay-panel-title">Account details</div>
                <div className="pay-panel-sub">{`${ACCY[ccy]?.name || ccy} · ${method?.label || ""}`}</div>
              </div>

              <div className="ar-tabs" role="tablist">
                <button role="tab" aria-selected={party === "third"} className={`ar-tab ${party === "third" ? "on" : ""}`} onClick={() => setParty("third")}>
                  <div className="ic"><AIcon.people /></div>
                  <div className="meta"><div className="t">Pay someone else</div><div className="s">A supplier, contractor or partner</div></div>
                </button>
                <button role="tab" aria-selected={party === "self"} className={`ar-tab ${party === "self" ? "on" : ""}`} onClick={() => setParty("self")}>
                  <div className="ic"><AIcon.bank /></div>
                  <div className="meta"><div className="t">Pay myself</div><div className="s">Move funds to my own bank or wallet</div></div>
                </button>
              </div>

              {party === "third" && (
                <div className="ar-form" style={{ paddingBottom: 0 }}>
                  <div className="field">
                    <div className="lbl">Recipient type <span className="req">· required</span></div>
                    <select className="inp pay-select" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                      <option value="individual">Individual — A personal account</option>
                      <option value="business">Business — A company or organisation</option>
                    </select>
                  </div>
                </div>
              )}

              {method && (
                <div className="ar-form">
                  {schema.map(f => (
                    <div className="field" key={f.k}>
                      <div className="lbl">{f.label}{f.optional ? <span className="opt">· optional</span> : <span className="req">· required</span>}</div>
                      {f.kind === "select" ? (
                        <select className="inp pay-select" value={fields[f.k] || ""} onChange={(e) => setField(f.k, e.target.value)}>
                          <option value="">{`Select ${f.label.toLowerCase()}…`}</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="inp" value={fields[f.k] || ""} onChange={(e) => { let v = e.target.value; if (f.kind === "digits") v = v.replace(/\D/g, ""); setField(f.k, v); }} placeholder={f.placeholder} maxLength={f.maxLength} inputMode={f.kind === "digits" ? "numeric" : undefined} />
                      )}
                    </div>
                  ))}

                  {party === "self" && (
                    <div className="field">
                      <div className="lbl">Account holder</div>
                      <input className="inp" value={SELF_BUSINESS_NAME} readOnly disabled />
                      <div className="help">First-party transfers move funds within your business. The destination account name must match.</div>
                    </div>
                  )}

                  {schema.length > 0 && (
                    <NameResolution party={party} lookup={lookup} lookupAvailable={lookupAvailable} selfName={SELF_BUSINESS_NAME} thirdName={thirdName} setThirdName={setThirdName} />
                  )}
                </div>
              )}

              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn btn-lg" disabled={!canStep2} onClick={() => setStep(2)}>Continue <AIcon.arrowRight /></button>
              </div>
            </>
          )}

          {step === 2 && isCrypto && cryptoNetwork && (
            <>
              <div className="pay-panel-head" style={{ paddingBottom: 0 }}>
                <div className="pay-panel-title">Review and save</div>
                <div className="pay-panel-sub">Confirm everything looks right.</div>
              </div>
              <div className="pay-recip-strip" style={{ margin: "16px 0 8px" }}>
                <div className="ava"><span>{(cryptoLabel || "??").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</span><NetworkBadge network={cryptoNetwork} size={14} /></div>
                <div className="meta"><div className="t">{cryptoLabel || "Recipient"}</div><div className="s">{handle}</div></div>
                <div className="rt">{cryptoChainMeta?.name}</div>
              </div>
              <div className="pay-review-list" style={{ marginTop: 8 }}>
                <div className="row-item"><div className="k">Network</div><div className="v">{cryptoChainMeta?.name} ({cryptoChainMeta?.short})</div></div>
                <div className="row-item"><div className="k">Wallet address</div><div className="v" style={{ wordBreak: "break-all" }}>{cryptoAddress}</div></div>
                <div className="row-item"><div className="k">Label</div><div className="v">{cryptoLabel}</div></div>
              </div>
              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Back</button>
                <button className="btn btn-lg" disabled={saving} onClick={() => {
                  setSaving(true);
                  setTimeout(() => {
                    onToast && onToast(`${cryptoLabel} saved as a crypto recipient`);
                    if (onSaved) onSaved({ name: cryptoLabel, country: "crypto", handle, type: "Crypto", network: cryptoNetwork, networkLabel: cryptoChainMeta?.name, party: "third" });
                    reset();
                  }, 900);
                }}>
                  {saving ? <><span className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><AIcon.check /> Save recipient</>}
                </button>
              </div>
            </>
          )}

          {step === 2 && !isCrypto && ccy && method && (
            <>
              <div className="pay-panel-head" style={{ paddingBottom: 0 }}>
                <div className="pay-panel-title">Review and save</div>
                <div className="pay-panel-sub">Confirm everything looks right.</div>
              </div>
              <div className="pay-recip-strip" style={{ margin: "16px 0 8px" }}>
                <div className="ava">
                  <span>{(resolvedName || "??").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</span>
                  {ACCY[ccy]?.flag && <AFlag cc={ACCY[ccy].flag} size={14} />}
                </div>
                <div className="meta"><div className="t">{resolvedName || "Recipient"}</div><div className="s">{handle}</div></div>
                <div className="rt">{ccy}</div>
              </div>
              <div className="pay-review-list" style={{ marginTop: 8 }}>
                <div className="row-item"><div className="k">Type</div><div className="v">{party === "self" ? "Pay myself · 1st party" : "Pay someone else · 3rd party"}</div></div>
                {party === "third" && <div className="row-item"><div className="k">Recipient type</div><div className="v">{entityType === "business" ? "Business" : "Individual"}</div></div>}
                <div className="row-item"><div className="k">Currency</div><div className="v">{ccy}</div></div>
                <div className="row-item"><div className="k">Method</div><div className="v">{method.label}</div></div>
                <div className="row-item"><div className="k">Account holder</div><div className="v">{resolvedName}</div></div>
                {schema.map(f => fields[f.k] ? (
                  <div className="row-item" key={f.k}><div className="k">{f.label}</div><div className="v">{f.k === "accNo" || f.k === "iban" ? maskAccount(fields[f.k]) : fields[f.k]}</div></div>
                ) : null)}
              </div>
              <div className="pay-review-foot" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← Back</button>
                <button className="btn btn-lg" disabled={saving} onClick={() => {
                  setSaving(true);
                  setTimeout(() => {
                    onToast && onToast(`${resolvedName} saved as a recipient`);
                    if (onSaved) onSaved({ name: resolvedName, ccy, country: ACCY[ccy]?.flag || "us", handle, type: method.id === "bank" ? "Bank" : "Mobile money", party });
                    reset();
                  }, 900);
                }}>
                  {saving ? <><span className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : <><AIcon.check /> Save recipient</>}
                </button>
              </div>
            </>
          )}
        </div>
      </FlowShell>
    </Page>
  );
}

window.OBAddRecipient = { AddRecipientScreen };
