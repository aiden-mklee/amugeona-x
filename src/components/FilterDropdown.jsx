import { useEffect, useRef, useState } from 'react';
import { FILTER_DEFS } from '../config/places';

export default function FilterDropdown({ excluded, onToggle }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const count = excluded.size;

  return (
    <div className="filter-wrap" ref={wrapRef}>
      <button
        className={`filter-btn${count > 0 ? ' filter-btn--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="뽑기 설정"
      >
        ⚙{count > 0 && <span className="filter-badge">{count}</span>}
      </button>

      {open && (
        <div className="filter-dropdown">
          {FILTER_DEFS.map((f) => (
            <label key={f.id} className="filter-row">
              <span className="filter-row__label">{f.label}</span>
              <span className={`filter-switch${!excluded.has(f.id) ? ' filter-switch--on' : ''}`}>
                <input
                  type="checkbox"
                  className="filter-switch__input"
                  checked={!excluded.has(f.id)}
                  onChange={() => onToggle(f.id)}
                />
                <span className="filter-switch__track" />
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
