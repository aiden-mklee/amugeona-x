import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

export default function Verdict({ picked, onPick, disabled, isNight, results, onBlacklist }) {
  const [displayName, setDisplayName] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!picked) {
      setDisplayName(null);
      setSpinning(false);
      return;
    }

    clearTimeout(timerRef.current);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayName(picked.place_name);
      return;
    }

    const pool = results
      .filter((r) => !r.isCafeteria && r.id !== picked.id)
      .map((r) => r.place_name);

    if (!pool.length) {
      setDisplayName(picked.place_name);
      return;
    }

    setSpinning(true);
    let count = 0;
    const total = 10;

    const tick = () => {
      count++;
      if (count < total) {
        setDisplayName(pool[Math.floor(Math.random() * pool.length)]);
        setFlashKey((k) => k + 1);
        const delay = count < 4 ? 45 : count < 7 ? 90 : count < 9 ? 170 : 280;
        timerRef.current = setTimeout(tick, delay);
      } else {
        setDisplayName(picked.place_name);
        setFlashKey((k) => k + 1);
        setSpinning(false);
      }
    };

    timerRef.current = setTimeout(tick, 0);
    return () => clearTimeout(timerRef.current);
  }, [picked?.id]);

  // 스핀 완료 or prefersReduced 직행 시 카드로 스크롤
  useEffect(() => {
    if (!spinning && displayName && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [spinning, displayName]);

  const handleShare = async () => {
    if (!picked) return;
    const label = isNight ? '저녁' : '점심';
    const url = picked.place_url || '';
    const body = [
      `오늘 ${label}은 ${picked.place_name}!`,
      url,
      '아무거나금지가 골라줬어요 🎯',
    ].filter(Boolean).map((s) => s.trim()).join('\n');

    if (navigator.share) {
      // title 제외 — 일부 앱이 title을 text 뒤에 붙여 여분의 줄바꿈 발생
      try { await navigator.share({ text: body }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(body);
        setToast('링크 복사됨');
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(''), 2000);
      } catch {
        setToast('복사 실패');
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(''), 2000);
      }
    }
  };

  const isSpecial = picked?.isSpecial;

  return (
    <div className="verdict">
      {/* 결정 버튼 — document.body에 portal해 .app의 overflow-x:hidden 회피 */}
      {createPortal(
        <button
          className="float-btn"
          onClick={onPick}
          disabled={disabled || spinning}
        >
          {isNight ? '오늘 저녁 정해줘' : '오늘 점심 정해줘'}
        </button>,
        document.body
      )}

      {picked && displayName && (() => {
        const Tag = (!spinning && picked.place_url) ? 'a' : 'div';
        const linkProps = (!spinning && picked.place_url)
          ? { href: picked.place_url, target: '_blank', rel: 'noreferrer' }
          : {};

        return (
          <>
            <Tag
              ref={cardRef}
              key={spinning ? 'spin' : picked.id}
              className={`verdict__card${spinning ? ' verdict__card--spinning' : ''}${!spinning && isSpecial ? ' verdict__card--special' : ''}`}
              {...linkProps}
              onClick={spinning ? (e) => e.preventDefault() : undefined}
            >
              {!spinning && isSpecial && (
                <span className="verdict__special-tag">🎲 오늘의 제안</span>
              )}
              <strong key={flashKey} className="verdict__name">
                <span>{displayName}</span>
              </strong>
              {spinning && (
                <span className="verdict__spinning-hint">결정하는 중…</span>
              )}
              {!spinning && picked.category_name && (
                <span className="verdict__cat">{picked.category_name}</span>
              )}
              {!spinning && picked.place_url && (
                <span className="verdict__go">카카오맵에서 보기 →</span>
              )}
            </Tag>

            {!spinning && (
              <div className="verdict__actions">
                {!isSpecial && !picked.isCafeteria && onBlacklist && (
                  <button
                    className="verdict__action"
                    onClick={() => onBlacklist(picked.id, picked.place_name)}
                  >
                    🚫 다시 추천 안 함
                  </button>
                )}
                {picked.place_url && (
                  <button className="verdict__action" onClick={handleShare}>
                    🔗 공유
                  </button>
                )}
              </div>
            )}

            {toast && <p className="verdict__toast">{toast}</p>}
          </>
        );
      })()}
    </div>
  );
}
