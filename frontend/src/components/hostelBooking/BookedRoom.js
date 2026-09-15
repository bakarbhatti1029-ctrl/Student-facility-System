import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBookedRooms, removeBookingFromHistory } from '../../store/bookingsSlice';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { downloadReceipt } from '../../utils/downloadReceipt';
import ResponseCountdown from '../common/ResponseCountdown';

const BookedRoom = () => {
  const dispatch = useDispatch();
  const { bookedRooms, status, error } = useSelector((state) => state.bookings);
  const [removingId, setRemovingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
      dispatch(fetchBookedRooms());
  }, [dispatch]);

  const handleRemove = async (bookingId) => {
    if (!window.confirm('Cancel this booking? This will free up your bed.')) return;
    setRemovingId(bookingId);
    await dispatch(removeBookingFromHistory(bookingId));
    setRemovingId(null);
  };

  const handleDownloadReceipt = async (bookingId) => {
    setDownloadingId(bookingId);
    try {
      await downloadReceipt(bookingId);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    } finally {
      setDownloadingId(null);
    }
  };
  
  if (status === 'loading') return <p>Loading...</p>;
  // if (status === 'failed') return <p>Error: {error}</p>;

  return (
    <div className="flex flex-col min-h-screen bg-[#1E201E]">
      <Navbar module="hostel" />

      <div className="flex-grow p-4 md:p-8">
        <h1 className="text-3xl text-white font-bold mb-6">Booked Beds</h1>
        {bookedRooms.length === 0 ? (
          <div className="text-white text-center mt-20">
            <p className="text-lg">No beds booked yet.</p>
            <p className="text-gray-400">Start booking your stay at our hostels!</p>
          </div>
        ) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookedRooms.map((booking) => (
            <div key={booking.bookingId} className="bg-gray-800 p-6 flex flex-col justify-center gap-4 rounded-lg shadow-md border border-gray-600">
              <h3 className="text-xl text-yellow-400 font-bold">{booking.hostelName}</h3>
              <ResponseCountdown deadline={booking.responseDeadline} pending={booking.status === 'Pending'} label="Hostel response time" />

              <div className="text-white space-y-2 text-center">
                <p>
                  <span className="font-semibold text-gray-400">Booking ID:</span> {booking.bookingId}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">Hostel Address:</span> {booking.hostelAddress}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">Room No.</span> {booking.roomName}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">Booking Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">Booking Status:</span>{' '}
                  <span className={booking.status === 'Approved' ? 'text-green-500' : booking.status === 'Rejected' ? 'text-red-500' : 'text-yellow-400'}>
                    {(booking.status || 'Pending').toUpperCase()}
                  </span>
                </p>

                <ul className="list-none space-y-2">
                  {booking.beds.map((bed) => (
                    <li key={bed._id} className="flex flex-wrap gap-4 justify-center items-center">
                      <p>
                        <span className="font-semibold text-gray-400">Bed Number:</span> {bed.bed_number}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Payment Status: </span>
                        <span className={bed.paymentStatus === 'completed' ? 'text-green-500' : 'text-red-500'}>
                          {(bed.paymentStatus || 'pending').toUpperCase()}
                        </span>
                      </p>
                      {bed.paymentStatus === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(booking.bookingId)}
                          disabled={downloadingId === booking.bookingId}
                          className="text-yellow-400 hover:text-yellow-300 underline text-sm disabled:opacity-50"
                        >
                          {downloadingId === booking.bookingId ? 'Preparing...' : 'Download Receipt'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition mx-auto disabled:opacity-50"
                disabled={removingId === booking.bookingId}
                onClick={() => handleRemove(booking.bookingId)}
              >
                {removingId === booking.bookingId ? 'Removing...' : 'Remove from History'}
              </button>
            </div>
          ))}
        </div>) }


      </div>

      <Footer />
    </div>
  );
};

export default BookedRoom;
