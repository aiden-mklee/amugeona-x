// ─────────────────────────────────────────────────────────────
// 경복대학교 남양주(진접)캠퍼스 위치
//   ※ 아래는 "대략값"입니다. 정확히 맞추려면 좌표를 교체하세요.
//   쉬운 방법: 카카오맵에서 "경복대학교 남양주캠퍼스" 검색 → 우클릭/공유로
//   위경도 확인하거나, 콘솔에서 geocodeRegion('경복대학교 남양주캠퍼스') 호출.
// ─────────────────────────────────────────────────────────────
export const GYEONGBOK_NYJ = { lat: 37.73480276519048, lng: 127.21150146853569 };

// 캠퍼스에서 이 거리(m) 이내면 학식을 후보에 끼워넣음
export const CAMPUS_RADIUS_M = 1500;

// 학식 후보 (1km 이내일 때만 노출)
//   place_url 은 카카오맵 검색 링크. 실제 장소 페이지가 있으면 그 URL로 교체하면
//   메뉴/사진/리뷰가 바로 보입니다.
export const CAFETERIAS = [
  {
    id: 'cafeteria-peony',
    place_name: '피오니 (학생식당)',
    address: '지운관 1층',
    menuKey: 'peony',
    isCafeteria: true,
    place_url: 'https://www.kbu.ac.kr/kor/CMS/DietMenuMgr/list.do?mCode=MN203&searchDietCategory=4',
  },
  {
    id: 'cafeteria-azilia',
    place_name: '아질리아 (학생식당)',
    address: '창조관 1층',
    isCafeteria: true,
    place_url: 'https://www.kbu.ac.kr/kor/CMS/DietMenuMgr/list.do?mCode=MN203&searchDietCategory=5',
  },
];

// 거리 프리셋. radius 는 카카오 카테고리 검색에 넘기는 미터값.
export const RADIUS_PRESETS = [
  { id: 'walk5', label: '도보 5분', radius: 350, mode: 'walk' },
  { id: 'walk10', label: '도보 10분', radius: 700, mode: 'walk' },
  { id: 'car5', label: '차 5분', radius: 3000, mode: 'car' },
  { id: 'car10', label: '차 10분', radius: 6000, mode: 'car' },
];
