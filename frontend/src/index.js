import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { store } from './store/store';
import './index.css';
import App from './App';


// Load Stripe with your publishable key
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
   <HelmetProvider>
    <Elements stripe={stripePromise}>
    <ToastContainer
        position="bottom-right" // This will fix it at the bottom right
        autoClose={5000} // Auto-close after 5 seconds
        hideProgressBar={false} // Show the progress bar
        newestOnTop={false} // Toasts are stacked oldest to newest
        closeOnClick
        rtl={false} // Default is left-to-right layout
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ top: '70px' }}
        />
      <App />
    </Elements>
   </HelmetProvider>
  </Provider>
);
