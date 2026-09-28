import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { getOrdersForCustomer, updateOrderInState, removeOrder } from '../../store/orderSlice'; // Import the new action
import ChatModule from './ChatModule'; // Import the ChatModule component
import API_BASE_URL from '../../utils/api';
import ResponseCountdown from '../common/ResponseCountdown';

const OrderPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const user = useSelector((state) => state.auth.user);
  const [orderPlaced, setOrderPlaced] = useState(false); // For tracking order placement

  useEffect(() => {
    // Fetch the order details when the page loads
    dispatch(getOrdersForCustomer()).then(() => {
      setOrderPlaced(true); // Set orderPlaced to true once order data is fetched
    });

    if (user?._id) {
      const userId = user._id;

      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
        withCredentials: true });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      newSocket.emit('joinUserRoom', userId);

      // Handle real-time updates for the order
      newSocket.on('orderUpdate', (order) => {
        dispatch(updateOrderInState(order)); // Update the order in the Redux store
      });

      return () => {
        newSocket.emit('leaveUserRoom', userId);
        newSocket.disconnect();
      };
    }
  }, [dispatch, user]);

  const deleteOrder = (orderId) => {
    dispatch(removeOrder(orderId));
  };

  if (loading) return <div className="flex flex-col min-h-screen bg-[#1E201E]"><Navbar module={'food'} /><p className="text-center text-white mt-32">Loading...</p></div>;
  if (error) {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Something went wrong while loading your orders.');
    return (
      <div className="flex flex-col min-h-screen bg-[#1E201E]">
        <Navbar module={'food'} />
        <p className="text-center text-red-400 mt-32">{errorMessage}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="text-center text-white">No orders yet.</p>;
  } else {
    return (
      <div className="flex flex-col min-h-screen bg-[#1E201E]">
        <Navbar module={'food'} />
        <main className="flex-grow container mx-auto p-4 mt-28 bg-[#25292e] border border-[#59636e]">
          {orders.map((order) => (
            <div className="mb-4 rounded text-white" key={order._id}>
              <div className="p-4 rounded flex flex-col md:flex-row justify-between gap-4">
                <div className="w-full md:w-1/2 p-2 rounded md:pr-8 md:mr-2 border border-[#59636e]">
                  <h2 className="text-xl font-bold mb-2">Order #{order._id.slice(-6).toUpperCase()}</h2>
                  <OrderDetails details={order} />
                  <ResponseCountdown deadline={order.responseDeadline} pending={order.status === 'placed'} label="Kitchen confirmation time" />
                  <OrderList items={order.dishes} />
                </div>
                <div className="w-full md:w-1/2 bg-[#25292e] border border-[#59636e] shadow-[#25292e] text-white rounded">
                  <ChatModule orderId={order._id} kitchenId={order.kitchenOwnerId} orderStatus={order.status} />
                </div>
              </div>
              {order.status === 'Cancelled' ? (
                <p className="m-4 rounded bg-red-500/15 p-3 font-semibold text-red-300">Cancelled: {order.cancellationReason || 'The kitchen did not confirm this order.'}</p>
              ) : <OrderTracker status={order.status} orderPlaced={orderPlaced} />}
              <button
                onClick={() => deleteOrder(order._id)}
                className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded self-center mb-2 ml-2"
              >
                Remove From History
              </button>
            </div>
          ))}
        </main>
        <Footer />
      </div>
    );
  }
};

// Helper function to safely render message content
const renderMessage = (message) => {
  if (!message) {
    return "No message available";
  }

  if (typeof message === 'object') {
    return (
      <ul>
        {Object.entries(message).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
          </li>
        ))}
      </ul>
    );
  }

  return message; // For string or primitive type
};

// OrderDetails Component
const OrderDetails = ({ details }) => {
  return (
    <div>
      <h3 className="text-xl font-bold">Order Summary</h3>
      <p><strong>Kitchen:</strong> {details.kitchenName}</p>
      <p><strong>Delivery Address:</strong> {details.deliveryAddress}</p>
      <p><strong>Total Price:</strong> PKR {details.totalPrice}</p>
      <p><strong>Date:</strong> {new Date(details.orderPlacedAt).toLocaleDateString()}</p>

      {/* Render message safely */}
      <p><strong>Message:</strong> {renderMessage(details.message)}</p>
    </div>
  );
};

// OrderTracker Component
const OrderTracker = ({ status, orderPlaced }) => {
  const steps = ["Order Placed", "Confirm Order", "Preparing Order", "Delivered", "Completed"];
  const currentStep = steps.indexOf(status);
  const isActive = (index) => (orderPlaced && index === 0) || currentStep >= index;

  return (
    <>
      {/* Mobile: wrapping grid, no connector lines — a single cramped row has no
          room for two-word labels next to 5 circles, so they overlap. */}
      <div className="grid grid-cols-3 gap-y-4 justify-items-center w-full px-4 sm:hidden">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center px-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white
              ${isActive(index) ? 'bg-green-500' : 'bg-gray-300'}
              transition-all duration-700 ease-in-out`} style={{ transitionDelay: '0.5s' }}>
              {index + 1}
            </div>
            <span className="mt-2 text-center text-white text-sm">{step}</span>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: original horizontal line-connected stepper */}
      <div className="hidden sm:flex justify-between items-center w-full px-4">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white
                ${isActive(index) ? 'bg-green-500' : 'bg-gray-300'}
                transition-all duration-700 ease-in-out`} style={{ transitionDelay: '0.5s' }}>
                {index + 1}
              </div>
              <span className="mt-2 text-center text-white">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="h-0.5 bg-gray-300 flex-grow relative my-2" style={{ margin: '0 6px' }}>
                <div className={`absolute left-0 right-0 bg-green-500 h-0.5
                  ${currentStep > index ? 'w-full' : 'w-0'}
                  transition-all duration-700 ease-in-out`}
                  style={{ transitionDelay: '0.1s' }}>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

// OrderList Component
const OrderList = ({ items }) => (
  <>
    <h3 className="text-xl font-bold mb-4">Items Ordered</h3>
    {items.map(item => (
      <div key={item.dishId} className="grid grid-cols-3 justify-between items-center mb-2">
        <p className="text-left">Name: {item.name}</p>
        <p className="text-center">Qty: {item.quantity}</p>
        <p className="text-right">Total Price: PKR {item.price * item.quantity}</p>
      </div>
    ))}
  </>
);

export default OrderPage;
