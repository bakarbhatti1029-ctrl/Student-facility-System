import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ImageUploadField from '../common/ImageUploadField';
import { FaEdit } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const KitchenOwnerProfile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editPicture, setEditPicture] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return <div>No user data available</div>;
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
      const token = Cookies.get('token');
      const res = await axios.put(
        `${API_BASE_URL}/profile/User`,
        { kitchen_picture: editPicture },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <div className=' text-white'>
    <div className='flex flex-col justify-center items-center'>
    <p className="text-2xl font-bold text-center text-white mt-4"> {user.kitchen_name} Dashboard </p>
      <button
        type='button'
        onClick={() => user.profile_picture && setShowProfilePicture(true)}
        className='mb-4 flex h-24 w-24 overflow-hidden rounded-full border-4 border-[#697565] bg-gray-700'
        aria-label='View profile picture'
      >
        {user.profile_picture ? <img className='h-full w-full object-cover' src={user.profile_picture} alt='Owner profile' /> : <span className='m-auto text-gray-300'>No photo</span>}
      </button>
      <img className='w-full h-[500px]' src={user.kitchen_picture} alt={user.kitchen_name} />
      {!editMode && (
        <button
          onClick={startEdit}
          className='mt-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2'
        >
          <FaEdit /> Change Picture
        </button>
      )}
      {editMode && (
        <form onSubmit={handleSave} className='mt-4 w-full max-w-md bg-[#25292e] rounded-xl p-4'>
          <ImageUploadField
            label="Kitchen Picture"
            name="kitchenPicture"
            value={editPicture}
            onChange={setEditPicture}
            uploadType="kitchen"
          />
          {error && <div className='text-red-500 text-sm mb-2'>{error}</div>}
          <div className='flex gap-3'>
            <button type='submit' disabled={saving} className='bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded'>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type='button' onClick={() => setEditMode(false)} className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded'>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className='p-4 justify-center'>

        <h2 className='text-xl font-bold'>{user.kitchen_name}</h2>
        <p className='text-lg font-semibold'>{user.address}</p>
        <p className=''>Description:{user.kitchen_description}</p>
      </div>
      {showProfilePicture && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4' onClick={() => setShowProfilePicture(false)}>
          <div className='relative max-w-3xl max-h-[90vh]' onClick={(e) => e.stopPropagation()}>
            <button type='button' onClick={() => setShowProfilePicture(false)} className='absolute -top-10 right-0 text-2xl text-white' aria-label='Close profile picture'>&times;</button>
            <img src={user.profile_picture} alt='Owner profile' className='max-h-[85vh] max-w-full rounded-lg object-contain' />
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default KitchenOwnerProfile;
