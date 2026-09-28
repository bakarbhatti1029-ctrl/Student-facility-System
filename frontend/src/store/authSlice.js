import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'No active session.' });
    }
  }
);

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response received from server' });
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        credentials
      );
      return response.data;
    } catch (error) {
      // express-rate-limit includes RateLimit headers on successful and normal
      // 400 responses too. A bad password is not a lockout; only honour the
      // reset value when the server actually returned 429.
      const isRateLimited = error.response?.status === 429;
      return rejectWithValue(
        {
          ...(error.response?.data || { message: 'Unable to log in. Please try again.' }),
          retryAfter: isRateLimited ? Number(error.response?.headers?.['ratelimit-reset']) || 0 : 0 }
      );
    }
  }
);

// Define the initial state
const initialState = {
  user: null,
  cartSummary: null,
  verified: false,
  isAuthenticated: false,
  loading: false,
  error: null };

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Used to restore auth state from cookies/sessionStorage on page load
    setCredentials: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;  // Clear user information
      state.cartSummary = null;  // Clear cart summary
      state.isAuthenticated = false;  // Set authenticated to false
      state.verified = false;  // Set verified to false
      sessionStorage.removeItem('user');  // Clear session storage
      sessionStorage.removeItem('verified');  // Clear verified session
    },
    clearError: (state) => {
      state.error = null;  // Clear any existing errors
    } },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user || null;
        state.cartSummary = action.payload.cartSummary;
        state.isAuthenticated = false;
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
        const { user, cartSummary } = action.payload;
        state.user = user;
        state.cartSummary = cartSummary;
        state.isAuthenticated = true;
        state.verified = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        sessionStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        sessionStorage.removeItem('user');
      });
  } });

export const { logout, clearError, setCredentials } = authSlice.actions;

export default authSlice.reducer;
