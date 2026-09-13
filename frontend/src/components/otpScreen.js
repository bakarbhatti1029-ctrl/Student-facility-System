import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import Cookies from 'js-cookie';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

const OtpScreen = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setIsOtpExpired(true); // OTP expired when timer reaches 0
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (isOtpExpired) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    try {
      const token = Cookies.get('token');
      const verified = sessionStorage.getItem('verified');
      if (verified) {
        console.log("i am in otp screen");
        const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { otp }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        Cookies.set('token', response.data.token);
        sessionStorage.removeItem('verified');
        navigate('/reset-password');
        return;
      }
      else{
        const response = await axios.patch(`${API_BASE_URL}/auth/verifyEmail`, { otp }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        Cookies.set('token', response.data.token); // Set the real post-verification token
        sessionStorage.removeItem('verified');
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        if(response.status === 200){
          const role = response.data.user?.role;
          if (role === 'hostelOwner') {
            navigate('/hostel-owner-profile');
          } else if (role === 'kitchenOwner') {
            navigate('/kitchen-owner-profile');
          } else {
            navigate('/');
          }
        }
        return;
      }
      
    } catch (error) {
      setError('Invalid OTP or verification failed.');
    }
  };

  const handleResendOtp = async () => {
    try {
      console.log("i am in resend otp");

      const token = Cookies.get('token');
      await axios.get(`${API_BASE_URL}/auth/resendOTP`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTimeLeft(300);
      setMessage('OTP resent successfully');
      setError('');
      setIsOtpExpired(false);
    } catch (error) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div className='bg-black min-h-screen flex items-center justify-center'>
      <div className="flex flex-col lg:flex-row justify-center items-center bg-gray-800 text-gray-100 rounded-lg shadow-lg max-w-4xl w-full">
        {/* Left side with form */}
        <div className="w-full lg:w-1/2 p-6">
          <p className="text-2xl text-center font-bold mb-2">Please Check your Email</p>
          <p className="text-sm text-center text-gray-400 mb-5">Didn't get the code? Check your spam folder.</p>

          <form onSubmit={handleOtpSubmit}>
            <div className="mb-4">
              <label htmlFor="otp" className="block text-lg font-medium">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                className="mt-1 p-2 block w-full bg-[#25292e] border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                disabled={isOtpExpired}
              />
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              {message && <div className="text-green-600 text-sm mt-2">{message}</div>}
            </div>
            <div className='flex gap-20'>
            <button
              onClick={handleResendOtp}
              type="button"
              className=" text-lg rounded-md shadow-sm font-semibold text-gray-300 underline"
            >
              Resend OTP
            </button>
            <p className="text-center text-red-400 ">
            OTP will expire in {formatTime(timeLeft)} {isOtpExpired && '(Expired)'}
          </p>
            
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 mt-6 hover:bg-black border-gray-300 bg-[#25292e] text-white rounded-md shadow-sm  "
              disabled={isOtpExpired} // Disable button if OTP is expired
            >
              Verify OTP
            </button>
          </form>
        </div>

        {/* Right side with image */}
        <div className="w-full lg:w-1/2">
          <img
            src="https://media.istockphoto.com/id/1435713006/photo/cyber-security-concept-businessmans-hand-enter-a-one-time-password-for-the-validation-process.webp?a=1&b=1&s=612x612&w=0&k=20&c=QFpM17OUY9N-KQKpx6v6kxQ4JUcevbNsdrHjSI-eQd0="
            alt="OTP Illustration"
            className="w-full h-full  lg:object-cover lg:rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default OtpScreen;
