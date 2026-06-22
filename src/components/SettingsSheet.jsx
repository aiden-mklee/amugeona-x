import { useState } from 'react';
import { FILTER_DEFS } from '../config/places';

const TABS = [
  ['filter', '카테고리'],
  ['blacklist', '제외 가게'],
];

export default function SettingsSheet({
  excluded,
  onToggleExcluded,
  blacklist,
  onRemoveFromBlacklist,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('filter');

  const badgeCount = excluded.size + blacklist.length;

  return (
    <>
      <button
        className="hero__settings"
        onClick={() => setOpen(true)}
        title="뽑기 설정"
        aria-haspopup="dialog"
      >
        ⚙{badgeCount > 0 && <span className="hero__settings-badge">{badgeCount}</span>}
      </button>

      {open && (
        <>
          <div className="sheet-overlay" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="뽑기 설정">
            <div className="sheet__handle" />
            <div className="sheet__head">
              <div className="sheet__tabs">
                {TABS.map(([key, label]) => (
                  <button
                    key={key}
                    className={`sheet__tab${tab === key ? ' sheet__tab--on' : ''}`}
                    onClick={() => setTab(key)}
                  >
                    {label}
                    {key === 'blacklist' && blacklist.length > 0 && (
                      <span className="sheet__tab-badge">{blacklist.length}</span>
                    )}
                  </button>
                ))}
              </div>
              <button className="sheet__close" onClick={() => setOpen(false)} aria-label="닫기">✕</button>
            </div>

            <div className="sheet__body">
              {tab === 'filter' && (
                <div className="sheet__section">
                  {FILTER_DEFS.map((f) => (
                    <label key={f.id} className="filter-row">
                      <span className="filter-row__label">{f.label}</span>
                      <span className={`filter-switch${!excluded.has(f.id) ? ' filter-switch--on' : ''}`}>
                        <input
                          type="checkbox"
                          className="filter-switch__input"
                          checked={!excluded.has(f.id)}
                          onChange={() => onToggleExcluded(f.id)}
                        />
                        <span className="filter-switch__track" />
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {tab === 'blacklist' && (
                <div className="sheet__section">
                  {blacklist.length === 0 ? (
                    <p className="sheet__empty">제외한 가게가 없어요.</p>
                  ) : (
                    <ul className="sheet__list">
                      {blacklist.map((b) => (
                        <li key={b.id} className="sheet__item">
                          <span className="sheet__item-name">{b.place_name}</span>
                          <button
                            className="sheet__item-action"
                            onClick={() => onRemoveFromBlacklist(b.id)}
                          >
                            되돌리기
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
