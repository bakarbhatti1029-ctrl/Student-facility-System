import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageUploadField from '../common/ImageUploadField';
import { FaEdit, FaMapMarkerAlt, FaUtensils } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const KitchenOwnerProfile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPicture, setEditPicture] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return <div className='text-white text-center'>No user data available</div>;
  }

  const startEdit = () => {
    setEditPicture(user.kitchen_picture || '');
    setError('');
    setEditMode(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {

      const res = await axios.put(
        `${API_BASE_URL}/profile/User`,
        { kitchen_picture: editPicture },
        { headers: { } }
      );
      const updatedUser = { ...user, kitchen_picture: res.data.kitchen_picture };
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setEditMode(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update picture. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className='w-full'>
      <div className='relative min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#25292e] shadow-2xl sm:min-h-[500px]'>
        <img
          className='absolute inset-0 h-full w-full object-cover'
          src={user.kitchen_picture}
          alt={user.kitchen_name || 'Kitchen'}
        />
        <div className='absolute inset-0 bg-black/15' />
        <div className='absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/85 via-black/70 to-transparent sm:w-[64%] lg:w-[56%]' />

        <div className='absolute inset-y-0 left-0 flex w-full max-w-3xl flex-col justify-end p-6 text-white sm:w-[64%] sm:p-10 lg:w-[56%] lg:p-12'>
          <div className='border-l-2 border-[#ECDFCC] pl-5 sm:pl-6'>
            <div className='mb-5 flex items-center gap-3'>
              <span className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ECDFCC]/50 bg-[#ECDFCC]/15 text-[#ECDFCC]'>
                <FaUtensils aria-hidden='true' />
              </span>
              <p className='text-[11px] font-bold uppercase tracking-[0.28em] text-[#ECDFCC]'>
                Kitchen owner profile
              </p>
            </div>

            <h2 className='max-w-xl text-4xl font-bold leading-[0.95] tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl'>
              {user.kitchen_name}
            </h2>

            <div className='my-5 h-px w-20 bg-[#ECDFCC]/80' />

            {user.address && (
              <p className='flex items-start gap-3 text-sm font-semibold leading-6 text-white/95 sm:text-base'>
                <FaMapMarkerAlt className='mt-1 shrink-0 text-[#ECDFCC]' aria-hidden='true' />
                <span>{user.address}</span>
              </p>
            )}

            {user.kitchen_description && (
              <p className='mt-4 max-w-lg text-sm leading-7 text-white/85 sm:text-base'>
                {user.kitchen_description}
              </p>
            )}

            <p className='mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55'>
              Homemade food · Kitchen information
            </p>
          </div>

          {!editMode && (
            <button
              onClick={startEdit}
              className='mt-6 w-fit rounded-lg border border-white/15 bg-[#697565] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#3C3D37] focus:outline-none focus:ring-2 focus:ring-[#ECDFCC]'
            >
              <span className='flex items-center gap-2'>
                <FaEdit /> Change Picture
              </span>
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <form onSubmit={handleSave} className='mt-4 rounded-xl bg-[#25292e] p-4'>
          <ImageUploadField
            label="Kitchen Picture"
            name="kitchenPicture"
            value={editPicture}
            onChange={setEditPicture}
            uploadType="kitchen"
          />
          {error && <div className='mb-2 text-sm text-red-500'>{error}</div>}
          <div className='flex gap-3'>
            <button type='submit' disabled={saving} className='rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60'>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type='button' onClick={() => setEditMode(false)} className='rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default KitchenOwnerProfile;
