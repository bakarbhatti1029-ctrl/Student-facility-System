import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';
import Footer from '../Footer';
import SEO from '../common/SEO';
import API_BASE_URL from '../../utils/api';

// Skeleton component for shimmer effect
const SkeletonCard = () => (
  <div className="h-full w-full max-w-sm justify-self-center rounded-lg overflow-hidden shadow-lg animate-pulse bg-[#1E201E]">
    <div className="bg-gray-300 h-48 w-full"></div>
    <div className="h-40 px-6 py-4 bg-[#3C3D37]">
      <div className="h-6 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400"></div>
    </div>
  </div>
);

const Kitchens = () => {
  const [kitchensData, setKitchensData] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [selectedKitchen, setSelectedKitchen] = useState(null);

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

  useEffect(() => {
    if (!selectedKitchen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setSelectedKitchen(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedKitchen]);

  const truncateDescription = (description, wordLimit) => {
    const safeDescription = description || 'No description available.';
    const words = safeDescription.split(' ');
    if (words.length > wordLimit) {
      return {
        truncated: words.slice(0, wordLimit).join(' ') + '...',
        full: safeDescription
      };
    }
    return {
      truncated: safeDescription,
      full: safeDescription
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
                    <article key={kitchen._id} className="flex h-full w-full max-w-sm justify-self-center flex-col overflow-hidden rounded-lg bg-[#1E201E] shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                      <Link 
                        to={`/kitchen/${kitchen._id}`}
                        state={{ kitchen }} // Passing kitchen data as state
                        className="block h-48 shrink-0 overflow-hidden"
                      >
                        <img
                          className="h-full w-full cursor-pointer object-cover transition duration-300 hover:scale-105"
                          src={kitchen.kitchen_picture}
                          alt={kitchen.kitchen_name}
                        />
                      </Link>
                      <div className="flex min-h-[168px] flex-1 flex-col px-6 py-4 text-white">
                        <p className="mb-2 line-clamp-1 text-xl font-bold capitalize" title={kitchen.kitchen_name}>{kitchen.kitchen_name}</p>
                        <p className="mb-2 line-clamp-2 min-h-[48px] text-base leading-6 text-gray-200" title={kitchen.address}>{kitchen.address || 'Address not provided'}</p>
                        <p className="mt-auto line-clamp-2 min-h-[48px] text-base leading-6 text-gray-300">
                          {truncated}
                          {truncated !== full && (
                            <button type="button" className="ml-1 text-[#ECDFCC] hover:underline" onClick={() => setSelectedKitchen(kitchen)}>Read more</button>
                          )}
                        </p>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </div>
      {selectedKitchen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={event => { if (event.target === event.currentTarget) setSelectedKitchen(null); }}
          role="presentation"
        >
          <section role="dialog" aria-modal="true" aria-labelledby="kitchen-details-title" className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#465047] bg-[#1E201E] text-white shadow-2xl">
            <div className="relative h-52 bg-[#252a26] sm:h-64">
              {selectedKitchen.kitchen_picture ? (
                <img src={selectedKitchen.kitchen_picture} alt={selectedKitchen.kitchen_name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-gray-500">No kitchen image</div>
              )}
              <button
                type="button"
                onClick={() => setSelectedKitchen(null)}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-2xl leading-none text-white transition hover:bg-black"
                aria-label="Close kitchen details"
              >&times;</button>
            </div>
            <div className="max-h-[calc(88vh-13rem)] overflow-y-auto p-6 sm:max-h-[calc(88vh-16rem)] sm:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c8b88f]">Kitchen details</p>
              <h2 id="kitchen-details-title" className="text-2xl font-bold capitalize sm:text-3xl">{selectedKitchen.kitchen_name}</h2>
              <div className="mt-4 rounded-xl border border-[#3b433d] bg-[#252a26] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</p>
                <p className="mt-1 text-sm leading-6 text-gray-200">{selectedKitchen.address || 'Address not provided'}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">About this kitchen</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-300">{selectedKitchen.kitchen_description || 'No description available.'}</p>
              </div>
              <div className="mt-7 flex justify-end">
                <button type="button" onClick={() => setSelectedKitchen(null)} className="rounded-lg bg-[#ECDFCC] px-6 py-2.5 text-sm font-semibold text-[#1E201E] transition hover:bg-[#D6C4B0]">Close</button>
              </div>
            </div>
          </section>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Kitchens;
