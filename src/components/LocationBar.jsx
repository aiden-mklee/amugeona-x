import { useState } from 'react';
import { geocodeRegion } from '../lib/kakao';

export default function LocationBar({ center, mode, loading, onUseGps, onSelectRegion, gpsAddr, gpsBlocked }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    setSearchErr('');
    setCandidates([]);
    try {
      const results = await geocodeRegion(q.trim());
      setCandidates(results);
    } catch (e) {
      setSearchErr(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (c) => {
    onSelectRegion(c);
    setCandidates([]);
    setQ('');
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setCandidates([]);
    setQ('');
    setSearchErr('');
  };

  return (
    <section className="locbar">
      <div className="locbar__current">
        {mode === 'gps' ? (
          <button
            className="locbar__gps"
            onClick={onUseGps}
            disabled={loading}
            title="위치 다시 찾기"
          >
            <span className="locbar__pin" aria-hidden>📍</span>
            <span className="locbar__label">
              {center ? center.label : loading ? '위치 찾는 중…' : '위치 없음'}
              {gpsAddr && <span className="locbar__addr">({gpsAddr})</span>}
            </span>
          </button>
        ) : (
          <>
            <span className="locbar__pin" aria-hidden>📍</span>
            <span className="locbar__label">
              {center ? center.label : loading ? '위치 찾는 중…' : '위치 없음'}
            </span>
            <span className="tag tag--sub">검색지역</span>
            <button className="locbar__reset" onClick={onUseGps} disabled={loading}>
              내 위치로
            </button>
          </>
        )}
      </div>

      <p className="locbar__privacy">내 주변 식당을 찾는 데만 위치를 써요. 저장하지 않아요.</p>

      {gpsBlocked ? (
        <div className="locbar__blocked">
          <p className="locbar__blocked-msg">
            위치 권한이 거부됐어요. 브라우저 설정에서 이 사이트의 위치를 허용한 뒤 새로고침해주세요.
          </p>
          <button
            className="locbar__blocked-cta"
            onClick={() => setOpen(true)}
          >
            다른 지역에서 찾기 →
          </button>
        </div>
      ) : (
        <button
          className="locbar__toggle"
          onClick={() => (open ? handleClose() : setOpen(true))}
          aria-expanded={open}
        >
          {open ? '닫기' : '다른 지역에서 찾기'}
        </button>
      )}

      {open && (
        <div className="locbar__search-wrap">
          <div className="locbar__search">
            <input
              type="text"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="예: 강남역, 홍대입구, 남양주 별내"
              aria-label="지역 검색"
            />
            <button onClick={search} disabled={searching || !q.trim()}>
              {searching ? '…' : '검색'}
            </button>
          </div>
          {searchErr && <p className="locbar__err">{searchErr}</p>}
          {candidates.length > 0 && (
            <ul className="locbar__candidates">
              {candidates.map((c, i) => (
                <li key={i}>
                  <button onClick={() => handleSelect(c)}>
                    <strong>{c.label}</strong>
                    {c.address && <span>{c.address}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
