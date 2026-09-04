const cloudinary = require('../config/cloudinary');

// Streams an in-memory buffer straight to Cloudinary — same upload_stream
// pattern as uploadController.js, generalized to non-image resource types
// (e.g. 'raw' for PDFs) since that controller is hardcoded to images.
function uploadBufferToCloudinary(buffer, { folder, resource_type = 'raw', public_id } = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type, public_id },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// Cloudinary denies unsigned delivery of raw files (PDF/ZIP) by default on
// all accounts as an anti-abuse measure — plain secure_url returns 401
// ("deny or ACL failure"). A signed URL proves the request comes from the
// account holder and bypasses that restriction; unlike upload-API signing,
// this signature has no expiry, so it's safe to store permanently.
// The attachment filename must NOT contain a "." — Cloudinary's transformation
// parser misreads a dot as starting a new (invalid) flag.
function getSignedFileUrl(publicId, { resourceType = 'raw', version, attachmentFilename } = {}) {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    version,
    sign_url: true,
    secure: true,
    flags: attachmentFilename ? `attachment:${attachmentFilename}` : 'attachment',
  });
}

module.exports = { uploadBufferToCloudinary, getSignedFileUrl };
