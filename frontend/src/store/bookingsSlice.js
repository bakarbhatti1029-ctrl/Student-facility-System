import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../utils/api';

// Thunk to book a bed
export const bookRoom = createAsyncThunk('bookings/bookRoom', async ({ hostelId, roomId, bed, paymentData }, { rejectWithValue }) => {
  console.log("hostelId",hostelId);
  console.log("roomId",roomId);
  console.log("bed",bed);
  console.log("paymentData",paymentData);
  const token = Cookies.get('token');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/book/${hostelId}/${roomId}/${bed}`, { bed, paymentData }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return { roomId, bed: response.data };
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Thunk to fetch all bookings
export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async (_, { rejectWithValue }) => {
  const token = Cookies.get('token');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/bookings/HostelOwnerBookedBeds`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('fetchBookings for hostelowner:', response.data);
    return response.data; // Raw bookings data from the backend
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
    });
  }
});

// Thunk to unbook a bed
export const unbookRoom = createAsyncThunk('bookings/unbookRoom', async ({ roomId, bedId }, { rejectWithValue }) => {
  const token = Cookies.get('token');
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/bookings/unbookBed`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: { roomId, bedId }
    });
    return { roomId, bedId };
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

// Thunk to remove/cancel a booking from history (used by both the student's
// "Booked Beds" page and the hostel owner's "Booked Beds" page). Hits the real
// DELETE /api/bookings/unbookBed/:bookingId endpoint.
export const removeBookingFromHistory = createAsyncThunk(
  'bookings/removeBookingFromHistory',
  async (bookingId, { rejectWithValue }) => {
    const token = Cookies.get('token');
    try {
      await axios.delete(`${API_BASE_URL}/api/bookings/unbookBed/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { bookingId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to remove booking' });
    }
  }
);

// Async thunk for fetching booked rooms
export const fetchBookedRooms = createAsyncThunk(
  'bookings/fetchBookedRooms',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching booked rooms');
      const token = Cookies.get('token');
      const response = await axios.get(`${API_BASE_URL}/api/bookings/booked-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('fetch Bookings:', response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [], // Flat array of hostel-owner-side booked beds (see getHostelOwnerBookedBeds)
    loading: false,
    error: null,
    bookedRooms: [],
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Book Room
      .addCase(bookRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookRoom.fulfilled, (state, action) => {
        const { roomId, bed } = action.payload;
        if (!state.bookings[roomId]) {
          state.bookings[roomId] = { beds: [] };
        }
        state.bookings[roomId].beds.push(bed);
        state.loading = false;
      })
      .addCase(bookRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Booking failed';
      })

      // Unbook Room
      .addCase(unbookRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unbookRoom.fulfilled, (state, action) => {
        const { roomId, bedId } = action.payload;
        const room = state.bookings[roomId];
        if (room) {
          const bedIndex = room.beds.findIndex((bed) => bed._id === bedId);
          if (bedIndex !== -1) {
            room.beds[bedIndex].isBooked = false;
            room.beds[bedIndex].bookedBy = null;
            room.beds[bedIndex].bookingDate = null;
            room.beds[bedIndex].paymentStatus = 'pending';
          }
        }
        state.loading = false;
      })
      .addCase(unbookRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to unbook room';
      })

      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        // Backend returns { success, data: [...] } - a flat array of booked-bed rows
        state.bookings = Array.isArray(action.payload)
          ? action.payload
          : (action.payload?.data || []);
        state.loading = false;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch bookings';
      })

      // Fetch Booked Rooms
      .addCase(fetchBookedRooms.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBookedRooms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.bookedRooms = action.payload;
      })
      .addCase(fetchBookedRooms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch booked rooms';
      })

      // Remove/cancel a booking from history (owner side + student side)
      .addCase(removeBookingFromHistory.fulfilled, (state, action) => {
        const { bookingId } = action.payload;
        // Owner-side flat list
        state.bookings = state.bookings.filter(
          b => b.bookingId?.toString() !== bookingId
        );
        // Student-side list (grouped by room, each with its own bookingId)
        state.bookedRooms = state.bookedRooms.filter(
          b => b.bookingId?.toString() !== bookingId
        );
      })
      .addCase(removeBookingFromHistory.rejected, (state, action) => {
        state.error = action.payload?.message || action.payload?.error || 'Failed to remove booking';
      });
  }
});

export default bookingsSlice.reducer;
