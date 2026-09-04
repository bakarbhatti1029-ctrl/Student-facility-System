import React, { useState } from 'react';
import Modal from 'react-modal';
import { downloadReceipt } from '../../utils/downloadReceipt';

Modal.setAppElement('#root');

// Shown right after a successful bed booking. Displays a receipt the student
// can either save (download a freshly generated PDF) or dismiss.
const InvoiceModal = ({ data, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  if (!data) return null;

  const { bed, booking, room, hostel, student } = data;

  const handleSave = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadReceipt(booking._id);
    } catch (err) {
      console.error('Failed to download receipt:', err);
      const status = err?.response?.status;
      setDownloadError(
        status === 401 || status === 403
          ? "You're not authorized to download this receipt. Please log in again."
          : "Couldn't generate the receipt right now. If the server was recently idle, please try again in a moment."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={!!data}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
      bodyOpenClassName="overflow-hidden"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Booking Receipt</h2>
          <p className="text-gray-500 text-sm">Keep this for your records</p>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 text-sm">
          {student && (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Student</p>
              <p className="text-gray-800 font-medium">{student.first_name} {student.last_name}</p>
              <p className="text-gray-500">{student.email}</p>
              <p className="text-gray-500">{student.phone_number}</p>
            </div>
          )}
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Hostel</p>
            <p className="text-gray-800 font-medium">{hostel?.hostel_name}</p>
            <p className="text-gray-500">{hostel?.hostel_address}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Booking</p>
            <p className="text-gray-800">Room: <span className="font-medium">{room?.name}</span></p>
            <p className="text-gray-800">Bed Number: <span className="font-medium">{bed?.bed_number}</span></p>
            <p className="text-gray-800">
              Date: <span className="font-medium">{booking?.booking_date ? new Date(booking.booking_date).toLocaleString() : 'N/A'}</span>
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Payment</p>
            <p className="text-gray-800">Amount Paid: <span className="font-medium">PKR {room?.price}</span></p>
            <p className="text-gray-800">Reference: <span className="font-medium break-all">{booking?._id}</span></p>
          </div>
        </div>

        {downloadError && (
          <p className="mt-4 text-sm text-red-600 text-center">{downloadError}</p>
        )}

        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={downloading || !booking?._id}
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {downloading ? 'Preparing...' : 'Save Receipt'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
