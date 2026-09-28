import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../utils/api';

const ResetPasswordScreen = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Clear temporary reset-flow state when leaving the screen.
    return () => {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('verified');
    };
  }, []);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '' },
    validationSchema: Yup.object({
      password: Yup.string().required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Required') }),
    onSubmit: async (values) => {
      try {
        await axios.patch(`${API_BASE_URL}/auth/reset-password`, {
          password: values.password,
          confirmPassword: values.confirmPassword });
        sessionStorage.removeItem('user');
        navigate('/loginform'); // Redirect to login
      } catch (error) {
        setError('Failed to reset password.');
      }
    } });

  return (
    <div className='bg-black min-h-screen flex items-center justify-center'>
      <div className="flex flex-col lg:flex-row justify-center items-center bg-[#25292e]  text-gray-100 rounded-lg shadow-lg max-w-4xl w-full">
        {/* Left side with image */}
        <div className="w-full lg:w-1/2">
          <img
            src="/images/reset.png"
            alt="Reset Password"
            className="w-full h-full lg:object-cover lg:rounded-lg"
          />
        </div>

        {/* Right side with form */}
        <div className="w-full lg:w-1/2 p-6 ">
          <p className="text-2xl text-center font-bold mb-5">Reset Your Password</p>

          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-lg font-medium">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                onChange={formik.handleChange}
                value={formik.values.password}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-600 text-sm mt-2">{formik.errors.password}</div>
              ) : null}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-lg font-medium">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                onChange={formik.handleChange}
                value={formik.values.confirmPassword}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                <div className="text-red-600 text-sm mt-2">{formik.errors.confirmPassword}</div>
              ) : null}
            </div>

            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

            <button
              type="submit"
              className="w-full py-2 px-4 mt-6 bg-black text-white rounded-md shadow-sm hover:bg-gray-600 focus:ring-2 focus:ring-offset-2"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
