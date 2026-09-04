// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import bookingsReducer from './bookingsSlice';
import hostelReducer from './hostelSlice';
import kitchenReducer from './kitchenSlice'
import orderReducer from './orderSlice';
import studentReducer from './studentSlice'; 
import paymentReducer from './paymentSlice';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    cart: cartReducer,
    bookings: bookingsReducer,
    hostels: hostelReducer,
    kitchenItems: kitchenReducer,
    orders:orderReducer,
    student: studentReducer,
    payments: paymentReducer,
    auth: authReducer,
  },
});

export default store;
