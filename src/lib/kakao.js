// 카카오맵 services 라이브러리만 동적으로 로드해서 사용합니다.
// (지도를 그리지 않으므로 지도 컨테이너 없이 검색 기능만 씁니다.)
// services 라이브러리를 쓰면 브라우저에서 바로 검색이 가능해서
// REST API 직접 호출 시 생기는 CORS 문제를 피할 수 있습니다.

const SDK_BASE = 'https://dapi.kakao.com/v2/maps/sdk.js';

let loadPromise = null;

export function loadKakao() {
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_KAKAO_JS_KEY;

  loadPromise = new Promise((resolve, reject) => {
    if (!key) {
      reject(new Error('VITE_KAKAO_JS_KEY 가 .env 에 없습니다.'));
      return;
    }
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(window.kakao);
      return;
    }
    const script = document.createElement('script');
    script.src = `${SDK_BASE}?appkey=${key}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () =>
      reject(new Error('카카오 SDK 로드 실패: JS 키와 등록한 도메인을 확인하세요.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

// 음식점(FD6) 카테고리 검색 — 최대 3페이지(45개)
export async function searchFood({ lat, lng, radius }) {
  const kakao = await loadKakao();
  const places = new kakao.maps.services.Places();

  const fetchPage = (page) =>
    new Promise((resolve, reject) => {
      places.categorySearch(
        'FD6',
        (data, status, pagination) => {
          if (status === kakao.maps.services.Status.OK) {
            resolve({ data, hasMore: !pagination.isEnd });
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve({ data: [], hasMore: false });
          } else {
            reject(new Error('주변 검색에 실패했어요. 잠시 후 다시 시도하세요.'));
          }
        },
        {
          location: new kakao.maps.LatLng(lat, lng),
          radius,
          sort: kakao.maps.services.SortBy.DISTANCE,
          size: 15,
          page,
        }
      );
    });

  const raw = [];
  for (let page = 1; page <= 3; page++) {
    const { data, hasMore } = await fetchPage(page);
    raw.push(...data);
    if (!hasMore) break;
  }

  // 같은 id가 여러 페이지에 걸쳐 중복 등장하는 경우 제거
  const seen = new Set();
  return raw.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// 키워드 검색 — 최대 2페이지(30개), 저녁 모드 풀 확장용
export async function searchKeyword({ lat, lng, radius, keyword }) {
  const kakao = await loadKakao();
  const places = new kakao.maps.services.Places();

  const fetchPage = (page) =>
    new Promise((resolve, reject) => {
      places.keywordSearch(
        keyword,
        (data, status, pagination) => {
          if (status === kakao.maps.services.Status.OK) {
            resolve({ data, hasMore: !pagination.isEnd });
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve({ data: [], hasMore: false });
          } else {
            reject(new Error('키워드 검색 실패'));
          }
        },
        {
          location: new kakao.maps.LatLng(lat, lng),
          radius,
          sort: kakao.maps.services.SortBy.DISTANCE,
          size: 15,
          page,
        }
      );
    });

  const raw = [];
  for (let page = 1; page <= 2; page++) {
    const { data, hasMore } = await fetchPage(page);
    raw.push(...data);
    if (!hasMore) break;
  }
  const seen = new Set();
  return raw.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// 지역명 검색 — 후보 목록(최대 5개) 반환
export async function geocodeRegion(query) {
  const kakao = await loadKakao();
  const places = new kakao.maps.services.Places();

  return new Promise((resolve, reject) => {
    places.keywordSearch(
      query,
      (data, status) => {
        if (status === kakao.maps.services.Status.OK && data.length) {
          resolve(
            data.slice(0, 5).map((d) => ({
              lat: Number(d.y),
              lng: Number(d.x),
              label: d.place_name,
              address: d.road_address_name || d.address_name,
            }))
          );
        } else {
          reject(new Error(`"${query}" 위치를 찾지 못했어요.`));
        }
      },
      { size: 5 }
    );
  });
}
