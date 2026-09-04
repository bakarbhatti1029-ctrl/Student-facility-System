import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from './api';

// Fetches a booking's receipt PDF from our own backend (authenticated) and
// triggers a browser download. Cloudinary's raw-file CDN delivery turned out
// to be blocked on this account regardless of signing, so downloads are
// served directly by our own server instead of linking to Cloudinary.
export async function downloadReceipt(bookingId) {
  const token = Cookies.get('token');
  const response = await axios.get(`${API_BASE_URL}/api/bookings/receipt/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `SFS-Receipt-${bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
