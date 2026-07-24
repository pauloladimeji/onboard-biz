/* global React, ReactDOM */
const { useState } = React;
const Icon = window.OBIcon;
const { Shell } = window.OBShell;
const { Dashboard } = window.OBDashboard;
const { DepositPage } = window.OBDeposit;
const { SendPayment } = window.OBSendPayment;
const { RecipientsScreen } = window.OBRecipients;
const { AddRecipientScreen } = window.OBAddRecipient;
const { TransactionsScreen, TransactionDetailScreen } = window.OBTransactions;
const { SettingsScreen, DeveloperSection } = window.OBSettings;
const { CardsScreen } = window.OBCards;
const {
  ApplyForAccessScreen, SignInScreen, SignInPasswordScreen, ForgotPasswordScreen,
  TotpVerifyScreen, TotpSetupScreen, SetPasswordScreen,
  TotpRecoveryStartScreen, TotpRecoverySentScreen, TotpRecoveryInvalidScreen, TotpRecoveryDoneScreen,
} = window.OBAuth;

// 24h withdrawal-hold end time → "Jul 24, 3:42 PM" for the recovery-done screen + in-app banner.
function formatHoldUntil(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}
const { Page, Toast, Sheet, isDemoMode, withDemoUtm, TALLY_URL, CONSUMER_APP_LINKS, useIsDesktop } = window.OBPrimitives;
const { RECIPIENTS_FULL } = window.OBData;

// ---------- Demo entry gate (demo mode only) ----------
// The only screen a demo visitor sees before the app itself. Not a real auth step — it never
// asks for anything, just routes personal-use visitors to the consumer app instead of the
// business demo. Skipped entirely outside demo mode.
const DEMO_ENTRY_FEATURES = [
  "Hold a global USD balance",
  "Get paid and payout in 5+ currencies",
  "Corporate cards (coming soon)",
];

// Onboard wordmark as inline SVG (from the design reference) — single-colour via currentColor,
// so callers set the colour (white on the photo hero, brand purple on light backgrounds).
const OnboardLogo = (p) => (
  <svg viewBox="0 0 147 23" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M21.5413 12.3745C22.9199 9.65267 19.7742 5.1951 14.4376 2.3487C9.03524 -0.534224 3.43088 -0.673859 1.92058 2.03721C1.19177 3.34548 1.54959 5.0791 2.72403 6.84709C2.72403 6.84924 2.72842 6.85138 2.72842 6.85353C3.14331 7.48082 3.66358 8.11025 4.27384 8.72894C4.28701 8.74397 4.30238 8.75686 4.31555 8.7719C5.54048 10.005 7.12322 11.1801 8.96939 12.1661C12.4883 14.0437 16.095 14.7569 18.5976 14.2778C18.6129 14.2757 18.6261 14.2714 18.6415 14.2692C18.299 14.6258 17.7261 14.8965 16.9797 15.0705C16.8129 15.1113 16.6372 15.1457 16.4528 15.1758C14.824 15.44 12.5717 15.3261 10.1658 14.7741C8.44254 14.3788 6.89053 13.8159 5.65682 13.1822C4.53507 12.6043 3.67455 11.9685 3.18722 11.3412C2.82062 10.8686 2.66476 10.4024 2.76793 9.97491C2.83818 9.67631 3.02916 9.41637 3.32332 9.19725C2.6911 8.56352 2.20596 7.9835 1.76911 7.34118C0.88225 7.90187 0.285153 8.62797 0.0788041 9.49156C-0.151693 10.4561 0.131489 11.4787 0.822979 12.4647C1.10177 12.8643 1.44642 13.2574 1.85034 13.6376C2.05229 13.8288 2.26962 14.0179 2.50012 14.2005C2.90842 14.527 3.36064 14.8428 3.85017 15.1414C5.42852 16.106 7.4086 16.9115 9.62356 17.4207C12.9559 18.1833 16.117 18.1145 18.3912 17.3841C18.4768 17.3562 18.5602 17.3283 18.6437 17.2982C17.7063 18.5915 14.4289 19.5087 10.5477 19.4529C6.69955 19.3949 4.14213 18.2563 2.54622 17.0963C2.13132 16.7934 1.73399 16.4733 1.22251 16.5635C0.236859 16.7418 -0.202182 17.8933 0.436623 18.6495C2.12474 20.6495 6.03001 22.0866 10.6004 22.1532C16.7536 22.2434 21.7806 19.8138 21.8267 16.7246C21.8333 16.2155 21.706 15.7193 21.4579 15.2467C21.6006 14.9996 21.706 14.7375 21.774 14.4626C21.9365 13.7816 21.8443 13.0748 21.5326 12.3702L21.5413 12.3745ZM17.95 11.6978C17.6668 11.7708 17.3375 11.8095 16.9731 11.8138C15.2652 11.8353 12.7583 11.1135 10.2097 9.75364C9.57307 9.41422 8.97158 9.05547 8.414 8.68382C8.2779 8.5936 8.14399 8.50337 8.01447 8.411C8.93646 8.42174 9.92211 8.49908 10.9407 8.6473C12.249 8.8385 13.4081 9.12421 14.4289 9.47222C15.5111 9.84387 16.3277 10.2177 17.1004 10.6967C17.2563 10.7934 17.4539 10.8965 17.6558 10.8986C17.9061 10.8986 18.0136 10.7805 18.0663 10.6409C18.1454 10.4325 18.1058 10.0329 17.7853 9.53237C17.1224 8.49263 15.3135 7.13495 11.4105 6.27136C8.83329 5.70208 6.51076 5.85246 5.38901 6.11669C4.39897 4.97168 3.98847 3.91476 4.3858 3.20369C5.20241 1.7386 9.13403 2.29499 13.1688 4.44752C16.7777 6.37233 19.2451 8.92228 19.142 10.4862C19.131 10.6537 19.0893 10.8106 19.0168 10.9545C19.0103 10.9695 19.0015 10.9824 18.9949 10.9975C18.8039 11.339 18.4439 11.571 17.9522 11.6978H17.95Z" />
    <path d="M45.0853 5.84755C43.8384 5.08922 42.4094 4.70898 40.7981 4.70898C39.1868 4.70898 37.7358 5.08278 36.5108 5.83251C35.2859 6.58224 34.3464 7.60694 33.6922 8.90447C33.038 10.2042 32.7109 11.6521 32.7109 13.2503C32.7109 14.8486 33.038 16.303 33.6922 17.6112C34.3464 18.9195 35.2793 19.955 36.4955 20.7133C37.7094 21.4716 39.1451 21.8518 40.8003 21.8518C42.4555 21.8518 43.8626 21.4716 45.0875 20.7133C46.3124 19.955 47.2564 18.9238 47.9193 17.6263C48.5823 16.3288 48.9138 14.8701 48.9138 13.2503C48.9138 11.6306 48.5867 10.2084 47.9347 8.91951C47.2805 7.63057 46.3322 6.60587 45.0875 5.84755H45.0853ZM44.4729 16.2922C44.1458 17.1816 43.665 17.8755 43.0328 18.376C42.3984 18.8765 41.6542 19.1257 40.7959 19.1257C39.9376 19.1257 39.1978 18.8765 38.5743 18.376C37.9509 17.8776 37.4811 17.188 37.165 16.3073C36.8489 15.4286 36.6908 14.4082 36.6908 13.2503C36.6908 12.0924 36.8489 11.1322 37.165 10.2536C37.4811 9.37494 37.9509 8.68535 38.5743 8.18482C39.1978 7.68643 39.9376 7.43509 40.7959 7.43509C41.6542 7.43509 42.394 7.68428 43.0152 8.18482C43.6387 8.68535 44.1172 9.37279 44.4553 10.2536C44.7912 11.1322 44.9602 12.1311 44.9602 13.2503C44.9602 14.3696 44.7956 15.405 44.4707 16.2922H44.4729Z" />
    <path d="M65.7598 10.3438C65.7598 9.26538 65.5666 8.30082 65.1781 7.45227C64.7895 6.60372 64.2034 5.93347 63.4175 5.44368C62.6316 4.95388 61.646 4.70898 60.4628 4.70898C59.6045 4.70898 58.7835 4.90877 57.9976 5.30834C57.2117 5.70791 56.5114 6.25786 55.899 6.95818C55.2865 7.6585 54.797 8.4469 54.4282 9.32553V5.13004H50.7227V21.4351H54.4282V14.0624C54.4282 12.8443 54.6565 11.738 55.1175 10.7498C55.5763 9.76162 56.1799 8.99255 56.9241 8.44261C57.6705 7.89266 58.4498 7.61769 59.2686 7.61769C60.1884 7.61769 60.8755 7.89266 61.3365 8.44261C61.7953 8.99255 62.0258 9.81747 62.0258 10.9152V21.4351H65.9464C65.8235 20.2557 65.762 18.9582 65.762 17.5382V10.3438H65.7598Z" />
    <path d="M81.0308 5.77014C79.9596 5.06123 78.7083 4.70462 77.2792 4.70462C76.1772 4.70462 75.1652 5.02041 74.2476 5.64984C73.3278 6.27927 72.5946 7.12353 72.0414 8.1826V0H68.3359V21.4307H72.0414V18.464C72.5924 19.5038 73.3278 20.3287 74.2476 20.9366C75.1674 21.5467 76.1662 21.8518 77.2485 21.8518C78.6578 21.8518 79.9069 21.493 81.0001 20.7734C82.0933 20.0537 82.9406 19.044 83.5421 17.7465C84.1436 16.449 84.4444 14.9581 84.4444 13.2803C84.4444 11.6026 84.1436 10.0838 83.5421 8.78411C82.9406 7.48443 82.1021 6.4812 81.0308 5.77229V5.77014ZM79.9595 16.1998C79.6017 17.0483 79.1056 17.7078 78.4734 18.1783C77.839 18.6488 77.1146 18.8829 76.2979 18.8829C75.4813 18.8829 74.8118 18.6681 74.1686 18.2385C73.5254 17.8088 73.0095 17.2245 72.6232 16.4855C72.2346 15.7465 72.0414 14.9259 72.0414 14.0279V12.6187C72.0414 11.7401 72.2302 10.9194 72.6078 10.1611C72.9854 9.4028 73.4969 8.79699 74.1401 8.34802C74.7833 7.89904 75.5033 7.67347 76.3001 7.67347C77.097 7.67347 77.8412 7.90333 78.4756 8.36305C79.1078 8.82277 79.6039 9.47798 79.9617 10.3265C80.3196 11.1751 80.4974 12.1611 80.4974 13.2782C80.4974 14.3953 80.3174 15.3512 79.9617 16.2019L79.9595 16.1998Z" />
    <path d="M97.7963 5.84755C96.5494 5.08922 95.1203 4.70898 93.509 4.70898C91.8977 4.70898 90.4467 5.08278 89.2218 5.83251C87.9969 6.58224 87.0573 7.60694 86.4031 8.90447C85.749 10.2042 85.4219 11.6521 85.4219 13.2503C85.4219 14.8486 85.749 16.303 86.4031 17.6112C87.0573 18.9195 87.9903 19.955 89.2064 20.7133C90.4204 21.4716 91.856 21.8518 93.5112 21.8518C95.1664 21.8518 96.5735 21.4716 97.7984 20.7133C99.0234 19.955 99.9673 18.9238 100.63 17.6263C101.293 16.3288 101.625 14.8701 101.625 13.2503C101.625 11.6306 101.298 10.2084 100.646 8.91951C99.9915 7.63057 99.0431 6.60587 97.7984 5.84755H97.7963ZM97.1838 16.2922C96.8567 17.1816 96.376 17.8755 95.7437 18.376C95.1093 18.8765 94.3651 19.1257 93.5068 19.1257C92.6485 19.1257 91.9087 18.8765 91.2853 18.376C90.6618 17.8776 90.1921 17.188 89.876 16.3073C89.5598 15.4286 89.4018 14.4082 89.4018 13.2503C89.4018 12.0924 89.5598 11.1322 89.876 10.2536C90.1921 9.37494 90.6618 8.68535 91.2853 8.18482C91.9087 7.68643 92.6485 7.43509 93.5068 7.43509C94.3651 7.43509 95.1049 7.68428 95.7262 8.18482C96.3496 8.68535 96.8282 9.37279 97.1662 10.2536C97.5021 11.1322 97.6711 12.1311 97.6711 13.2503C97.6711 14.3696 97.5065 15.405 97.1816 16.2922H97.1838Z" />
    <path d="M117.677 19.3304C117.411 19.3304 117.207 19.2595 117.064 19.1199C116.922 18.9803 116.838 18.7397 116.819 18.4002V10.5184C116.819 9.31967 116.608 8.29067 116.191 7.43138C115.771 6.57208 115.104 5.90184 114.184 5.42278C113.265 4.94373 112.09 4.70312 110.661 4.70312C109.048 4.70312 107.531 5.06188 106.113 5.78154C104.694 6.50119 103.474 7.56027 102.453 8.95877L105.118 10.9674C105.731 9.80946 106.486 8.92439 107.386 8.3143C108.284 7.7042 109.254 7.39915 110.297 7.39915C111.236 7.39915 111.934 7.68916 112.395 8.26918C112.854 8.84921 113.085 9.64835 113.085 10.6666V10.7848C110.953 10.9802 109.116 11.3412 107.601 11.8804C105.948 12.469 104.686 13.2337 103.819 14.1725C102.951 15.1113 102.517 16.2112 102.517 17.47C102.517 18.7289 102.96 19.8481 103.849 20.6473C104.738 21.4464 105.928 21.846 107.419 21.846C108.808 21.846 109.987 21.4872 110.955 20.7676C111.888 20.0737 112.595 19.1671 113.085 18.0587V18.2799C113.085 19.44 113.381 20.3229 113.974 20.933C114.564 21.5431 115.372 21.8481 116.393 21.8481C116.759 21.8481 117.113 21.8138 117.449 21.7429C117.784 21.672 118.107 21.5689 118.412 21.4292L118.871 19.0318C118.625 19.1328 118.417 19.208 118.243 19.2574C118.07 19.3068 117.881 19.3326 117.677 19.3326V19.3304ZM112.441 16.5742C112.013 17.3347 111.456 17.9083 110.771 18.2971C110.086 18.6859 109.346 18.8814 108.551 18.8814C107.877 18.8814 107.351 18.7117 106.973 18.3723C106.595 18.0329 106.407 17.5538 106.407 16.933C106.407 16.1747 106.707 15.5388 107.309 15.0297C107.91 14.5205 108.749 14.1253 109.82 13.846C110.749 13.6032 111.842 13.4249 113.082 13.3025V13.9362C113.082 14.9351 112.867 15.8138 112.439 16.5742H112.441Z" />
    <path d="M129.557 4.92869C129.19 4.77831 128.771 4.70312 128.301 4.70312C127.443 4.70312 126.611 5.0984 125.805 5.8868C125 6.6752 124.33 7.71924 123.799 9.01892V5.12203H120.062V21.4271H123.952C123.849 20.4668 123.799 19.3089 123.799 17.9491V13.3927C123.799 12.3551 123.968 11.4292 124.304 10.6193C124.64 9.80946 125.07 9.19507 125.59 8.77617C126.11 8.35726 126.637 8.14674 127.168 8.14674C127.555 8.14674 127.893 8.20259 128.178 8.31215C128.464 8.42171 128.78 8.63653 129.129 8.95662L130.63 5.65909C130.283 5.31967 129.926 5.07477 129.559 4.92439L129.557 4.92869Z" />
    <path d="M146.25 21.4307C146.127 20.2514 146.065 18.9538 146.065 17.5338V0H142.36V8.09238C141.809 7.05263 141.074 6.22986 140.154 5.61977C139.234 5.00967 138.233 4.70462 137.153 4.70462C135.744 4.70462 134.492 5.06337 133.401 5.78303C132.308 6.50269 131.461 7.51236 130.859 8.80989C130.258 10.1096 129.957 11.5983 129.957 13.2761C129.957 14.9538 130.253 16.4726 130.846 17.7723C131.439 19.072 132.275 20.0752 133.357 20.7841C134.44 21.493 135.695 21.8475 137.124 21.8475C138.226 21.8475 139.238 21.5317 140.156 20.9023C141.076 20.2728 141.809 19.4286 142.362 18.3695V21.4264H146.252L146.25 21.4307ZM141.794 16.3953C141.416 17.1558 140.905 17.7594 140.261 18.2084C139.618 18.6574 138.909 18.8829 138.132 18.8829C137.293 18.8829 136.558 18.6531 135.926 18.1933C135.294 17.7336 134.797 17.0784 134.44 16.2299C134.082 15.3813 133.904 14.3974 133.904 13.2782C133.904 12.159 134.082 11.2052 134.44 10.3566C134.797 9.50806 135.294 8.84855 135.926 8.37809C136.558 7.90763 137.293 7.67347 138.132 7.67347C138.887 7.67347 139.587 7.8883 140.231 8.31794C140.874 8.74759 141.39 9.33191 141.778 10.0709C142.165 10.8099 142.36 11.6305 142.36 12.5285V13.9377C142.36 14.8163 142.171 15.637 141.794 16.3953Z" />
  </svg>
);

// Same check-in-a-lime-circle mark for every row (not a different icon per feature) — matches
// the design reference exactly.
function DemoCheckIcon(p) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
      <rect width="19.5401" height="19.5401" rx="9.77007" fill="#C6FF00" />
      <path fillRule="evenodd" clipRule="evenodd" d="M14.2078 7.34907C14.3386 7.47992 14.4121 7.65738 14.4121 7.84241C14.4121 8.02744 14.3386 8.20489 14.2078 8.33575L8.97763 13.5659C8.90852 13.6351 8.82646 13.6899 8.73614 13.7273C8.64582 13.7648 8.54902 13.784 8.45126 13.784C8.35351 13.784 8.2567 13.7648 8.16639 13.7273C8.07607 13.6899 7.99401 13.6351 7.92489 13.5659L5.32631 10.9678C5.25966 10.9035 5.2065 10.8265 5.16993 10.7413C5.13336 10.6562 5.11411 10.5646 5.11331 10.472C5.1125 10.3793 5.13016 10.2874 5.16524 10.2017C5.20033 10.1159 5.25214 10.038 5.31766 9.9725C5.38318 9.90698 5.46109 9.85517 5.54684 9.82008C5.6326 9.785 5.72449 9.76734 5.81714 9.76814C5.90979 9.76895 6.00136 9.7882 6.08649 9.82477C6.17162 9.86134 6.24862 9.9145 6.31299 9.98115L8.45103 12.1192L13.2207 7.34907C13.2855 7.28422 13.3624 7.23279 13.4471 7.19769C13.5318 7.1626 13.6226 7.14453 13.7143 7.14453C13.8059 7.14453 13.8967 7.1626 13.9814 7.19769C14.0661 7.23279 14.143 7.28422 14.2078 7.34907Z" fill="#1D1700" />
    </svg>
  );
}

// The exact brand accent graphic from the design reference — the viewBox (0 0 720 440) clips
// the blob paths to just the arrow/chevron portion that shows, same as the Figma export.
function DemoEntryAccent() {
  return (
    <svg className="demo-entry-accent" width="720" height="440" viewBox="0 0 720 440" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#demoAccentClip)">
        <path d="M851.682 0.00701398V460.452L737.104 490.816C714.592 496.777 686.908 504.107 664.268 501.486C653.83 500.28 644.273 495.884 637.384 488.705C637.546 487.789 638.416 487.302 639.518 486.919C659.084 480.088 686.676 467.921 688.647 444.516C689.598 433.173 688.091 422.758 685.168 411.624L641.605 245.156C638.346 232.688 631.898 216.555 620.694 209.852C612.332 204.853 602.763 203.067 593.009 203.287C583.105 203.519 573.64 203.368 563.886 203.693L541.409 204.459C535.309 204.667 529.405 205.201 523.676 204.702C527.839 200.422 532.653 197.024 537.907 193.197L634.855 122.39C651.939 109.922 668.989 98.7765 687.627 88.6978L851.682 0.00701398Z" fill="#FFCB00" />
        <path d="M239.363 596.035C234.596 625.123 221.258 631.978 194.385 639.052L38.1821 680.075C17.8971 685.41 0.198332 678.266 -18.5558 674.114C-17.6744 671.365 -15.4939 669.254 -13.615 666.795L-3.21152 652.982L18.071 624.601L28.8921 610.37C34.2388 603.296 42.9374 590.596 39.1216 581.758C35.7117 573.918 29.5416 568.768 23.2438 563.317L-12.142 532.709L-33.8421 514.036C-35.1875 512.923 -36.7185 511.995 -38.1914 511.056V454.631L60.2302 398.218C68.7548 393.057 76.6879 388.788 86.0939 385.982C93.0876 384.103 99.9653 384.045 106.785 384.926C106.727 385.808 106.611 386.863 105.788 387.675C94.6186 398.334 94.3286 414.548 97.2629 429.173L125.899 571.923C127.186 578.476 129.308 584.391 131.593 590.248C136.36 602.182 147.123 608.445 159.823 608.329C168.87 608.271 177.278 608.329 186.278 606.508L239.363 596.035Z" fill="#FFCB00" />
        <path d="M521.229 205.574C519.397 208.682 516.068 210.549 513.412 213.275C504.145 222.82 494.496 235.033 494.09 248.974C493.753 260.85 497.476 271.683 503.299 281.704L516.184 303.856L525.869 319.154L608.134 450.966C615.418 462.634 622.353 473.629 631.388 483.836C632.815 485.448 634.728 486.549 635.065 488.521L609.236 496.443L323.783 578.035L265.827 590.318C256.99 592.185 248.697 594.041 240.219 595.143L259.657 481.145C261.849 468.306 265.549 450.097 255.575 440.644C251.086 436.388 245.879 433.013 239.639 430.774L121.79 388.557C117.418 386.991 112.86 387.026 109.902 384.208C115.029 379.371 120.979 375.648 127.636 371.902L379.941 230.138C403.59 216.847 426.716 208.288 453.821 207.464L476.611 206.768L501.524 206.003C508.297 205.794 514.792 205.562 521.229 205.574Z" fill="#FFCB00" />
        <path d="M637.382 488.701C636.663 488.84 635.758 488.318 635.062 488.527C634.726 486.555 632.812 485.453 631.386 483.841C622.351 473.635 615.415 462.628 608.132 450.96L525.855 319.159L516.182 303.862L503.296 281.709C497.474 271.688 493.751 260.856 494.087 248.979C494.482 235.038 504.143 222.814 513.41 213.28C516.066 210.543 519.395 208.687 521.227 205.579C521.958 205.382 522.781 204.628 523.674 204.709C529.404 205.208 535.307 204.663 541.408 204.454L563.885 203.7C573.639 203.364 583.103 203.526 593.008 203.294C602.762 203.062 612.33 204.848 620.692 209.859C631.896 216.563 638.345 232.696 641.604 245.152L685.166 411.62C688.089 422.765 689.597 433.169 688.646 444.512C686.674 467.928 659.082 480.083 639.516 486.926C638.414 487.309 637.544 487.784 637.382 488.701Z" fill="#FF9000" />
        <path d="M240.213 595.142C240.097 595.826 240.074 595.872 239.378 596.012L186.259 606.531C177.259 608.317 168.85 608.271 159.815 608.352C147.127 608.468 136.376 602.17 131.62 590.247C129.289 584.402 127.213 578.498 125.891 571.899L97.2783 429.173C94.3324 414.513 94.6339 398.299 105.768 387.675C106.626 386.863 106.731 385.784 106.766 384.903C107.786 385.03 108.911 384.381 109.897 384.207C112.866 387.025 117.413 386.99 121.785 388.568L239.634 430.773C245.885 433.012 251.081 436.387 255.569 440.643C265.544 450.096 261.856 468.305 259.663 481.155L240.213 595.142Z" fill="#FF9000" />
      </g>
      <defs>
        <clipPath id="demoAccentClip"><rect width="772" height="863.469" rx="7.07485" fill="white" /></clipPath>
      </defs>
    </svg>
  );
}

const AppleStoreIcon = (p) => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M13.3571 10.454C13.3668 9.70056 13.5669 8.96183 13.9388 8.30654C14.3108 7.65124 14.8424 7.10067 15.4843 6.70605C15.0765 6.12368 14.5386 5.64442 13.9132 5.30632C13.2878 4.96822 12.5922 4.78061 11.8816 4.75838C10.3658 4.59927 8.89628 5.66541 8.12384 5.66541C7.33647 5.66541 6.1472 4.77417 4.86655 4.80052C4.03819 4.82728 3.2309 5.06816 2.52331 5.49969C1.81573 5.93122 1.232 6.53868 0.828983 7.26288C-0.916738 10.2854 0.385416 14.7275 2.0577 17.1707C2.89438 18.367 3.87222 19.7034 5.15172 19.656C6.40378 19.6041 6.8714 18.8576 8.38273 18.8576C9.88004 18.8576 10.3188 19.656 11.6242 19.6259C12.9677 19.6041 13.8142 18.4242 14.6216 17.2165C15.2227 16.3641 15.6853 15.4219 15.9922 14.425C15.2116 14.0949 14.5455 13.5423 14.0769 12.8361C13.6083 12.1299 13.358 11.3015 13.3571 10.454Z" fill="black" />
    <path d="M10.8915 3.15088C11.624 2.2715 11.9849 1.14119 11.8975 0C10.7784 0.117545 9.7446 0.65243 9.00217 1.49808C8.63916 1.9112 8.36114 2.39181 8.184 2.91245C8.00685 3.43308 7.93406 3.98352 7.96977 4.53231C8.52955 4.53807 9.08334 4.41674 9.58943 4.17745C10.0955 3.93817 10.5407 3.58717 10.8915 3.15088Z" fill="black" />
  </svg>
);

const GooglePlayIcon = (p) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <path d="M7.26782 8.29883L0.0703125 15.9356C0.0703125 15.9356 0.0703125 15.9356 0.0703125 15.9424C0.293334 16.7736 1.05026 17.3819 1.9491 17.3819C2.30728 17.3819 2.6452 17.2873 2.9358 17.1116L2.95607 17.098L11.0524 12.4281L7.26782 8.29883Z" fill="#EA4335" />
    <path d="M14.5463 7.00298L14.5395 6.99622L11.0455 4.96875L7.10547 8.47627L11.059 12.4298L14.5395 10.4226C15.1478 10.0915 15.56 9.44945 15.56 8.71281C15.56 7.9694 15.1478 7.33413 14.5463 7.00298Z" fill="#FBBC04" />
    <path d="M0.0675825 1.44727C0.0270332 1.60946 0 1.77166 0 1.94737V15.4435C0 15.6193 0.0202749 15.7815 0.0675825 15.9437L7.50839 8.50285L0.0675825 1.44727Z" fill="#4285F4" />
    <path d="M7.32189 8.69108L11.0457 4.96729L2.95607 0.277087C2.66547 0.101373 2.3208 0 1.9491 0C1.05026 0 0.293334 0.614999 0.0703125 1.4395L7.32189 8.69108Z" fill="#34A853" />
  </svg>
);

function DemoEntryContent({ onEnterBusiness }) {
  return (
    <>
      <span className="demo-entry-eyebrow">
        <span className="demo-entry-dot"><span className="demo-entry-dot-ring" /><span className="demo-entry-dot-core" /></span>
        Live Product Demo
      </span>
      <h1>Business payments, without the friction</h1>
      <p className="demo-entry-lede">Get a quick look at what your business gets with Onboard — no signup needed.</p>

      <div className="demo-entry-features">
        {DEMO_ENTRY_FEATURES.map((label) => (
          <div key={label} className="demo-entry-feature">
            <DemoCheckIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-lg btn-block btn-dark" onClick={onEnterBusiness}>Explore for my business</button>
      <div className="demo-entry-divider"><span>or</span></div>
      <div className="demo-entry-personal">
        <div className="demo-entry-personal-lbl">Not a business? Get the personal Onboard app</div>
        <div className="demo-entry-stores">
          <a href={withDemoUtm(CONSUMER_APP_LINKS.ios, { utm_campaign: "entry_personal" })} target="_blank" rel="noopener noreferrer" className="demo-entry-store"><AppleStoreIcon />App Store</a>
          <a href={withDemoUtm(CONSUMER_APP_LINKS.android, { utm_campaign: "entry_personal" })} target="_blank" rel="noopener noreferrer" className="demo-entry-store"><GooglePlayIcon />Google Play</a>
        </div>
      </div>
    </>
  );
}

// Desktop: photo is full-bleed across the whole viewport, card floats on top over it — matches
// the design reference exactly (not a two-column split). Mobile: no photo (keeps payload light,
// avoids fighting for vertical space), single centered column on the plain gray canvas.
function DemoEntryScreen({ onEnterBusiness }) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <div className="demo-entry demo-entry-hero">
        <div className="demo-entry-hero-photo" />
        <div className="demo-entry-hero-scrim" />
        <DemoEntryAccent />
        <div className="demo-entry-logo"><OnboardLogo aria-label="Onboard" role="img" /></div>
        <div className="demo-entry-card-shell">
          <div className="demo-entry-card">
            <DemoEntryContent onEnterBusiness={onEnterBusiness} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="demo-entry">
      <div className="demo-entry-logo"><OnboardLogo aria-label="Onboard" role="img" /></div>
      <div className="demo-entry-card-shell">
        <div className="demo-entry-card">
          <DemoEntryContent onEnterBusiness={onEnterBusiness} />
        </div>
      </div>
    </div>
  );
}

// Auth screens render outside the app Shell (no sidebar/topbar yet), so mock controls
// get a small floating gear instead of the one built into TopBar/TopBarMobile.
function AuthMockWrap({ mockControls, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="auth-mock-gear" onClick={() => setOpen(true)} aria-label="Mock controls"><Icon.cog style={{ width: 15, height: 15 }} /></button>
      {children}
      <Sheet open={open} onClose={() => setOpen(false)} title="Mock controls">{mockControls}</Sheet>
    </>
  );
}

function MockControls({
  dataState, onDataState, accountStatus, onAccountStatus,
  usdAccountStatus, onUsdAccountStatus, ngnIssuance, onNgnIssuance,
  stablecoinIssuance, onStablecoinIssuance, fiatConvert, onFiatConvert,
  payMode, onPayMode, paymentApproval, onPaymentApproval, paymentApprovalMethod, onPaymentApprovalMethod,
  complianceHold, onComplianceHold, route, nameLookupMock, onNameLookupMock,
  apiAccess, onApiAccess, cardsAccess, onCardsAccess,
  flow, onFlow, signinAccountStatus, onSigninAccountStatus, totpState, onTotpState,
  recoveryLink, onRecoveryLink, withdrawalHoldActive, onWithdrawalHoldTest,
}) {
  const inSignin = flow.startsWith("signin") || flow === "forgot-password";
  return (
    <>
      <div className="mock-group">
        <div className="mock-label">Flow</div>
        <div className="mock-row">
          <button className={flow === "signin" ? "on" : ""} onClick={() => onFlow("signin")}>Sign-in</button>
          <button className={flow === "app" ? "on" : ""} onClick={() => onFlow("app")}>App</button>
          <button className={flow === "apply-for-access" ? "on" : ""} onClick={() => onFlow("apply-for-access")}>Apply for access</button>
          <button className={flow === "signin-set-password" ? "on" : ""} onClick={() => onFlow("signin-set-password")} style={{ opacity: .55 }} title="Password reset landing page — reached via email link in real app">Set pw (ref)</button>
          <button
            className={(flow === "signin-totp-recovery-setup" || flow === "signin-totp-recovery-invalid") ? "on" : ""}
            onClick={() => onFlow(recoveryLink === "expired" ? "signin-totp-recovery-invalid" : "signin-totp-recovery-setup")}
            style={{ opacity: .55 }}
            title="TOTP-recovery link landing — reached via email link in real app; destination depends on the Recovery link toggle below">
            Recovery link (ref)
          </button>
        </div>
      </div>
      {inSignin && (
        <>
          <div className="mock-group">
            <div className="mock-label">Password result</div>
            <div className="mock-row">
              <button className={signinAccountStatus === "verified_active" ? "on" : ""} onClick={() => onSigninAccountStatus("verified_active")}>Correct</button>
              <button className={signinAccountStatus === "wrong_password" ? "on" : ""} onClick={() => onSigninAccountStatus("wrong_password")}>Wrong</button>
            </div>
          </div>
          <div className="mock-group">
            <div className="mock-label">After password</div>
            <div className="mock-row">
              <button className={totpState === "setup" ? "on" : ""} onClick={() => onTotpState("setup")}>Setup 2FA</button>
              <button className={totpState === "verify" ? "on" : ""} onClick={() => onTotpState("verify")}>Verify 2FA</button>
            </div>
          </div>
          <div className="mock-group">
            <div className="mock-label">Recovery link ("lost authenticator")</div>
            <div className="mock-row">
              <button className={recoveryLink === "valid" ? "on" : ""} onClick={() => onRecoveryLink("valid")}>Valid</button>
              <button className={recoveryLink === "expired" ? "on" : ""} onClick={() => onRecoveryLink("expired")}>Expired</button>
            </div>
          </div>
        </>
      )}
      <div className="mock-group">
        <div className="mock-label">Data state</div>
        <div className="mock-row">
          <button className={dataState === "full" ? "on" : ""} onClick={() => onDataState("full")}>Populated</button>
          <button className={dataState === "empty" ? "on" : ""} onClick={() => onDataState("empty")}>Empty</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Account status</div>
        <div className="mock-row">
          <button className={accountStatus === "active" ? "on" : ""} onClick={() => onAccountStatus("active")}>Active</button>
          <button className={accountStatus === "suspended" ? "on" : ""} onClick={() => onAccountStatus("suspended")}>Suspended</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Withdrawal hold (post-recovery)</div>
        <div className="mock-row">
          <button className={!withdrawalHoldActive ? "on" : ""} onClick={() => onWithdrawalHoldTest(false)}>Off</button>
          <button className={withdrawalHoldActive ? "on" : ""} onClick={() => onWithdrawalHoldTest(true)}>Active (24h banner)</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">USD account status</div>
        <div className="mock-row">
          <button className={usdAccountStatus === "not_applied" ? "on" : ""} onClick={() => onUsdAccountStatus("not_applied")}>Not applied</button>
          <button className={usdAccountStatus === "incomplete" ? "on" : ""} onClick={() => onUsdAccountStatus("incomplete")}>Incomplete</button>
          <button className={usdAccountStatus === "under_review" ? "on" : ""} onClick={() => onUsdAccountStatus("under_review")}>Under review</button>
          <button className={usdAccountStatus === "approved" ? "on" : ""} onClick={() => onUsdAccountStatus("approved")}>Approved</button>
          <button className={usdAccountStatus === "declined" ? "on" : ""} onClick={() => onUsdAccountStatus("declined")}>Declined</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">NGN account details</div>
        <div className="mock-row">
          <button className={ngnIssuance === "not_generated" ? "on" : ""} onClick={() => onNgnIssuance("not_generated")}>Not generated</button>
          <button className={ngnIssuance === "ready" ? "on" : ""} onClick={() => onNgnIssuance("ready")}>Ready</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Stablecoin addresses</div>
        <div className="mock-row">
          <button className={stablecoinIssuance === "not_generated" ? "on" : ""} onClick={() => onStablecoinIssuance("not_generated")}>Not generated</button>
          <button className={stablecoinIssuance === "ready" ? "on" : ""} onClick={() => onStablecoinIssuance("ready")}>Ready</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">EUR / GBP account</div>
        <div className="mock-row">
          <button className={fiatConvert === "not_generated" ? "on" : ""} onClick={() => onFiatConvert("not_generated")}>Not created</button>
          <button className={fiatConvert === "ready" ? "on" : ""} onClick={() => onFiatConvert("ready")}>Ready</button>
          <button className={fiatConvert === "error" ? "on" : ""} onClick={() => onFiatConvert("error")}>Alloc. error</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Send payment order</div>
        <div className="mock-row">
          <button className={payMode === "recipient" ? "on" : ""} onClick={() => onPayMode("recipient")}>Recipient first</button>
          <button className={payMode === "amount" ? "on" : ""} onClick={() => onPayMode("amount")}>Amount first</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">2FA on payments</div>
        <div className="mock-row">
          <button className={paymentApproval === "required" ? "on" : ""} onClick={() => onPaymentApproval("required")}>Required</button>
          <button className={paymentApproval === "off" ? "on" : ""} onClick={() => onPaymentApproval("off")}>Off</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">2FA method</div>
        <div className="mock-row">
          <button className={paymentApprovalMethod === "totp" ? "on" : ""} onClick={() => onPaymentApprovalMethod("totp")}>Authenticator</button>
          <button className={paymentApprovalMethod === "email" ? "on" : ""} onClick={() => onPaymentApprovalMethod("email")}>Email OTP</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Compliance hold</div>
        <div className="mock-row">
          <button className={!complianceHold ? "on" : ""} onClick={() => onComplianceHold(false)}>Off</button>
          <button className={complianceHold ? "on" : ""} onClick={() => onComplianceHold(true)}>Txn on hold</button>
        </div>
      </div>
      {route === "add-recipient" && (
        <div className="mock-group">
          <div className="mock-label">Name lookup</div>
          <div className="mock-row">
            <button className={nameLookupMock === "default" ? "on" : ""} onClick={() => onNameLookupMock("default")}>Default</button>
            <button className={nameLookupMock === "on" ? "on" : ""} onClick={() => onNameLookupMock("on")}>Force on</button>
            <button className={nameLookupMock === "off" ? "on" : ""} onClick={() => onNameLookupMock("off")}>Force off</button>
          </div>
        </div>
      )}
      <div className="mock-group">
        <div className="mock-label">API access</div>
        <div className="mock-row">
          <button className={apiAccess === "granted" ? "on" : ""} onClick={() => onApiAccess("granted")}>Granted</button>
          <button className={apiAccess === "pending" ? "on" : ""} onClick={() => onApiAccess("pending")}>Pending</button>
          <button className={apiAccess === "none" ? "on" : ""} onClick={() => onApiAccess("none")}>Not requested</button>
        </div>
      </div>
      <div className="mock-group">
        <div className="mock-label">Cards</div>
        <div className="mock-row">
          <button className={cardsAccess === "not_applied" ? "on" : ""} onClick={() => onCardsAccess("not_applied")}>Not applied</button>
          <button className={cardsAccess === "active" ? "on" : ""} onClick={() => onCardsAccess("active")}>Active</button>
        </div>
      </div>
    </>
  );
}

// Defensive fallback for any unrouted screen. No nav item currently reaches it.
function PlaceholderScreen({ title }) {
  return (
    <Page>
      <h1 className="title">{title}</h1>
      <div className="card">
        <div className="empty">
          <div className="ic"><Icon.inbox /></div>
          <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500, marginBottom: 4 }}>Not part of the prototype</div>
          <div style={{ fontSize: 12.5, maxWidth: 320, margin: "0 auto" }}>This screen hasn't been built in the adaptive prototype.</div>
        </div>
      </div>
    </Page>
  );
}

function App() {
  // Top-level flow: signin | signin-password | forgot-password | signin-totp-setup |
  // signin-totp-verify | signin-set-password | apply-for-access | app, plus the TOTP-recovery
  // sub-flow: signin-totp-recovery-{start,sent,invalid,setup,done}.
  // Sign-up is off-app via Tally, so it's not part of this state machine.
  const [flow, setFlow] = useState("app"); // start in app for review
  // Demo mode only: gates everything behind a Personal/Business choice first. Non-demo
  // builds skip it entirely (starts true) since it's not part of the real product flow.
  const [demoEntryDone, setDemoEntryDone] = useState(() => !isDemoMode());
  const [authEmail, setAuthEmail] = useState("finance@acmetrading.com");
  const [signinAccountStatus, setSigninAccountStatus] = useState("verified_active");
  const [totpState, setTotpState] = useState("verify"); // "setup" = first sign-in, "verify" = returning
  const [recoveryLink, setRecoveryLink] = useState("valid"); // "valid" | "expired" — drives the recovery-link landing
  const [withdrawalHold, setWithdrawalHold] = useState(null); // end-of-hold timestamp (ms), or null

  const [route, setRoute] = useState("dashboard");
  const [dataState, setDataState] = useState("full");
  const [accountStatus, setAccountStatus] = useState("active");
  const [usdAccountStatus, setUsdAccountStatus] = useState("approved");
  const [ngnIssuance, setNgnIssuance] = useState("ready");
  const [stablecoinIssuance, setStablecoinIssuance] = useState("ready");
  const [fiatConvert, setFiatConvert] = useState("ready");
  const [payMode, setPayMode] = useState("recipient");
  const [paymentApproval, setPaymentApproval] = useState("required");
  const [paymentApprovalMethod, setPaymentApprovalMethod] = useState("totp");
  const [complianceHold, setComplianceHold] = useState(false);
  const [nameLookupMock, setNameLookupMock] = useState("default");
  const [apiAccess, setApiAccess] = useState("granted");
  const [cardsAccess, setCardsAccess] = useState("active");
  const [openTx, setOpenTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [recipients, setRecipients] = useState(() => [...RECIPIENTS_FULL]);

  const mockControls = (
    <MockControls
      dataState={dataState} onDataState={setDataState}
      accountStatus={accountStatus} onAccountStatus={setAccountStatus}
      usdAccountStatus={usdAccountStatus} onUsdAccountStatus={setUsdAccountStatus}
      ngnIssuance={ngnIssuance} onNgnIssuance={setNgnIssuance}
      stablecoinIssuance={stablecoinIssuance} onStablecoinIssuance={setStablecoinIssuance}
      fiatConvert={fiatConvert} onFiatConvert={setFiatConvert}
      payMode={payMode} onPayMode={setPayMode}
      paymentApproval={paymentApproval} onPaymentApproval={setPaymentApproval}
      paymentApprovalMethod={paymentApprovalMethod} onPaymentApprovalMethod={setPaymentApprovalMethod}
      complianceHold={complianceHold} onComplianceHold={setComplianceHold}
      route={route} nameLookupMock={nameLookupMock} onNameLookupMock={setNameLookupMock}
      apiAccess={apiAccess} onApiAccess={setApiAccess}
      cardsAccess={cardsAccess} onCardsAccess={setCardsAccess}
      flow={flow} onFlow={setFlow}
      signinAccountStatus={signinAccountStatus} onSigninAccountStatus={setSigninAccountStatus}
      totpState={totpState} onTotpState={setTotpState}
      recoveryLink={recoveryLink} onRecoveryLink={setRecoveryLink}
      withdrawalHoldActive={!!(withdrawalHold && Date.now() < withdrawalHold)}
      onWithdrawalHoldTest={(on) => setWithdrawalHold(on ? Date.now() + 24 * 60 * 60 * 1000 : null)} />
  );

  // ---------- DEMO ENTRY GATE (demo mode only, ahead of everything else) ----------
  if (!demoEntryDone) {
    return <DemoEntryScreen onEnterBusiness={() => setDemoEntryDone(true)} />;
  }

  // ---------- AUTH FLOWS (pre-app — no Shell yet) ----------
  if (flow === "apply-for-access") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <ApplyForAccessScreen onSignIn={() => setFlow("signin")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SignInScreen
          onSubmit={({ email }) => { setAuthEmail(email); setFlow("signin-password"); }}
          onApplyForAccess={() => setFlow("apply-for-access")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SignInPasswordScreen
          email={authEmail}
          error={signinAccountStatus === "wrong_password" ? "Incorrect password." : null}
          onSubmit={() => {
            if (signinAccountStatus !== "wrong_password") {
              setFlow(totpState === "setup" ? "signin-totp-setup" : "signin-totp-verify");
            }
          }}
          onBack={() => setFlow("signin")}
          onForgotPassword={() => setFlow("forgot-password")}
          onApplyForAccess={() => setFlow("apply-for-access")} />
      </AuthMockWrap>
    );
  }
  if (flow === "forgot-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <ForgotPasswordScreen onBack={() => setFlow("signin-password")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-verify") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpVerifyScreen
          onSubmit={() => setFlow("app")}
          onBack={() => setFlow("signin")}
          onLostAccess={() => setFlow("signin-totp-recovery-start")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-setup") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpSetupScreen email={authEmail} onSubmit={() => setFlow("app")} />
      </AuthMockWrap>
    );
  }
  // ---------- TOTP RECOVERY (lost authenticator) ----------
  if (flow === "signin-totp-recovery-start") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpRecoveryStartScreen
          onContinue={() => setFlow("signin-totp-recovery-sent")}
          onBack={() => setFlow("signin-totp-verify")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-recovery-sent") {
    // Dead-ends here in the live UI, same as ForgotPasswordScreen's "check your email" state —
    // the link is only reachable via the "Recovery link (ref)" mock-controls entry below.
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpRecoverySentScreen onBack={() => setFlow("signin")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-recovery-invalid") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpRecoveryInvalidScreen onBackToSignIn={() => setFlow("signin")} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-recovery-setup") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpSetupScreen email={authEmail}
          onSubmit={() => { setWithdrawalHold(Date.now() + 24 * 60 * 60 * 1000); setFlow("signin-totp-recovery-done"); }} />
      </AuthMockWrap>
    );
  }
  if (flow === "signin-totp-recovery-done") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <TotpRecoveryDoneScreen holdUntilLabel={formatHoldUntil(withdrawalHold)} onContinue={() => setFlow("app")} />
      </AuthMockWrap>
    );
  }
  // Password reset — reached via email link in the real app; accessible here for design review
  if (flow === "signin-set-password") {
    return (
      <AuthMockWrap mockControls={mockControls}>
        <SetPasswordScreen onSubmit={() => setFlow("signin-totp-setup")} />
      </AuthMockWrap>
    );
  }

  // ---------- APP ----------
  let screen;
  if (route === "dashboard") {
    screen = (
      <Dashboard
        dataState={dataState}
        accountSuspended={accountStatus === "suspended"}
        onAddMoney={() => setRoute("add-money")}
        onSendPayment={() => setRoute("payments")}
        onOpenTx={() => {}}
        onViewAll={() => setRoute("activity")} />
    );
  } else if (route === "add-money") {
    screen = (
      <DepositPage
        onBack={() => setRoute("dashboard")}
        onToast={setToast}
        usdAccountStatus={usdAccountStatus}
        ngnIssuance={ngnIssuance}
        stablecoinIssuance={stablecoinIssuance}
        accountSuspended={accountStatus === "suspended"}
        fiatConvert={fiatConvert} />
    );
  } else if (route === "payments") {
    screen = (
      <SendPayment
        key={payMode}
        recipients={recipients}
        defaultMode={payMode}
        paymentApproval={paymentApproval}
        paymentApprovalMethod={paymentApprovalMethod}
        accountSuspended={accountStatus === "suspended"}
        dataState={dataState}
        onAddRecipient={() => setRoute("add-recipient")}
        onToast={setToast} />
    );
  } else if (route === "recipients") {
    screen = (
      <RecipientsScreen
        recipients={recipients}
        onDelete={(id) => setRecipients((prev) => prev.filter((r) => r.id !== id))}
        dataState={dataState}
        onAddNew={() => setRoute("add-recipient")}
        onPay={() => setRoute("payments")}
        onToast={setToast} />
    );
  } else if (route === "add-recipient") {
    screen = (
      <AddRecipientScreen
        nameLookupMock={nameLookupMock}
        onBack={() => setRoute("recipients")}
        onSaved={(newRecipient) => {
          setRecipients((prev) => [{ ...newRecipient, id: `r${Date.now()}`, last: "Never" }, ...prev]);
          setRoute("recipients");
        }}
        onToast={setToast} />
    );
  } else if (route === "activity" && openTx) {
    screen = <TransactionDetailScreen tx={openTx} onBack={() => setOpenTx(null)} onToast={setToast} />;
  } else if (route === "activity") {
    screen = (
      <TransactionsScreen
        dataState={dataState}
        complianceHold={complianceHold}
        onOpenTx={setOpenTx}
        onToast={setToast} />
    );
  } else if (route === "cards") {
    screen = <CardsScreen onToast={setToast} cardsAccess={cardsAccess} />;
  } else if (route === "settings") {
    screen = <SettingsScreen onToast={setToast} />;
  } else if (route === "developer") {
    screen = (
      <Page>
        <div className="page-head">
          <div><h1 className="title">Developer</h1><p className="subtitle">API keys, webhooks, and integration settings.</p></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DeveloperSection onToast={setToast} apiAccess={apiAccess} />
        </div>
      </Page>
    );
  } else {
    screen = <PlaceholderScreen title={route} />;
  }

  const navigate = (r) => { setRoute(r); setOpenTx(null); };

  const holdActive = withdrawalHold && Date.now() < withdrawalHold;
  const holdBanner = holdActive ? (
    <div className="wd-hold-banner">
      <Icon.clock />
      <span><strong>Withdrawals are paused until {formatHoldUntil(withdrawalHold)}</strong> - this is a 24-hour security hold after your authenticator reset. Everything else works as normal.</span>
    </div>
  ) : null;

  return (
    <>
      <Shell active={route} onNavigate={navigate} mockControls={mockControls} banner={holdBanner}>
        {screen}
      </Shell>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
