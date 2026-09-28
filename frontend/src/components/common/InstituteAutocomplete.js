import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';

// Drop-in replacement for a plain text <input> — same name/value/onChange
// contract (calls onChange with { target: { name, value } } exactly like a
// real input event), so it wires into existing handlers unchanged. Adds a
// suggestion dropdown backed by the self-growing KnownInstitute cache, so
// people are guided toward names the system already knows instead of typing
// blind and hoping it matches.
const InstituteAutocomplete = ({ id, name, value, onChange, placeholder, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) return undefined;
    const timer = setInterval(() => setRetryAfter(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter > 0]);

  const countdown = `${Math.floor(retryAfter / 60)}:${String(retryAfter % 60).padStart(2, '0')}`;

  const fetchSuggestions = (query) => {
    if (retryAfter > 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/geo/geocode-search`, {
          params: { q: query.trim() } });
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Institute search failed:', err);
        setSuggestions([]);
        setRetryAfter(Number(err?.response?.headers?.['ratelimit-reset']) || 0);
        setSearchError(err.response?.data?.message || 'Unable to search institutes. Please try again.');
      }
    }, 300);
  };

  const handleInputChange = (e) => {
    onChange(e);
    setSearchError('');
    setOpen(true);
    fetchSuggestions(e.target.value);
  };

  const handleSelect = (item) => {
    onChange({ target: { name, value: item.name } });
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        id={id}
        name={name}
        value={value || ''}
        onChange={handleInputChange}
        disabled={retryAfter > 0}
        onFocus={() => value && value.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-500 rounded shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.name}
              onClick={() => handleSelect(s)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700 text-sm"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      {searchError && <p className="mt-1 text-xs text-red-500">{searchError}{retryAfter > 0 && ` Try again in ${countdown}.`}</p>}
    </div>
  );
};

export default InstituteAutocomplete;
