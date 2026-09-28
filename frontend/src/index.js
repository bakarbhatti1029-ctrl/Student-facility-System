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
import axios from 'axios';

// Send the HTTP-only session cookie and double-submit CSRF token on writes.
axios.defaults.withCredentials = true;
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const csrfClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true });
let csrfToken = null;
let csrfRequest = null;

// Keep one in-flight token request for the whole app. Without this, two
// simultaneous writes can receive different tokens: the browser stores the
// later cookie while the earlier request sends the older header, causing a
// false "Invalid or missing CSRF token" response.
const getCsrfToken = async ({ refresh = false } = {}) => {
  if (!refresh && csrfToken) return csrfToken;
  if (csrfRequest) return csrfRequest;

  csrfRequest = csrfClient.get('/auth/csrf')
    .then((response) => {
      csrfToken = response.data.csrfToken;
      return csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
};

const setCsrfHeader = (config, token) => {
  config.headers = config.headers || {};
  // Bracket assignment works with both AxiosHeaders (Axios 1.x) and a plain
  // object, including mobile browser builds where `.set()` is not available.
  config.headers['X-CSRF-Token'] = token;
};

axios.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    const token = await getCsrfToken();
    if (token) setCsrfHeader(config, token);
  }
  return config;
});
axios.interceptors.response.use((response) => {
  const refreshedCsrfToken = response.headers['x-csrf-token'];
  if (refreshedCsrfToken) csrfToken = refreshedCsrfToken;
  return response;
}, async (error) => {
  const request = error.config;
  const isCsrfFailure = error.response?.status === 403
    && error.response?.data?.message === 'Invalid or missing CSRF token.';

  // A cookie may have been rotated in another tab or during a slow mobile
  // connection. Refresh once and replay the original request; never retry
  // repeatedly, so a genuine permission failure remains visible.
  if (request && isCsrfFailure && !request.__csrfRetried) {
    request.__csrfRetried = true;
    const token = await getCsrfToken({ refresh: true });
    if (token) setCsrfHeader(request, token);
    return axios(request);
  }
  return Promise.reject(error);
});

// Prevent a flash of unstyled React content on slow connections. In the
// production build CRA extracts our CSS to /static/css/*.css; reveal the app
// only after those local stylesheets are available. External web fonts do not
// block the interface. Development injects styles synchronously, so it can be
// revealed immediately when no extracted CSS link exists.
const revealStyledApp = () => {
  document.documentElement.classList.add('app-styles-ready');
};

const appStyleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  .filter(link => link.href.includes('/static/css/'));

if (appStyleLinks.length === 0 || appStyleLinks.every(link => link.sheet)) {
  revealStyledApp();
} else {
  let remaining = appStyleLinks.filter(link => !link.sheet).length;
  appStyleLinks.filter(link => !link.sheet).forEach(link => {
    link.addEventListener('load', () => {
      remaining -= 1;
      if (remaining === 0) revealStyledApp();
    }, { once: true });
  });

  window.setTimeout(() => {
    if (document.documentElement.classList.contains('app-styles-ready')) return;
    const boot = document.getElementById('app-boot');
    const message = document.getElementById('app-boot-message');
    boot?.classList.add('app-boot-slow');
    if (message) message.textContent = 'Styles are taking longer than expected. Check your connection and try again.';
  }, 12000);
}


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

// Cache the compiled application shell for repeat visits on weak or offline
// connections. Dynamic API requests are deliberately not cached because bed
// availability, bookings, orders, and payments must always be current.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Offline support could not be enabled:', error);
    });
  });
}
