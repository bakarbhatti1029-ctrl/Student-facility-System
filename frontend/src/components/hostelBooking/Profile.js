import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import ImageUploadField from '../common/ImageUploadField';
import { FaEdit } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
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
    return <div className='text-white text-center'>No user data available</div>;
  }

  const startEdit = () => {
    setEditPicture(user.hostel_picture || '');
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
        { hostel_picture: editPicture },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = { ...user, hostel_picture: res.data.hostel_picture };
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
    <div className='md:flex'>
      <div className='w-full md:w-[500px] pt-6 pl-6'>
        <button
          type='button'
          onClick={() => user.profile_picture && setShowProfilePicture(true)}
          className='mb-4 flex h-24 w-24 overflow-hidden rounded-full border-4 border-[#697565] bg-gray-700'
          aria-label='View profile picture'
        >
          {user.profile_picture ? <img className='h-full w-full object-cover' src={user.profile_picture} alt='Owner profile' /> : <span className='m-auto text-gray-300'>No photo</span>}
        </button>
        <img className='w-full h-auto md:h-[500px] object-cover' src={user.hostel_picture} alt={user.hostel_name} />
        {!editMode && (
          <button
            onClick={startEdit}
            className='mt-2 bg-[#697565] hover:bg-[#3C3D37] text-white px-4 py-2 rounded flex items-center gap-2'
          >
            <FaEdit /> Change Picture
          </button>
        )}
        {editMode && (
          <form onSubmit={handleSave} className='mt-4 bg-[#25292e] rounded-xl p-4'>
            <ImageUploadField
              label="Hostel Picture"
              name="hostelPicture"
              value={editPicture}
              onChange={setEditPicture}
              uploadType="hostel"
            />
            {error && <div className='text-red-500 text-sm mb-2'>{error}</div>}
            <div className='flex gap-3'>
              <button type='submit' disabled={saving} className='bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded'>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type='button' onClick={() => setEditMode(false)} className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded'>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      {showProfilePicture && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4' onClick={() => setShowProfilePicture(false)}>
          <div className='relative max-w-3xl max-h-[90vh]' onClick={(e) => e.stopPropagation()}>
            <button type='button' onClick={() => setShowProfilePicture(false)} className='absolute -top-10 right-0 text-2xl text-white' aria-label='Close profile picture'>&times;</button>
            <img src={user.profile_picture} alt='Owner profile' className='max-h-[85vh] max-w-full rounded-lg object-contain' />
          </div>
        </div>
      )}
      <div className='p-4 text-white text-center mt-20'>
        <h2 className='text-2xl font-bold'>{user.hostel_name}</h2>
        <p className='text-lg font-semibold'>{user.hostel_address}</p>
        <p>Description: {user.hostel_description}</p>
        <h2 className='text-2xl font-bold pt-8'>Nearby Universities</h2>
        <ul>
          {user.nearby_institutes.map((institute) => (
            <li key={institute._id} className='text-xl'>{institute.university}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
