import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookingsReducer from './bookingsSlice';
import cartReducer from './cartSlice';
import hostelReducer from './hostelSlice';
import kitchenReducer from './kitchenSlice';
import ordersReducer from './orderSlice';
import paymentReducer from './paymentSlice';
import studentReducer from './studentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingsReducer,
    cart: cartReducer,
    hostels: hostelReducer,
    kitchenItems: kitchenReducer,
    orders: ordersReducer,
    payments: paymentReducer,
    student: studentReducer,
  },
});