/* global React */
const { useState: useStateC, useMemo: useMemoC, useRef: useRefC, useEffect: useEffectC } = React;
const CIcon = window.OBIcon;
const CNetworkIcon = window.OBNetworkIcon;
const { RECIPIENTS_FULL } = window.OBData;
const { Page, Sheet, Flag: CFlag, FilterBar, useIsDesktop } = window.OBPrimitives;

const PAGE_SIZE_RC = 10;

function CoinBadge({ coin, size = 22 }) {
  const colors = { USDC: "#2775CA", USDT: "#26A17B" };
  const labels = { USDC: "Ⓒ", USDT: "Ⓣ" };
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[coin] || "#888", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.7, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>
      {labels[coin] || "?"}
    </div>
  );
}

function NetworkBadge({ network, size = 14 }) {
  const NetIc = CNetworkIcon[network];
  if (!NetIc) return null;
  return (
    <div className="ccy-flag" style={{ width: size, height: size, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <NetIc style={{ width: size * 0.8, height: size * 0.8 }} />
    </div>
  );
}

function RecipientRow({ r, onPay, onMore }) {
  const isCrypto = r.country === "crypto";
  return (
    <div className="rc-row" onClick={() => onPay(r)}>
      <div className="ava">
        <span>{r.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
        {isCrypto ? <NetworkBadge network={r.network} size={14} /> : <CFlag cc={r.country} size={14} />}
      </div>
      <div className="meta">
        <div className="t">{r.name}</div>
        <div className="s">{`${r.handle} · ${r.type}`}</div>
      </div>
      <div className="ccy-cell">
        {isCrypto ? <NetworkBadge network={r.network} size={18} /> : <CFlag cc={r.country} size={18} />}
        <span>{isCrypto ? r.networkLabel : r.ccy}</span>
      </div>
      <div className="last-cell">{`Last paid ${r.last}`}</div>
      <div className="actions">
        <button className="rc-pay" onClick={(e) => { e.stopPropagation(); onPay(r); }}><CIcon.paperplane /> Pay</button>
        <button className="rc-iconbtn" title="More options" onClick={(e) => { e.stopPropagation(); onMore(r); }}><span className="dots">···</span></button>
      </div>
    </div>
  );
}

function RecipientRowMobile({ r, onPay, onMore }) {
  const isCrypto = r.country === "crypto";
  return (
    <div className="rc-row-mobile" onClick={() => onPay(r)}>
      <div className="ava">
        <span>{r.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</span>
        {isCrypto ? <NetworkBadge network={r.network} size={14} /> : <CFlag cc={r.country} size={14} />}
      </div>
      <div className="meta">
        <div className="t">{r.name}</div>
        <div className="s">{isCrypto ? r.networkLabel : r.ccy} · Last paid {r.last}</div>
      </div>
      <button className="rc-iconbtn" title="More options" onClick={(e) => { e.stopPropagation(); onMore(r); }}><span className="dots">···</span></button>
    </div>
  );
}

function DeleteRecipientSheet({ recipient, onConfirm, onClose }) {
  const [confirming, setConfirming] = useStateC(false);
  const handleConfirm = () => { setConfirming(true); setTimeout(onConfirm, 900); };
  return (
    <Sheet open={!!recipient} onClose={onClose} title="Remove recipient?">
      {recipient && (
        <>
          <div className="rc-delete-icon"><CIcon.trash /></div>
          <p style={{ fontSize: 13.5, color: "var(--gray-600)", lineHeight: 1.55, margin: "0 0 20px" }}>
            <strong style={{ color: "var(--gray-900)" }}>{recipient.name}</strong> will be removed from your saved recipients. You can add them again at any time.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={confirming}>Cancel</button>
            <button className="btn" style={{ background: "#DC2626", color: "#fff", minWidth: 90 }} disabled={confirming} onClick={handleConfirm}>
              {confirming ? <><span className="spin" style={{ width: 13, height: 13, borderWidth: 2 }} /> Removing…</> : "Remove"}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function RecipientsScreen({ onAddNew, onPay, onToast, dataState = "full" }) {
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useStateC("fiat");
  const [q, setQ] = useStateC("");
  const [ccyF, setCcyF] = useStateC("all");
  const [visible, setVisible] = useStateC(PAGE_SIZE_RC);
  const sentinelRef = useRefC(null);

  const fiatCount = RECIPIENTS_FULL.filter(r => r.country !== "crypto").length;
  const cryptoCount = RECIPIENTS_FULL.filter(r => r.country === "crypto").length;

  const filtered = useMemoC(() => {
    if (dataState === "empty") return [];
    let res = RECIPIENTS_FULL.filter(r => tab === "fiat" ? r.country !== "crypto" : r.country === "crypto");
    if (tab === "fiat" && ccyF !== "all") res = res.filter(r => r.ccy === ccyF);
    const t = q.trim().toLowerCase();
    if (t) res = res.filter(r => r.name.toLowerCase().includes(t) || r.handle.toLowerCase().includes(t) || (r.ccy || "").toLowerCase().includes(t) || (r.networkLabel || "").toLowerCase().includes(t));
    return res;
  }, [q, ccyF, tab, dataState]);

  useEffectC(() => { setVisible(PAGE_SIZE_RC); }, [q, ccyF, tab]);
  useEffectC(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visible < filtered.length) setVisible(v => Math.min(v + PAGE_SIZE_RC, filtered.length));
    }, { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const list = filtered.slice(0, visible);
  const [loadingRc, setLoadingRc] = useStateC(true);
  useEffectC(() => { const t = setTimeout(() => setLoadingRc(false), 700); return () => clearTimeout(t); }, []);

  const [deleteTarget, setDeleteTarget] = useStateC(null);

  return (
    <Page>
      <div className="page-head">
        <div>
          <h1 className="title">Recipients</h1>
          <p className="subtitle">{dataState === "empty" ? "Save people and businesses you pay regularly so it's one tap next time." : tab === "fiat" ? `${fiatCount} recipients` : `${cryptoCount} crypto wallets`}</p>
        </div>
        <button className="btn" onClick={onAddNew}><CIcon.plus /> Add recipient</button>
      </div>

      <div className="pay-tabs" style={{ marginBottom: 16 }}>
        {[["fiat", "Bank or mobile money", fiatCount], ["crypto", "Crypto wallet", cryptoCount]].map(([id, label, count]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => { setTab(id); setQ(""); setCcyF("all"); }}>
            {label}<span className="n">{count}</span>
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={q} onSearchChange={setQ} searchPlaceholder={tab === "fiat" ? "Search by name or bank…" : "Search by name or network…"}
        filters={tab === "fiat" ? [
          { key: "currency", label: "Currency", value: ccyF, onChange: setCcyF, options: [{ v: "all", t: "All currencies" }, { v: "NGN", t: "NGN" }, { v: "GHS", t: "GHS" }, { v: "KES", t: "KES" }, { v: "TZS", t: "TZS" }, { v: "MZN", t: "MZN" }] },
        ] : []}
        activeCount={ccyF !== "all" ? 1 : 0}
        onClear={() => { setCcyF("all"); setQ(""); }} />

      {loadingRc ? (
        <div className="records-card">
          {[58, 44, 62, 40, 52].map((w, i) => (
            <div key={i} className="skel-row">
              <div className="skel" style={{ width: 40, height: 40, borderRadius: 99, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skel" style={{ width: `${w}%`, height: 13 }} />
                <div className="skel" style={{ width: `${w - 15}%`, height: 11 }} />
              </div>
              <div className="skel" style={{ width: 36, height: 14 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="records-card">
          <div className="records-head">
            <h2>{tab === "fiat" ? "Recipients" : "Crypto wallets"}</h2>
            <span className="meta">{`${list.length} of ${filtered.length}`}</span>
          </div>

          <div className="rc-list">
            {list.map(r => isDesktop
              ? <RecipientRow key={r.id} r={r} onPay={onPay} onMore={setDeleteTarget} />
              : <RecipientRowMobile key={r.id} r={r} onPay={onPay} onMore={setDeleteTarget} />)}
          </div>

          {visible < filtered.length && <div ref={sentinelRef} className="tx-loader"><span className="spin" style={{ width: 14, height: 14 }} /> Loading more recipients…</div>}
          {visible >= filtered.length && filtered.length > PAGE_SIZE_RC && <div className="tx-end">All {filtered.length} recipients shown</div>}

          {filtered.length === 0 && (
            dataState === "empty" ? (
              <div className="empty" style={{ padding: "56px 16px" }}>
                <div className="ic"><CIcon.people /></div>
                <div style={{ fontSize: 15, color: "var(--gray-900)", fontWeight: 600, marginBottom: 4 }}>No recipients yet</div>
                <div style={{ fontSize: 13, maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.55 }}>Save the people and businesses you pay regularly. After your first save, paying again is one tap.</div>
                <button className="btn" onClick={onAddNew}><CIcon.plus /> Add your first recipient</button>
              </div>
            ) : (
              <div className="empty" style={{ padding: "48px 16px" }}>
                <div className="ic"><CIcon.people /></div>
                <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500 }}>No recipients match</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Try clearing the filter or adding a new recipient.</div>
              </div>
            )
          )}
        </div>
      )}

      <DeleteRecipientSheet
        recipient={deleteTarget}
        onConfirm={() => { onToast && onToast(`${deleteTarget.name} removed`); setDeleteTarget(null); }}
        onClose={() => setDeleteTarget(null)} />
    </Page>
  );
}

window.OBRecipients = { RecipientsScreen };
