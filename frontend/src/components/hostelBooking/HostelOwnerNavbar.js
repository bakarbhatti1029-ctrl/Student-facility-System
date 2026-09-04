// src/components/HostelNavbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const OWNER_LINKS = [
  { label: 'Dashboard', to: '/hostelOwnerDashboard' },
  { label: 'Profile', to: '/hostel-owner-profile' },
  { label: 'Personal Profile', to: '/profile' },
  { label: 'Rooms', to: '/hostel-owner-profile/totalroom' },
  { label: 'Booking', to: '/booking' },
];

const MOBILE_BREAKPOINT = 768;

const HostelNavbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Desktop vs mobile is decided in JS, not via Tailwind's `md:` classes -
  // the deployed CSS bundle was found to be missing `md:` responsive
  // utilities (a Vercel build-cache issue), so this can't depend on CSS
  // media queries to work correctly.
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const token = Cookies.get('token');
    const user = sessionStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock background scroll while the mobile drawer is open, otherwise the
  // page underneath the translucent backdrop can still be scrolled/swiped.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    Cookies.remove('token');
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    setShowLogoutModal(false);
    navigate('/'); // Redirect to home or login page after logout
  };

  const handleCancel = () => {
    setShowLogoutModal(false);
  };

  const renderLinks = (onLinkClick) => (
    <>
      {OWNER_LINKS.map((link) => (
        <li key={link.label} className="text-white text-2xl font-semibold hover:bg-gray-900 px-3 py-2 rounded">
          <Link to={link.to} onClick={onLinkClick}>{link.label}</Link>
        </li>
      ))}
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile: slim top bar - hamburger only, no logo/title */}
          <div className="fixed top-0 left-0 w-full h-14 bg-gray-800 z-40 flex items-center px-4">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          {/* Mobile: backdrop + dropdown drawer (the only hamburger menu on these pages) */}
          {isMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMenu} />
          )}
          {isMenuOpen && (
            <nav className="fixed top-14 left-0 w-full max-h-[calc(100vh-3.5rem)] overflow-y-auto bg-gray-800 z-50 p-4 flex flex-col justify-between">
              <ul className="space-y-2">
                {renderLinks(closeMenu)}
              </ul>
              <div className="mt-4">
                <Link to="/" target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="text-white text-xl font-semibold hover:bg-gray-900 px-3 py-2 rounded">
                  Visit Website
                </Link>
                {isLoggedIn && (
                  <div className="mt-4">
                    <button
                      onClick={handleLogoutClick}
                      className="bg-[#ECDFCC] hover:bg-[#D6C4B0] px-4 py-2 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </>
      ) : (
        /* Desktop: traditional sidebar, sticky (not fixed) so it can't overlap
           content that comes after it in the page (e.g. anything below the fold). */
        <nav className="flex w-[180px] shrink-0 h-screen sticky top-0 self-start p-4 flex-col justify-between bg-gray-800 z-30">
          <ul className="mt-20 space-y-4">
            {renderLinks(undefined)}
          </ul>

          <div className="mb-4">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="text-white text-xl font-semibold  hover:bg-gray-900 px-3 py-2 rounded">
              Visit Website
            </Link>
            {isLoggedIn && (
              <div className="ml-4 mt-6">
                <button
                  onClick={handleLogoutClick}
                  className="bg-[#ECDFCC] hover:bg-[#D6C4B0] px-4 py-2 rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[#25292e] p-6 rounded-lg text-center shadow-lg text-white">
            <p className="text-xl mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-around">
              <button
                onClick={handleLogoutConfirm}
                className="bg-[#ECDFCC] hover:bg-[#D6C4B0] text-black px-6 py-2 rounded-lg"
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
    </>
  );
};

export default HostelNavbar;
