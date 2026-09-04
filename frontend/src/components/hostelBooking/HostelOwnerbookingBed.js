import React, { useEffect, useState } from 'react';
import HostelNavbar from "./HostelOwnerNavbar";
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings, removeBookingFromHistory } from '../../store/bookingsSlice';
import ErrorState from '../common/ErrorState';

const HostelOwnerBookingBed = () => {
  const dispatch = useDispatch();
  const [removingId, setRemovingId] = useState(null);

  // Fetch the bookings state from Redux (flat array - see getHostelOwnerBookedBeds)
  const { bookings, loading, error } = useSelector(state => state.bookings);

  useEffect(() => {
    // Dispatch fetchBookings when the component mounts or is revisited
    dispatch(fetchBookings());
  }, [dispatch]);

  const handleRemove = async (bookingId) => {
    if (!window.confirm('Remove this booking? This will free up the bed.')) return;
    setRemovingId(bookingId);
    await dispatch(removeBookingFromHistory(bookingId));
    setRemovingId(null);
  };

  return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <HostelNavbar />

      <main className="p-8 pt-20 md:pt-8 flex-1">
        <h1 className="text-3xl text-white font-bold mb-6">Booked Beds</h1>

        {loading ? (
          <p className="text-white">Loading bookings...</p>
        ) : error ? (
          <ErrorState message={error} onRetry={() => dispatch(fetchBookings())} />
        ) : !bookings || bookings.length === 0 ? (
          <p className="text-gray-400">No beds have been booked yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="bg-gray-800 p-6 flex flex-col md:flex-row flex-wrap gap-4 rounded-lg shadow-md border border-gray-600">
                <h3 className="text-xl text-yellow-400 font-bold mb-4">{booking.studentName}</h3>

                <div className="text-white gap-4 md:ml-8 flex flex-wrap">
                  <p><span className="font-semibold flex flex-col pt-2 text-gray-400">Booking ID:</span> {booking.bookingId}</p>
                  <p><span className="font-semibold flex flex-col text-gray-400">CNIC:</span> {booking.cnic}</p>
                  <p><span className="font-semibold flex flex-col text-gray-400">Email:</span> {booking.email}</p>
                  <p><span className="font-semibold flex flex-col text-gray-400">Phone Number:</span> {booking.phoneNumber}</p>
                  <p><span className="font-semibold flex flex-col text-gray-400">Room Number:</span> {booking.roomNumber}</p>
                  <p><span className="font-semibold flex flex-col text-gray-400">Bed Number:</span> {booking.bedNumber}</p>
                  <p>
                    <span className="font-semibold flex flex-col text-gray-400">Payment Status:</span>
                    <span className={booking.paymentStatus === 'completed' ? 'text-green-500' : 'text-red-500'}>
                      {booking.paymentStatus}
                    </span>
                  </p>
                </div>

                <button
                  className="px-6 py-2 ml-0 md:ml-10 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  disabled={removingId === booking.bookingId}
                  onClick={() => handleRemove(booking.bookingId)}
                >
                  {removingId === booking.bookingId ? 'Removing...' : 'Remove from History'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HostelOwnerBookingBed;
