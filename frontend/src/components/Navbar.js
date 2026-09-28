import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getCartAPI } from '../store/cartSlice';
import { logout, setCredentials } from '../store/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faUser } from '@fortawesome/free-solid-svg-icons'; 
import axios from "axios";
import { toast } from 'react-toastify';
import API_BASE_URL from '../utils/api';
import PushNotificationButton from './common/PushNotificationButton';

const Navbar = ({ module }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const totalItems = useSelector((state) => state.cart.totalItems);
  const authUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE_URL}/auth/me`).then(({ data }) => {
      if (!active) return;
      sessionStorage.setItem('user', JSON.stringify(data.user));
      dispatch(setCredentials({ user: data.user }));
      setIsLoggedIn(true);
    }).catch(() => {
      if (!active) return;
      sessionStorage.removeItem('user');
      setIsLoggedIn(false);
    });
    return () => { active = false; };
  }, [dispatch]);
  

  const handleCartClick = async () => {
    try {
      await dispatch(getCartAPI()).unwrap(); 
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true); 
  };

  const handleLogoutConfirm = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      dispatch(logout());
      setIsLoggedIn(false);
      setShowLogoutModal(false);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not log out. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowLogoutModal(false);
  };

  const handleProfileClick = () => {
    if (authUser?.role === 'hostelOwner') {
      navigate('/hostel-owner-profile');
    } else if (authUser?.role === 'kitchenOwner') {
      navigate('/kitchen-owner-profile');
    } else {
      navigate('/profile');
    }
  };

  return (
    <nav className="bg-[#1E201E] p-4 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
     
      <Link to="/" className="relative overflow-hidden group">
  <img
    className="h-[60px] md:h-[60px] transition-all duration-300 ease-in-out transform group-hover:scale-105"
    alt="Logo"
    src='/images/logo.png'
  />
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-25 transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-in-out"></div>
</Link>



        {/* Toggle Button for Mobile Screens */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>

        {/* Main Navigation Links */}
        <div className={`${isOpen ? "block" : "hidden"} w-full md:flex md:items-center md:space-x-4 md:w-auto`}>
          {module === "hostel" && (
            <>
              <Link to="/" className="text-white hover:bg-gray-900 px-3 py-2 rounded">Home</Link>
              <Link to="/hostel-booking" className="text-white hover:bg-gray-900 px-3 py-2 rounded">Hostels</Link>
              <Link to='/booked-room'>
              <button className="text-white hover:bg-gray-900 px-3 py-2 rounded">Booking</button>
              </Link>
            </>
          )}

          {module === "food" && (
            <>
              <Link to="/" className="text-white hover:bg-gray-900 px-3 py-2 rounded">Home</Link>
              <Link to="/kitchens" className="text-white hover:bg-gray-900 px-3 py-2 rounded">Kitchens</Link>
              <Link to="/orders" className="text-white hover:bg-gray-900 px-3 py-2 rounded">Orders</Link>
              <div className="relative">
                <Link
                  to="/cart"
                  onClick={handleCartClick}
                  className="text-white hover:bg-gray-900 px-3 py-2 rounded"
                >
                  Cart
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full w-4 h-4 flex items-center justify-center">
                      <span className="text-white text-xs">{totalItems}</span>
                    </span>
                  )}
                </Link>
              </div>
            </>
          )}

          {module === "home" && (
            <>
              {!isLoggedIn ? (
                <>
                  <Link 
                    to="/register" 
                    className="block text-gray-900 bg-[#ECDFCC] hover:bg-[#D6C4B0] hover:text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md md:inline-block mr-3"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/loginform" 
                    className="block text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md md:inline-block"
                  >
                    Log In
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogoutClick}
                  className="block w-28 md:w-auto text-center text-black bg-[#ECDFCC] hover:bg-[#D6C4B0] px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md md:inline-block"
                >
                  Logout
                </button>
              )}

              {isLoggedIn && (
                <div className="mt-3 md:mt-0 md:ml-3 w-28 md:w-auto bg-white rounded-lg inline-block">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full md:w-auto flex items-center justify-center px-4 py-2 md:p-2 text-[#1E201E] hover:text-gray-700 focus:outline-none"
                    aria-label="Open profile"
                  >
                    <FontAwesomeIcon icon={faUser} />
                  </button>
                </div>
              )}
            </>
          )}
          {isLoggedIn && module !== 'home' && (
            <div className="mt-3 md:mt-0 md:ml-3"><PushNotificationButton /></div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#25292e] p-6 rounded-lg text-center shadow-lg text-white">
            <p className="text-xl mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-around">
              <button
                onClick={handleLogoutConfirm}
                className="text-black px-6 py-2 rounded-lg bg-[#ECDFCC] hover:bg-[#D6C4B0]"
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
