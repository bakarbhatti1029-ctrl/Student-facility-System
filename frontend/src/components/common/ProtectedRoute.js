import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import { setCredentials } from '../../store/authSlice';

// The browser-side guard restores identity from the server; the API remains
// responsible for authorization on every protected request.
export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const isAdminRoute = allowedRoles?.some((role) => role === 'admin' || role === 'super_admin') || false;
  const [user, setUser] = useState(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const endpoint = isAdminRoute ? '/api/admin/me' : '/auth/me';
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        const authenticatedUser = isAdminRoute ? response.data.admin : response.data.user;
        if (!active) return;
        setUser(authenticatedUser);
        sessionStorage.setItem(isAdminRoute ? 'adminData' : 'user', JSON.stringify(authenticatedUser));
        if (!isAdminRoute) dispatch(setCredentials({ user: authenticatedUser }));
      } catch {
        if (!active) return;
        sessionStorage.removeItem(isAdminRoute ? 'adminData' : 'user');
      } finally {
        if (active) setResolved(true);
      }
    };
    restore();
    return () => { active = false; };
  }, [dispatch, isAdminRoute]);

  if (!resolved) return <div role="status">Checking session...</div>;
  if (!user) {
    return <Navigate to={isAdminRoute ? '/admin/login' : '/loginform'} replace state={{ from: location }} />;
  }
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
