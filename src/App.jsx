import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentPosition } from './lib/geolocation';
import { searchFood, searchKeyword, reverseGeocode } from './lib/kakao';
import { haversine, walkMinutes, formatDistance } from './lib/geo';
import {
  GYEONGBOK_NYJ,
  CAMPUS_RADIUS_M,
  CAFETERIAS,
  RADIUS_PRESETS,
  SPECIAL_PICKS,
} from './config/places';
import LocationBar from './components/LocationBar';
import RadiusSelector from './components/RadiusSelector';
import Verdict from './components/Verdict';
import ResultList from './components/ResultList';
import SettingsSheet from './components/SettingsSheet';
import InstallBanner from './components/InstallBanner';

function applyRandomOffset(center, meters) {
  const R = 6371000;
  const angle = Math.random() * 2 * Math.PI;
  const dlat = ((meters * Math.cos(angle)) / R) * (180 / Math.PI);
  const dlng =
    ((meters * Math.sin(angle)) / (R * Math.cos((center.lat * Math.PI) / 180))) *
    (180 / Math.PI);
  return { lat: center.lat + dlat, lng: center.lng + dlng };
}

const EVENING_CATS = ['술집', '호프', '포차', '포장마차', '실내포장마차', '이자카야', '바', '펍', '막걸리', '와인', '맥주', '요리주점', '칵테일'];

function weightedSample(items, n, isNight) {
  const pool = [];
  for (const item of items) {
    const isEvening =
      isNight && EVENING_CATS.some((kw) => (item.category_name || '').includes(kw));
    const weight = isEvening ? 3 : 1;
    for (let i = 0; i < weight; i++) pool.push(item);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const seen = new Set();
  const result = [];
  for (const item of pool) {
    if (!seen.has(item.id) && result.length < n) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function applyExclusion(pool, excluded) {
  return pool.filter((d) => {
    const cat = d.category_name || '';
    if (excluded.has('bar') && EVENING_CATS.some((kw) => cat.includes(kw))) return false;
    if (excluded.has('snack') && cat.includes('간식')) return false;
    return true;
  });
}

// fullPool → 블랙리스트·카테고리 필터 → weightedSample → 거리정렬 → 학식 prepend
function buildResults(pool, excluded, blacklist, isNight, center) {
  const blacklistIds = new Set(blacklist.map((b) => b.id));
  const withoutBlacklist = pool.filter((d) => !blacklistIds.has(d.id));
  const filtered = applyExclusion(withoutBlacklist, excluded);
  const mapped = weightedSample(filtered, 45, isNight).sort((a, b) => a.distance - b.distance);
  const nearCampus = !isNight && center && haversine(center, GYEONGBOK_NYJ) <= CAMPUS_RADIUS_M;
  return nearCampus
    ? [...CAFETERIAS.map((c) => ({ ...c, distance: 0 })), ...mapped]
    : mapped;
}

function loadExcluded() {
  try {
    const saved = localStorage.getItem('amugeona:excluded');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function loadBlacklist() {
  try {
    const saved = localStorage.getItem('amugeona:blacklist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}


export default function App() {
  const [center, setCenter] = useState(null);
  const [mode, setMode] = useState('gps');
  const [preset, setPreset] = useState(RADIUS_PRESETS[1]);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNight, setIsNight] = useState(false);
  const [gpsAddr, setGpsAddr] = useState(null);
  const [fullPool, setFullPool] = useState([]);
  const [excluded, setExcluded] = useState(loadExcluded);
  const [blacklist, setBlacklist] = useState(loadBlacklist);
  const [recentPicked, setRecentPicked] = useState([]);
  const [gpsBlocked, setGpsBlocked] = useState(false);

  // ref로 유지해 API useEffect에서 dep 없이 최신값 읽음
  const excludedRef = useRef(excluded);
  const blacklistRef = useRef(blacklist);
  useEffect(() => { excludedRef.current = excluded; }, [excluded]);
  useEffect(() => { blacklistRef.current = blacklist; }, [blacklist]);

  useEffect(() => {
    document.body.classList.toggle('night', isNight);
  }, [isNight]);

  const toggleExcluded = useCallback((id) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem('amugeona:excluded', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const addToBlacklist = useCallback((id, place_name) => {
    setBlacklist((prev) => {
      if (prev.some((b) => b.id === id)) return prev;
      const next = [...prev, { id, place_name }];
      try { localStorage.setItem('amugeona:blacklist', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeFromBlacklist = useCallback((id) => {
    setBlacklist((prev) => {
      const next = prev.filter((b) => b.id !== id);
      try { localStorage.setItem('amugeona:blacklist', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);


  const useGps = useCallback(async () => {
    setError('');
    setGpsBlocked(false);
    setLoading(true);
    setPicked(null);
    try {
      const pos = await getCurrentPosition();
      setMode('gps');
      setCenter({ ...pos, label: '내 위치' });
      reverseGeocode({ lat: pos.lat, lng: pos.lng })
        .then((addr) => { if (addr) setGpsAddr(addr); })
        .catch(() => {});
    } catch (e) {
      if (e.code === 1) {
        setGpsBlocked(true);
      } else {
        setError('위치를 가져올 수 없어요. 지역을 직접 검색해보세요.');
      }
      setLoading(false);
    }
  }, []);

  const selectRegion = useCallback((loc) => {
    setError('');
    setPicked(null);
    setMode('manual');
    setCenter(loc);
    setGpsAddr(null);
  }, []);

  useEffect(() => {
    useGps();
  }, [useGps]);

  // API 검색 — excluded·blacklist는 ref로 참조해 dep 오염 방지
  useEffect(() => {
    if (!center) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      setPicked(null);
      try {
        const offsetFraction = preset.mode === 'car' ? 0.3 : 0.15;
        const searchCenters = [
          center,
          applyRandomOffset(center, preset.radius * offsetFraction),
          applyRandomOffset(center, preset.radius * offsetFraction),
        ];

        const fdSearches = searchCenters.map((sc) =>
          searchFood({ lat: sc.lat, lng: sc.lng, radius: preset.radius })
        );

        const nightSearches = isNight
          ? ['술집', '포차'].map((kw) =>
              searchKeyword({ lat: center.lat, lng: center.lng, radius: preset.radius, keyword: kw })
            )
          : [];

        const allData = await Promise.all([...fdSearches, ...nightSearches]);

        const seen = new Set();
        const merged = allData
          .flat()
          .filter((d) => {
            if (seen.has(d.id)) return false;
            seen.add(d.id);
            if (isNight && (d.category_name || '').includes('간식')) return false;
            return true;
          })
          .map((d) => ({
            id: d.id,
            place_name: d.place_name,
            category_name: d.category_name,
            place_url: d.place_url,
            phone: d.phone,
            address: d.road_address_name || d.address_name,
            distance: haversine(center, { lat: Number(d.y), lng: Number(d.x) }),
            isCafeteria: false,
          }));

        if (!cancelled) {
          setFullPool(merged);
          setResults(buildResults(merged, excludedRef.current, blacklistRef.current, isNight, center));
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [center, preset, isNight]);

  // excluded 변경 시 API 재호출 없이 재계산
  useEffect(() => {
    if (!fullPool.length) return;
    setPicked(null);
    setResults(buildResults(fullPool, excluded, blacklistRef.current, isNight, center));
  }, [excluded]); // eslint-disable-line react-hooks/exhaustive-deps

  // blacklist 변경 시 API 재호출 없이 재계산
  useEffect(() => {
    if (!fullPool.length) return;
    setPicked(null);
    setResults(buildResults(fullPool, excludedRef.current, blacklist, isNight, center));
  }, [blacklist]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshResults = () => {
    if (!fullPool.length) return;
    setResults(buildResults(fullPool, excluded, blacklist, isNight, center));
    setPicked(null);
  };

  const activeSpecials = SPECIAL_PICKS.filter((sp) => {
    if (sp.id === 'special-delivery' && excluded.has('delivery')) return false;
    if (sp.id === 'special-convenience' && excluded.has('convenience')) return false;
    if (sp.id === 'special-cafeteria' && excluded.has('cafeteria')) return false;
    return true;
  });
  const canPick = results.length > 0 || activeSpecials.length > 0;
  const filterEmpty = !loading && fullPool.length > 0 && !canPick;

  const blacklistIds = new Set(blacklist.map((b) => b.id));
  const filteredPoolSize = applyExclusion(
    fullPool.filter((d) => !blacklistIds.has(d.id)),
    excluded
  ).length;

  const pickRandom = () => {
    const allOptions = [...results, ...activeSpecials];
    if (!allOptions.length) return;
    // 최근 뽑힌 3곳 제외 → 없으면 전체에서 선택
    let pool = allOptions.filter((r) => !recentPicked.includes(r.id));
    if (!pool.length) pool = allOptions;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPicked(choice);
    setRecentPicked((prev) => [choice.id, ...prev].slice(0, 3));
  };

  return (
    <>
    <div className="app">
      <header className="hero">
        <h1 className="hero__title">아무거나 금지</h1>
        <p className="hero__sub">
          {isNight ? '오늘 밤, 어디서 달릴까?' : '오늘 점심, 내가 정한다.'}
        </p>
        <div className="seg">
          <button
            className={`seg__btn ${!isNight ? 'seg__btn--on' : ''}`}
            onClick={() => setIsNight(false)}
            aria-label="점심 모드"
          >
            ☀️
          </button>
          <button
            className={`seg__btn ${isNight ? 'seg__btn--on' : ''}`}
            onClick={() => setIsNight(true)}
            aria-label="저녁 모드"
          >
            🌙
          </button>
        </div>
        <SettingsSheet
          excluded={excluded}
          onToggleExcluded={toggleExcluded}
          blacklist={blacklist}
          onRemoveFromBlacklist={removeFromBlacklist}
        />
        <button
          className="hero__reload"
          onClick={() => window.location.reload()}
          aria-label="앱 새로고침"
          title="전체 새로고침"
        >
          ↺
        </button>
      </header>

      <LocationBar
        center={center}
        mode={mode}
        loading={loading}
        onUseGps={useGps}
        onSelectRegion={selectRegion}
        gpsAddr={gpsAddr}
        gpsBlocked={gpsBlocked}
      />

      <RadiusSelector presets={RADIUS_PRESETS} value={preset} onChange={setPreset} />

      <Verdict
        picked={picked}
        onPick={pickRandom}
        disabled={loading || !canPick}
        isNight={isNight}
        results={results}
        onBlacklist={addToBlacklist}
      />

      {error && <div className="error">{error}</div>}

      <ResultList
        results={results}
        loading={loading}
        pickedId={picked?.id}
        walkMinutes={walkMinutes}
        formatDistance={formatDistance}
        carMode={preset.mode === 'car'}
        canRefresh={filteredPoolSize > 45}
        onRefresh={refreshResults}
        filterEmpty={filterEmpty}
      />

      <footer className="foot">
        결과를 누르면 카카오맵으로 이동합니다 · 메뉴·길찾기는 거기서 확인
      </footer>
    </div>

    <InstallBanner />
    </>
  );
}
