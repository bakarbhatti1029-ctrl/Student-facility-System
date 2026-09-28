const isProduction = process.env.NODE_ENV === 'production';
const sameSite = isProduction ? 'none' : 'lax';
const crypto = require('crypto');

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function getSessionToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.split(' ')[1];
  }
  return parseCookies(req.headers.cookie).sfs_session;
}

function setSessionCookie(res, token) {
  res.cookie('sfs_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
}

function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('sfs_csrf', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
  res.set('X-CSRF-Token', token);
  return token;
}

function clearSessionCookie(res) {
  res.clearCookie('sfs_session', { httpOnly: true, secure: isProduction, sameSite, path: '/' });
  res.clearCookie('sfs_csrf', { httpOnly: false, secure: isProduction, sameSite, path: '/' });
  setCsrfCookie(res);
}

module.exports = { parseCookies, getSessionToken, setSessionCookie, setCsrfCookie, clearSessionCookie };
