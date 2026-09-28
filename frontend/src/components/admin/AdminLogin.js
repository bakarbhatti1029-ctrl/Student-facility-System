import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
      sessionStorage.setItem('adminData', JSON.stringify(response.data.admin));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/forgot-password`, { email });
      setNotice(response.data.message);
      setView('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request a password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/verify-password-reset-otp`, { email, otp });
      setView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/reset-password`,
        { password: newPassword, confirmPassword }
      );
      setNotice(response.data.message);
      setView('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset the password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const returnToLogin = () => {
    setView('login');
    setError('');
    setNotice('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const isRecovery = view !== 'login';
  const title = view === 'login'
    ? 'Admin Portal'
    : view === 'request'
      ? 'Forgot Password'
      : view === 'otp'
        ? 'Verify Your Email'
        : 'Set New Password';
  const description = view === 'login'
    ? 'Welcome back! Please enter your admin credentials.'
    : view === 'request'
      ? 'Enter your admin email and we will send a password reset code.'
      : view === 'otp'
        ? 'Enter the verification code sent to your email address.'
        : 'Choose a new password for your admin account.';

  return (
    <div className="h-full w-full bg-black">
      <div className="bg-black h-full w-full flex flex-col md:flex-row justify-center container">
        <div className="flex flex-col items-center justify-center max-h-[100vh] bg-black mb-12 mt-8">
          <img className="w-[85vw] max-w-[500px] h-auto md:h-[500px] mt-5 rounded-md bg-black" src="/images/login.jpg" alt="Login Illustration" />
        </div>
        <div className="px-4 md:pl-10 md:px-0 flex flex-col justify-center relative bg-black p-3 mt-8 mb-12 w-full max-w-lg overflow-y-auto scrollbar-hide h-auto md:h-[100vh]">
          <div className="text-gray-300 text-center pt-9 justify-end">
            <h1 className="font-bold text-4xl">{title}</h1>
            <p className="text-wrap max-w-md p-3">{description}</p>
          </div>

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="mb-4">
                <label htmlFor="admin-email" className="block text-lg font-medium text-gray-300">Email</label>
                <input id="admin-email" name="email" type="email" autoComplete="username" onChange={(e) => setEmail(e.target.value)} value={email} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              <div className="mb-4">
                <label htmlFor="admin-password" className="block text-lg font-medium text-gray-300">Password</label>
                <input id="admin-password" name="password" type="password" autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} value={password} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { setView('request'); setError(''); setNotice(''); }} className="text-sm text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </button>
              </div>
              {notice && <div role="status" className="text-green-400 text-sm">{notice}</div>}
              {error && <div role="alert" className="text-red-500 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-2 px-4 mt-6 hover:bg-black text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 hover:border-gray-600 focus:ring-indigo-500 focus:ring-offset-2 bg-[#25292e] disabled:opacity-50">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {view === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-lg font-medium text-gray-300">Admin email</label>
                <input id="reset-email" name="email" type="email" autoComplete="email" onChange={(e) => setEmail(e.target.value)} value={email} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              {error && <div role="alert" className="text-red-500 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-2 px-4 mt-6 text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 bg-[#25292e] disabled:opacity-50">
                {loading ? 'Sending code...' : 'Send reset code'}
              </button>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="reset-otp" className="block text-lg font-medium text-gray-300">Verification code</label>
                <input id="reset-otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" onChange={(e) => setOtp(e.target.value)} value={otp} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              {notice && <div role="status" className="text-green-400 text-sm">{notice}</div>}
              {error && <div role="alert" className="text-red-500 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-2 px-4 mt-6 text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 bg-[#25292e] disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
              <button type="button" onClick={() => { setView('request'); setError(''); setNotice(''); }} className="w-full text-sm text-indigo-400 hover:text-indigo-300">
                Use a different email
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-admin-password" className="block text-lg font-medium text-gray-300">New password</label>
                <input id="new-admin-password" name="newPassword" type="password" autoComplete="new-password" minLength="6" onChange={(e) => setNewPassword(e.target.value)} value={newPassword} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              <div>
                <label htmlFor="confirm-admin-password" className="block text-lg font-medium text-gray-300">Confirm new password</label>
                <input id="confirm-admin-password" name="confirmPassword" type="password" autoComplete="new-password" minLength="6" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white" />
              </div>
              {error && <div role="alert" className="text-red-500 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-2 px-4 mt-6 text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 bg-[#25292e] disabled:opacity-50">
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          )}

          {isRecovery && (
            <button type="button" onClick={returnToLogin} className="mt-5 w-full text-sm text-gray-400 hover:text-gray-200">
              Back to login
            </button>
          )}

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
