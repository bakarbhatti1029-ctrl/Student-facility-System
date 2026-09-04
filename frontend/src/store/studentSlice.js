import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../utils/api';

// Fetch student data
export const getStudentDataAPI = createAsyncThunk('student/getStudentDataAPI', async () => {
  const token = Cookies.get('token');
  const response = await axios.get(`${API_BASE_URL}/api/student/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
});

const studentSlice = createSlice({
  name: 'student',
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStudentDataAPI.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStudentDataAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getStudentDataAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default studentSlice.reducer;
