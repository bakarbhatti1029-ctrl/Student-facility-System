import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Styled as an exact twin of the student Login page (Login.js) so the
// admin area looks consistent with the rest of the website.
const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-black">
      <div className="bg-black h-full w-full flex flex-col md:flex-row justify-center container">
        <div className="flex flex-col items-center justify-center max-h-[100vh] bg-black mb-12 mt-8">
          <img className="w-[85vw] max-w-[500px] h-auto md:h-[500px] mt-5 rounded-md bg-black" src="/images/login.jpg" alt="Login Illustration" />
        </div>
        <div className="px-4 md:pl-10 md:px-0 flex flex-col justify-center relative bg-black p-3 mt-8 mb-12 w-full max-w-lg overflow-y-auto scrollbar-hide h-auto md:h-[100vh]">
          <div className="text-gray-300 text-center pt-9 justify-end">
            <h1 className="font-bold text-4xl">Admin Portal</h1>
            <p className="text-wrap max-w-md p-3">Welcome back! Please enter your admin credentials.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="admin-email" className="block text-lg font-medium text-gray-300">Email</label>
              <input id="admin-email" name="email" type="email" onChange={(e) => setEmail(e.target.value)} value={email} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
            </div>
            <div className="mb-4">
              <label htmlFor="admin-password" className="block text-lg font-medium text-gray-300">Password</label>
              <input id="admin-password" name="password" type="password" onChange={(e) => setPassword(e.target.value)} value={password} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
            </div>
            {loginError && <div className="text-red-600 text-sm mb-4">{loginError}</div>}
            <button type="submit" disabled={loginLoading} className="w-full py-2 px-4 mt-6 hover:bg-black text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 hover:border-gray-600 focus:ring-indigo-500 focus:ring-offset-2 bg-[#25292e] disabled:opacity-50">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-300">
            Not an administrator?{' '}
            <Link to="/loginform" className="text-indigo-600 font-bold hover:text-indigo-900">Student Login</Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-600">Access restricted to authorized administrators only.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
