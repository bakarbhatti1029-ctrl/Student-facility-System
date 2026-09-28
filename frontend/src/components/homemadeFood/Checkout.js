import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCartAPI, getCartAPI } from '../../store/cartSlice'; // Using Redux actions for cart
import { getStudentDataAPI } from '../../store/studentSlice'; // Using Redux actions for student
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios'; // Importing axios library
import Footer from '../Footer';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentMethodDropdown } from '../PaymentOptions';
import API_BASE_URL from '../../utils/api';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { kitchenId } = useLocation().state;
  const stripe = useStripe();
  const elements = useElements();

  // Get student and cart data from Redux
  const studentData = useSelector(state => state.student.data);
  const cartItems = useSelector(state => state.cart.carts.find(cart => cart.kitchenId === kitchenId));
  const isCartLoading = useSelector(state => state.cart.loading);

  const [paymentMethod, setPaymentMethod] = useState('stripe'); // Default payment method (lowercase)
  const [phoneNumber, setPhoneNumber] = useState(''); // Editable phone number
  const [address, setAddress] = useState(''); // Editable address
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch student and cart data when component mounts
  useEffect(() => {
    dispatch(getStudentDataAPI()); // Fetch student data via Redux
    dispatch(getCartAPI()); // Fetch cart data via Redux
  }, [dispatch]);

  useEffect(() => {
    if (studentData) {
      setPhoneNumber(studentData.phone_number); // Set initial phone number
      setAddress(studentData.address); // Set initial address
    }
  }, [studentData]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!studentData || !cartItems || cartItems.items.length === 0) {
      setPaymentError('Please complete all fields before proceeding with the payment.');
      return;
    }
    if (!stripe || !elements) {
      setPaymentError('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setPaymentError('Please enter your card details.');
      return;
    }

    setProcessing(true);

    // Create a Stripe payment method from the entered card details.
    // STRIPE_MOCK: when REACT_APP_STRIPE_MOCK=true (local testing only, pair
    // with STRIPE_MOCK=true in backend/.env), skip Stripe.js entirely so
    // payment can be tested even if Stripe is unreachable from this network.
    let paymentMethodIdToSend;
    if (process.env.REACT_APP_STRIPE_MOCK === 'true') {
      paymentMethodIdToSend = 'pm_mock';
    } else {
      const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${studentData.first_name} ${studentData.last_name}`,
          phone: phoneNumber } });

      if (error) {
        setPaymentError(error.message || 'Failed to validate card details. Please check and try again.');
        setProcessing(false);
        return;
      }
      paymentMethodIdToSend = stripePaymentMethod.id;
    }

    const totalQuantity = cartItems.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cartItems.totalPrice;
    const kitchenOwnerId = cartItems.kitchenId;
    const kitchenName = cartItems.kitchenName;

    const orderData = {
      kitchenOwnerId,
      kitchenName,
      deliveryAddress: address,
      dishes: cartItems.items.map(item => ({
        id: item.productId._id,
        name: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price })),
      totalQuantity,
      totalPrice,
      paymentMethod,
      paymentMethodId: paymentMethodIdToSend };

    try {

      const response = await axios.post(`${API_BASE_URL}/api/order/create`, orderData, {
        headers: { } });

      if (response.data.requiresAction && response.data.clientSecret) {
        // Extra authentication (3D Secure) required
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(response.data.clientSecret);

        if (confirmError) {
          setPaymentError(confirmError.message || 'Payment confirmation failed. Please try again.');
          setProcessing(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          // Tell the backend to mark this order as paid now that Stripe confirms it
          await axios.post(
            `${API_BASE_URL}/api/order/confirm-payment`,
            { orderId: response.data.orderId },
            { headers: { } }
          );
          await dispatch(clearCartAPI({ kitchenId }));
          setPaymentSuccess(true);
          setTimeout(() => navigate('/orders'), 1800);
        } else {
          setPaymentError('Payment could not be confirmed. Please try again.');
          setProcessing(false);
        }
      } else if (response.data.success) {
        await dispatch(clearCartAPI({ kitchenId }));
        setPaymentSuccess(true);
        setTimeout(() => navigate('/orders'), 1800);
      } else {
        setPaymentError(response.data.message || 'Order could not be placed. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred during checkout. Please try again.';
      setPaymentError(message);
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/cart'); // Navigate back to the cart page
  };

  if (isCartLoading) {
    return (
      <div className="bg-[#1E201E] min-h-screen text-white text-center pt-32">
        Loading cart...
      </div>
    );
  }

  if (!cartItems) return <div className="bg-[#1E201E] min-h-screen text-white text-center pt-32">No cart items found!</div>;

  return (
    <>
      <div className='bg-[#1E201E]'>
  <Navbar module={'food'} />
  <div className="container border-b border-[#59636e] mx-auto pt-32 text-white">
    <h2 className="text-2xl text-center font-bold mb-4">Checkout</h2>

    {paymentSuccess ? (
      <div className="max-w-lg mx-auto mb-5 bg-[#25292e] border border-[#59636e] text-white p-10 rounded shadow-lg flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-900/40 border border-green-600 flex items-center justify-center mb-4">
          <svg className="w-9 h-9 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-1">Payment Successful!</h3>
        <p className="text-gray-400 text-sm">Your order has been placed. Redirecting to your orders...</p>
      </div>
    ) : (
    <form
      onSubmit={handleCheckout}
      className="max-w-lg mx-auto mb-5 bg-[#25292e] border border-[#59636e] text-white p-8 rounded shadow-lg"
      style={{ maxHeight: '600px', overflowY: 'auto' }} // Scrollable form
    >
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={`${studentData.first_name} ${studentData.last_name}`}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
          readOnly
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          type="text"
          value={phoneNumber} // Use state variable for phone number
          onChange={(e) => setPhoneNumber(e.target.value)} // Update phone number state
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" htmlFor="address">Address (Your Current Address)</label>
        <input
          id="address"
          type="text"
          value={address} // Use state variable for address
          onChange={(e) => setAddress(e.target.value)} // Update address state
          className="shadow border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      {cartItems && (
        <>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2" htmlFor="kitchenName">Kitchen Name</label>
            <input
              id="kitchenName"
              type="text"
              value={cartItems.kitchenName}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2" htmlFor="totalQuantity">Total Quantity</label>
            <input
              id="totalQuantity"
              type="text"
              value={cartItems.items.reduce((acc, item) => acc + item.quantity, 0)}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2" htmlFor="totalPrice">Total Price</label>
            <input
              id="totalPrice"
              type="text"
              value={`PKR ${cartItems.totalPrice.toFixed(2)}`}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-[#25292e] text-white leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </>
      )}
      <div className="mb-4">
        <label className="block text-white text-sm font-bold mb-2" htmlFor="paymentMethod">Payment Method</label>
        <PaymentMethodDropdown
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="block text-white text-sm font-bold mb-2">Card Number</label>
        <div className="shadow border rounded w-full py-3 px-3 bg-white">
          <CardNumberElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#9ca3af' } },
                invalid: { color: '#dc2626' } } }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="block text-white text-sm font-bold mb-2">Expiry (MM / YY)</label>
          <div className="shadow border rounded py-3 px-3 bg-white">
            <CardExpiryElement options={{ style: { base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } }, invalid: { color: '#dc2626' } } }} />
          </div>
        </div>
        <div>
          <label className="block text-white text-sm font-bold mb-2">CVC</label>
          <div className="shadow border rounded py-3 px-3 bg-white">
            <CardCvcElement options={{ style: { base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } }, invalid: { color: '#dc2626' } } }} />
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="mb-4 mt-3 p-3 bg-red-900/40 border border-red-700/50 text-red-300 rounded text-sm">
          {paymentError}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          type="submit"
          disabled={processing}
          className="bg-black hover:bg-[#25292e] disabled:opacity-50 disabled:cursor-not-allowed border border-[#59636e] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={processing}
          className="bg-black hover:bg-[#25292e] border border-[#59636e] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
    )}
  </div>
  <Footer />
</div>

    </>
  );
};

export default Checkout;
