import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, restoreSession } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageUploadField from '../components/common/ImageUploadField';
import axios from 'axios';
import {
  FaUser, FaEnvelope, FaPhone, FaVenusMars, FaMapMarkerAlt, FaIdCard,
  FaEdit, FaSignOutAlt, FaUtensils, FaHome, FaCalendarAlt, FaMoneyBillWave,
  FaBed, FaHotel
} from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StudentProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState(null);
  const [foodOrders, setFoodOrders] = useState([]);
  const [bedBookings, setBedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showFoodDetails, setShowFoodDetails] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(null);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      dispatch(restoreSession()).unwrap().catch(() => navigate('/loginform'));
      return;
    }
    if (user) {
      const role = user.role || 'student';
      setProfileData({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || 'N/A',
        email: user.email || '',
        phone: user.phone_number || '',
        gender: user.gender || '',
        address: user.address || '',
        profilePicture: user.profile_picture || '',
        student_id: user.student_id || '',
        cnic: user.cnic || '',
        role });
      setEditData({ name: `${user.first_name||''} ${user.last_name||''}`.trim(), phone: user.phone_number||'', address: user.address||'', profilePicture: user.profile_picture||'' });

      // Food orders / hostel bookings only apply to student accounts.
      if (role === 'student') {
        const fetchAll = async () => {
          try {
            const [ordersRes, bookingsRes] = await Promise.allSettled([
              axios.get(`${API_BASE_URL}/api/order/customer`, { headers: { } }),
              axios.get(`${API_BASE_URL}/api/bookings/booked-rooms`, { headers: { } }),
            ]);
            setFoodOrders(ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.orders || ordersRes.value.data || []) : []);
            setBedBookings(bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data?.data || bookingsRes.value.data || []) : []);
          } catch (e) { console.error(e); }
          setLoading(false);
        };
        fetchAll();
      } else {
        setLoading(false);
      }
    }
  }, [user, navigate, dispatch]);

  const handleLogout = () => { dispatch(logout()); navigate('/loginform'); };
  const [savingProfile, setSavingProfile] = useState(false);
  const handleEditSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const [firstName, ...rest] = (editData.name || '').trim().split(' ');
      const payload = {
        first_name: firstName || '',
        last_name: rest.join(' ') || '',
        phone_number: editData.phone || '',
        profile_picture: editData.profilePicture || '' };
      // For kitchen owners, `address` on the account record is the kitchen's
      // own address, not the owner's personal one — never send it from here.
      if (profileData?.role !== 'kitchenOwner') {
        payload.address = editData.address || '';
      }
      const res = await axios.put(`${API_BASE_URL}/profile/User`, payload, {
        headers: { } });
      setProfileData(prev => ({
        ...prev,
        name: `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim(),
        phone: res.data.phone_number,
        address: res.data.address,
        profilePicture: res.data.profile_picture }));
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert(err?.response?.data?.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#1E201E] flex items-center justify-center"><p className="text-white text-xl">Loading profile...</p></div>;
  if (!profileData) return <div className="min-h-screen bg-[#1E201E] flex items-center justify-center"><p className="text-white">Please log in to view your profile.</p></div>;

  const profileFields = [
    { label: 'Full Name',  value: profileData.name,             icon: <FaUser /> },
    { label: 'Email',      value: profileData.email,            icon: <FaEnvelope /> },
    { label: 'Phone',      value: profileData.phone || 'N/A',   icon: <FaPhone /> },
    { label: 'Gender',     value: profileData.gender || 'N/A',  icon: <FaVenusMars /> },
    // Kitchen owners' `address` field is their kitchen's address, not personal — don't show it here.
    ...(profileData.role !== 'kitchenOwner' ? [{ label: 'Address', value: profileData.address || 'N/A', icon: <FaMapMarkerAlt /> }] : []),
    { label: 'CNIC',       value: profileData.cnic || 'N/A',    icon: <FaIdCard /> },
  ];

  const inputCls = "w-full bg-[#1E201E] border border-[#59636e] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#697565]";

  return (
    <div className="min-h-screen bg-[#1E201E] text-white">
      <Navbar module="home" />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">

        {/* Header card */}
        <div className="bg-[#25292e] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
          <button
            type="button"
            onClick={() => profileData.profilePicture && setShowProfilePicture(true)}
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#697565] flex-shrink-0 bg-gray-700 flex items-center justify-center cursor-pointer"
            aria-label="View profile picture"
          >
            {profileData.profilePicture
              ? <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" onError={e=>{e.target.style.display='none'}} />
              : <FaUser style={{ fontSize:'2.5rem', color:'#9ca3af' }} />}
          </button>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold">{profileData.name}</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2 justify-center md:justify-start"><FaEnvelope /> {profileData.email}</p>
            {profileData.phone && <p className="text-gray-400 flex items-center gap-2 justify-center md:justify-start"><FaPhone /> {profileData.phone}</p>}
            {profileData.student_id && <span className="inline-block mt-2 bg-[#697565] text-white text-xs px-3 py-1 rounded-full">ID: {profileData.student_id}</span>}
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={() => setEditMode(!editMode)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"><FaEdit /> Edit</button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"><FaSignOutAlt /> Logout</button>
          </div>
        </div>

        {showProfilePicture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowProfilePicture(false)}>
            <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setShowProfilePicture(false)} className="absolute -top-10 right-0 text-white text-2xl" aria-label="Close profile picture">&times;</button>
              <img src={profileData.profilePicture} alt="Profile" className="max-h-[85vh] max-w-full rounded-lg object-contain" />
            </div>
          </div>
        )}

        {/* Edit form */}
        {editMode && (
          <div className="bg-[#25292e] rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[['Full Name','name','text'],['Phone Number','phone','tel'], ...(profileData.role !== 'kitchenOwner' ? [['Address','address','text']] : [])].map(([label,key,type])=>(
                  <div key={key}>
                    <label className="block text-sm text-gray-400 mb-1">{label}</label>
                    <input type={type} value={editData[key]} onChange={e=>setEditData({...editData,[key]:e.target.value})} className={inputCls} />
                  </div>
                ))}
              </div>
              <ImageUploadField
                label="Profile Picture"
                name="profilePicture"
                value={editData.profilePicture}
                onChange={(url) => setEditData({ ...editData, profilePicture: url })}
                uploadType="profile"
              />
              <div className="flex gap-3">
                <button type="submit" disabled={savingProfile} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-semibold transition">{savingProfile ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditMode(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Profile details */}
        <div className="bg-[#25292e] rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Profile Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileFields.map(({ label, value, icon }) => (
              <div key={label} className="flex items-start gap-3 bg-[#1E201E] rounded-xl p-4">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-white font-medium mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs — food orders / hostel bookings only apply to student accounts */}
        {profileData.role === 'student' && (
        <div className="flex gap-4 mb-4">
          {[['orders','Food Orders',<FaUtensils />],['bookings','Hostel Bookings',<FaHome />]].map(([key,label,icon])=>(
            <button key={key} onClick={()=>setActiveTab(key)}
              className={`px-5 py-2 rounded-lg font-semibold capitalize transition flex items-center gap-2 ${activeTab===key?'bg-[#697565] text-white':'bg-[#25292e] text-gray-400 hover:bg-[#2f3438]'}`}>
              {icon} {label}
            </button>
          ))}
        </div>
        )}

        {/* Food Orders */}
        {profileData.role === 'student' && activeTab === 'orders' && (
          <div className="bg-[#25292e] rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaUtensils /> Food Order History</h2>
            {foodOrders.length === 0
              ? <div className="text-center py-12 text-gray-500"><FaUtensils style={{fontSize:'3rem',margin:'0 auto 12px'}} /><p>No food orders yet.</p></div>
              : <div className="space-y-4">
                  {foodOrders.map((order,idx)=>(
                    <div key={order._id||idx} className="bg-[#1E201E] rounded-xl p-4 border border-[#59636e]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Order #{(order._id||idx).toString().slice(-6)}</p>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-1"><FaCalendarAlt /> {order.createdAt?new Date(order.createdAt).toLocaleDateString('en-PK'):'N/A'}</p>
                          <p className="text-green-400 font-bold mt-1 flex items-center gap-1"><FaMoneyBillWave /> PKR {order.totalAmount||order.total||0}</p>
                          <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${order.status==='delivered'?'bg-green-900 text-green-300':order.status==='pending'?'bg-yellow-900 text-yellow-300':'bg-blue-900 text-blue-300'}`}>{order.status||'Processing'}</span>
                        </div>
                        <button onClick={()=>setShowFoodDetails(showFoodDetails===order._id?null:order._id)} className="text-blue-400 hover:text-blue-300 text-sm">{showFoodDetails===order._id?'Hide':'View Details'}</button>
                      </div>
                      {showFoodDetails===order._id&&order.items&&(
                        <div className="mt-4 border-t border-[#59636e] pt-4">
                          {order.items.map((item,i)=>(
                            <div key={i} className="flex justify-between text-sm py-1">
                              <span>{item.name||item.dish_name}</span>
                              <span className="text-green-400">PKR {item.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* Hostel Bookings */}
        {profileData.role === 'student' && activeTab === 'bookings' && (
          <div className="bg-[#25292e] rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaHome /> Hostel Booking History</h2>
            {bedBookings.length === 0
              ? <div className="text-center py-12 text-gray-500"><FaHotel style={{fontSize:'3rem',margin:'0 auto 12px'}} /><p>No hostel bookings yet.</p></div>
              : <div className="space-y-4">
                  {bedBookings.map((booking,idx)=>(
                    <div key={booking.bookingId||idx} className="bg-[#1E201E] rounded-xl p-4 border border-[#59636e]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{booking.hostelName||'Hostel'}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1"><FaMapMarkerAlt /> {booking.hostelAddress||'N/A'}</p>
                          <p className="text-sm mt-1 flex items-center gap-1"><FaBed /> Room: <span className="text-white ml-1">{booking.roomName}</span></p>
                          <p className="text-sm flex items-center gap-1"><FaCalendarAlt /> {booking.bookingDate?new Date(booking.bookingDate).toLocaleDateString('en-PK'):'N/A'}</p>
                          <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${booking.status==='Booked'?'bg-green-900 text-green-300':booking.status==='Cancelled'?'bg-red-900 text-red-300':'bg-yellow-900 text-yellow-300'}`}>{booking.status||'Pending'}</span>
                        </div>
                        <button onClick={()=>setShowBookingDetails(showBookingDetails===booking.bookingId?null:booking.bookingId)} className="text-blue-400 hover:text-blue-300 text-sm">{showBookingDetails===booking.bookingId?'Hide':'View Details'}</button>
                      </div>
                      {showBookingDetails===booking.bookingId&&booking.beds&&(
                        <div className="mt-4 border-t border-[#59636e] pt-4">
                          {booking.beds.map((bed,i)=>(
                            <div key={i} className="text-sm py-1 flex gap-4 items-center">
                              <FaBed /> Bed #{bed.bed_number}
                              <span className={bed.isBooked?'text-red-400':'text-green-400'}>{bed.isBooked?'Booked':'Available'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default StudentProfile;
