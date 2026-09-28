const { parseCookies } = require('../utils/sessionCookie');

describe('session cookie parsing', () => {
  test('extracts the HTTP-only session token from a Cookie header', () => {
    expect(parseCookies('theme=dark; sfs_session=abc.def; other=value')).toEqual({
      theme: 'dark',
      sfs_session: 'abc.def',
      other: 'value',
    });
  });

  test('handles an absent Cookie header', () => {
    expect(parseCookies()).toEqual({});
  });
});
