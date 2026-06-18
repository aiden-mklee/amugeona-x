require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));

app.get('/api/restaurants', async (req, res) => {
  const { lat, lng } = req.query;

  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    return res.status(500).json({ error: '.env에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 설정해주세요' });
  }

  const headers = { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret };
  const queries = ['한식', '중식', '일식', '양식', '분식', '카페'];

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
  } else {
    return res.status(400).json({ error: 'lat/lng 또는 manual 위치가 필요합니다' });
  }

  const location = dong || gu;
  const coordParam = (lat && lng) ? `&coordinate=${lng},${lat}` : '';

  try {
    const fetches = queries.map(q =>
      fetch(
        `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent((location ? location + ' ' : '') + q)}&display=5${coordParam}&sort=random`,
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

    if (dong) {
      const filtered = unique.filter(item =>
        (item.address || '').includes(dong) || (item.roadAddress || '').includes(dong)
      );
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
