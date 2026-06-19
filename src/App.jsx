import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition } from './lib/geolocation';
import { searchFood } from './lib/kakao';
import { haversine, walkMinutes, formatDistance } from './lib/geo';
import {
  GYEONGBOK_NYJ,
  CAMPUS_RADIUS_M,
  CAFETERIAS,
  RADIUS_PRESETS,
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

export default function App() {
  const [center, setCenter] = useState(null);
  const [mode, setMode] = useState('gps');
  const [preset, setPreset] = useState(RADIUS_PRESETS[1]);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const useGps = useCallback(async () => {
    setError('');
    setLoading(true);
    setPicked(null);
    try {
      const pos = await getCurrentPosition();
      setMode('gps');
      setCenter({ ...pos, label: '내 위치' });
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
        // 3곳에서 병렬 검색 → 머지 → 랜덤 45개 → 거리순 정렬
        const offsetFraction = preset.mode === 'car' ? 0.3 : 0.15;
        const searchCenters = [
          center,
          applyRandomOffset(center, preset.radius * offsetFraction),
          applyRandomOffset(center, preset.radius * offsetFraction),
        ];

        const allData = await Promise.all(
          searchCenters.map((sc) =>
            searchFood({ lat: sc.lat, lng: sc.lng, radius: preset.radius })
          )
        );

        const seen = new Set();
        const merged = allData
          .flat()
          .filter((d) => {
            if (seen.has(d.id)) return false;
            seen.add(d.id);
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

        // 셔플 후 45개, 거리순 정렬
        const mapped = merged
          .sort(() => Math.random() - 0.5)
          .slice(0, 45)
          .sort((a, b) => a.distance - b.distance);

        const nearCampus = haversine(center, GYEONGBOK_NYJ) <= CAMPUS_RADIUS_M;
        const list = nearCampus
          ? [...CAFETERIAS.map((c) => ({ ...c, distance: 0 })), ...mapped]
          : mapped;

        if (!cancelled) setResults(list);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [center, preset]);

  const pickRandom = () => {
    if (!results.length) return;
    const pool = picked ? results.filter((r) => r.id !== picked.id) : results;
    const source = pool.length ? pool : results;
    setPicked(source[Math.floor(Math.random() * source.length)]);
  };

  return (
    <div className="app">
      <header className="hero">
        <h1 className="hero__title">아무거나 금지</h1>
        <p className="hero__sub">오늘 점심, 내가 정한다.</p>
      </header>

      <LocationBar
        center={center}
        mode={mode}
        loading={loading}
        onUseGps={useGps}
        onSelectRegion={selectRegion}
      />

      <RadiusSelector presets={RADIUS_PRESETS} value={preset} onChange={setPreset} />

      <Verdict picked={picked} onPick={pickRandom} disabled={loading || !results.length} />

      {error && <div className="error">{error}</div>}

      <ResultList
        results={results}
        loading={loading}
        pickedId={picked?.id}
        walkMinutes={walkMinutes}
        formatDistance={formatDistance}
        carMode={preset.mode === 'car'}
      />

      <footer className="foot">
        결과를 누르면 카카오맵으로 이동합니다 · 메뉴·길찾기는 거기서 확인
      </footer>
    </div>
  );
}
