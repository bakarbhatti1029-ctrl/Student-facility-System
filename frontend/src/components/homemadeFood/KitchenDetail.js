import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCartAPI } from '../../store/cartSlice'; // Updated to trigger async action
import Navbar from '../Navbar';
import Footer from '../Footer';
import { toast } from 'react-toastify';
import SidebarNotification from './SidebarNotification';
import ReviewSection from '../common/ReviewSection';

const KitchenDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const kitchen = state?.kitchen;
  const dispatch = useDispatch();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMessage, setSidebarMessage] = useState('');

  if (!kitchen) {
    return (
      <>
        <Navbar module="food" />
        <div className="container mx-auto mt-8">
          <h2 className="text-2xl font-bold mb-4">Kitchen not found</h2>
        </div>
        <Footer />
      </>
    );
  }

  const handleAddToCart = async (dish) => {
      const storedUser = sessionStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (currentUser?.role && currentUser.role !== 'student') {
        toast.error('Only students can order food. Please log in with a student account.');
        return;
      }
      try {
        // Dispatch the action to add item to the cart in frontend state
        const resultAction = await dispatch(addToCartAPI({ kitchenId: kitchen._id, productId: dish._id, quantity: 1 }));
    
        if (addToCartAPI.fulfilled.match(resultAction)) {
          // Display success notification
          toast.success(`${dish.name} added to cart!`);
          // setSidebarMessage(`${dish.name} added to cart!`);
          // setShowSidebar(true); // Show sidebar notification
          // setTimeout(() => setShowSidebar(false), 3000); // Hide sidebar after 3 seconds
        } else if (resultAction.payload?.message === 'Invalid or expired token') {
          // Handle invalid or expired token by redirecting to the login page
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() =>{
            navigate('/loginform');
          },2000);
          // setSidebarMessage('Your session has expired. Please log in again.');
          // setShowSidebar(true); // Show sidebar notification
          // setTimeout(() => {
          //   setShowSidebar(false)
          //   navigate('/loginform'); // Redirect to login
          //  }, 3000
          // ); // Hide sidebar after 3 seconds
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add item to cart.');
      }
    };

  return (
    <>
      <Navbar module="food" />
      <SidebarNotification isOpen={showSidebar} message={sidebarMessage} onClose={() => setShowSidebar(false)} />
      <div className="bg-[#697565] text-white pb-5 pt-28 border-b border-gray-500">
        <div className="max-w-4xl  mx-auto rounded overflow-hidden shadow-lg">
          <h1 className="text-4xl font-bold mb-6  pt-12 text-center">{kitchen.kitchen_name}</h1>
          <div className='bg-[#1E201E] border border-[#59636e] container'>
          <img className="w-full h-[400px] mb-6 " src={kitchen.kitchen_picture} alt={kitchen.kitchen_name} />
          <p className="text-base mb-6 text-center">About: {kitchen.kitchen_description}</p>
          <div className=' border border-[#59636e]'>
            <h2 className="text-4xl text-center font-bold mb-4 pt-4 ">Menu</h2>
            <div className="mt-6 gap-6 pb-8 flex flex-wrap justify-center items-stretch ">
              {kitchen.dishes.map((dish) => (
                <div key={dish._id} className={`w-52 rounded mt-6 shadow-lg border border-[#59636e] ml-4 flex flex-col ${dish.availability === false ? 'opacity-50' : ''}`}>
                  <img className="w-52 h-48" src={dish.imageUrls && dish.imageUrls[0]} alt={dish.name} />
                  <div className="text-center p-2 bg-[#25292e] flex flex-col flex-1">
                    <p className="text-xl font-bold mb-2">{dish.name}</p>
                    <p className="text-base">Price: {dish.price}</p>
                    {dish.availability === false ? (
                      <p className="mt-auto pt-4 text-red-400 text-sm font-semibold">Not Available</p>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(dish)}
                        className="bg-black hover:bg-[#3C3D37] mt-auto self-center text-white text-nowrap px-2 rounded"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
      <div className="bg-[#697565] pb-10">
        <ReviewSection targetType="kitchen" targetId={kitchen._id} />
      </div>
      <Footer />
    </>
  );
};

export default KitchenDetail;
