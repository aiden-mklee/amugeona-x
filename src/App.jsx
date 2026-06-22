import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    document.body.classList.toggle('night', isNight);
  }, [isNight]);

  const useGps = useCallback(async () => {
    setError('');
    setLoading(true);
    setPicked(null);
    try {
      const pos = await getCurrentPosition();
      setMode('gps');
      setCenter({ ...pos, label: '내 위치' });
      reverseGeocode({ lat: pos.lat, lng: pos.lng })
        .then((addr) => { if (addr) setGpsAddr(addr); })
        .catch(() => {});
    } catch {
      setError('위치 권한이 필요해요. 허용하거나, 아래에서 지역을 검색하세요.');
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

        // 야간 모드: 술집·포차 키워드 검색으로 풀 확장
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
            // 야간 모드에서 간식 카테고리 제외
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

        // 야간 카테고리 가중치 3배 → 랜덤 45개 → 거리순
        const mapped = weightedSample(merged, 45, isNight).sort(
          (a, b) => a.distance - b.distance
        );

        // 야간 모드에선 학식 숨김
        const nearCampus = !isNight && haversine(center, GYEONGBOK_NYJ) <= CAMPUS_RADIUS_M;
        const list = nearCampus
          ? [...CAFETERIAS.map((c) => ({ ...c, distance: 0 })), ...mapped]
          : mapped;

        if (!cancelled) {
          setFullPool(merged);
          setResults(list);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [center, preset, isNight]);

  const refreshResults = () => {
    if (!fullPool.length) return;
    const mapped = weightedSample(fullPool, 45, isNight).sort(
      (a, b) => a.distance - b.distance
    );
    const nearCampus = !isNight && center && haversine(center, GYEONGBOK_NYJ) <= CAMPUS_RADIUS_M;
    const list = nearCampus
      ? [...CAFETERIAS.map((c) => ({ ...c, distance: 0 })), ...mapped]
      : mapped;
    setPicked(null);
    setResults(list);
  };

  const pickRandom = () => {
    if (!results.length) return;
    const allOptions = [...results, ...SPECIAL_PICKS];
    const pool = picked ? allOptions.filter((r) => r.id !== picked.id) : allOptions;
    const source = pool.length ? pool : allOptions;
    setPicked(source[Math.floor(Math.random() * source.length)]);
  };

  return (
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
      />

      <RadiusSelector presets={RADIUS_PRESETS} value={preset} onChange={setPreset} />

      <Verdict
        picked={picked}
        onPick={pickRandom}
        disabled={loading || !results.length}
        isNight={isNight}
        results={results}
      />

      {error && <div className="error">{error}</div>}

      <ResultList
        results={results}
        loading={loading}
        pickedId={picked?.id}
        walkMinutes={walkMinutes}
        formatDistance={formatDistance}
        carMode={preset.mode === 'car'}
        canRefresh={fullPool.length > 45}
        onRefresh={refreshResults}
      />

      <footer className="foot">
        결과를 누르면 카카오맵으로 이동합니다 · 메뉴·길찾기는 거기서 확인
      </footer>
    </div>
  );
}
