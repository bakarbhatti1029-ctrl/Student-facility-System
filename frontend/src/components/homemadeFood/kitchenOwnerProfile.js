import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, deleteItem, updateItem, fetchItem } from "../../store/kitchenSlice";
import KitchenOwnerNavbar from "./KitchenOwnerNavbar";
import { AddOrUpdateItemModal } from "./AddOrUpdateItemModal";
import Profile from "../homemadeFood/Profile";

const KitchenOwnerProfile = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: 'Add',
    payload: {}
  });

  const [successMessage, setSuccessMessage] = useState(''); // State for success message

  const dispatch = useDispatch();
  const kitchenItems = useSelector((state) => state.kitchenItems || []);

  // Function to display success message and reset it after a few seconds
  const handleItemSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  useEffect(() => {
    // Fetch all items or specific items if needed
  }, [dispatch]);

  return (
    <div className="flex min-h-screen">
      <KitchenOwnerNavbar />
      <div className="bg-black flex-1 flex flex-col items-center justify-center pt-20 md:pt-0"> {/* Centering the content */}
         {/* Centered text */}
        
        <Profile />
        
        <button
          onClick={() => {
            setModalState((prevState) => ({
              ...prevState,
              isOpen: true,
              action: 'Add',
              payload: {},
            }));
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 mt-4 rounded"
        >
          Add Item
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
              handleItemSuccess('Item added/updated successfully!'); // Show success message
            }}
          />
        )}

        {successMessage && (
          <div className="mt-4 p-2 bg-green-500 text-white rounded">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenOwnerProfile;
