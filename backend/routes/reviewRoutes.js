// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/AuthToken');
const {
  getRecentReviews,
  getReviewsForTarget,
  getMyEligibility,
  createOrUpdateReview,
} = require('../controllers/reviewController/reviewController');

// Public: recent reviews for the home page carousel.
router.get('/recent', getRecentReviews);

// Auth: can the logged-in student review this place? (+ their existing review)
router.get('/eligibility', authenticateToken, getMyEligibility);

// Auth: create or update the student's review for a place.
router.post('/', authenticateToken, createOrUpdateReview);

// Public: all reviews for one hostel/kitchen (+ average). Keep LAST so the
// two-segment pattern doesn't swallow /recent or /eligibility above.
router.get('/:target_type/:target_id', getReviewsForTarget);

module.exports = router;
