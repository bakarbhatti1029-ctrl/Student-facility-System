import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

export const fetchAllDishes = createAsyncThunk('kitchens/fetchAllDishes', async (_, { rejectWithValue }) => {

  try {
    const response = await axios.get(`${API_BASE_URL}/api/dishes/getAllDishes`, {
      headers: {
        
      } });
    return response.data;
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.message || error.message,
      status: error.response?.status });
  }
});

export const addItem = createAsyncThunk(
  'kitchens/addItem',
  async (itemDetails, { rejectWithValue }) => {

    try {
      const response = await axios.post(`${API_BASE_URL}/api/dishes/createDish`, itemDetails, {
        headers: { } });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status });
    }
  }
);

export const updateItem = createAsyncThunk(
  'kitchens/updateItem',
  async ({ id, itemDetails }, { rejectWithValue }) => {

    try {
      const response = await axios.put(`${API_BASE_URL}/api/dishes/updateDish/${id}`, itemDetails, {
        headers: { } });
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        status: error.response?.status });
    }
  }
);

export const deleteItem = createAsyncThunk(
  'kitchens/deleteItem',
  async (id) => {

    await axios.delete(`${API_BASE_URL}/api/dishes/deleteDish/${id}`, {
      headers: { } });
    return id;
  }
);

export const fetchItem = createAsyncThunk(
  'kitchens/fetchItem',
  async (id) => {

    const response = await axios.get(`${API_BASE_URL}/api/dishes/getDish/${id}`, {
      headers: { } });
    return response.data;
  }
);

const kitchenSlice = createSlice({
  name: 'kitchens',
  initialState: { dishes: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDishes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDishes.fulfilled, (state, action) => {
        state.dishes = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllDishes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.dishes.push(action.payload);
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.dishes.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.dishes[index] = action.payload;
        }
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.dishes = state.dishes.filter((item) => item._id !== action.payload);
      })
      .addCase(fetchItem.fulfilled, (state, action) => {
        const index = state.dishes.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.dishes[index] = action.payload;
        } else {
          state.dishes.push(action.payload);
        }
      });
  } });

export default kitchenSlice.reducer;
