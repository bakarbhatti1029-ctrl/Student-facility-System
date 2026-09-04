import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaLink, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Reusable image field with two ways to provide an image:
 *  - "Upload from device": picks a file from local storage, uploads it to
 *    Cloudinary via the backend, and fills `value` with the returned URL.
 *  - "Image URL": a plain text field for pasting an existing image URL —
 *    kept exactly as it worked before, no upload involved.
 *
 * Props:
 *  - label: field label text
 *  - name: field name (used for htmlFor/id)
 *  - value: current URL string (controlled)
 *  - onChange(url): called with the new URL string whenever it changes
 *  - onBlur: optional, forwarded to the URL text input (for formik touched state)
 *  - error: optional error message string to display
 *  - uploadType: 'profile' | 'hostel' | 'kitchen' — just used to bucket uploads in Cloudinary folders
 *  - darkMode: true renders text/inputs styled for the app's dark form theme (Register.js)
 */
const ImageUploadField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  uploadType = 'general',
  darkMode = true,
}) => {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // If a URL already exists (e.g. editing an existing profile), default to the
  // URL tab so the person immediately sees what's already set.
  useEffect(() => {
    if (value) {
      setMode('url');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadError('');
    setFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', uploadType);

      const res = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onChange(res.data.url);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Image upload failed. Please try again, or switch to "Image URL" and paste a link instead.';
      setUploadError(message);
      onChange('');
    } finally {
      setUploading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setUploadError('');
    if (newMode === 'upload') {
      setFileName('');
    }
  };

  const labelCls = darkMode ? 'block text-lg font-medium text-gray-300' : 'block text-sm font-medium text-gray-700';
  const helpCls = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputCls = darkMode
    ? 'mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white'
    : 'mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div className="mb-4">
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>

      {/* Tabs */}
      <div className="flex gap-2 mt-2 mb-2">
        <button
          type="button"
          onClick={() => switchMode('upload')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            mode === 'upload'
              ? 'bg-[#697565] text-white'
              : darkMode
              ? 'bg-[#1E201E] text-gray-300 border border-gray-600'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}
        >
          <FaUpload /> Upload from device
        </button>
        <button
          type="button"
          onClick={() => switchMode('url')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            mode === 'url'
              ? 'bg-[#697565] text-white'
              : darkMode
              ? 'bg-[#1E201E] text-gray-300 border border-gray-600'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}
        >
          <FaLink /> Image URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            id={`${name}_file`}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-4 transition ${
              darkMode ? 'border-gray-500 text-gray-300 hover:border-[#697565]' : 'border-gray-300 text-gray-600 hover:border-[#697565]'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" /> Uploading...
              </>
            ) : value ? (
              <>
                <FaCheckCircle className="text-green-500" /> {fileName ? `${fileName} uploaded` : 'Image set — click to replace'}
              </>
            ) : (
              <>
                <FaUpload /> Click to choose an image from your device
              </>
            )}
          </button>
          <p className={`text-xs mt-1 ${helpCls}`}>JPG, PNG, WEBP, or GIF — up to 5MB.</p>
          {value && (
            <img
              src={value}
              alt="Preview"
              className="mt-2 h-24 w-24 object-cover rounded-md border border-gray-500"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          {uploadError && (
            <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <FaTimesCircle /> {uploadError}
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            id={name}
            name={name}
            type="text"
            placeholder="https://example.com/image.jpg"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={inputCls}
          />
          {value && (
            <img
              src={value}
              alt="Preview"
              className="mt-2 h-24 w-24 object-cover rounded-md border border-gray-500"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default ImageUploadField;
