const asyncHandler = require('../utils/asyncHandler');

// Simple in-memory cache for recent location searches
const cache = new Map();

// Search locations using OpenStreetMap Nominatim with in-memory caching
const search = asyncHandler(async (req, res) => {
  const query = (req.query.q || '').trim();
  console.log(`Searching locations for query: "${query}"`);
  if (!query || query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const cacheKey = query.toLowerCase();
  if (cache.has(cacheKey)) {
    return res.json({ success: true, data: cache.get(cacheKey) });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'beowned-crm' },
    });

    if (!response.ok) {
      return res.json({ success: true, data: [] });
    }

    const data = await response.json();
    const suggestions = data.map((item) => {
      const addr = item.address || {};
      const parts = [
        item.name || addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.county,
        addr.state,
        addr.country,
      ].filter(Boolean);
      return Array.from(new Set(parts)).join(', ') || item.display_name;
    });

    const unique = Array.from(new Set(suggestions)).slice(0, 5);
    cache.set(cacheKey, unique);

    res.json({ success: true, data: unique });
  } catch (err) {
    console.error('Location search error:', err.message);
    res.json({ success: true, data: [] });
  }
});

module.exports = {
  search,
};
