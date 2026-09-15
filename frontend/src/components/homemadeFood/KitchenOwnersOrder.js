import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import KitchenOwnerNavbar from './KitchenOwnerNavbar';
import { getOrdersForKitchen, updateOrderStatus, removeOrder, addNewOrder,addOrderToChart } from '../../store/orderSlice';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import ChatModule from './ChatModule';
import API_BASE_URL from '../../utils/api';
import ErrorState from '../common/ErrorState';
import ResponseCountdown from '../common/ResponseCountdown';

const KitchenOwnerOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [socket, setSocket] = useState(null);
  
  const steps = ["Confirm Order", "Preparing Order", "Delivered", "Completed"]; // Defined steps

  useEffect(() => {
    dispatch(getOrdersForKitchen());

    const token = Cookies.get('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const kitchenId = decodedToken.id;

      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
        withCredentials: true,
        auth: { token },
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(newSocket);

      // Kitchen owner joins the room
      newSocket.emit('joinKitchenRoom', kitchenId);

      // Listen for new orders
      newSocket.on('newOrder', (order) => {
        dispatch(addNewOrder(order));
      });

      return () => {
        newSocket.emit('leaveKitchenRoom', kitchenId);
        newSocket.disconnect();
      };
    }
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="flex flex-col lg:flex-row bg-[#181C14] min-h-screen">
      <KitchenOwnerNavbar />
      <div className="flex-1 pt-20 md:pt-0">
        <ErrorState message={error} onRetry={() => dispatch(getOrdersForKitchen())} />
      </div>
    </div>
  );
  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
    // Note: no need to also emit a socket event here - the backend's
    // updateOrderStatus controller already emits 'orderUpdate' to the
    // customer's room once the status change is saved.

    // If the order is completed, update the chart data
    if (newStatus === "Completed") {
      dispatch(addOrderToChart(orderId));  // Dispatch action to add completed order to chart
    }
  };
  
  const handleRemoveOrder = (orderId) => {
    dispatch(removeOrder(orderId));
  };

  const isButtonDisabled = (order, buttonStatus) => {
    const currentStepIndex = steps.indexOf(order.status);
    const buttonIndex = steps.indexOf(buttonStatus);
    return currentStepIndex !== buttonIndex - 1;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <KitchenOwnerNavbar />
      <div className="flex-1 p-4 pt-20 md:pt-4 bg-[#181C14] text-white">
        <h1 className="text-2xl font-bold mb-4">Confirmed Orders</h1>
        {orders.length > 0 ? orders.map(order => (
          <div key={order._id} className="border p-4 mb-4 rounded shadow-lg">
            <div className="p-4 shadow rounded flex flex-col md:flex-row justify-between gap-4">
              <div className= 'w-full md:w-1/2 p-2  rounded md:pr-8 md:mr-2 bg-[#25292e] border border-[#59636e]'>
                <h3 className="text-lg font-bold">Order ID: {order._id}</h3>
                <ResponseCountdown deadline={order.responseDeadline} pending={order.status === 'placed'} label="Confirm before" />
                <div className="border p-4 mt-4">
                  <h4 className="font-bold mb-2">Summary</h4>
                  <p>Customer Name: {order.customerName}</p>
                  <p>Phone: {order.customerId?.phone_number || 'Not available'}</p>
                  <p>Delivery Address: {order.deliveryAddress}</p>
                  <p>Payment Method: {order.paymentMethod}</p>
                  <p>Payment Status: {order.paymentStatus}</p>
                </div>
                <div className="border p-4 mt-4">
                  <h4 className="font-bold mb-2">Order Items</h4>
                  {order.dishes.map((item, index) => (
                    <div key={index} className="flex justify-between mb-2">
                      <span>{item.name}</span>
                      <span>Qty {item.quantity}</span>
                      <span>PKR {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-4 flex justify-between">
                    <p>Total Qty: {order.totalQuantity}</p>
                    <p>Total Price: PKR {order.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className='w-full md:w-1/2  border-gray-700 border-2  rounded'>
                {/* Pass orderStatus as a prop */}
                <ChatModule orderId={order._id} kitchenId={order.kitchenOwnerId} orderStatus={order.status} />
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row justify-between">
              {steps.map((status, idx) => (
                <button
                  key={idx}
                  disabled={isButtonDisabled(order, status)}
                  className={`mt-2 md:mt-0 px-4 py-2 border rounded shadow ${order.status === status || steps.indexOf(order.status) > idx ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} ${isButtonDisabled(order, status) ? 'cursor-not-allowed' : 'hover:bg-blue-300'}`}
                  onClick={() => handleStatusChange(order._id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleRemoveOrder(order._id)}
              disabled={order.status !== 'Completed'}
              className={`mt-4 px-4 py-2 rounded shadow ${order.status === 'Completed' ? 'bg-red-500 text-white cursor-pointer' : 'bg-gray-500 text-white cursor-not-allowed'}`}
            >
              Remove from History
            </button>
          </div>
        )) : (
          <p>No orders found.</p>
        )}
      </div>
    </div>
  );
};

export default KitchenOwnerOrders;
