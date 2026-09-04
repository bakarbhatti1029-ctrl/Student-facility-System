import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import axios from 'axios';

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Thunk: Sending registration request with data:', userData);
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/register`, userData);
      console.log('Thunk: Registration API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Thunk: Registration API error:', error);
      // Log more details about the error
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        return rejectWithValue({ message: 'No response received from server' });
      } else {
        // Something happened in setting up the request
        console.error('Error message:', error.message);
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk('auth/loginUser', async (credentials) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/login`, credentials);
  return response.data;
});

// Define the initial state
const initialState = {
  token: null,
  user: null,
  cartSummary: null,
  verified: false,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Used to restore auth state from cookies/sessionStorage on page load
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;  // Clear token
      state.user = null;  // Clear user information
      state.cartSummary = null;  // Clear cart summary
      state.isAuthenticated = false;  // Set authenticated to false
      state.verified = false;  // Set verified to false
      Cookies.remove('token');  // Remove token from cookies
      sessionStorage.removeItem('user');  // Clear session storage
      sessionStorage.removeItem('verified');  // Clear verified session
    },
    clearError: (state) => {
      state.error = null;  // Clear any existing errors
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { token, user, cartSummary } = action.payload;
        state.token = token;
        state.user = user;
        state.cartSummary = cartSummary;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user, cartSummary } = action.payload;
        state.token = token;
        state.user = user;
        state.cartSummary = cartSummary;
        state.isAuthenticated = true;
        state.verified = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;

export default authSlice.reducer;
