import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import Shimmer from './Shimmer'; // Import the shimmer component
import ReviewSection from '../common/ReviewSection';

const HostelDetail = () => {
  const location = useLocation();
  const hostel = location.state?.hostel;
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState({}); // State to track loaded images
 
  console.log('hostel', hostel);

  if (!hostel) {
    return <div>Rooms not found</div>;
  }

  const handleRoomClick = (room) => {
    navigate(`/rooms/${room._id}`, { state: { room, hostelId: hostel._id } });
  };

  const handleImageLoad = (roomId) => {
    setImageLoaded((prevState) => ({ ...prevState, [roomId]: true }));
  };

  return (
    <>
      <Navbar module="hostel" />
      <div className="p-4 bg-[#697565] w-full text-white border-b border-gray-600">
        <div className="max-w-4xl mx-auto mt-24 rounded overflow-hidden shadow-lg bg-[#1E201E] border border-[#59636e]">
          <img
            className="w-full  h-[400px]"
            src={hostel.hostel_picture}
            alt={hostel.hostel_name}
          />
          <div className="px-6 py-4">
            <h2 className="font-bold text-2xl mb-2">{hostel.hostel_name}</h2>
            <p className="text-base">{hostel.hostel_description}</p>
            <div className="mt-4">
              <h3 className="font-bold text-center text-xl mb-2">Rooms</h3>
              <div className="flex justify-center items-center flex-wrap gap-4">
                {/* Check if the hostel has rooms */}
                {(hostel.rooms || []).length === 0 ? (
                  <p>No room found in this hostel.</p>
                ) : (
                  (hostel.rooms || []).map((room) => (
                    <div key={room._id} className="flex flex-col sm:flex-row border border-[#59636e] mb-4 w-full sm:w-[480px]">
                      {!imageLoaded[room._id] && <Shimmer className="w-full h-48 sm:w-[200px] sm:h-[200px] flex-shrink-0" />}
                      <img
                        src={room.imageUrls?.[0] || ''}
                        alt={`Room ${room.name}`}
                        className={`w-full h-48 sm:w-[200px] sm:h-[200px] object-cover sm:mr-4 flex-shrink-0 ${imageLoaded[room._id] ? 'block' : 'hidden'}`}
                        onLoad={() => handleImageLoad(room._id)}
                      />
                      <div className="flex-1 min-w-0 p-6">
                        <h4 className="font-bold text-lg mb-2">Room No: {room.name}</h4>
                        <p className="mb-2">No. of Beds: {room.capacity}</p>
                        <p className="mb-2">Price per Bed: PKR {room.price}</p>
                        <button
                          onClick={() => handleRoomClick(room)}
                          className="hover:bg-[#697565] bg-[#3C3D37] text-white p-2 rounded"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-[#697565] w-full">
        <ReviewSection targetType="hostel" targetId={hostel._id} />
      </div>
      <Footer />
    </>
  );
};

export default HostelDetail;
