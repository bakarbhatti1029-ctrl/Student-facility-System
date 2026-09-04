import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 200);

    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="blur-background"></div>
      <div className="content">
        <h1>Welcome to Student Facility System</h1>
        <p>Your one-stop solution for managing hostel & HomeMade meals bookings.</p>
        <div className="loading-bar">
          <div className="progress" style={{ width: `${loadingProgress}%` }}></div>
        </div>
        <p>Loading... {loadingProgress}%</p>
      </div>
    </div>
  );
};

export default SplashScreen;