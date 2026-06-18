require('dotenv').config();
const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.static('.'));

app.get('/api/restaurants', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng 필요' });

  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    return res.status(500).json({ error: '.env에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 설정해주세요' });
  }

  const headers = { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret };
  const queries = ['한식', '중식', '일식', '양식', '분식', '카페'];

  // 수동 입력 위치가 있으면 바로 사용, 없으면 좌표로 역지오코딩
  let dong = '';
  let gu = '';

  if (req.query.manual) {
    dong = req.query.manual;
  } else if (lat && lng) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko`,
        { headers: { 'User-Agent': 'lunch-picker-app/1.0' } }
      );
      const geoData = await geoRes.json();
      const addr = geoData.address || {};
      dong = addr.suburb || addr.neighbourhood || addr.quarter || '';
      gu = addr.city_district || addr.county || '';
    } catch (_) {}
  }

  const location = dong || gu;

  try {
    const fetches = queries.map(q =>
      fetch(
        `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent((location ? location + ' ' : '') + q)}&display=5&coordinate=${lng},${lat}&sort=random`,
        { headers }
      )
        .then(r => r.json())
        .then(data => (data.items || []).map(item => ({ ...item, searchCat: q })))
        .catch(() => [])
    );

    const allItems = (await Promise.all(fetches)).flat();

    const seen = new Set();
    let unique = allItems.filter(item => {
      const key = item.title + item.address;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 동 이름이 있으면 주소에 포함된 것만 필터링
    if (dong) {
      const filtered = unique.filter(item =>
        (item.address || '').includes(dong) || (item.roadAddress || '').includes(dong)
      );
      // 결과가 너무 적으면 구 단위로 완화
      if (filtered.length >= 3) {
        unique = filtered;
      } else if (gu) {
        const guFiltered = unique.filter(item =>
          (item.address || '').includes(gu) || (item.roadAddress || '').includes(gu)
        );
        if (guFiltered.length >= 3) unique = guFiltered;
      }
    }

    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
