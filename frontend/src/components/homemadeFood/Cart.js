import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCartAPI, clearCartAPI, updateItemQuantityAPI, getCartAPI } from '../../store/cartSlice';
import Navbar from '../Navbar';
import Footer from '../Footer';

const Cart = () => {
  const cart = useSelector(state => state.cart || { carts: [] });
  const isLoading = useSelector(state => state.cart.loading);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loadingItems, setLoadingItems] = useState({}); // Track the loading state for each item

  useEffect(() => {
    dispatch(getCartAPI());
  }, [dispatch]);

  const handleRemoveItem = (kitchenId, itemId) => {
    dispatch(removeFromCartAPI({ kitchenId, productId: itemId }));
  };

  const handleClearCart = (kitchenId) => {
    dispatch(clearCartAPI({ kitchenId }));
  };

  const handleIncrement = (kitchenId, itemId, currentQuantity) => {
    const updatedQuantity = currentQuantity + 1;
    setLoadingItems((prev) => ({ ...prev, [itemId]: true }));
    dispatch(updateItemQuantityAPI({ kitchenId, productId: itemId, quantity: updatedQuantity }))
      .finally(() => setLoadingItems((prev) => ({ ...prev, [itemId]: false })));
  };

  const handleDecrement = (kitchenId, itemId, currentQuantity) => {
    if (currentQuantity > 1) {
      const updatedQuantity = currentQuantity - 1;
      setLoadingItems((prev) => ({ ...prev, [itemId]: true }));
      dispatch(updateItemQuantityAPI({ kitchenId, productId: itemId, quantity: updatedQuantity }))
        .finally(() => setLoadingItems((prev) => ({ ...prev, [itemId]: false })));
    }
  };

  const handleProceedToCheckout = (kitchenId) => {
    navigate('/food/checkout', { state: { kitchenId } });
  };

  const renderShimmer = () => (
    <div className="animate-pulse">
      <div className="bg-gray-300 h-6 w-16 mb-2"></div>
      <div className="bg-gray-300 h-6 w-24 mb-2"></div>
      <div className="bg-gray-300 h-6 w-20"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#1E201E]">
      <Navbar module={'food'} />
      <main className="flex-grow container mx-auto mt-8">
        <h2 className="text-4xl font-bold text-center text-white mb-6">Your Cart</h2>
        {cart.carts.length > 0 ? (
          cart.carts.map(({ kitchenId, kitchenName, items }) => {
            const totalPrice = items.reduce((acc, item) => {
              if (item.productId && item.productId.price) {
                return acc + (item.productId.price || 0) * item.quantity;
              }
              return acc;
            }, 0);

            return (
              <div key={kitchenId} className="mb-8 border-b  border-[#59636e]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-4xl text-white font-semibold">Cart Items in {kitchenName || 'Unknown Kitchen'}</h3>
                  <button onClick={() => handleClearCart(kitchenId)} className="text-red-500 hover:text-red-700 font-semibold">Clear Cart</button>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <div className="flex-auto md:w-3/4 pr-4">
                    {items.map((item) => (
                      item.productId ? (
                        <div key={item.productId._id} className="flex mb-4 bg-[#25292e] border border-[#59636e] text-white shadow rounded overflow-hidden relative">
                          <img src={item.productId.imageUrls ? item.productId.imageUrls[0] : '/placeholder.png'} alt={item.productId.name} className="w-36 h-36 object-cover" />
                          <div className="px-4 py-3 flex flex-col justify-between flex-1 min-w-0">
                            {loadingItems[item.productId._id] ? (
                              renderShimmer() // Show shimmer effect while loading
                            ) : (
                              <>
                                <h4 className="text-xl font-bold">{item.productId.name}</h4>
                                <p className="line-clamp-2">{item.productId.description}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 mb-3">
                                  <p className="text-lg font-semibold">Price: PKR {item.productId.price}</p>
                                  <div className="flex items-center">
                                    <p className="text-lg font-semibold mr-4">Quantity</p>
                                    <button onClick={() => handleDecrement(kitchenId, item.productId._id, item.quantity)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">-</button>
                                    <span className="mx-2">{item.quantity}</span>
                                    <button onClick={() => handleIncrement(kitchenId, item.productId._id, item.quantity)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">+</button>
                                  </div>
                                  <button onClick={() => handleRemoveItem(kitchenId, item.productId._id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded self-start">Remove</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div key={item._id} className="flex mb-4 bg-[#25292e] border border-[#59636e] text-white shadow rounded overflow-hidden relative">
                          <p className="px-4 text-lg">Item not found</p>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="w-full md:w-1/4 mb-4 pt-4 md:pt-0 md:pl-4 bg-[#25292e] border border-[#59636e]">
                    <div className="p-4 shadow rounded text-white">
                      <h3 className="text-2xl font-semibold mb-3">Summary for {kitchenName}</h3>
                      <p>Total: PKR {totalPrice.toFixed(2)}</p>
                      <button onClick={() => handleProceedToCheckout(kitchenId)} className="bg-[#59636e] hover:bg-black text-white font-bold py-2 px-4 rounded w-full mt-4">Proceed to Checkout</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center">
            <h2 className="text-2xl pt-28 text-center text-white font-bold">Your cart is empty</h2>
            <Link to="/kitchens" className="text-blue-500 mt-4">Browse kitchens</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
