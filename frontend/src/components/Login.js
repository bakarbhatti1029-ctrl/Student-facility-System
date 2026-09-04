import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { updateCartSummary } from '../store/cartSlice';
import { loginUser, setCredentials } from '../store/authSlice';
import { toast } from 'react-toastify';
import API_BASE_URL from '../utils/api';


const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (token && user) {
      dispatch(setCredentials({ token, user })); // Restore auth state without re-calling API
      navigate('/'); // Redirect to home if already logged in
    }
  }, [dispatch, navigate]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await dispatch(loginUser(values)).unwrap();
        const { token, user, cartSummary } = response;
        Cookies.set('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));

        dispatch(updateCartSummary(cartSummary));

        // Clear any verification data
        sessionStorage.removeItem('verified');
        
        if (user.role === 'student') {
          toast.success(`${user.first_name} ${user.last_name} has successfully logged in!`);
          navigate('/');
        } else if (user.role === 'hostelOwner') {
          navigate('/hostel-owner-profile');
        } else if (user.role === 'kitchenOwner') {
          navigate('/kitchen-owner-profile');
        }
      } catch (error) {
        setError('Invalid email or password');
      }
    },
  });

  const handleForgotPassword = async () => {
    if (!formik.values.email) {
      setError('Please enter your email address to reset your password');
    } else if (formik.errors.email) {
      setError('Please enter a valid email address');
    } else {
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formik.values.email }),
        });
        const data = await response.json();
        if (response.ok) {
          Cookies.set('token', data.token);
          sessionStorage.setItem('verified', data.verified);
          navigate('/otp');
          toast.success('OTP sent to your email.');
        } else {
          setError(data.message || 'Failed to send OTP');
        }
      } catch (error) {
        setError('An error occurred. Please try again.');
      }
    }
  };
  

  return (
    <div className="h-full w-full bg-black">
    
      <div className="bg-black h-full w-full flex flex-col md:flex-row justify-center container">

        <div className="flex flex-col items-center  justify-center max-h-[100vh] bg-black mb-12 mt-8">

          <img
            className="w-[85vw] max-w-[500px] h-auto md:h-[500px] mt-5 rounded-md bg-black"
            src="/images/login.jpg"
            alt="Login Illustration"
          />
        </div>
        <div className="px-4 md:pl-10 md:px-0 flex flex-col justify-center relative bg-black p-3 mt-8 mb-12 w-full max-w-lg overflow-y-auto scrollbar-hide h-auto md:h-[100vh]">
        <div className="text-gray-300 text-center pt-9 justify-end">
            <h1 className="font-bold text-4xl">Welcome Back</h1>
            <p className="text-wrap max-w-md p-3">
              Welcome back! Please enter your credentials.
            </p>
          </div>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="email" className="block text-lg font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                value={formik.values.email}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-600 text-sm">{formik.errors.email}</div>
              ) : null}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-lg font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                onChange={formik.handleChange}
                value={formik.values.password}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-600 text-sm">{formik.errors.password}</div>
              ) : null}
            </div>

            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-2 text-gray-300 hover:text-gray-500 font-semibold rounded-md shadow-sm"
            >
              Forgot Password?
            </button>
            <button
              type="submit"
              className="w-full py-2 px-4 mt-6 hover:bg-black text-gray-300 font-bold rounded-md shadow-sm focus:ring-2 hover:border-gray-600 focus:ring-indigo-500 focus:ring-offset-2 bg-[#25292e]"
            >
              Login
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center text-gray-300">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-900">
              Sign up first
            </Link>
          </p>

          {/* Discreet Admin Login link */}
          <p className="mt-3 text-center">
            <Link
              to="/admin/login"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200"
            >
              Admin Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
