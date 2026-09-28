const crypto = require('crypto');
const { parseCookies } = require('../utils/sessionCookie');

// Double-submit CSRF protection for cookie-authenticated state-changing calls.
// Legacy Bearer calls are intentionally left compatible during migration.
module.exports = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.sfs_session) return next(); // Public endpoints (login/register etc.)
  const supplied = req.headers['x-csrf-token'];
  const suppliedBuffer = Buffer.from(typeof supplied === 'string' ? supplied : '');
  const cookieBuffer = Buffer.from(cookies.sfs_csrf || '');
  if (!supplied || !cookies.sfs_csrf || suppliedBuffer.length !== cookieBuffer.length
      || !crypto.timingSafeEqual(suppliedBuffer, cookieBuffer)) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token.' });
  }
  next();
};
