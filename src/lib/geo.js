// 두 좌표 사이 직선거리(m)
export function haversine(a, b) {
  const R = 6371000; // 지구 반지름(m)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 직선거리(m) -> 대략 도보 분 (약 4km/h = 67m/분). 직선거리 기준이라 실제보단 짧게 나옴.
export function walkMinutes(meters) {
  return Math.max(1, Math.round(meters / 67));
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
