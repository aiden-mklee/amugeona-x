# 아무거나 금지 🍴

GPS 기반으로 주변 식당을 찾아 **한 곳을 랜덤으로 정해주는** 점심 결정 앱.
지도는 그리지 않고, 결과를 누르면 카카오맵 상세 페이지(메뉴·사진·길찾기)로 넘어갑니다.

- 기본: 내 위치(GPS) 주변 검색
- 서브: 다른 지역을 직접 검색해서 돌려보기
- 경복대학교 남양주캠퍼스 1km 이내면 학식(피오니·아질리아)도 후보에 등장

## 1. 카카오 키 발급 (필수)

1. https://developers.kakao.com → 로그인 → **내 애플리케이션** → 앱 추가
2. **앱 설정 > 앱 키**에서 **JavaScript 키** 복사
3. **앱 설정 > 플랫폼 > Web** 에 사용할 도메인 등록
   - 개발용: `http://localhost:5173`
   - 배포 안 하고 친구끼리만 써도, 접속하는 주소는 모두 등록되어야 동작합니다.
4. **제품 설정 > 카카오맵**에서 **사용 설정 ON** (2024.12 이후 신규 앱은 필수)

> 무료 쿼터(지도/로컬) 안에서 소규모 사용은 사실상 무료입니다.

## 2. 환경변수

```bash
cp .env.example .env
# .env 를 열고 VITE_KAKAO_JS_KEY 에 JavaScript 키 입력
```

## 3. 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 위치 권한을 허용하면 주변 식당이 뜹니다.
(GPS는 `https` 또는 `localhost`에서만 동작합니다.)

## 경복대 학식 좌표 맞추기

`src/config/places.js` 의 `GYEONGBOK_NYJ` 좌표는 **대략값**입니다. 정확히 맞추려면:

- 카카오맵에서 "경복대학교 남양주캠퍼스" 검색 후 위경도 확인, 또는
- 콘솔에서 `geocodeRegion('경복대학교 남양주캠퍼스')` 결과로 교체

학식 카드의 `place_url` 도 실제 장소 페이지 URL로 바꾸면 메뉴/리뷰가 바로 보입니다.

## 폴더 구조

```
src/
  App.jsx              상태 오케스트레이션 (GPS / 검색 / 지오펜스 / 랜덤)
  config/places.js     경복대 좌표·학식 데이터·거리 프리셋
  lib/kakao.js         카카오 SDK 로드 + 카테고리/키워드 검색
  lib/geo.js           거리 계산·도보분 환산
  lib/geolocation.js   브라우저 GPS
  components/          LocationBar · RadiusSelector · Verdict · ResultList
```
