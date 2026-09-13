import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { processPayment } from '../../store/paymentSlice';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Modal from 'react-modal';
import PaymentOptions from '../PaymentOptions';

// Set Modal styles
Modal.setAppElement('#root'); // Important for accessibility

const CheckoutModal = ({ isOpen, onClose, bed, room, hostelOwnerId, onSuccess }) => {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idCard, setIdCard] = useState('');
  const [idCardError, setIdCardError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [stripeCardElement, setStripeCardElement] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Auto-populate user information when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setStudentName(fullName || user.name || '');
      setStudentEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
      setIdCard(user.cnic || user.id_card_number || '');
    }
  }, [isOpen, user]);

  const stripe = useStripe();
  const elements = useElements();

  // Validate ID Card (without dashes and exactly 13 digits)
  const validateIdCard = (value) => {
    const numericValue = value.replace(/-/g, ''); // Remove any dashes
    if (numericValue.length !== 13) {
      setIdCardError('ID card must be exactly 13 digits');
    } else {
      setIdCardError('');
    }
    setIdCard(numericValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!hostelOwnerId || hostelOwnerId === 'null') {
        setPaymentError('Hostel information could not be loaded. Please close checkout, refresh the page, and try again.');
        return;
    }

    // Ensure the user has provided a valid ID card number
    if (!idCard || idCardError) {
        setPaymentError('Please enter a valid 13-digit ID card number');
        return;
    }

    // Set payment processing state
    setPaymentProcessing(true);

    if (!stripe || !elements) {
        setPaymentError('Payment system is still loading. Please wait a moment and try again.');
        setPaymentProcessing(false);
        return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        setPaymentError('Please enter your card details.');
        setPaymentProcessing(false);
        return;
    }

    // Create a Payment Method.
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
                name: studentName,
                email: studentEmail,
                phone: phoneNumber,
            },
        });

        if (error) {
            // Stripe's own error message is already human-readable (e.g. "Your card number is invalid.")
            setPaymentError(error.message || 'Failed to validate card details. Please check and try again.');
            setPaymentProcessing(false);
            return;
        }
        paymentMethodIdToSend = stripePaymentMethod.id;
    }

    // Payment data to be sent to the backend
    const paymentData = {
        paymentMethodId: paymentMethodIdToSend,
        amount: room.price, // PKR is zero-decimal — no cents conversion needed
        description: `Booking bed ${bed.bed_number} in room ${room.name}`,
        hostelOwnerId,
        roomId: room._id,
        bed,
    };

    try {
        // Dispatching payment processing action to the backend
        const response = await dispatch(processPayment(paymentData)).unwrap();

        if (response.requiresAction && response.clientSecret) {
            // 3D Secure / additional authentication required
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(response.clientSecret);

            if (confirmError) {
                setPaymentError(confirmError.message || 'Payment confirmation failed. Please try again.');
                setPaymentProcessing(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                setPaymentSuccess(true);
                setTimeout(() => onSuccess(response.paymentData), 1800);
            } else {
                setPaymentError('Payment could not be confirmed. Please try again.');
                setPaymentProcessing(false);
            }
        } else if (response.success) {
            // Direct payment success — no further action needed
            setPaymentSuccess(true);
            setTimeout(() => onSuccess(response.paymentData), 1800);
        } else {
            setPaymentError(response.message || 'Payment failed. Please try again.');
            setPaymentProcessing(false);
        }
    } catch (rejectedValue) {
        // rejectedValue comes from rejectWithValue(error.response.data) in paymentSlice —
        // it's the actual backend error object/message, not a generic string.
        const message =
          (typeof rejectedValue === 'string' && rejectedValue) ||
          rejectedValue?.message ||
          'An error occurred during payment. Please try again.';
        setPaymentError(message);
        setPaymentProcessing(false);
    }
};


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
      bodyOpenClassName="overflow-hidden"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh]">
        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">Bed {bed.bed_number} in {room.name} has been booked for you.</p>
          </div>
        ) : (
        <>
        <h2 className="text-xl font-bold mb-4">Checkout for Bed {bed.bed_number}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              value={studentName}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              readOnly
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={studentEmail}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              readOnly
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              readOnly
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">ID Card Number</label>
            <input
              type="text"
              value={idCard}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              readOnly
              required
            />
            {idCardError && <p className="text-red-500 text-xs italic">{idCardError}</p>}
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <PaymentOptions
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          </div>

          <div className="mb-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Card Details</label>
            <div
              className="shadow border rounded w-full min-h-[48px] px-3 bg-white flex items-center cursor-text focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400"
              onClick={() => stripeCardElement?.focus()}
            >
              <CardElement
                onReady={setStripeCardElement}
                options={{
                  hidePostalCode: true,
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#1f2937',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '24px',
                      '::placeholder': { color: '#9ca3af' },
                    },
                    invalid: { color: '#dc2626' },
                  },
                }}
                className="w-full"
              />
            </div>
          </div>

          {paymentError && (
            <div className="mb-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {paymentError}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                paymentProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={paymentProcessing}
            >
              {paymentProcessing ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </Modal>
  );
};

export default CheckoutModal;
