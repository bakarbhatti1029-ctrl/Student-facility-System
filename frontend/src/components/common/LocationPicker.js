import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';

// Same marker art HostelMap.js uses for hostels, so the picker looks
// consistent with the rest of the app.
const pinIcon = new L.Icon({ iconUrl: '/images/hostelMarker.png', iconSize: [25, 41] });
const DEFAULT_CENTER = [31.5204, 74.3587]; // Lahore

const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const ClickHandler = ({ onChange }) => {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    } });
  return null;
};

// Small pin-picker map: click or drag the marker to set an exact lat/lng.
// `value`/`onChange` follow standard controlled-input shape ({lat,lng} | null).
// `addressHint` powers the optional "Locate my address" convenience button.
const LocationPicker = ({ value, onChange, addressHint }) => {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);
  const hasValue = value && value.lat != null && value.lng != null;
  const position = hasValue ? [value.lat, value.lng] : DEFAULT_CENTER;
  const countdown = `${Math.floor(retryAfter / 60)}:${String(retryAfter % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (retryAfter <= 0) return undefined;
    const timer = setInterval(() => setRetryAfter(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter > 0]);

  const locateAddress = async (address, showError = true) => {
    if (!address || !address.trim() || retryAfter > 0) return;

    setLocating(true);
    if (showError) setLocateError('');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/geo/geocode`, {
        address: `${address.trim()}, Lahore, Pakistan` });
      if (data?.lat != null && data?.lng != null) {
        onChange({ lat: data.lat, lng: data.lng });
      } else if (showError) {
        setLocateError('Could not find that address. Try clicking the map directly instead.');
      }
    } catch (err) {
      console.error('Failed to locate address:', err);
      setRetryAfter(Number(err?.response?.headers?.['ratelimit-reset']) || 0);
      if (showError) {
        setLocateError(
          err.response?.data?.message || 'Could not find that address. Try clicking the map directly instead.'
        );
      }
    } finally {
      setLocating(false);
    }
  };

  // Look up a typed place after the user pauses, rather than sending a
  // request for every keystroke. The button remains available for retries.
  useEffect(() => {
    const address = addressHint?.trim();
    if (!address || address.length < 3) return undefined;

    const timer = setTimeout(() => {
      locateAddress(address, false);
    }, 900);

    return () => clearTimeout(timer);
  }, [addressHint]);

  const handleLocateAddress = () => {
    if (!addressHint || !addressHint.trim()) {
      setLocateError('Type your hostel address above first, then click this button.');
      return;
    }
    locateAddress(addressHint);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-lg font-medium text-gray-300">Pin Exact Location</label>
        <button
          type="button"
          onClick={handleLocateAddress}
          disabled={locating || retryAfter > 0}
          className="text-xs bg-[#697565] hover:bg-[#3C3D37] text-white px-2 py-1 rounded disabled:opacity-50"
        >
          {locating ? 'Locating...' : retryAfter > 0 ? `Try again in ${countdown}` : 'Locate my address'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-2">
        Click the map (or drag the pin) to mark your hostel's exact location — this helps students get accurate distances. Optional; you can skip this.
      </p>
      {locateError && (
        <p className="text-xs text-red-400 mb-2">{locateError}{retryAfter > 0 && ` Try again in ${countdown}.`}</p>
      )}
      <MapContainer center={position} zoom={hasValue ? 15 : 13} className="w-full h-64 rounded-md">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickHandler onChange={onChange} />
        <RecenterMap center={hasValue ? position : null} zoom={15} />
        {hasValue && (
          <Marker
            position={position}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onChange({ lat, lng });
              } }}
          />
        )}
      </MapContainer>
      {hasValue && (
        <p className="text-xs text-gray-400 mt-1">
          Selected: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
