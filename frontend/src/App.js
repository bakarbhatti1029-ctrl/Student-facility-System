import './index.css';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Home from './screens/Home';
import Kitchens from './components/homemadeFood/Kitchens';
import RegistrationForm from './components/Register';
import LoginForm from './components/Login';
import HostelList from './components/hostelBooking/Hostels';
import HostelDetail from './components/hostelBooking/HostelDetail';
import BookedRoom from './components/hostelBooking/BookedRoom';
import Checkout from './components/hostelBooking/Checkout';
import Cart from './components/homemadeFood/Cart';
import KitchenDetail from './components/homemadeFood/KitchenDetail';
import Confirmation from './components/homemadeFood/Confirmation';
import CheckoutFood from './components/homemadeFood/Checkout';
import HostelOwnerProfile from './components/hostelBooking/HostelOwnerProfile';
import KitchenOwnerProfile from './components/homemadeFood/kitchenOwnerProfile';
import KitchenOwnerOrders from './components/homemadeFood/KitchenOwnersOrder';
import OtpScreen from './components/otpScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import HostelOwnerDashboard from './components/hostelBooking/HostelOwnerDashboard';
import KitchenOwnerDashboard from './components/homemadeFood/KitchenOwnerDashboard';
import TotalRoom from './components/hostelBooking/TotalRoom';
import Dishes from './components/homemadeFood/Dishes';
import OrderPage from './components/homemadeFood/Order';
import RoomDetail from './components/hostelBooking/RoomDetail';
import Mission from './components/Mission';
import AboutUs from './screens/AboutUs';
import ContactUs from './screens/ContactUs';
import StudentProfile from './screens/StudentProfile';
import Logout from './components/Logout';
import HostelOwnerBookingBed from './components/hostelBooking/HostelOwnerbookingBed';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import NotFound from './screens/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const INDEXABLE_ROUTES = new Set([
  '/',
  '/hostel-booking',
  '/kitchens',
  '/about-us',
  '/contact-us',
]);

// Keep account, checkout, dashboard, and unknown SPA routes out of search results.
// These routes are useful to users but are not standalone search landing pages.
function RouteIndexing() {
  const { pathname } = useLocation();

  if (INDEXABLE_ROUTES.has(pathname)) return null;

  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );
}

function App() {
  return (
    <div className="">
   
     <Router>
      <ScrollToTop />
      <RouteIndexing />
      <Routes>
        <Route path="/" exact element={<Home/>} />
        <Route path="/otp" element={<OtpScreen/>} />
        <Route path="/reset-password" element={<ResetPasswordScreen/>} />
        <Route path="/hostel-booking" element={<HostelList/>} />
        <Route path="/home-made-food" element={<Navigate to="/kitchens" replace />} />
        <Route path="/rooms/:id" element={<RoomDetail/>} />
        <Route path='/register' element={<RegistrationForm/>}/>
        <Route path='/loginform' element={<LoginForm/>}/>
        <Route path='/logout' element={<Logout/>}/>
        <Route path="/hostels/:id" element={<HostelDetail/>} />
        <Route path="/booked-room" element={<BookedRoom/>} />
        <Route path="/food/checkout" element={<CheckoutFood/>} />
        <Route path="/hostel/checkout" element={<Checkout/>} />
        <Route path="/cart" element={<Cart/>} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/kitchen/:id" element={<KitchenDetail/>} />
        <Route path="/kitchens" element={<Kitchens/>} />
        <Route path="/hostel-owner-profile/totalroom" element={<TotalRoom/>} />
        <Route path="/kitchen-owner-profile/dishes" element={<Dishes/>} />
        <Route path="/confirmation" element={<Confirmation/>} />
        <Route path="/hostel-owner-profile" element={<HostelOwnerProfile/>}/>
        <Route path="/kitchen-owner-profile" element={<KitchenOwnerProfile/>} />
        <Route path="/kitchen-owner/orders" element={<KitchenOwnerOrders/>} />
       <Route path='/hostelownerdashboard' element={<HostelOwnerDashboard/>}/>
       <Route path='/Mission' element={<Mission/>}/>
       <Route path='/about-us' element={<AboutUs/>}/>
       <Route path='/AboutUs' element={<Navigate to="/about-us" replace />}/>
       <Route path='/profile' element={<StudentProfile/>}/>
       <Route path='/booking' element={<HostelOwnerBookingBed/>}/>
       <Route path='/contact-us' element={<ContactUs/>}/>
       <Route path='/ContactUs' element={<Navigate to="/contact-us" replace />}/>
       <Route path='/kitchenownerdashboard' element={<KitchenOwnerDashboard/>}/>

       {/* Admin Routes */}
       <Route path='/admin/login' element={<AdminLogin/>}/>
       <Route path='/admin/dashboard' element={<AdminDashboard/>}/>

       {/* Catch-all: any unmatched URL */}
       <Route path='*' element={<NotFound/>}/>
      </Routes>
    </Router>
    </div>
  );
}

export default App;
