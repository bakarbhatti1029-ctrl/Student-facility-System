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
      ? 'All Facilities'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading
            ? Array(6)
                .fill(0)
                .map((_, index) => <SkeletonCard key={index} />)
            : filteredHostels.length > 0
            ? filteredHostels.map((hostel) => (
                <HostelCard key={hostel._id} hostel={hostel} />
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
    </>
  );
};

export default HostelList;
