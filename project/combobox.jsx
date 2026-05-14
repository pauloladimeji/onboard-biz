/* global React */
/*
 * Combobox — searchable dropdown.
 * Props:
 *   value          (any) — selected value
 *   onChange       (fn)  — (val, item) => void
 *   options        ([{ value, label, sub?, leading?, disabled?, search? }])
 *   placeholder    (str) — shown when nothing selected
 *   searchPlaceholder (str)
 *   renderTrigger  (fn?)  — custom trigger renderer (item, open) => ReactNode
 *   renderOption   (fn?)  — custom option renderer (item, isSelected) => ReactNode
 *   emptyText      (str)
 *   width          (str|num) — applied to the trigger button (default 100%)
 *   id             (str?) — used for aria
 */
const { useState: cbUseState, useEffect: cbUseEffect, useRef: cbUseRef, useMemo: cbUseMemo } = React;
const cbIcon = window.OBIcon;

window.OBCombobox = function Combobox(props) {
  const {
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    renderTrigger,
    renderOption,
    emptyText = "No matches.",
    width = "100%",
    disabled = false,
    locked = false,
  } = props;

  const [open, setOpen] = cbUseState(false);
  const [q, setQ] = cbUseState("");
  const [highlight, setHighlight] = cbUseState(0);
  const wrapRef = cbUseRef(null);
  const listRef = cbUseRef(null);
  const searchRef = cbUseRef(null);

  const selected = cbUseMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const filtered = cbUseMemo(() => {
    if (!q.trim()) return options;
    const needle = q.trim().toLowerCase();
    return options.filter((o) => {
      const hay = (o.search || `${o.label || ""} ${o.sub || ""}`).toLowerCase();
      return hay.includes(needle);
    });
  }, [options, q]);

  // Close on outside click
  cbUseEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Focus search on open
  cbUseEffect(() => {
    if (open) {
      setQ("");
      setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Keep highlighted item in view
  cbUseEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-cbox-i="${highlight}"]`);
    if (el && el.scrollIntoView) {
      const r = el.getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      if (r.top < lr.top) list.scrollTop -= lr.top - r.top;
      else if (r.bottom > lr.bottom) list.scrollTop += r.bottom - lr.bottom;
    }
  }, [highlight, open]);

  // Reset highlight when filter changes
  cbUseEffect(() => { setHighlight(0); }, [q]);

  const choose = (item) => {
    if (!item || item.disabled) return;
    onChange?.(item.value, item);
    setOpen(false);
  };

  const onKey = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { setOpen(false); e.preventDefault(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(filtered.length - 1, h + 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); return; }
    if (e.key === "Enter") { e.preventDefault(); choose(filtered[highlight]); return; }
  };

  return (
    <div className={`cbox ${open ? "open" : ""} ${disabled ? "disabled" : ""} ${locked ? "locked" : ""}`} ref={wrapRef} style={{ width }}>
      <button
        type="button"
        className="cbox-trigger"
        onClick={() => !disabled && !locked && setOpen((v) => !v)}
        onKeyDown={onKey}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {renderTrigger
          ? renderTrigger(selected, open)
          : (selected
              ? (
                <div className="cbox-selected">
                  {selected.leading && <div className="cbox-leading">{selected.leading}</div>}
                  <div className="cbox-meta">
                    <div className="cbox-t">{selected.label}</div>
                    {selected.sub && <div className="cbox-s">{selected.sub}</div>}
                  </div>
                </div>
              )
              : <div className="cbox-placeholder">{placeholder}</div>
            )
        }
        <div className="cbox-caret"><cbIcon.arrowDown /></div>
      </button>
      {open && (
        <div className="cbox-pop" role="listbox">
          <div className="cbox-search">
            <cbIcon.search />
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="cbox-list" ref={listRef}>
            {filtered.length === 0 && <div className="cbox-empty">{emptyText}</div>}
            {filtered.map((o, i) => {
              const isSel = o.value === value;
              const isHi = i === highlight;
              return (
                <button
                  key={o.value}
                  type="button"
                  data-cbox-i={i}
                  role="option"
                  aria-selected={isSel}
                  className={`cbox-opt ${isSel ? "on" : ""} ${isHi ? "hi" : ""} ${o.disabled ? "disabled" : ""}`}
                  onMouseMove={() => setHighlight(i)}
                  onClick={() => choose(o)}
                  disabled={o.disabled}
                >
                  {renderOption
                    ? renderOption(o, isSel)
                    : (
                      <>
                        {o.leading && <div className="cbox-leading">{o.leading}</div>}
                        <div className="cbox-meta">
                          <div className="cbox-t">{o.label}</div>
                          {o.sub && <div className="cbox-s">{o.sub}</div>}
                        </div>
                        {isSel && <div className="cbox-check"><cbIcon.check /></div>}
                      </>
                    )
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
