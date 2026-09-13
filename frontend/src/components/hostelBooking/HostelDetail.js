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
              <div className="mt-6 gap-6 pb-8 flex flex-wrap justify-center items-stretch">
                {/* Check if the hostel has rooms */}
                {(hostel.rooms || []).length === 0 ? (
                  <p>No room found in this hostel.</p>
                ) : (
                  (hostel.rooms || []).map((room) => (
                    <div key={room._id} className="w-52 rounded mt-6 shadow-lg border border-[#59636e] flex flex-col">
                      {!imageLoaded[room._id] && <Shimmer className="w-52 h-48 flex-shrink-0" />}
                      <img
                        src={room.imageUrls?.[0] || ''}
                        alt={`Room ${room.name}`}
                        className={`w-52 h-48 object-cover flex-shrink-0 ${imageLoaded[room._id] ? 'block' : 'hidden'}`}
                        onLoad={() => handleImageLoad(room._id)}
                      />
                      <div className="text-center p-2 bg-[#25292e] flex flex-col flex-1">
                        <h4 className="font-bold text-lg mb-2">Room No: {room.name}</h4>
                        <p className="text-base">No. of Beds: {room.capacity}</p>
                        <p className="text-base">Price per Bed: PKR {room.price}</p>
                        <button
                          onClick={() => handleRoomClick(room)}
                          className="bg-black hover:bg-[#3C3D37] mt-auto self-center text-white text-nowrap px-2 rounded"
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
