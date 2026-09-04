import React from 'react';
import { Link } from 'react-router-dom';

const HostelCard = ({ hostel }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg mx-auto bg-[#25292e] border-2 border-[#4a5568]">
      <img className="w-full h-48 object-cover" src={hostel.hostel_picture} alt={hostel.hostel_name} />
      <div className="px-6 py-4  text-white ">
        <p className=" text-xl mb-2">{hostel.hostel_name}</p>
        <p className="text-base">Address:  {hostel.hostel_address}</p>
        <p className="text-base">Facilities:  {(hostel.facilities || []).join(', ')}</p>
        {hostel.calculated_distance != null && (
          <p className="text-base text-[#a5b68d] font-semibold mt-1">
            {hostel.calculated_distance} km away
          </p>
        )}
      </div>
      <div className="px-6 py-4">
        <Link
          to={`/hostels/${hostel._id}`}
          state={{ hostel }} // Passing hostel data as state
          className="bg-[#697565] hover:bg-[#1E201E] text-white font-bold py-2 px-4 rounded inline-block"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default HostelCard;
