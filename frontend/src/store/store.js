// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import bookingsReducer from './bookingsSlice';
// import cartReducer from './cartSlice';
// import hostelReducer from './hostelSlice';
// import kitchenReducer from './kitchenSlice';
// import ordersReducer from './orderSlice';
// import paymentReducer from './paymentSlice';
// import studentReducer from './studentSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     bookings: bookingsReducer,
//     cart: cartReducer,
//     hostels: hostelReducer,
//     kitchenItems: kitchenReducer,
//     orders: ordersReducer,
//     payments: paymentReducer,
//     student: studentReducer,
//   },
// });


// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import bookingsReducer from './bookingsSlice';
// import cartReducer from './cartSlice';
// import hostelReducer from './hostelSlice';
// import kitchenReducer from './kitchenSlice';
// import ordersReducer from './orderSlice';
// import paymentReducer from './paymentSlice';
// import studentReducer from './studentSlice';

// const appReducer = combineReducers({
//   auth: authReducer,
//   bookings: bookingsReducer,
//   cart: cartReducer,
//   hostels: hostelReducer,
//   kitchenItems: kitchenReducer,
//   orders: ordersReducer,
//   payments: paymentReducer,
//   student: studentReducer,
// });

// // Wipe EVERY slice back to its initial state whenever the user logs out.
// // Without this, data fetched for one logged-in user (e.g. a kitchen
// // owner's orders) can briefly survive in the Redux store after logout and
// // get rendered again for whichever account logs in next, before that
// // account's own data has finished loading — causing 403s from endpoints
// // that check "does this record belong to the current user".
// const rootReducer = (state, action) => {
//   if (action.type === 'auth/logout') {
//     state = undefined;
//   }
//   return appReducer(state, action);
// };

// export const store = configureStore({
//   reducer: rootReducer,
// });


// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import bookingsReducer from './bookingsSlice';
// import cartReducer from './cartSlice';
// import hostelReducer from './hostelSlice';
// import kitchenReducer from './kitchenSlice';
// import ordersReducer from './orderSlice';
// import paymentReducer from './paymentSlice';
// import studentReducer from './studentSlice';

// const appReducer = combineReducers({
//   auth: authReducer,
//   bookings: bookingsReducer,
//   cart: cartReducer,
//   hostels: hostelReducer,
//   kitchenItems: kitchenReducer,
//   orders: ordersReducer,
//   payments: paymentReducer,
//   student: studentReducer,
// });

// // Wipe EVERY slice back to its initial state whenever the user logs out,
// // OR right as a new login attempt starts.
// // Without this, data fetched for one logged-in user (e.g. a kitchen
// // owner's orders) can briefly survive in the Redux store after logout and
// // get rendered again for whichever account logs in next, before that
// // account's own data has finished loading — causing 403s from endpoints
// // that check "does this record belong to the current user". Resetting on
// // 'auth/loginUser/pending' as well covers the case where someone logs
// // straight into a different account without ever clicking Logout first
// // (e.g. testing multiple roles in the same tab).
// const rootReducer = (state, action) => {
//   if (action.type === 'auth/logout' || action.type === 'auth/loginUser/pending') {
//     state = undefined;
//   }
//   return appReducer(state, action);
// };

// export const store = configureStore({
//   reducer: rootReducer,
// });


import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookingsReducer from './bookingsSlice';
import cartReducer from './cartSlice';
import hostelReducer from './hostelSlice';
import kitchenReducer from './kitchenSlice';
import ordersReducer from './orderSlice';
import paymentReducer from './paymentSlice';
import studentReducer from './studentSlice';

const appReducer = combineReducers({
  auth: authReducer,
  bookings: bookingsReducer,
  cart: cartReducer,
  hostels: hostelReducer,
  kitchenItems: kitchenReducer,
  orders: ordersReducer,
  payments: paymentReducer,
  student: studentReducer,
});

// Wipe EVERY slice back to its initial state whenever the user logs out,
// OR right as a new login attempt starts.
// Without this, data fetched for one logged-in user (e.g. a kitchen
// owner's orders) can briefly survive in the Redux store after logout and
// get rendered again for whichever account logs in next, before that
// account's own data has finished loading — causing 403s from endpoints
// that check "does this record belong to the current user". Resetting on
// 'auth/loginUser/pending' as well covers the case where someone logs
// straight into a different account without ever clicking Logout first
// (e.g. testing multiple roles in the same tab).
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout' || action.type === 'auth/loginUser/pending') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});