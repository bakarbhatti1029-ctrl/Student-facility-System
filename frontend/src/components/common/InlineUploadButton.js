import React, { useRef, useState } from 'react';
import axios from 'axios';
import { FaUpload, FaSpinner } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Compact upload button meant to sit BESIDE an existing image-URL text input
 * (used in the Room and Dish add/edit modals, which manage arrays of image URLs).
 *
 * Click → pick a file from the device → upload to Cloudinary via the backend →
 * call onUploaded(url) with the returned hosted URL so the parent can fill that
 * row. The existing "paste a URL" text field keeps working exactly as before;
 * this only adds a device-upload option next to it.
 *
 * Props:
 *  - onUploaded(url): called with the Cloudinary URL on success
 *  - uploadType: 'hostel' | 'kitchen' — buckets the upload into a Cloudinary folder
 */
const InlineUploadButton = ({ onUploaded, uploadType = 'general' }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', uploadType);
      const res = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.url);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Upload failed. You can paste an image URL instead.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={uploading}
        title="Upload an image from your device"
        className={`ml-2 flex items-center gap-1 px-3 py-2 rounded text-white text-sm whitespace-nowrap transition ${
          uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#697565] hover:opacity-90'
        }`}
      >
        {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
        {uploading ? 'Uploading' : 'Upload'}
      </button>
      {error && (
        <span className="ml-2 text-red-500 text-xs">{error}</span>
      )}
    </>
  );
};

export default InlineUploadButton;
