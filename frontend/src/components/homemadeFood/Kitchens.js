import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';
import Footer from '../Footer';
import SEO from '../common/SEO';
import API_BASE_URL from '../../utils/api';

// Skeleton component for shimmer effect
const SkeletonCard = () => (
  <div className="max-w-sm rounded overflow-hidden shadow-lg animate-pulse">
    <div className="bg-gray-300 h-48 w-full"></div>
    <div className="px-6 py-4 bg-[#3C3D37]">
      <div className="h-6 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400"></div>
    </div>
  </div>
);

const Kitchens = () => {
  const [kitchensData, setKitchensData] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading

  useEffect(() => {
    const fetchKitchens = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/kitchen/getAllKitchens`);
        const kitchens = response.data.data;
        setKitchensData(kitchens);
        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error('Error fetching kitchens:', error);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchKitchens();
  }, []);

  const truncateDescription = (description, wordLimit) => {
    const words = description.split(' ');
    if (words.length > wordLimit) {
      return {
        truncated: words.slice(0, wordLimit).join(' ') + '...',
        full: description
      };
    }
    return {
      truncated: description,
      full: description
    };
  };

  return (
    <>
      <SEO
        title="Homemade Food Kitchens"
        description="Browse homemade food kitchens across Lahore and order affordable, home-cooked meals for students."
      />
      <Navbar module={'food'} />
      <div className='bg-[#697565] border-b border-gray-500 pb-8 pt-32 text-white'>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">All Kitchens</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loading
              ? Array(6).fill(0).map((_, index) => <SkeletonCard key={index} />) // Display skeletons while loading
              : kitchensData.map(kitchen => {
                  const { truncated, full } = truncateDescription(kitchen.kitchen_description, 8);
                  return (
                    <div key={kitchen._id} className="max-w-sm rounded overflow-hidden shadow-lg">
                      <Link 
                        to={`/kitchen/${kitchen._id}`}
                        state={{ kitchen }} // Passing kitchen data as state
                      >
                        <img
                          className="w-full cursor-pointer h-48 object-cover"
                          src={kitchen.kitchen_picture}
                          alt={kitchen.kitchen_name}
                        />
                      </Link>
                      <div className="px-6 py-4 bg-[#1E201E] text-white">
                        <p className="font-bold text-xl mb-2">{kitchen.kitchen_name}</p>
                        <p className="text-base">{kitchen.address}</p>
                        <p className="text-base">
                          {truncated}
                          {truncated !== full && (
                            <span className="text-[#ECDFCC] cursor-pointer" onClick={() => alert(full)}> Read More</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Kitchens;
