/* global React */
const Icon = window.OBIcon;
const { TXNS } = window.OBData;
const { CcyFlag, Page, Records } = window.OBPrimitives;

function Dashboard({ dataState = "full", accountSuspended = false, onAddMoney, onSendPayment, onOpenTx, onViewAll }) {
  const isEmpty = dataState === "empty";
  const balance = isEmpty ? "0.00" : "84,231.50";
  const recentTxns = isEmpty ? [] : TXNS.slice(0, 8);

  return (
    <Page>
      {accountSuspended && (
        <div className="card" style={{ marginBottom: 18, borderLeft: "3px solid var(--danger-600)", display: "flex", gap: 12 }}>
          <Icon.alert style={{ width: 18, height: 18, color: "var(--danger-600)", flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: "var(--gray-900)", marginBottom: 2 }}>Account suspended</div>
            <div style={{ color: "var(--gray-600)" }}>Deposits and withdrawals are not supported. Contact <strong>support@onboard.xyz</strong>.</div>
          </div>
        </div>
      )}

      <div className="home-hero">
        <div className="home-hero-top">
          <div className="home-acct-label"><CcyFlag code="USD" size={22} /><span>Global USD Account</span></div>
          <div className="home-status"><span className="dot" />Active</div>
        </div>
        <div className="home-balance">
          <span className="home-balance-num">${balance}</span>
          <span className="home-balance-ccy">USD</span>
        </div>
        <div className="home-actions">
          <button className="btn btn-lg" onClick={onAddMoney}><Icon.plus /> Deposit</button>
          <button className="btn btn-soft btn-lg" onClick={onSendPayment} disabled={accountSuspended}><Icon.paperplane /> Send money</button>
        </div>
        <div className="home-divider" />
        <div className="home-rails-note">Fund with USD, NGN, or stablecoins — all deposits are held as USD</div>
      </div>

      <Records
        title="Recent activity"
        txns={recentTxns}
        onRowClick={onOpenTx}
        onViewAll={onViewAll}
        emptyHint="Money movements will appear here once your first payment lands or settles." />
    </Page>
  );
}

window.OBDashboard = { Dashboard };
