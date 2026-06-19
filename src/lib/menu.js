const URLS = {
  peony: '/api/kbu/kor/CMS/DietMenuMgr/list.do?mCode=MN203&searchDietCategory=4',
  azilia: '/api/kbu/kor/CMS/DietMenuMgr/list.do?mCode=MN203&searchDietCategory=5',
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

async function parseMenu(key) {
  try {
    const res = await fetch(URLS[key]);
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const today = todayStr();

    // 오늘 날짜가 있는 th를 찾아 열 인덱스 확인
    let colIdx = -1;
    let menuTable = null;

    for (const row of doc.querySelectorAll('tr')) {
      const ths = Array.from(row.querySelectorAll('th'));
      const idx = ths.findIndex((th) => th.textContent.includes(today));
      if (idx !== -1) {
        colIdx = idx;
        menuTable = row.closest('table');
        break;
      }
    }

    if (colIdx === -1 || !menuTable) return null;

    // 같은 열의 tbody 셀에서 메뉴 항목 추출
    // 행 라벨이 <th>일 수도 있으므로 td+th 모두 선택
    const items = [];
    menuTable.querySelectorAll('tbody tr').forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const cell = cells[colIdx];
      if (!cell) return;
      const lis = cell.querySelectorAll('li');
      if (lis.length) {
        lis.forEach((li) => {
          const t = li.textContent.trim();
          if (t) items.push(t);
        });
      } else {
        // li가 없으면 줄바꿈으로 분리
        cell.textContent.split('\n').forEach((t) => {
          const s = t.trim();
          if (s) items.push(s);
        });
      }
    });

    return items.length ? items : null;
  } catch {
    return null;
  }
}

export async function fetchTodayMenus() {
  const [peony, azilia] = await Promise.allSettled([
    parseMenu('peony'),
    parseMenu('azilia'),
  ]);
  return {
    peony: peony.status === 'fulfilled' ? peony.value : null,
    azilia: azilia.status === 'fulfilled' ? azilia.value : null,
  };
}
