import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import CheckoutModal from "./Checkout";
import InvoiceModal from "./InvoiceModal";
import Footer from "../Footer";
import { FaBed, FaArrowLeft } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";

const RoomDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: roomId } = useParams(); // Get roomId from URL

  const locationState = location.state || {};
  const initialRoom = locationState.room || null;

  const [selectedBed, setSelectedBed] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [roomData, setRoomData] = useState(initialRoom);
  const [loading, setLoading] = useState(!initialRoom && !!roomId); // Load only if no location state but roomId exists
  const [error, setError] = useState(null);
  // Router state disappears after a refresh/direct URL visit. The room API
  // always returns hostelId, so use it as the durable source of truth.
  const hostelId = locationState.hostelId
    || roomData?.hostelId?._id
    || roomData?.hostelId
    || null;

  // Fetch room data from backend on mount (if roomId exists)
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/api/rooms/getRoom/${roomId}`,
          { headers: { } }
        );
        if (response.data && response.data.room) {
          setRoomData(response.data.room);
        } else if (response.data) {
          setRoomData(response.data);
        }
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError(err.response?.data?.message || 'Failed to load room data');
        // Fallback to location.state if available
        if (initialRoom) {
          setRoomData(initialRoom);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, initialRoom]);

  if (loading) {
    return (
      <>
        <Navbar module="hostel"/>
        <div className="min-h-screen bg-[#1E201E] flex flex-col items-center justify-center text-white px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#697565] mb-4"></div>
          <p className="text-gray-400">Loading room details...</p>
        </div>
        <Footer/>
      </>
    );
  }

  if (!roomData) {
    return (
      <>
        <Navbar module="hostel"/>
        <div className="min-h-screen bg-[#1E201E] flex flex-col items-center justify-center text-white px-4">
          <FaBed style={{fontSize:'4rem',color:'#697565',marginBottom:'16px'}}/>
          <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
          <p className="text-gray-400 mb-6 text-center">{error || 'Room data could not be loaded. This may be due to a page refresh or an outdated link.'}</p>
          <button onClick={()=>navigate(-1)} className="flex items-center gap-2 bg-[#697565] hover:bg-[#3C3D37] text-white font-bold py-2 px-6 rounded-lg transition">
            <FaArrowLeft/> Go Back
          </button>
        </div>
        <Footer/>
      </>
    );
  }

  const imageUrls = Array.isArray(roomData.imageUrls) ? roomData.imageUrls
    : roomData.imageUrls ? [roomData.imageUrls]
    : roomData.image ? [roomData.image] : [];

  const beds = Array.isArray(roomData.beds) ? roomData.beds : [];

  const handleBookBedClick = (bed) => {
    const storedUser = sessionStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (currentUser?.role && currentUser.role !== 'student') {
      alert('Only students can book beds. Please log in with a student account.');
      return;
    }
    setSelectedBed(bed);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = async (paymentData) => {
    const updatedBed = { ...selectedBed, isBooked: true, bookingStatus: "Pending", paymentStatus: "completed" };
    // Checkout already created the booking through processPayment. Do not
    // dispatch a second booking request here.

    // Refetch room data from backend to ensure UI shows current bed status
    // (in case another user booked a bed or the DB state changed)
    try {

      const response = await axios.get(
        `${API_BASE_URL}/api/rooms/getRoom/${roomId}`,
        { headers: { } }
      );
      if (response.data && response.data.room) {
        setRoomData(response.data.room);
      } else if (response.data) {
        setRoomData(response.data);
      }
    } catch (err) {
      // If refetch fails, update local state as fallback
      console.error('Error refetching room data:', err);
      setRoomData(prev => ({
        ...prev,
        beds: Array.isArray(prev.beds)
          ? prev.beds.map(b => b.bed_number === updatedBed.bed_number ? updatedBed : b)
          : [updatedBed] }));
    }

    setIsCheckoutOpen(false);
    setInvoiceData(paymentData);
  };

  return (
    <>
      <Navbar module="hostel"/>
      <div className="bg-[#697565] w-full min-h-screen border-b border-gray-500 pb-8 text-white flex flex-col items-center">
        <div className="container mt-28 bg-[#1E201E] border border-[#59636e] items-center pb-4">
          {imageUrls.length > 0
            ? <img className="w-full h-[500px] object-cover" src={imageUrls[0]} alt={`Room ${roomData.name||''}`} onError={e=>{e.target.style.display='none'}}/>
            : <div className="w-full h-64 bg-[#25292e] flex items-center justify-center text-gray-500"><FaBed style={{fontSize:'3rem'}}/></div>
          }
          <h2 className="pt-2 font-bold text-2xl pb-4 text-center">Room No: {roomData.name||'N/A'}</h2>
          <p className="text-center">No. of Beds: {roomData.capacity??beds.length}</p>
          <p className="text-center whitespace-normal break-words mx-4">Description: {roomData.description||'No description available.'}</p>
          <p className="text-center">Price per Bed: PKR {roomData.price??'N/A'}</p>
          <h3 className="text-xl text-center font-semibold mt-4">Beds:</h3>
          {beds.length === 0
            ? <p className="text-center text-gray-400 py-8">No bed data available for this room.</p>
            : <div className="flex justify-center items-center w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 w-full max-w-4xl">
                  {beds.map((bed, index) => (
                    <div key={bed.bed_number??index} className={`border border-[#59636e] p-4 rounded ${bed.isBooked?"bg-gray-200 text-gray-800":""}`}>
                      <p>Bed Number: {bed.bed_number??index+1}</p>
                      <p>Status: {bed.isBooked ? (bed.bookingStatus === 'Pending' ? 'Pending Approval' : 'Booked') : 'Available'}</p>
                      {bed.isBooked
                        ? <button className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed mt-2" disabled>
                            {bed.bookingStatus === 'Pending' ? 'Reserved - Pending Approval' : 'Occupied'}
                          </button>
                        : <button onClick={()=>handleBookBedClick(bed)} className="bg-[#697565] hover:bg-[#3C3D37] text-white font-bold py-2 px-4 mt-2 rounded transition">Book Bed</button>
                      }
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>
      {isCheckoutOpen&&<CheckoutModal isOpen={isCheckoutOpen} onClose={()=>setIsCheckoutOpen(false)} bed={selectedBed} room={roomData} hostelOwnerId={hostelId} onSuccess={handleCheckoutSuccess}/>}
      <InvoiceModal data={invoiceData} onClose={()=>setInvoiceData(null)}/>
      <Footer/>
    </>
  );
};

export default RoomDetail;
