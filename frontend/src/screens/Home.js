import React, { useState, useEffect } from 'react';
import SEO from '../components/common/SEO';
import Navbar from '../components/Navbar';
import HeroSection from '../components/Hero';
import Mission from '../components/Mission';
import Reviews from '../components/reviews';
import Footer from '../components/Footer';
import ChatBot from '../components/chatBot/ChatBot';
import SplashScreen from '../components/splashScreen/SplashScreen';
import Marquee from '../components/common/Marquee';

const Home = () => {
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(() => {
    // Check if splash screen has been shown before
    const splashShown = sessionStorage.getItem('splashShown');
    return splashShown ? false : true;
  });

  useEffect(() => {
    if (loading) {
      // Simulate loading time or fetch necessary data
      const timer = setTimeout(() => {
        setLoading(false);
        // Mark splash screen as shown
        sessionStorage.setItem('splashShown', 'true');
      }, 3000); // 3 seconds splash screen display

      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className='bg-[#697565] border border-[#59636e] min-h-screen flex flex-col'>
      <SEO
        title="Hostel Booking & Homemade Food for Students in Lahore"
        description="Student Facility System connects students in Lahore with quality hostel accommodations and homemade food from local kitchens."
      />
      <Navbar module={'home'} setShowCart={setShowCart} />
      <Marquee
        className="mt-28"
        text="⚠️ Note: Our OTP verification emails sometimes land in your Spam/Junk folder — please check there if you don't see it in your inbox."
      />
      <div className='container rounded-lg mx-auto flex flex-col'>
        <HeroSection topMarginClass="mt-8" />
        <Mission />
        <Reviews /> 
        <div style={{ position: 'fixed', bottom: 0, right: 0, margin: '10px' }}>
          <ChatBot />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
