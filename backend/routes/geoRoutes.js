// Public geocoding helper — used by the registration page's map picker,
// before the user has an account/token, so no auth middleware here.
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { geocodeAddress, searchInstitutes } = require('../controllers/geoController');

// Proxies to Nominatim, so keep this tighter than the general limiter —
// same shape as uploadRoutes.js's uploadLimiter.
const geocodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many location lookups. Please wait a few minutes and try again.' },
});

// Only hits our own DB (no external service), so this can be looser to
// tolerate fast typing from the autocomplete boxes.
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many searches. Please slow down a moment.' },
});

router.post('/geocode', geocodeLimiter, geocodeAddress);
router.get('/geocode-search', searchLimiter, searchInstitutes);

module.exports = router;
