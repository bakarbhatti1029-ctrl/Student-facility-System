const csrfProtection = require('../middlewares/csrfProtection');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('CSRF protection', () => {
  test('allows public state-changing requests with no session cookie', () => {
    const next = jest.fn();
    csrfProtection({ method: 'POST', headers: {} }, makeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('rejects a cookie-authenticated write with no CSRF token', () => {
    const response = makeResponse();
    csrfProtection({ method: 'PATCH', headers: { cookie: 'sfs_session=session-jwt' } }, response, jest.fn());
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ message: 'Invalid or missing CSRF token.' });
  });

  test('allows a cookie-authenticated write when the double-submit token matches', () => {
    const next = jest.fn();
    csrfProtection({
      method: 'DELETE',
      headers: { cookie: 'sfs_session=session-jwt; sfs_csrf=known-token', 'x-csrf-token': 'known-token' },
    }, makeResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
