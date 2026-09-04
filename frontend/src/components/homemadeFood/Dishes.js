import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllDishes, fetchItem, deleteItem } from '../../store/kitchenSlice';
import KitchenOwnerNavbar from './KitchenOwnerNavbar';
import { AddOrUpdateItemModal } from './AddOrUpdateItemModal';
import ErrorState from '../common/ErrorState';

const Shimmer = () => (
  <div className="animate-pulse border ml-4 h-[580px]  mt-8 bg-gray-700 text-white">
    <div className="bg-gray-400 h-48 w-full"></div>
    <div className="p-4">
      <div className="h-6 bg-gray-400 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-400 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-400 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-400 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-400 rounded w-1/3"></div>
    </div>
    <div className="flex mt-8 ml-4">
      <div className="bg-gray-400 h-10 w-20 rounded mr-2"></div>
      <div className="bg-gray-400 h-10 w-20 rounded"></div>
    </div>
  </div>
);

const Dishes = () => {
  const dispatch = useDispatch();
  const { dishes, loading, error } = useSelector((state) => state.kitchenItems);
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: 'Add',
    payload: {},
  });

  useEffect(() => {
    dispatch(fetchAllDishes());
  }, [dispatch]);

  const handleEdit = (dishId) => {
    dispatch(fetchItem(dishId)).then((result) => {
      setModalState({
        isOpen: true,
        action: 'Edit',
        payload: result.payload, // Ensure this contains the dish details
      });
    });
  };
  

  const handleDelete = (dishId) => {
    dispatch(deleteItem(dishId));
  };

  if (loading) {
    // Show shimmer effect while data is loading
    return (
      <div className="flex min-h-screen">
        <KitchenOwnerNavbar />
        <div className="flex flex-wrap bg-black w-full pt-20 md:pt-0">
          {[...Array(4)].map((_, index) => (
            <Shimmer key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="flex bg-black min-h-screen">
      <KitchenOwnerNavbar />
      <div className="flex-1 pt-20 md:pt-0">
        <ErrorState message={error} onRetry={() => dispatch(fetchAllDishes())} />
      </div>
    </div>
  );

  return (
    <div className="flex bg-black min-h-screen">
      <KitchenOwnerNavbar />
      <div className="flex flex-wrap w-full pt-20 md:pt-0">
        {dishes.map((item) => (
          <div key={item._id} className="border ml-4   flex-grow w-full sm:w-[45%] lg:w-1/4 mt-8 text-white">
            {item.imageUrls && item.imageUrls.length > 0 && (
              <img src={item.imageUrls[0]} alt={item.name} className="w-full h-48" />
            )}
            <div className="p-4">
              <h2 className="text-xl font-bold">{item.name}</h2>
              <p>Price: PKR {item.price}</p>
              <p>Category: {item.category}</p>
              <p>Availability: {item.availability ? 'Available' : 'Not Available'}</p>
              <p>{item.description}</p>
            
            <div className="flex mt-8  ml-4">
              <button
                onClick={() => handleEdit(item._id)}
                className="bg-[#ECDFCC] hover:bg-[#D6C4B0] text-black px-4 py-2 rounded mr-2"
              >
                Edit
              </button>
              {modalState.isOpen && (
                <AddOrUpdateItemModal
                  action={modalState.action}
                  payload={modalState.payload}
                  handleClose={() => {
                    setModalState({
                      isOpen: false,
                      payload: {},
                      action: 'Add',
                    });
                  }}
                />
              )}
              <button
                onClick={() => handleDelete(item._id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dishes;
