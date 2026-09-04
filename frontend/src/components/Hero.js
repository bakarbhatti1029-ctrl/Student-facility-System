import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../src/animation.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const HeroSection = ({ topMarginClass = "mt-32" }) => {
  const [swap, setSwap] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Toggle swap state every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSwap((prev) => !prev);
      setAnimationKey((prevKey) => prevKey + 1); // Change key to reset animation
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    // Main div with border added
    <div className={`  rounded-lg shadow-lg bg-[#25292e] ${topMarginClass} border border-[#59636e]`}>
      <section className="hero-section mb-4">
        {/* First Div */}
        <div
          className={`flex flex-col-reverse md:flex-row items-center ${
            swap ? 'md:flex-row-reverse' : 'md:flex-row'
          } mb-8 transition-all duration-500`}
        >
          <div
            key={`text1-${animationKey}`} // Dynamic key to trigger animation for text
            className="text-container p-10 md:w-1/2  animate-fadeSlide"
          >
            <h1 className="text-3xl font-bold text-white">Your Home Away from Home</h1>
            <p className="mt-4 text-white">
            Looking for a comfortable and affordable place to stay? Our platform connects you with the best hostels tailored to meet the needs of students and travelers. Each hostel offers a welcoming environment, modern amenities, and easy access to nearby attractions. With a variety of rooms and flexible booking options, you can choose what fits your lifestyle and budget. Experience hassle-free living with our carefully curated hostels, ensuring you feel at home even when you're away.
            </p>
           
            <Link to='/hostel-booking'>
            <div className='flex bg-[#ECDFCC] items-center rounded w-[160px] mt-9 p-4'>
              <button className='   font-bold  '>Visit Hostels</button>
              <div className='ml-2'>
              <FontAwesomeIcon icon={faArrowRight}  />
              </div>
              </div>
            </Link>
          </div>
          <div className=" bg-[#25292e] md:w-1/2 h-[300px]">
            <Link to="/hostel-booking">
              <img
                key={`hero1-${animationKey}`} // Dynamic key to trigger animation for image
                src="/images/hostels.png"
                alt="Hero 1"
                className="w-full h-[220px] md:h-[350px] rounded "
              />
            </Link>
          </div>
        </div>

        {/* Second Div */}
        <div
          className={`flex flex-col md:flex-row items-center ${
            swap ? 'md:flex-row' : 'md:flex-row-reverse'
          } transition-all duration-500`}
        >
          <div
            key={`text2-${animationKey}`} // Dynamic key to trigger animation for text
            className="text-container md:w-1/2 p-8 animate-fadeSlide"
          >
            <h1 className="text-3xl font-bold text-white">Homemade Delights</h1>
            <p className="mt-4 text-white">
            Craving delicious homemade meals without the hassle of cooking? Our homemade food services bring freshly prepared, nutritious dishes right to your doorstep. Whether you're a busy student or a working professional, you can enjoy a variety of meals crafted with love by local kitchens. From hearty meals to healthy snacks, our food is both affordable and satisfying, offering you a taste of home wherever you are. Let us take care of your meals, so you can focus on what matters most!</p>
            <Link to='/kitchens'>
            <div className='flex bg-[#ECDFCC] items-center rounded w-[160px] mt-9 p-4'>
              <button className='   font-bold  '>Visit Kitchens</button>
              <div className='ml-2'>
              <FontAwesomeIcon icon={faArrowRight}  />
              </div>
              </div>
            </Link>
          </div>
          <div className="image-container md:w-1/2  ">
            <Link to="/home-made-food">
              <img
                key={`hero2-${animationKey}`} // Dynamic key to trigger animation for image
                src="/images/kitchens.png"
                alt="Hero 2"
                className="w-full h-[220px] md:h-[350px] rounded "
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
