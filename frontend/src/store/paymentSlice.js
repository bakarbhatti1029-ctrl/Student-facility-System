import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../utils/api';

// Example thunk for processing payment
export const processPayment = createAsyncThunk('payments/processPayment', async (paymentData, { rejectWithValue }) => {
  console.log("paymentData",paymentData);
  const token = Cookies.get('token');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/bookings/book/${paymentData.hostelOwnerId}/${paymentData.roomId}/${paymentData.bed.bed_number}`, paymentData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Payment processing failed';
      });
  }
});

export default paymentSlice.reducer;
