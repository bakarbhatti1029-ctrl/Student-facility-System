export const readStoredAuth = () => {
  let user = null;

  try {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) user = JSON.parse(storedUser);
  } catch {
    sessionStorage.removeItem('user');
  }

  return { user };
};
