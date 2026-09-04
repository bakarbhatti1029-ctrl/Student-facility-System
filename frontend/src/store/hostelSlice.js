import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import axios from 'axios';
import API_BASE_URL from '../utils/api';


export const addRoom = createAsyncThunk('hostels/addRoom', async (roomDetails) => {
  const token = Cookies.get('token');
  const response = await axios.post(`${API_BASE_URL}/api/rooms/createRoom`, roomDetails, {
    headers: {  Authorization: `Bearer ${token}` }, 
  });
  return response.data;
});

export const fetchRoom = createAsyncThunk('hostels/fetchRoom', async (id) => {
  const token = Cookies.get('token');
  const response = await axios.get(`${API_BASE_URL}/api/rooms/getRoom/${id}`, {
    headers: { Authorization: `Bearer ${token}` }, 
  });
  return response.data;
});

export const editRoom = createAsyncThunk('hostels/editRoom', async ({ id, roomDetails }) => {
  const token = Cookies.get('token');
  const response = await axios.put(`${API_BASE_URL}/api/rooms/updateRoom/${id}`, roomDetails, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

export const deleteRoom = createAsyncThunk('hostels/deleteRoom', async (id) => {
  const token = Cookies.get('token');
  await axios.delete(`${API_BASE_URL}/api/rooms/deleteRoom/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return id;
});

// Inside hostelSlice.js

export const fetchAllRooms = createAsyncThunk('hostels/fetchAllRooms', async (_, { rejectWithValue }) => {
  const token = Cookies.get('token');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rooms/getAllRooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Get all rooms response:', response);
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
    });
  }
});


const hostelSlice = createSlice({
  name: 'hostels',
  initialState: { rooms: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRooms.fulfilled, (state, action) => {
        state.rooms = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload);
      })
      .addCase(fetchRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex((room) => room._id === action.payload._id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        } else {
          state.rooms.push(action.payload);
        }
      })
      .addCase(editRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex((room) => room._id === action.payload._id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter((room) => room._id !== action.payload);
      });
  },
});

export default hostelSlice.reducer;

