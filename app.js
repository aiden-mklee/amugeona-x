const CAT_EMOJI = {
  '한식': '🍲', '중식': '🥢', '일식': '🍣',
  '양식': '🍝', '분식': '🌮', '카페': '☕', '학식': '🏫', '기타': '🍽️',
};

const SCHOOL_ITEMS = [
  {
    name: '피오니',
    cat: '학식',
    menus: '경복대학교 학생식당 1',
    address: '경기도 남양주시 진접읍 경복대학교',
    link: 'https://map.naver.com/v5/search/경복대학교 피오니',
  },
  {
    name: '아질리아',
    cat: '학식',
    menus: '경복대학교 학생식당 2',
    address: '경기도 남양주시 진접읍 경복대학교',
    link: 'https://map.naver.com/v5/search/경복대학교 아질리아',
  },
];

let restaurants = [];
let currentCategory = 'all';

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '');
}

function parseCategory(naverCat, searchCat) {
  for (const cat of ['한식', '중식', '일식', '양식', '분식', '카페']) {
    if (naverCat.includes(cat)) return cat;
  }
  return searchCat || '기타';
}

function parseMainMenus(naverCat) {
  const parts = naverCat.split('>');
  if (parts.length >= 3) {
    return parts.slice(2).join('>').split(',').slice(0, 3).map(s => s.trim()).filter(Boolean).join(' · ');
  }
  return '';
}

async function fetchAndRender(url, label) {
  setStatus('🔍 ' + label + ' 주변 식당을 검색하는 중...');
  document.getElementById('menuList').innerHTML = '<div class="loading">식당 정보를 불러오는 중...</div>';

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API 오류');
  }
  const items = await res.json();

  const apiItems = items.map(item => ({
    name: stripHtml(item.title),
    cat: parseCategory(item.category, item.searchCat),
    menus: parseMainMenus(item.category),
    address: item.roadAddress || item.address,
    link: `https://map.naver.com/v5/search/${encodeURIComponent(stripHtml(item.title))}`,
  }));

  restaurants = [...SCHOOL_ITEMS, ...apiItems];

  setStatus(`📍 ${label} 식당 ${restaurants.length}곳을 찾았어요`);
  renderChips();
  renderList();
}

async function loadRestaurants() {
  setStatus('📍 위치를 가져오는 중...');
  document.getElementById('menuList').innerHTML = '<div class="loading">식당 정보를 불러오는 중...</div>';

  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );
    const { latitude: lat, longitude: lng } = pos.coords;
    await fetchAndRender(`/api/restaurants?lat=${lat}&lng=${lng}`, '내 주변');
  } catch (err) {
    // 위치 실패해도 학식은 보여줌
    restaurants = [...SCHOOL_ITEMS];
    if (err.code === 1) {
      setStatus('⚠️ 위치 권한 없음 — 학식만 표시 중. 아래에 동네를 입력하세요');
    } else {
      setStatus('⚠️ 위치를 가져오지 못했어요 — 아래에 동네를 입력하세요');
    }
    renderChips();
    renderList();
  }
}

async function searchManual() {
  const val = document.getElementById('locationInput').value.trim();
  if (!val) return;
  try {
    await fetchAndRender(`/api/restaurants?manual=${encodeURIComponent(val)}`, val);
  } catch (err) {
    setStatus('❌ ' + err.message);
    document.getElementById('menuList').innerHTML = '';
  }
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function filtered() {
  if (currentCategory === 'all') return restaurants;
  return restaurants.filter(r => r.cat === currentCategory);
}

function setCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('active', c.dataset.cat === cat)
  );
  renderList();
}

function renderChips() {
  const cats = ['all', ...new Set(restaurants.map(r => r.cat))];
  document.getElementById('chips').innerHTML = cats.map(cat => `
    <button class="chip ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}" onclick="setCategory('${cat}')">
      ${cat === 'all' ? '전체' : (CAT_EMOJI[cat] || '') + ' ' + cat}
    </button>
  `).join('');
}

function pickRestaurant() {
  const pool = filtered();
  if (!pool.length) {
    alert(restaurants.length ? '해당 카테고리에 식당이 없어요!' : '식당 정보를 먼저 불러와주세요!');
    return;
  }

  const box = document.getElementById('resultBox');
  box.classList.remove('spinning');
  void box.offsetWidth;
  box.classList.add('spinning');

  document.getElementById('resultSub').textContent = '';
  document.getElementById('resultMenus').textContent = '';

  let count = 0;
  const interval = setInterval(() => {
    const r = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('resultEmoji').textContent = CAT_EMOJI[r.cat] || '🍽️';
    document.getElementById('resultText').textContent = r.name;
    count++;
    if (count >= 12) {
      clearInterval(interval);
      const final = pool[Math.floor(Math.random() * pool.length)];
      document.getElementById('resultEmoji').textContent = CAT_EMOJI[final.cat] || '🍽️';
      document.getElementById('resultText').textContent = final.name;
      document.getElementById('resultSub').textContent = final.address;
      document.getElementById('resultMenus').textContent = final.menus ? '🍴 ' + final.menus : '';
    }
  }, 60);
}

function renderList() {
  const list = document.getElementById('menuList');
  const items = filtered();
  if (!items.length) {
    list.innerHTML = '<p class="empty">해당 카테고리 식당이 없어요</p>';
    return;
  }
  list.innerHTML = items.map(r => `
    <div class="menu-item">
      <div class="restaurant-info">
        <div class="restaurant-name-row">
          <span class="restaurant-name">${CAT_EMOJI[r.cat] || '🍽️'} ${r.name}</span>
          <span class="tag">${r.cat}</span>
        </div>
        ${r.menus ? `<div class="menus">${r.menus}</div>` : ''}
        <div class="address">📍 ${r.address}</div>
      </div>
      ${r.link ? `<a class="map-btn" href="${r.link}" target="_blank" rel="noopener">지도</a>` : ''}
    </div>
  `).join('');
}

document.getElementById('locationInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchManual();
});

loadRestaurants();
