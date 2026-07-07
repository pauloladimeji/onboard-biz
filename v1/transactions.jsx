/* global React */
const { useState: useStateT, useMemo: useMemoT, useRef: useRefT, useEffect: useEffectT } = React;
const TIcon = window.OBIcon;
const TNetworkIcon = window.OBNetworkIcon;
const { CURRENCIES: TCCY, TXNS_FULL } = window.OBData;
const { Page, Pill, Flag: TFlag, FilterBar, useIsDesktop, shortRef } = window.OBPrimitives;

const PAGE_SIZE_TX = 12;

function TxStat({ label, value, tone }) {
  return (
    <div className={`tx-stat ${tone || ""}`}>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

// Real <table> with a header row — matches the homepage/Records desktop pattern exactly,
// and lets the browser size the reference column instead of forcing it into a fixed grid track.
function TxTable({ list, onOpen }) {
  return (
    <table className="records-table">
      <thead><tr>
        <th>Counterparty</th>
        <th>Reference</th>
        <th>Date</th>
        <th>Status</th>
        <th className="num">Amount</th>
      </tr></thead>
      <tbody>
        {list.map(tx => {
          const isIn = tx.direction === "in";
          return (
            <tr key={tx.id} onClick={() => onOpen(tx)}>
              <td>
                <div style={{ fontWeight: 500, color: "var(--gray-900)" }}>{tx.party}</div>
                <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{tx.type}{tx.from ? ` · From ${tx.from}` : ""}</div>
              </td>
              <td title={tx.ref}>{shortRef(tx.ref)}</td>
              <td style={{ color: "var(--gray-600)", fontSize: 12.5 }}>{tx.date}</td>
              <td><Pill tone={tx.pillTone}>{tx.status}</Pill></td>
              <td className="num">
                <span className={isIn ? "dir-in" : "dir-out"} style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {isIn ? "+" : "−"}{tx.amount} <span style={{ color: "var(--gray-600)", fontWeight: 500, fontSize: 12 }}>{tx.ccy}</span>
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Mirrors the homepage's Records mobile row exactly (same classes) for visual consistency.
function TxRowMobile({ tx, onOpen }) {
  const isIn = tx.direction === "in";
  return (
    <div className="records-row" onClick={() => onOpen(tx)}>
      <div className={`ic ${isIn ? "in" : "out"}`}>
        {isIn ? <TIcon.arrowDownLeft /> : <TIcon.arrowUpRight />}
        {tx.pillTone === "warn" && <span className="ic-dot" />}
        {tx.pillTone === "danger" && <span className="ic-badge" aria-label="Failed" />}
      </div>
      <div className="mid">
        <div className="party">{tx.party}</div>
        <div className="sub">{tx.date} · {tx.status}</div>
      </div>
      <div className="amt">
        <div className={`n ${isIn ? "in" : "out"}`}>{isIn ? "+" : "−"}{tx.amount}</div>
        <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{tx.ccy}</div>
      </div>
    </div>
  );
}

function TxListSkeleton() {
  return (
    <div className="records-card">
      {[62, 48, 55, 44, 58, 42, 50, 46].map((w, i) => (
        <div key={i} className="skel-row">
          <div className="skel" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="skel" style={{ width: `${w}%`, height: 13 }} />
            <div className="skel" style={{ width: `${w - 18}%`, height: 11 }} />
          </div>
          <div className="skel" style={{ width: 56, height: 20, borderRadius: 99 }} />
          <div className="skel" style={{ width: 80, height: 14 }} />
        </div>
      ))}
    </div>
  );
}

function TransactionsScreen({ onOpenTx, onToast, dataState = "full", complianceHold = false }) {
  const isDesktop = useIsDesktop();
  const HOLD_TXN = { id: "PAY-2026-04901", date: "May 7, 11:24", direction: "out", type: "Payout", party: "Riverline Imports Ltd", ref: "PAY-2026-04901", amount: "84,500.00", ccy: "GBP", from: "USD", status: "ON HOLD", pillTone: "warn", hold: true };
  const baseList = complianceHold ? [HOLD_TXN, ...TXNS_FULL] : TXNS_FULL;
  const [q, setQ] = useStateT("");
  const [direction, setDir] = useStateT("all");
  const [statusF, setStatusF] = useStateT("all");
  const [ccyF, setCcyF] = useStateT("all");
  const [visible, setVisible] = useStateT(PAGE_SIZE_TX);
  const sentinelRef = useRefT(null);

  const filtered = useMemoT(() => {
    if (dataState === "empty") return [];
    let res = baseList;
    if (direction !== "all") res = res.filter(t => t.direction === direction);
    if (statusF !== "all") res = res.filter(t => t.status.toLowerCase() === statusF);
    if (ccyF !== "all") res = res.filter(t => t.ccy === ccyF || t.from === ccyF);
    const t = q.trim().toLowerCase();
    if (t) res = res.filter(x => x.party.toLowerCase().includes(t) || x.ref.toLowerCase().includes(t) || x.amount.toLowerCase().includes(t));
    return res;
  }, [q, direction, statusF, ccyF, dataState, complianceHold]);

  useEffectT(() => { setVisible(PAGE_SIZE_TX); }, [q, direction, statusF, ccyF]);
  useEffectT(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) setVisible(v => Math.min(v + PAGE_SIZE_TX, filtered.length));
    }, { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const [loading, setLoading] = useStateT(true);
  useEffectT(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const stats = useMemoT(() => {
    if (dataState === "empty") return { total: 0, out: 0, inn: 0, pend: 0, fail: 0 };
    const all = baseList.filter(t => t.direction !== "fx");
    return {
      out: all.filter(t => t.direction === "out").length,
      inn: all.filter(t => t.direction === "in").length,
      fail: all.filter(t => t.status === "FAILED").length,
      pend: all.filter(t => t.status === "PROCESSING").length,
      total: all.length,
    };
  }, []);

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Transactions</h1>
          <p className="subtitle">Every payout and deposit across your accounts.</p>
        </div>
        <button className="btn btn-soft" onClick={() => onToast && onToast("Export CSV — phase 2")}><TIcon.doc /> Export CSV</button>
      </div>

      <div className="tx-stats">
        <TxStat label="All transactions" value={stats.total} />
        <TxStat label="Money out" value={stats.out} />
        <TxStat label="Money in" value={stats.inn} />
        <TxStat label="Processing" value={stats.pend} tone="warn" />
        <TxStat label="Failed" value={stats.fail} tone="danger" />
      </div>

      <FilterBar
        searchValue={q} onSearchChange={setQ} searchPlaceholder="Search by recipient, reference, or amount…"
        filters={[
          { key: "direction", label: "Direction", value: direction, onChange: setDir, options: [{ v: "all", t: "All directions" }, { v: "out", t: "Money out" }, { v: "in", t: "Money in" }] },
          { key: "status", label: "Status", value: statusF, onChange: setStatusF, options: [{ v: "all", t: "All statuses" }, { v: "completed", t: "Completed" }, { v: "processing", t: "Processing" }, { v: "failed", t: "Failed" }] },
          { key: "currency", label: "Currency", value: ccyF, onChange: setCcyF, options: [{ v: "all", t: "All currencies" }, { v: "USD", t: "USD" }, { v: "GBP", t: "GBP" }, { v: "EUR", t: "EUR" }, { v: "NGN", t: "NGN" }, { v: "GHS", t: "GHS" }, { v: "KES", t: "KES" }, { v: "TZS", t: "TZS" }, { v: "MZN", t: "MZN" }] },
        ]}
        activeCount={[direction !== "all", statusF !== "all", ccyF !== "all"].filter(Boolean).length}
        onClear={() => { setDir("all"); setStatusF("all"); setCcyF("all"); setQ(""); }} />

      {loading ? <TxListSkeleton /> : (
        <div className="records-card">
          <div className="records-head">
            <h2>Activity</h2>
            <span className="meta">{`Showing ${list.length} of ${filtered.length}`}</span>
          </div>

          {filtered.length === 0 ? (
            dataState === "empty" ? (
              <div className="empty" style={{ padding: "56px 16px" }}>
                <div className="ic"><TIcon.list /></div>
                <div style={{ fontSize: 15, color: "var(--gray-900)", fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 13, maxWidth: 360, margin: "0 auto", lineHeight: 1.55 }}>Money in and out of your accounts will appear here. Send your first payment or share an account number to get started.</div>
              </div>
            ) : (
              <div className="empty" style={{ padding: "48px 16px" }}>
                <div className="ic"><TIcon.search /></div>
                <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500 }}>No transactions match these filters</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Try clearing a filter or searching for something else.</div>
              </div>
            )
          ) : (
            <>
              {isDesktop ? (
                <TxTable list={list} onOpen={onOpenTx} />
              ) : (
                <div className="records-list">
                  {list.map(tx => <TxRowMobile key={tx.id} tx={tx} onOpen={onOpenTx} />)}
                </div>
              )}
              {visible < filtered.length && <div ref={sentinelRef} className="tx-loader"><span className="spin" style={{ width: 14, height: 14 }} /> Loading more transactions…</div>}
              {visible >= filtered.length && filtered.length > PAGE_SIZE_TX && <div className="tx-end">All {filtered.length} transactions shown</div>}
            </>
          )}
        </div>
      )}
    </Page>
  );
}

function TransactionDetailScreen({ tx, onBack, onToast }) {
  const isDesktop = useIsDesktop();
  const heroPad = isDesktop ? "26px 30px" : "18px 16px";
  const cardPad = isDesktop ? "24px 28px" : "16px";
  const isOut = tx.direction === "out";
  const isIn = tx.direction === "in";
  const dstMeta = TCCY[tx.ccy];
  const srcMeta = TCCY[tx.from || tx.ccy];

  const copy = (v, label) => {
    if (navigator.clipboard) navigator.clipboard.writeText(v).catch(() => {});
    onToast && onToast(`Copied ${label}`);
  };

  const settledLabel = tx.status === "COMPLETED" ? "Settled" : tx.status === "PROCESSING" ? "Settling" : "Failed";
  const settledTone = tx.status === "COMPLETED" ? "done" : tx.status === "PROCESSING" ? "active" : "fail";

  const [loading, setLoading] = useStateT(true);
  useEffectT(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, [tx.id]);

  const txHashShort = tx.txHash ? (tx.txHash.length > 16 ? `${tx.txHash.slice(0, 8)}…${tx.txHash.slice(-6)}` : tx.txHash) : null;
  const explorerUrl = tx.chain && tx.txHash ? ({
    eth: `https://etherscan.io/tx/${tx.txHash}`, base: `https://basescan.org/tx/${tx.txHash}`, tron: `https://tronscan.org/#/transaction/${tx.txHash}`,
    polygon: `https://polygonscan.com/tx/${tx.txHash}`, solana: `https://solscan.io/tx/${tx.txHash}`,
  })[tx.chain] : null;

  if (loading) return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><TIcon.arrowLeft /> Back to Transactions</a>
        <span className="crumb-sep">/</span><span className="crumb-current">Transaction details</span>
      </div>
      <div className="page-head" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skel" style={{ width: 140, height: 26 }} />
          <div className="skel" style={{ width: 220, height: 14 }} />
        </div>
      </div>
      <div className="card" style={{ padding: heroPad, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div className="skel" style={{ width: 80, height: 12 }} /><div className="skel" style={{ width: "60%", height: 32 }} /><div className="skel" style={{ width: "40%", height: 12 }} />
          </div>
          <div className="skel" style={{ width: 28, height: 28, borderRadius: 99 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, alignItems: "flex-end" }}>
            <div className="skel" style={{ width: 80, height: 12 }} /><div className="skel" style={{ width: "60%", height: 32 }} /><div className="skel" style={{ width: "40%", height: 12 }} />
          </div>
        </div>
      </div>
      <div className="td-grid">
        {[5, 4].map((rows, ci) => (
          <div key={ci} className="card" style={{ padding: cardPad }}>
            <div className="skel" style={{ width: 110, height: 16, marginBottom: 20 }} />
            {[...Array(rows)].map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--gray-100)" }}>
                <div className="skel" style={{ width: 80, height: 13 }} /><div className="skel" style={{ width: 120, height: 13 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Page>
  );

  return (
    <Page>
      <div className="crumbs">
        <a className="crumb-back" onClick={onBack}><TIcon.arrowLeft /> Back to Transactions</a>
        <span className="crumb-sep">/</span><span className="crumb-current">Transaction details</span>
      </div>

      <div className="page-head" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="title" style={{ marginBottom: 6 }}>
            {isOut ? "Payout" : "Funding"}
            <span style={{ marginLeft: 12 }}><Pill tone={tx.pillTone}>{tx.status}</Pill></span>
          </h1>
          <p className="subtitle">{tx.date.replace(/,/, ", 2026,")}</p>
        </div>
        <div className="row" style={{ display: "flex", gap: 8 }}>
          {tx.status === "FAILED" && <button className="btn btn-soft" onClick={() => onToast && onToast("Retry — phase 2")}><TIcon.refresh /> Retry payment</button>}
          <button className="btn btn-soft" onClick={() => onToast && onToast("Receipt download — phase 2")}><TIcon.doc /> Download receipt</button>
        </div>
      </div>

      <div className="card" style={{ padding: heroPad, marginBottom: 22 }}>
        <div className="td-flow">
          <div className="leg">
            <div className="lbl-row">
              {!tx.chain && <TFlag cc={srcMeta?.flag || "us"} size={20} />}
              <div className="lbl">{isOut ? "You paid" : tx.chain ? "Deposited" : "Received from"}</div>
            </div>
            <div className="big">{tx.chain ? `${tx.amount} ${tx.party.split("·")[0].trim()}` : isIn && tx.fromAmount ? `${tx.from} ${tx.fromAmount}` : `${tx.from || tx.ccy} ${tx.amount}`}</div>
            <div className="sub">
              {isOut && tx.from && <>From your <strong>{tx.from}</strong> balance</>}
              {isIn && !tx.chain && <>{tx.party.includes(" — ") ? tx.party.split(" — ")[1] : tx.party}</>}
              {isIn && tx.chain && <>{tx.party}</>}
            </div>
          </div>

          <div className="td-arrow"><TIcon.arrowRight /></div>

          <div className="leg right">
            <div className="lbl-row">
              <div className="lbl">{isOut ? `${tx.party} received` : "Into"}</div>
              <TFlag cc={dstMeta?.flag || "us"} size={20} />
            </div>
            <div className="big">{`${tx.ccy} ${tx.amount}`}</div>
            <div className="sub">
              {isOut && <>{tx.party}</>}
              {isIn && <>Your <strong>{tx.ccy}</strong> balance</>}
            </div>
          </div>
        </div>

        {isOut && (
          <div className="td-stamps">
            <div className="td-stamp done">
              <TIcon.check />
              <div className="td-stamp-meta"><span className="t">Initiated</span><span className="s">{tx.date}</span></div>
            </div>
            <div className="td-stamp-bar" />
            <div className={`td-stamp ${settledTone}`}>
              {settledTone === "done" && <TIcon.check />}
              {settledTone === "active" && <span className="pulse" />}
              {settledTone === "fail" && <TIcon.alert />}
              <div className="td-stamp-meta">
                <span className="t">{settledLabel}</span>
                <span className="s">{tx.status === "COMPLETED" ? tx.date : tx.status === "PROCESSING" ? "In progress" : tx.date}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="td-grid">
        <div className="td-col">
          <div className="card" style={{ padding: cardPad }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)" }}>Payment details</h2>
            <div className="pay-review-list" style={{ paddingTop: 0, paddingBottom: 0 }}>
              <div className="row-item"><div className="k">Reference</div><div className="v"><span title={tx.ref}>{shortRef(tx.ref)}</span><button className="copy-inline" onClick={() => copy(tx.ref, "reference")}><TIcon.copy /></button></div></div>
              <div className="row-item"><div className="k">Type</div><div className="v">{tx.type}{tx.chain ? " · Stablecoin" : !isOut && tx.party && tx.party.includes(" — ") ? ` · ${tx.party.split(" — ")[0]}` : ""}</div></div>
              <div className="row-item"><div className="k">Counterparty</div><div className="v" style={tx.chain ? { wordBreak: "break-all" } : {}}>{tx.chain ? tx.txHash : !isOut && tx.party && tx.party.includes(" — ") ? tx.party.split(" — ")[1] : tx.party}</div></div>
              {tx.chain && (
                <div className="row-item"><div className="k">Network</div><div className="v" style={{ display: "flex", alignItems: "center", gap: 6 }}>{TNetworkIcon[tx.chain] && React.createElement(TNetworkIcon[tx.chain], { style: { width: 16, height: 16, flexShrink: 0 } })}{({ eth: "Ethereum (ERC-20)", base: "Base", polygon: "Polygon", solana: "Solana (SPL)", tron: "Tron (TRC-20)" })[tx.chain] || tx.chain}</div></div>
              )}
              {tx.chain && <div className="row-item"><div className="k">Conversion rate</div><div className="v">1 {tx.party.split("·")[0].trim()} = 1 USD</div></div>}
              {tx.txHash && (
                <div className="row-item"><div className="k">Tx hash</div><div className="v">
                  {explorerUrl ? <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--info-700)", textDecoration: "none", fontVariantNumeric: "tabular-nums" }}>{txHashShort}</a> : <span style={{ fontVariantNumeric: "tabular-nums" }}>{txHashShort}</span>}
                  <button className="copy-inline" onClick={() => copy(tx.txHash, "tx hash")}><TIcon.copy /></button>
                </div></div>
              )}
              {tx.from && tx.from !== tx.ccy && !tx.chain && <div className="row-item"><div className="k">FX rate</div><div className="v">{tx.rate || `${tx.from} → ${tx.ccy}`}</div></div>}
              {tx.convFee && <div className="row-item"><div className="k">Conversion fee</div><div className="v">{tx.convFee}</div></div>}
              <div className="row-item"><div className="k">Initiated</div><div className="v">{tx.date.replace(/,/, ", 2026,")}</div></div>
              {isOut && <div className="row-item"><div className="k">Memo</div><div className="v">{`Invoice #${tx.ref.slice(-5)} · ${tx.party}`}</div></div>}
            </div>

            {tx.status === "PROCESSING" && (
              <div className="td-banner info" style={{ marginTop: 20 }}>
                <TIcon.clock />
                <div><div className="t">Settling now</div><div className="s">Most {tx.ccy} payments arrive within 0–10 minutes. We'll email when this one lands.</div></div>
              </div>
            )}
            {tx.status === "FAILED" && (
              <div className="td-banner danger" style={{ marginTop: 20 }}>
                <TIcon.alert />
                <div><div className="t">Payment was rejected by the receiving bank</div><div className="s">Reason: <strong>account name mismatch</strong>. Funds were returned to your {tx.from} balance — no charge applied. You can edit the recipient and retry.</div></div>
              </div>
            )}
          </div>
        </div>

        <div className="td-col">
          <div className="card" style={{ padding: cardPad, marginBottom: 22 }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)" }}>Money breakdown</h2>
            {(() => {
              const FX = { USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1485.5, GHS: 14.2, KES: 129.4, TZS: 2640.0, MZN: 63.8 };
              const FEE = { USD: 4.50, GBP: 3.60, EUR: 4.10 };
              const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const parseAmt = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

              const dstAmt = parseAmt(tx.amount);
              const srcCcy = tx.from || tx.ccy;
              const dstCcy = tx.ccy;
              const isCrossCcy = !!tx.from && tx.from !== tx.ccy;
              const fee = isOut ? (FEE[srcCcy] ?? 0) : 0;
              const rate = isCrossCcy ? (FX[dstCcy] / FX[srcCcy]) : 1;
              const totalDebited = isCrossCcy ? (dstAmt / rate) : dstAmt;
              const amountSent = isOut ? Math.max(0, totalDebited - fee) : dstAmt;

              if (isIn) {
                return (
                  <div className="td-money">
                    <div className="row"><div className="k">Amount received</div><div className="v">{`${dstCcy} ${fmt(dstAmt)}`}</div></div>
                    <div className="row"><div className="k">Onboard fee</div><div className="v">{`${dstCcy} 0.00`}</div></div>
                    <div className="row total"><div className="k">Total credited</div><div className="v">{`${dstCcy} ${fmt(dstAmt)}`}</div></div>
                  </div>
                );
              }

              return (
                <div className="td-breakdown">
                  <div className="bd-row"><div className="bd-k">Amount sent</div><div className="bd-v">{`${srcCcy} ${fmt(amountSent)}`}</div></div>
                  <div className="bd-op"><span className="op">−</span><span className="op-lbl">Onboard fee</span><span className="bd-v op-v">{`${srcCcy} ${fmt(fee)}`}</span></div>
                  <div className="bd-eq"><div className="bd-k">Total debited</div><div className="bd-v strong">{`${srcCcy} ${fmt(totalDebited)}`}</div></div>
                  {isCrossCcy ? (
                    <>
                      <div className="bd-op"><span className="op">×</span><span className="op-lbl">FX rate</span><span className="bd-v op-v">{`1 ${srcCcy} = ${rate.toFixed(rate < 5 ? 4 : 2)} ${dstCcy}`}</span></div>
                      <div className="bd-eq final"><div className="bd-k">Recipient gets</div><div className="bd-v strong">{`${dstCcy} ${fmt(dstAmt)}`}</div></div>
                    </>
                  ) : (
                    <div className="bd-eq final"><div className="bd-k">Recipient gets</div><div className="bd-v strong">{`${dstCcy} ${fmt(dstAmt)}`}</div></div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="card" style={{ padding: cardPad }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "var(--gray-900)" }}>Actions</h2>
            <div className="td-actions">
              {isOut && (
                <button className="td-action" onClick={() => onToast && onToast(`Send another payment to ${tx.party}`)}>
                  <span className="ic"><TIcon.paperplane /></span><span className="t">Send again to {tx.party}</span><TIcon.arrowRight />
                </button>
              )}
              <button className="td-action" onClick={() => onToast && onToast("Receipt download — phase 2")}>
                <span className="ic"><TIcon.doc /></span><span className="t">Download PDF receipt</span><TIcon.arrowRight />
              </button>
              <button className="td-action" onClick={() => onToast && onToast("Receipt emailed")}>
                <span className="ic"><TIcon.email /></span><span className="t">Email receipt to recipient</span><TIcon.arrowRight />
              </button>
              <button className="td-action" onClick={() => onToast && onToast("Support — phase 2")}>
                <span className="ic"><TIcon.shield /></span><span className="t">Report a problem</span><TIcon.arrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

window.OBTransactions = { TransactionsScreen, TransactionDetailScreen };
