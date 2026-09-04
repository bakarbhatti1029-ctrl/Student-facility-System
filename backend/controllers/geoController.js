const getLatLngFromAddress = require('../utils/geocodingService');
const KnownInstitute = require('../models/KnownInstitute');

// Public endpoint used by the hostel-owner registration map picker's
// "Locate my address" button, to jump the pin near a typed address before
// the owner fine-tunes it by dragging. Wraps the same geocoding service
// registration already uses as its address-only fallback.
exports.geocodeAddress = async (req, res) => {
  const { address } = req.body;

  if (!address || typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ message: 'Address is required' });
  }

  try {
    const result = await getLatLngFromAddress(address.trim());
    if (!result) {
      return res.status(404).json({ message: 'Could not locate that address' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Geocoding failed' });
  }
};

// Public autocomplete endpoint backing the university/institute search boxes
// (student hostel search + hostel-owner "nearby institute" registration
// field). Only searches the self-growing KnownInstitute cache — cheap,
// no network — so it can't 429 Nominatim under fast typing.
exports.searchInstitutes = async (req, res) => {
  const q = (req.query.q || '').trim();

  if (q.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = await KnownInstitute.find({ name: { $regex: escaped, $options: 'i' } })
      .limit(25)
      .lean();

    const seen = new Set();
    const distinct = [];
    for (const m of matches) {
      if (seen.has(m.name)) continue;
      seen.add(m.name);
      distinct.push({ name: m.name, lat: m.lat, lng: m.lng });
      if (distinct.length >= 8) break;
    }

    res.status(200).json(distinct);
  } catch (error) {
    console.error('Institute search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};
