/* global React */
/* Data + icons for Onboard Business v0 mocks (Variation A — Africa-focused) */

// ---------- Icons (Ionicons-style outline, 1.5px stroke) ----------
const Icon = {
  // Nav
  home:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z"/></svg>,
  wallet: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16.5 13.5h2"/></svg>,
  paperplane: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  people: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 11a3 3 0 0 0 0-6M21.5 20a5.5 5.5 0 0 0-4-5.3"/></svg>,
  list:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  cog:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1l-.4-2.5h-4l-.3 2.6a7.4 7.4 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.8 1l.3 2.5h4l.4-2.6c.6-.2 1.2-.5 1.7-1l2.4 1 2-3.4-2-1.6z"/></svg>,
  // UI
  bell:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 17H9a3 3 0 0 0 6 0zM5 17h14l-1.5-2V11a5.5 5.5 0 1 0-11 0v4L5 17z"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  copy:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>,
  check:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6L9 17l-5-5"/></svg>,
  alert:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.3 3.86l-7.99 13.42A2 2 0 0 0 4.04 20.5h15.92a2 2 0 0 0 1.73-3.22L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
  info:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>,
  doc:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>,
  arrowLeft: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>,
  arrowRight: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowDown: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 9l7 7 7-7"/></svg>,
  arrowDownLeft: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 7L7 17M17 17H7V7"/></svg>,
  arrowUpRight: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17L17 7M7 7h10v10"/></svg>,
  swap:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 7h13l-3-3M17 17H4l3 3"/></svg>,
  plus:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  external:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 4h6v6M10 14L20 4M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></svg>,
  clock:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  bank:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/></svg>,
  zap:     (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>,
  globe:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
  refresh: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>,
  email:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  shield:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/></svg>,
  inbox:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 13l2-8h14l2 8M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6M3 13h6l1 2h4l1-2h6"/></svg>,
};

const NetworkIcon = {
  eth:     (p) => <svg viewBox="0 0 24 24" {...p}><path d="M12 1.5l-7 10.1L12 15l7-3.4L12 1.5z" fill="#627EEA" opacity=".6"/><path d="M12 15l-7-3.4L12 22.5l7-11L12 15z" fill="#627EEA"/><path d="M12 1.5v8.2l7 3.3L12 1.5z" fill="#627EEA" opacity=".8"/></svg>,
  base:    (p) => <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10" fill="#0052FF"/><path d="M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 10.8a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6z" fill="#fff" fillRule="evenodd"/><path d="M12 7.7a4.3 4.3 0 100 8.6V7.7z" fill="#fff"/></svg>,
  polygon: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M16.2 9.2c-.4-.2-.9-.2-1.2 0l-2.8 1.6-1.9 1.1-2.8 1.6c-.4.2-.9.2-1.2 0L4 12.3c-.4-.2-.6-.6-.6-1v-2.4c0-.4.2-.8.6-1l2.2-1.3c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1v1.6l1.9-1.1V7.8c0-.4-.2-.8-.6-1l-4-2.3c-.4-.2-.9-.2-1.2 0l-4.1 2.4c-.4.2-.6.6-.6 1v4.6c0 .4.2.8.6 1l4.1 2.3c.4.2.9.2 1.2 0l2.8-1.6 1.9-1.1 2.8-1.6c.4-.2.9-.2 1.2 0l2.2 1.3c.4.2.6.6.6 1v2.4c0 .4-.2.8-.6 1l-2.2 1.3c-.4.2-.9.2-1.2 0l-2.2-1.3c-.4-.2-.6-.6-.6-1v-1.6l-1.9 1.1v1.6c0 .4.2.8.6 1l4.1 2.3c.4.2.9.2 1.2 0l4.1-2.3c.4-.2.6-.6.6-1v-4.6c0-.4-.2-.8-.6-1L16.2 9.2z" fill="#8247E5"/></svg>,
  solana:  (p) => <svg viewBox="0 0 24 24" {...p}><path d="M6.1 16.3c.1-.1.3-.2.5-.2h13.3c.3 0 .5.4.3.6l-2.7 2.7c-.1.1-.3.2-.5.2H3.7c-.3 0-.5-.4-.3-.6l2.7-2.7z" fill="url(#sol1)"/><path d="M6.1 4.6c.1-.1.3-.2.5-.2h13.3c.3 0 .5.4.3.6L17.5 7.7c-.1.1-.3.2-.5.2H3.7c-.3 0-.5-.4-.3-.6L6.1 4.6z" fill="url(#sol2)"/><path d="M17.5 10.4c-.1-.1-.3-.2-.5-.2H3.7c-.3 0-.5.4-.3.6l2.7 2.7c.1.1.3.2.5.2h13.3c.3 0 .5-.4.3-.6l-2.7-2.7z" fill="url(#sol3)"/><defs><linearGradient id="sol1" x1="18.5" y1="2.3" x2="6.6" y2="21.5" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient><linearGradient id="sol2" x1="14.2" y1="0" x2="2.3" y2="19.2" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient><linearGradient id="sol3" x1="16.3" y1="1.2" x2="4.5" y2="20.4" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient></defs></svg>,
  tron:    (p) => <svg viewBox="0 0 24 24" {...p}><path d="M4.2 4.5l15.5 5.6-8.8 11L4.2 4.5z" fill="#FF060A" opacity=".8"/><path d="M4.2 4.5L19.7 10l-3.5-7.5L4.2 4.5z" fill="#FF060A"/><path d="M10.9 21.1l8.8-11.1-3.5-7.5L10.9 21z" fill="#FF060A" opacity=".6"/></svg>,
};

// ---------- Currency metadata ----------
// Variation A: funding USD/GBP/EUR; payouts NGN/GHS/KES/MZN/TZS
const CURRENCIES = {
  USD: { code: "USD", symbol: "$",  flag: "us", name: "US Dollar",          country: "United States" },
  GBP: { code: "GBP", symbol: "£",  flag: "gb", name: "Pound Sterling",     country: "United Kingdom" },
  EUR: { code: "EUR", symbol: "€",  flag: "eu", name: "Euro",               country: "Eurozone" },
  NGN: { code: "NGN", symbol: "₦",  flag: "ng", name: "Nigerian Naira",     country: "Nigeria" },
  GHS: { code: "GHS", symbol: "₵",  flag: "gh", name: "Ghanaian Cedi",      country: "Ghana" },
  KES: { code: "KES", symbol: "KSh",flag: "ke", name: "Kenyan Shilling",    country: "Kenya" },
  MZN: { code: "MZN", symbol: "MT", flag: "mz", name: "Mozambican Metical", country: "Mozambique" },
  TZS: { code: "TZS", symbol: "TSh",flag: "tz", name: "Tanzanian Shilling", country: "Tanzania" },
  USDC:{ code: "USDC",symbol: "Ⓒ", flag: null, name: "USD Coin",         country: "Stablecoin", stablecoin: true },
  USDT:{ code: "USDT",symbol: "Ⓣ", flag: null, name: "Tether USD",       country: "Stablecoin", stablecoin: true },
  CAD: { code: "CAD", symbol: "$",  flag: "ca", name: "Canadian Dollar",    country: "Canada" },
  AUD: { code: "AUD", symbol: "$",  flag: "au", name: "Australian Dollar",  country: "Australia" },
  JPY: { code: "JPY", symbol: "¥",  flag: "jp", name: "Japanese Yen",       country: "Japan" },
  CHF: { code: "CHF", symbol: "Fr", flag: "ch", name: "Swiss Franc",        country: "Switzerland" },
  SGD: { code: "SGD", symbol: "$",  flag: "sg", name: "Singapore Dollar",   country: "Singapore" },
  HKD: { code: "HKD", symbol: "$",  flag: "hk", name: "Hong Kong Dollar",   country: "Hong Kong SAR" },
  AED: { code: "AED", symbol: "د.إ",flag: "ae", name: "UAE Dirham",         country: "United Arab Emirates" },
  ZAR: { code: "ZAR", symbol: "R",  flag: "za", name: "South African Rand", country: "South Africa" },
};


// Sample transactions (recent — dashboard preview shows 5–8)
const TXNS = [
  { id: "PAY-2026-04812", date: "May 6, 09:14", direction: "out", type: "Payout",  party: "Adaeze Okafor",     ref: "PAY-2026-04812", amount: "1,250,000.00", ccy: "NGN",   from: "USD", status: "PROCESSING", pillTone: "warn" },
  { id: "FND-2026-00321", date: "May 7, 10:15", direction: "in",  type: "Funding", party: "NGN — First Bank ****1181", ref: "FND-2026-00321", amount: "504.87", fromAmount: "750,000.00", ccy: "USD", from: "NGN", rate: "1 USD = ₦1,485.50", convFee: "0.5%", status: "COMPLETED", pillTone: "success" },
  { id: "FND-2026-00319", date: "May 6, 07:41", direction: "in",  type: "Funding", party: "USDC · Base network", ref: "FND-2026-00319", amount: "5,000.00", ccy: "USD", chain: "base", txHash: "0x7b4a2f1c9e8d3a5b6f0c4e2d1a8b7c3f9e6d5a4b", status: "COMPLETED", pillTone: "success" },
  { id: "FND-2026-00318", date: "May 6, 08:02", direction: "in",  type: "Funding", party: "Wire — JPMorgan ****4419", ref: "FND-2026-00318", amount: "25,000.00",   ccy: "USD",   status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04809", date: "May 5, 16:38", direction: "out", type: "Payout",  party: "Mensah Holdings Ltd", ref: "PAY-2026-04809", amount: "48,200.00",   ccy: "GHS",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04802", date: "May 5, 14:22", direction: "out", type: "Payout",  party: "Joseph Mwangi",       ref: "PAY-2026-04802", amount: "62,500.00",   ccy: "KES",   from: "GBP", status: "COMPLETED",  pillTone: "success" },
  { id: "FND-2026-00317", date: "May 5, 11:50", direction: "in",  type: "Funding", party: "FPS — Barclays ****8821",  ref: "FND-2026-00317", amount: "8,000.00",    ccy: "GBP",   status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04795", date: "May 4, 17:09", direction: "out", type: "Payout",  party: "Tausi Logistics",     ref: "PAY-2026-04795", amount: "1,840,000.00", ccy: "TZS",  from: "USD", status: "FAILED",     pillTone: "danger" },
  { id: "PAY-2026-04790", date: "May 4, 10:14", direction: "out", type: "Payout",  party: "Lucia Macamo",        ref: "PAY-2026-04790", amount: "92,400.00",   ccy: "MZN",   from: "EUR", status: "COMPLETED",  pillTone: "success" },
  { id: "FND-2026-00316", date: "May 3, 14:00", direction: "in",  type: "Funding", party: "ACH — Mercury ****0021",   ref: "FND-2026-00316", amount: "12,000.00",   ccy: "USD",   status: "COMPLETED",  pillTone: "success" },
];

// ---------- Fiat funding rails (named accounts — USD only in v0) ----------
const FIAT_RAILS = [
  {
    id: "usd-wire", name: "Wire", desc: "Fedwire · domestic and international USD wires",
    icon: "globe", timing: "1–2 business days", timingTone: "med",
    fields: [
      { k: "Account holder",      v: "Acme Trading Co" },
      { k: "Bank name",           v: "Lead Bank, Kansas City MO" },
      { k: "ABA / Routing number",v: "101019644" },
      { k: "Account number",      v: "8841 0029 4471" },
      { k: "SWIFT / BIC",         v: "LEADUSAA" },
      { k: "Bank address",        v: "1801 Main Street, Kansas City, MO 64108, USA" },
    ],
  },
  {
    id: "usd-ach", name: "ACH", desc: "US domestic ACH transfer",
    icon: "bank", timing: "1–3 business days", timingTone: "med",
    fields: [
      { k: "Account holder",      v: "Acme Trading Co" },
      { k: "Bank name",           v: "Lead Bank, Kansas City MO" },
      { k: "ABA / Routing number",v: "101019644" },
      { k: "Account number",      v: "8841 0029 4471" },
      { k: "Account type",        v: "Checking · Business" },
    ],
  },
];

// ---------- Extended recipients (for lazy-load) ----------
const RECIPIENTS_FULL = (() => {
  const seed = [
    { name: "Adaeze Okafor",       handle: "GTBank · ****4419",          country: "ng", ccy: "NGN", type: "Bank",         last: "May 6" },
    { name: "Mensah Holdings Ltd", handle: "Ecobank Ghana · ****2210",   country: "gh", ccy: "GHS", type: "Bank",         last: "May 5" },
    { name: "Joseph Mwangi",       handle: "M-Pesa · +254 712 ••• 882",  country: "ke", ccy: "KES", type: "Mobile money", last: "May 5" },
    { name: "Tausi Logistics",     handle: "CRDB Bank · ****0091",       country: "tz", ccy: "TZS", type: "Bank",         last: "May 4" },
    { name: "Lucia Macamo",        handle: "Millennium BIM · ****7732",  country: "mz", ccy: "MZN", type: "Bank",         last: "May 4" },
    { name: "Kwame Osei",          handle: "MTN MoMo · +233 24 ••• 091", country: "gh", ccy: "GHS", type: "Mobile money", last: "Apr 28" },
    { name: "Chinedu Nwosu",       handle: "Access Bank · ****8821",     country: "ng", ccy: "NGN", type: "Bank",         last: "Apr 27" },
    { name: "Wanjiru Kamau",       handle: "Equity Bank · ****0042",     country: "ke", ccy: "KES", type: "Bank",         last: "Apr 26" },
    { name: "Nia Bakari",          handle: "NMB Bank · ****1190",        country: "tz", ccy: "TZS", type: "Bank",         last: "Apr 25" },
    { name: "Akosua Asante",       handle: "Standard Chartered · ****3380", country: "gh", ccy: "GHS", type: "Bank",      last: "Apr 24" },
    { name: "Tendai Moyo",         handle: "Vodacom M-Pesa · +258 84 ••• 220", country: "mz", ccy: "MZN", type: "Mobile money", last: "Apr 22" },
    { name: "Folake Adebayo",      handle: "Zenith Bank · ****6612",     country: "ng", ccy: "NGN", type: "Bank",         last: "Apr 22" },
    { name: "Samuel Otieno",       handle: "KCB Bank · ****7740",        country: "ke", ccy: "KES", type: "Bank",         last: "Apr 21" },
    { name: "Aisha Komba",         handle: "Airtel Money · +255 78 ••• 014", country: "tz", ccy: "TZS", type: "Mobile money", last: "Apr 20" },
    { name: "Kojo Mensah",         handle: "Vodafone Cash · +233 50 ••• 727", country: "gh", ccy: "GHS", type: "Mobile money", last: "Apr 18" },
    { name: "Omolade Ajayi",       handle: "First Bank · ****2295",      country: "ng", ccy: "NGN", type: "Bank",         last: "Apr 17" },
    { name: "Brenda Wairimu",      handle: "Co-op Bank · ****1108",      country: "ke", ccy: "KES", type: "Bank",         last: "Apr 16" },
    { name: "Salim Mwakawago",     handle: "CRDB Bank · ****5531",       country: "tz", ccy: "TZS", type: "Bank",         last: "Apr 15" },
    { name: "Eduardo Sitole",      handle: "Banco BCI · ****8842",       country: "mz", ccy: "MZN", type: "Bank",         last: "Apr 14" },
    { name: "Ifeoma Eze",          handle: "OPay · +234 803 ••• 4471",   country: "ng", ccy: "NGN", type: "Mobile money", last: "Apr 12" },
    { name: "Yaa Boateng",         handle: "Fidelity Bank · ****0193",   country: "gh", ccy: "GHS", type: "Bank",         last: "Apr 11" },
    { name: "Peter Njoroge",       handle: "Stanbic Bank · ****8821",    country: "ke", ccy: "KES", type: "Bank",         last: "Apr 10" },
    { name: "Halima Juma",         handle: "Tigo Pesa · +255 65 ••• 882",country: "tz", ccy: "TZS", type: "Mobile money", last: "Apr 09" },
    { name: "Bismark Acheampong",  handle: "GCB Bank · ****4421",        country: "gh", ccy: "GHS", type: "Bank",         last: "Apr 08" },
    { name: "Nkechi Obi",          handle: "UBA · ****7791",             country: "ng", ccy: "NGN", type: "Bank",         last: "Apr 07" },
    { name: "Daniel Kiprop",       handle: "NCBA Bank · ****0044",       country: "ke", ccy: "KES", type: "Bank",         last: "Apr 06" },
    { name: "Maria Tembe",         handle: "Standard Bank · ****6612",   country: "mz", ccy: "MZN", type: "Bank",         last: "Apr 05" },
    { name: "John Ssemakula",      handle: "Stanbic Tanzania · ****1140",country: "tz", ccy: "TZS", type: "Bank",         last: "Apr 04" },
    { name: "Grace Mensimah",      handle: "MTN MoMo · +233 27 ••• 0010",country: "gh", ccy: "GHS", type: "Mobile money", last: "Apr 03" },
    { name: "Tunde Bakare",        handle: "Sterling Bank · ****0817",   country: "ng", ccy: "NGN", type: "Bank",         last: "Apr 02" },
    { name: "Esther Wanjala",      handle: "ABSA · ****2275",            country: "ke", ccy: "KES", type: "Bank",         last: "Apr 01" },
    { name: "Issa Mwinyi",         handle: "Halotel · +255 62 ••• 991",  country: "tz", ccy: "TZS", type: "Mobile money", last: "Mar 30" },
    { name: "Carolina Bila",       handle: "Banco Único · ****9928",     country: "mz", ccy: "MZN", type: "Bank",         last: "Mar 28" },
    { name: "Henry Akoto",         handle: "ADB · ****3318",             country: "gh", ccy: "GHS", type: "Bank",         last: "Mar 27" },
    { name: "Patience Eyo",        handle: "Kuda · ****8814",            country: "ng", ccy: "NGN", type: "Bank",         last: "Mar 26" },
    { name: "Mwende Kilonzo",      handle: "DTB · ****5560",             country: "ke", ccy: "KES", type: "Bank",         last: "Mar 25" },
    { name: "Vitalik's Vault",    handle: "Ethereum · 0x9F2c…B0c4a", country: "crypto", type: "Crypto", network: "eth",  networkLabel: "Ethereum", last: "May 7" },
    { name: "Bridge Capital Ltd",  handle: "Tron · TZ9b…C0aB9",      country: "crypto", type: "Crypto", network: "tron", networkLabel: "Tron",     last: "May 3" },
    { name: "Solana Treasury",     handle: "Base · 0x7E2b…C0aB9",    country: "crypto", type: "Crypto", network: "base", networkLabel: "Base",     last: "Apr 30" },
  ];
  return seed.map((r, i) => ({ ...r, id: `r${i + 1}` }));
})();

// ---------- Extended transactions (full feed) ----------
const TXNS_FULL = [
  ...TXNS,
  { id: "WDR-2026-00101", date: "May 7, 11:02", direction: "out", type: "Withdrawal", party: "Vitalik's Vault · USDC", ref: "WDR-2026-00101", amount: "2,500.00", ccy: "USDC", from: "USD", chain: "eth", txHash: "0x4c1a8e2f7d3b5a9c6e0f1d2b3a4c5e6f7a8b9c0d", status: "COMPLETED", pillTone: "success" },
  { id: "WDR-2026-00102", date: "May 5, 15:30", direction: "out", type: "Withdrawal", party: "Bridge Capital Ltd · USDT", ref: "WDR-2026-00102", amount: "8,000.00", ccy: "USDT", from: "USD", chain: "tron", txHash: "TXa1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ", status: "PROCESSING", pillTone: "warn" },
  { id: "FND-2026-00320", date: "May 3, 09:12", direction: "in",  type: "Funding", party: "USDT · Tron (TRC-20)", ref: "FND-2026-00320", amount: "10,000.00", ccy: "USD", chain: "tron", txHash: "TZ9bD4cF6aE1c5B82d3F9CdA4b5e6F7E8d12C0aB9", status: "COMPLETED", pillTone: "success" },
  { id: "PAY-2026-04788", date: "May 3, 11:24", direction: "out", type: "Payout",  party: "Akosua Asante",       ref: "PAY-2026-04788", amount: "62,400.00",   ccy: "GHS",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04781", date: "May 2, 18:41", direction: "out", type: "Payout",  party: "Chinedu Nwosu",       ref: "PAY-2026-04781", amount: "780,000.00",  ccy: "NGN",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04772", date: "May 2, 14:55", direction: "out", type: "Payout",  party: "Wanjiru Kamau",       ref: "PAY-2026-04772", amount: "144,200.00",  ccy: "KES",   from: "GBP", status: "COMPLETED",  pillTone: "success" },
  { id: "FND-2026-00315", date: "May 2, 10:10", direction: "in",  type: "Funding", party: "SEPA — N26 ****1209", ref: "FND-2026-00315", amount: "5,000.00",    ccy: "EUR",   status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04763", date: "May 1, 16:02", direction: "out", type: "Payout",  party: "Nia Bakari",          ref: "PAY-2026-04763", amount: "920,000.00",  ccy: "TZS",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04760", date: "May 1, 11:38", direction: "out", type: "Payout",  party: "Tendai Moyo",         ref: "PAY-2026-04760", amount: "48,200.00",   ccy: "MZN",   from: "EUR", status: "PROCESSING", pillTone: "warn" },
  { id: "PAY-2026-04752", date: "Apr 30, 17:21",direction: "out", type: "Payout",  party: "Folake Adebayo",      ref: "PAY-2026-04752", amount: "510,000.00",  ccy: "NGN",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "FND-2026-00314", date: "Apr 30, 09:02",direction: "in",  type: "Funding", party: "Wire — Citi ****1188",ref: "FND-2026-00314", amount: "40,000.00",   ccy: "USD",   status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04748", date: "Apr 29, 15:44",direction: "out", type: "Payout",  party: "Samuel Otieno",       ref: "PAY-2026-04748", amount: "92,000.00",   ccy: "KES",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04742", date: "Apr 29, 12:09",direction: "out", type: "Payout",  party: "Kojo Mensah",         ref: "PAY-2026-04742", amount: "18,400.00",   ccy: "GHS",   from: "GBP", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04738", date: "Apr 28, 10:18",direction: "out", type: "Payout",  party: "Aisha Komba",         ref: "PAY-2026-04738", amount: "1,200,000.00",ccy: "TZS",   from: "USD", status: "FAILED",     pillTone: "danger" },
  { id: "PAY-2026-04730", date: "Apr 27, 16:49",direction: "out", type: "Payout",  party: "Omolade Ajayi",       ref: "PAY-2026-04730", amount: "330,000.00",  ccy: "NGN",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "FND-2026-00313", date: "Apr 27, 09:00",direction: "in",  type: "Funding", party: "FPS — Monzo ****0014",ref: "FND-2026-00313", amount: "12,500.00",   ccy: "GBP",   status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04725", date: "Apr 26, 13:11",direction: "out", type: "Payout",  party: "Brenda Wairimu",      ref: "PAY-2026-04725", amount: "78,200.00",   ccy: "KES",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04719", date: "Apr 25, 11:33",direction: "out", type: "Payout",  party: "Eduardo Sitole",      ref: "PAY-2026-04719", amount: "62,400.00",   ccy: "MZN",   from: "EUR", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04711", date: "Apr 24, 17:00",direction: "out", type: "Payout",  party: "Yaa Boateng",         ref: "PAY-2026-04711", amount: "27,400.00",   ccy: "GHS",   from: "USD", status: "COMPLETED",  pillTone: "success" },
  { id: "PAY-2026-04702", date: "Apr 23, 14:22",direction: "out", type: "Payout",  party: "Ifeoma Eze",          ref: "PAY-2026-04702", amount: "190,000.00",  ccy: "NGN",   from: "USD", status: "COMPLETED",  pillTone: "success" },
];

// Per-currency rail metadata for sending payouts (used in transaction details)
const PAYOUT_RAILS = {
  NGN: "NIBSS Instant Payment",
  GHS: "GhIPSS",
  KES: "Pesalink",
  TZS: "TIPS",
  MZN: "RTGS Mozambique",
  USDC: "Stablecoin transfer",
  USDT: "Stablecoin transfer",
};

// Mock business profile shown on Settings · Profile (also reused by Send Payment "pay myself")
const BUSINESS_PROFILE = {
  legalName: "Acme Trading Co",
  tradingName: "Acme",
  rcNumber: "RC-1284772",
  taxId: "TIN-204-119-883-001",
  industry: "Wholesale & distribution",
  registeredCountry: "Nigeria",
  registeredAddress: {
    line1: "12 Adeola Odeku Street",
    line2: "Suite 4B",
    city: "Lagos",
    region: "Lagos State",
    postalCode: "101241",
    country: "Nigeria",
  },
  primaryContact: {
    name: "Adaeze Okafor",
    email: "[email protected]",
    phone: "+234 802 555 0142",
    role: "Director",
  },
  website: "acmetrading.co",
  createdAt: "Mar 4, 2024",
};
window.OBIcon = Icon;

// Stablecoin chains supported per coin (mock)
const STABLECOIN_CHAINS = {
  USDC: [
    { id: "eth",     name: "Ethereum",       short: "ERC-20", address: "0x9F2c4a8b1E5d7a3c91F0bD2e4cAb7fE6Dd31B0c4a", min: "10",  arrival: "~2 min after 12 confirmations" },
    { id: "base",    name: "Base",            short: "Base",   address: "0x7E2bD4cF6aE1c5B82d3F9CdA4b5e6F7E8d12C0aB9", min: "1",   arrival: "~10 sec" },
    { id: "polygon", name: "Polygon",         short: "Polygon",address: "0xA1bC3d5E7F90123456789aBCdEf0123456789ABCd", min: "1",   arrival: "~5 sec" },
    { id: "solana",  name: "Solana",          short: "SPL",    address: "6dGN1MzCN3pUDmkXfpqCkX4Yp9rJfb7s5kKR3Z2VQwTm", min: "1",   arrival: "~10 sec" },
  ],
  USDT: [
    { id: "eth",     name: "Ethereum",       short: "ERC-20", address: "0x9F2c4a8b1E5d7a3c91F0bD2e4cAb7fE6Dd31B0c4a", min: "10",  arrival: "~2 min after 12 confirmations" },
    { id: "tron",    name: "Tron",            short: "TRC-20", address: "TZ9bD4cF6aE1c5B82d3F9CdA4b5e6F7E8d12C0aB9",   min: "5",   arrival: "~1 min" },
  ],
};

const WAITLIST_CURRENCIES = [
  { code: "GBP", name: "Pound Sterling",     flag: "gb" },
  { code: "EUR", name: "Euro",               flag: "eu" },
  { code: "NGN", name: "Nigerian Naira",     flag: "ng" },
  { code: "GHS", name: "Ghanaian Cedi",      flag: "gh" },
  { code: "KES", name: "Kenyan Shilling",    flag: "ke" },
  { code: "TZS", name: "Tanzanian Shilling", flag: "tz" },
  { code: "MZN", name: "Mozambican Metical", flag: "mz" },
];

// v0 mock balances — USD only (all funds held as a single USD balance)
const V0_USD_BALANCE = 84231.50;

window.OBData = { CURRENCIES, BUSINESS_PROFILE, RECIPIENTS_FULL, TXNS, TXNS_FULL, FIAT_RAILS, PAYOUT_RAILS, STABLECOIN_CHAINS, WAITLIST_CURRENCIES, V0_USD_BALANCE };
window.OBNetworkIcon = NetworkIcon;
