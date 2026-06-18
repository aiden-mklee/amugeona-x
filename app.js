const DEFAULT_MENUS = [
  { name: '김치찌개', cat: '한식', emoji: '🍲' },
  { name: '된장찌개', cat: '한식', emoji: '🥘' },
  { name: '불고기', cat: '한식', emoji: '🥩' },
  { name: '비빔밥', cat: '한식', emoji: '🍚' },
  { name: '삼겹살', cat: '한식', emoji: '🥓' },
  { name: '순두부찌개', cat: '한식', emoji: '🍲' },
  { name: '쌀국수', cat: '아시안', emoji: '🍜' },
  { name: '짜장면', cat: '중식', emoji: '🍜' },
  { name: '짬뽕', cat: '중식', emoji: '🍜' },
  { name: '탕수육', cat: '중식', emoji: '🍖' },
  { name: '마라탕', cat: '중식', emoji: '🌶️' },
  { name: '초밥', cat: '일식', emoji: '🍣' },
  { name: '라멘', cat: '일식', emoji: '🍜' },
  { name: '돈카츠', cat: '일식', emoji: '🍱' },
  { name: '우동', cat: '일식', emoji: '🍜' },
  { name: '파스타', cat: '양식', emoji: '🍝' },
  { name: '피자', cat: '양식', emoji: '🍕' },
  { name: '햄버거', cat: '양식', emoji: '🍔' },
  { name: '리조또', cat: '양식', emoji: '🍚' },
  { name: '떡볶이', cat: '분식', emoji: '🌶️' },
  { name: '순대국밥', cat: '한식', emoji: '🍲' },
  { name: '김밥', cat: '분식', emoji: '🍙' },
  { name: '쫄면', cat: '분식', emoji: '🍜' },
  { name: '토스트', cat: '분식', emoji: '🍞' },
];

let menus = JSON.parse(localStorage.getItem('lunchMenus')) || DEFAULT_MENUS;
let currentCategory = 'all';

function save() {
  localStorage.setItem('lunchMenus', JSON.stringify(menus));
}

function filtered() {
  if (currentCategory === 'all') return menus;
  return menus.filter(m => m.cat === currentCategory);
}

function setCategory(el, cat) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentCategory = cat;
  renderList();
}

function pickMenu() {
  const pool = filtered();
  if (!pool.length) {
    alert('해당 카테고리에 메뉴가 없어요!');
    return;
  }
  const box = document.getElementById('resultBox');
  box.classList.remove('spinning');
  void box.offsetWidth;
  box.classList.add('spinning');

  let count = 0;
  const interval = setInterval(() => {
    const r = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('resultEmoji').textContent = r.emoji;
    document.getElementById('resultText').textContent = r.name;
    count++;
    if (count >= 12) {
      clearInterval(interval);
      const final = pool[Math.floor(Math.random() * pool.length)];
      document.getElementById('resultEmoji').textContent = final.emoji;
      document.getElementById('resultText').textContent = final.name;
    }
  }, 60);
}

function addMenu() {
  const name = document.getElementById('newMenuName').value.trim();
  const cat = document.getElementById('newMenuCat').value;
  if (!name) return;
  if (menus.find(m => m.name === name)) {
    alert('이미 있는 메뉴에요!');
    return;
  }
  menus.push({ name, cat, emoji: '🍽️' });
  save();
  renderList();
  document.getElementById('newMenuName').value = '';
}

function deleteMenu(name) {
  menus = menus.filter(m => m.name !== name);
  save();
  renderList();
}

function renderList() {
  const list = document.getElementById('menuList');
  const items = filtered();
  list.innerHTML = items.map(m => `
    <div class="menu-item">
      <span>${m.emoji} ${m.name} <span class="tag">${m.cat}</span></span>
      <button class="delete-btn" onclick="deleteMenu('${m.name.replace(/'/g, "\\'")}')">✕</button>
    </div>
  `).join('');
}

document.getElementById('newMenuName').addEventListener('keydown', e => {
  if (e.key === 'Enter') addMenu();
});

renderList();
