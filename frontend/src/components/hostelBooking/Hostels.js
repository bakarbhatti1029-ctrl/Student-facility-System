// HostelList.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HostelCard from './HostelCard';
import Navbar from '../Navbar';
import axios from 'axios';
import HostelMap from './HostelMap';
import API_BASE_URL from '../../utils/api';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import SEO from '../common/SEO';

const ALL_FACILITIES = [
  'No Facility',
  'Wi-Fi',
  'AC',
  'CCTV',
  'Generator',
  'Laundry',
  'Parking',
  'Water Cooler',
  'Study Room',
];

// Shimmer effect component for loading state
const SkeletonCard = () => (
  <div className="max-w-sm rounded overflow-hidden shadow-lg animate-pulse">
    <div className="bg-gray-300 h-48 w-full"></div>
    <div className="px-6 py-4 bg-[#25292e]">
      <div className="h-6 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400 mb-2"></div>
      <div className="h-4 bg-gray-400"></div>
    </div>
  </div>
);

const HostelList = () => {
  const [filters, setFilters] = useState({
    university: '',
    facilities: [],   // multi-select array
    maxDistance: '',
  });
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [searchedUniversity, setSearchedUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState(null);
  const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setFacilityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedHostel) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setSelectedHostel(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedHostel]);

  // Fetch all hostels on initial load
  useEffect(() => {
    const fetchHostels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/hostel/getAllHostels`);
        if (response.data && response.data.success) {
          setFilteredHostels(response.data.data || []);
        } else {
          setError('Failed to load hostels');
        }
      } catch (error) {
        console.error('Error fetching hostels:', error);
        setError('Failed to load hostels. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchHostels();
  }, []);

  // Fetch filtered hostels from the API based on query parameters
  const fetchFilteredHostels = async (queryParams) => {
    setLoading(true);
    setError(null);
    try {
      const requestUrl = `${API_BASE_URL}/hostel/getFilteredHostels?${queryParams}`;
      const response = await axios.get(requestUrl);
      if (response.data && response.data.success) {
        setFilteredHostels(response.data.data || []);
        setSearchedUniversity(response.data.university || null);
        setSearchPerformed(true);
        if (response.data.data.length === 0) {
          setError(
            response.data.message ||
              'No hostels found matching your criteria. Try adjusting your search.'
          );
        }
      } else {
        setError(response.data.message || 'Failed to retrieve results');
      }
    } catch (error) {
      console.error('Error fetching filtered hostels:', error);
      if (error.response) {
        setError(`Server error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        setError('No response received from server. Please check your connection.');
      } else {
        setError('Failed to search hostels. Please try again later.');
      }
      setFilteredHostels([]);
      setSearchedUniversity(null);
    } finally {
      setLoading(false);
    }
  };

  // Sync filters from URL on load/change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const university = params.get('university') || '';
    const facilitiesParam = params.get('facilities') || '';
    const maxDistance = params.get('maxDistance') || '';
    const facilitiesArr = facilitiesParam ? facilitiesParam.split(',') : [];

    setFilters({ university, facilities: facilitiesArr, maxDistance });

    if (university || facilitiesParam || maxDistance) {
      fetchFilteredHostels(params.toString());
    }
  }, [location.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFacility = (facility) => {
    setFilters((prev) => {
      const exists = prev.facilities.includes(facility);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      };
    });
  };

  const toggleAllFacilities = () => {
    setFilters((prev) => ({
      ...prev,
      facilities: prev.facilities.length === ALL_FACILITIES.length ? [] : [...ALL_FACILITIES],
    }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.university) params.set('university', filters.university);
    if (filters.facilities.length > 0) params.set('facilities', filters.facilities.join(','));
    if (filters.maxDistance) params.set('maxDistance', filters.maxDistance);
    navigate(`?${params.toString()}`);
  };

  const facilityLabel =
    filters.facilities.length === 0
      ? 'No Facilities selected'
      : filters.facilities.length === ALL_FACILITIES.length
      ? 'All Selected'
      : `${filters.facilities.length} Selected`;

  return (
    <>
      <SEO
        title="Hostel Booking"
        description="Find and book student hostels in Lahore near your university, filtered by facilities, distance, and budget."
      />
      <Navbar module={'hostel'} />
      <div className="p-4 bg-[#697565] w-full pt-28">
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
          <div className="flex flex-col gap-4 mb-4 mt-6 md:mb-0 md:ml-24 md:flex-row md:items-center">
            {/* University input */}
            <div className="mr-2 w-full md:w-60">
              <InstituteAutocomplete
                name="university"
                placeholder="Enter the name of the university"
                value={filters.university || ''}
                onChange={handleFilterChange}
                className="border-2 border-blue-500 rounded p-2 text-wrap w-full"
              />
            </div>

            {/* Multi-select facility dropdown */}
            <div className="relative w-full md:w-60" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setFacilityDropdownOpen((o) => !o)}
                className="border-2 border-blue-500 rounded p-2 w-full bg-white text-left flex justify-between items-center"
              >
                <span className="text-gray-700 truncate">{facilityLabel}</span>
                <span className="ml-2 text-gray-500">{facilityDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {facilityDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-500 rounded shadow-lg">
                  {/* Select All toggle */}
                  <label className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={filters.facilities.length === ALL_FACILITIES.length}
                      onChange={toggleAllFacilities}
                      className="mr-2 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-800">Select All</span>
                  </label>

                  {ALL_FACILITIES.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.facilities.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      <span className="text-gray-700">{facility}</span>
                    </label>
                  ))}

                  {/* Clear button */}
                  {filters.facilities.length > 0 && (
                    <div className="border-t border-gray-200 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, facilities: [] }))}
                        className="text-sm text-red-500 hover:text-red-700 w-full text-left"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Max Distance */}
            <input
              type="number"
              name="maxDistance"
              placeholder="Max Distance (km)"
              value={filters.maxDistance || ''}
              onChange={handleFilterChange}
              className="border-2 border-blue-500 rounded p-2 w-full md:w-60"
              min="0"
            />

            <button
              className="bg-[#697565] text-white p-2 border-2 hover:bg-[#25292e] rounded ml-2 w-full md:w-auto"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 auto-rows-fr">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, index) => <SkeletonCard key={index} />)
            : filteredHostels.length > 0
            ? filteredHostels.map((hostel) => (
                <HostelCard key={hostel._id} hostel={hostel} onReadMore={setSelectedHostel} />
              ))
            : !loading && (
                <p className="text-white col-span-full text-center text-xl mt-6">No hostels found</p>
              )}
        </div>

        {filteredHostels.length > 0 && (
          <HostelMap
            hostels={filteredHostels}
            university={searchedUniversity}
            searchPerformed={searchPerformed}
          />
        )}
      </div>
      {selectedHostel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={event => { if (event.target === event.currentTarget) setSelectedHostel(null); }}
          role="presentation"
        >
          <section role="dialog" aria-modal="true" aria-labelledby="hostel-details-title" className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#465047] bg-[#1E201E] text-white shadow-2xl">
            <div className="relative h-52 bg-[#252a26] sm:h-64">
              {selectedHostel.hostel_picture ? (
                <img src={selectedHostel.hostel_picture} alt={selectedHostel.hostel_name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-gray-500">No hostel image</div>
              )}
              <button type="button" onClick={() => setSelectedHostel(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-2xl leading-none text-white transition hover:bg-black" aria-label="Close hostel details">&times;</button>
            </div>
            <div className="max-h-[calc(88vh-13rem)] overflow-y-auto p-6 sm:max-h-[calc(88vh-16rem)] sm:p-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c8b88f]">Hostel details</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="hostel-details-title" className="text-2xl font-bold capitalize sm:text-3xl">{selectedHostel.hostel_name}</h2>
                {selectedHostel.hostel_type && <span className="rounded-full border border-[#536057] bg-[#252d28] px-3 py-1 text-xs text-[#bdc8c0]">{selectedHostel.hostel_type}</span>}
              </div>
              <div className="mt-4 rounded-xl border border-[#3b433d] bg-[#252a26] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</p>
                <p className="mt-1 text-sm leading-6 text-gray-200">{selectedHostel.hostel_address || 'Address not provided'}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">About this hostel</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-300">{selectedHostel.hostel_description || 'No description available.'}</p>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Facilities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedHostel.facilities || []).length > 0
                    ? selectedHostel.facilities.map(facility => <span key={facility} className="rounded-full border border-[#465047] bg-[#252a26] px-3 py-1.5 text-xs text-gray-300">{facility}</span>)
                    : <span className="text-sm text-gray-500">No facilities listed.</span>}
                </div>
              </div>
              <div className="mt-7 flex justify-end">
                <button type="button" onClick={() => setSelectedHostel(null)} className="rounded-lg bg-[#ECDFCC] px-6 py-2.5 text-sm font-semibold text-[#1E201E] transition hover:bg-[#D6C4B0]">Close</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default HostelList;
