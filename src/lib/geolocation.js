// 브라우저 GPS로 현재 좌표 가져오기 (카카오와 무관, 무료)
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('이 브라우저는 위치 기능을 지원하지 않아요.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const e = new Error('위치 권한이 꺼져 있어요.');
        e.code = err.code; // 1=PERMISSION_DENIED, 2=UNAVAILABLE, 3=TIMEOUT
        reject(e);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
