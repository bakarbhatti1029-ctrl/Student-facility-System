// Handles image uploads for registration & profile forms (student/hostel/kitchen
// pictures). Accepts a multipart file (from the user's device) and streams it
// to Cloudinary, returning a hosted URL to store in MongoDB — the "paste a URL"
// path in the frontend never touches this endpoint at all, it just uses the
// text the user typed directly.
const cloudinary = require('../../config/cloudinary');
const logger = require('../../utils/logger');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file was provided.' });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Unsupported image type. Please upload a JPG, PNG, WEBP, or GIF file.',
      });
    }

    if (req.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({
        message: `Image is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`,
      });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.error('Cloudinary env vars are not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).');
      return res.status(500).json({
        message: 'Image upload is not configured on the server yet. Please use the "Image URL" option instead, or contact the site admin.',
      });
    }

    const folder = `sfs/${req.body.type || 'general'}`;

    const uploadFromBuffer = () =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            // Cap dimensions server-side so a huge phone photo doesn't bloat storage/CDN cost.
            transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

    const result = await uploadFromBuffer();

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    return res.status(500).json({ message: 'Image upload failed. Please try again, or use the "Image URL" option.' });
  }
};
