import { useEffect, useRef, useState } from 'react';

export default function Verdict({ picked, onPick, disabled, isNight, results }) {
  const [displayName, setDisplayName] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const timerRef = useRef(null);

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

  return (
    <div className="verdict">
      <button className="verdict__btn" onClick={onPick} disabled={disabled || spinning}>
        {isNight ? '오늘 저녁 정해줘' : '오늘 점심 정해줘'}
      </button>

      {picked && displayName && (
        <a
          key={spinning ? 'spin' : picked.id}
          className={`verdict__card${spinning ? ' verdict__card--spinning' : ''}`}
          href={!spinning ? picked.place_url : undefined}
          target="_blank"
          rel="noreferrer"
          onClick={spinning ? (e) => e.preventDefault() : undefined}
        >
          {!spinning && picked.isCafeteria && (
            <span className="stamp stamp--school">학식</span>
          )}
          <strong key={flashKey} className="verdict__name">
            {displayName}
          </strong>
          {!spinning && picked.isCafeteria && picked.address && (
            <span className="verdict__cat">{picked.address}</span>
          )}
          {!spinning && !picked.isCafeteria && picked.category_name && (
            <span className="verdict__cat">{picked.category_name}</span>
          )}
          {!spinning && (
            <span className="verdict__go">
              {picked.isCafeteria ? '오늘 메뉴 확인하기 →' : '카카오맵에서 보기 →'}
            </span>
          )}
        </a>
      )}
    </div>
  );
}
