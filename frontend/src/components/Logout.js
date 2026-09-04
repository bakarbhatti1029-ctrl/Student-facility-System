// src/components/Logout.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice'; // Import the logout action

const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogoutClick = () => {
    setShowConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    sessionStorage.removeItem('verified');
    sessionStorage.removeItem('user');
    Cookies.remove('token');
    dispatch(logout()); // Dispatch the logout action
    navigate('/'); // Navigate to the home page after logout
  };

  const handleCancel = () => {
    navigate('/'); // Navigate to the home page on cancel
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#181C14] text-white">
      {!showConfirmation ? (
        <button
          onClick={handleLogoutClick}
          className="bg-red-500 px-6 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      ) : (
        <div className="bg-[#25292e] p-8 rounded-lg text-center shadow-lg">
          <p className="text-xl text-white mb-4">Are you sure you want to logout?</p>
          <div className="flex justify-around">
            <button
              onClick={handleLogoutConfirm}
              className="bg-red-500 px-6 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 px-6 py-2 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logout;
