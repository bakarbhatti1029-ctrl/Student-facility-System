// Image upload route — device-file uploads for registration & profile forms.
// The frontend's "paste a URL" option deliberately does NOT go through this
// route; it just sends the typed URL straight to the register/profile endpoints.
const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { uploadImage } = require('../controllers/uploadController/uploadController');

// Keep the file in memory only long enough to stream it to Cloudinary — never
// written to disk, so there's nothing to clean up on this server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — matches uploadController's check
});

// Uploads are a bit more expensive than a normal API call, so keep this tighter
// than the general limiter but loose enough for a real registration flow.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many image uploads. Please wait a few minutes and try again.' },
});

router.post('/image', uploadLimiter, upload.single('image'), uploadImage);

module.exports = router;
