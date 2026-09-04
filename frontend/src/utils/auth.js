import Cookies from 'js-cookie';

export const readStoredAuth = () => {
  const token = Cookies.get('token') || null;
  let user = null;

  try {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error);
  }

  return { token, user };
};
