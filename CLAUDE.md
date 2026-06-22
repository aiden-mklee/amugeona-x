# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때의 행동 계약. 코드만 봐도 알 수 있는 건 적지 않고,
"모르면 틀릴 것"만 담는다. 깊은 설명은 `.claude/skills/`로 분리.

## 한 줄 요약
GPS로 주변 식당을 찾아 랜덤으로 한 곳을 "결정"해주는 점심/저녁 앱.
지도는 그리지 않고 카카오맵 링크로 연결만 한다. React 18 + Vite + vite-plugin-pwa. 상태관리 라이브러리 없음.

## 명령어
```bash
npm run dev      # 개발 서버 (localhost:5174)
npm run build    # 프로덕션 빌드 + 서비스워커 생성
npm run preview  # 빌드 결과 미리보기
```
`.env`에 `VITE_KAKAO_JS_KEY=...` 필요. 없으면 카카오 SDK 로드 실패.

## 작업 규칙 (행동 계약)
- **최소 변경.** 요청한 것만 고친다. 관련 없는 코드를 리팩터링하거나 스타일을 임의로 바꾸지 않는다.
- **수정·삭제 전 확인.** 파일/설정을 바꾸거나 지우기 전에 먼저 물어본다.
- **모르면 질문.** 의도가 불명확하면 짐작하지 말고 질문한다.
- **구현 전 선택지 제시.** 기능 추가·수정은 바로 짜지 말고 2~3가지 접근을 먼저 제안한다.
- **디자인은 Q&A로.** 방향을 제안하고 답을 받은 뒤 진행한다.
- **완료 전 검증.** "됐습니다"라고 말하기 전에 `npm run build` 또는 실제 동작으로 확인한다. 추측으로 완료를 주장하지 않는다. 무엇을 어떻게 확인했는지 한 줄로 보고한다.
- **배포는 명시적 요청 시에만.** "배포해줘"라고 직접 말하지 않으면 커밋·푸시까지만. (절차는 deploy 스킬)

## 절대 규칙 (깨면 앱이 망가짐)
- **지도 SDK 금지.** 카카오 `services` 라이브러리만 동적 로드해 검색만 한다(`src/lib/kakao.js`). REST API 직접 호출은 CORS로 막힌다.
- **GPS 우선.** 진입 시 항상 GPS를 먼저 시도. 지역검색은 보조 입력으로만. 이 우선순위를 깨지 말 것.
- **포트 5174 고정.** `vite.config.js`의 `server.port`를 건드리지 말 것(다른 로컬 프로젝트와 충돌).
- 카카오 키는 `.env`의 `VITE_KAKAO_JS_KEY`로만 읽는다. 하드코딩 금지.
- 거리 표시는 직선거리 기반 → "약 N분"으로만 표현.

## 승인 없이 건드리지 말 것
`dist/`(빌드 산출물), `public/`의 아이콘 PNG, `vite.config.js`의 PWA manifest·포트, `.env`.

## 아키텍처 (요점만)
데이터 흐름: `GPS/지역검색 → center → useEffect 검색 → fullPool(원본) + results(샘플) → pickRandom → picked → Verdict 카드`.
`App.jsx`가 유일한 stateful 컴포넌트. 검색·샘플링·야간 모드의 상세 규칙은 **kakao-search 스킬** 참고.

깨지기 쉬운 불변 규칙(이것만은 기억):
- **결과 두 종류를 섞지 말 것.** API 결과(`isCafeteria:false`)와 수동 항목(`CAFETERIAS`=캠퍼스 근처 prepend, `SPECIAL_PICKS`=`results`엔 없고 `pickRandom` 풀에만 합산)은 출처가 다르다.
- **목록 새로고침(↻)은 API를 다시 부르지 않는다.** `fullPool`에서 재샘플링만 한다.
- 거리는 `haversine(center, {lat:d.y, lng:d.x})`로 계산(카카오가 주는 distance 안 씀).

## 자주 건드릴 곳
- 캠퍼스 좌표·반경·학식·특수항목·거리프리셋: `src/config/places.js`
- 카카오 검색 함수(searchFood / searchKeyword / reverseGeocode / geocodeRegion): `src/lib/kakao.js`
- 검색·샘플링·야간 가중치(`EVENING_CATS`): `src/App.jsx`
- 스타일(라이트/야간 테마, `body.night`): `src/styles.css` 단일 파일

## 압축(compact) 시 보존할 것
수정한 파일 목록, 실행/빌드 명령, 미해결 이슈는 요약에서 빠뜨리지 말 것.

## 현재 미완성 / 주의
- **학식 메뉴(`src/lib/menu.js`)는 미연결.** 어디서도 import 안 되고 `/api/kbu` 프록시도 없어 지금은 동작하지 않는다. 살리려면 Vite dev proxy + Vercel rewrite(`/api/kbu` → `https://www.kbu.ac.kr`)가 필요하고, `CAFETERIAS` 아질리아 항목에 `menuKey:'azilia'`가 빠져 있다.
- 로드맵·미착수 항목은 `TODO.md` 참고.
