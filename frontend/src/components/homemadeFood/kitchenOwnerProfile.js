import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, deleteItem, updateItem, fetchItem } from "../../store/kitchenSlice";
import KitchenOwnerNavbar from "./KitchenOwnerNavbar";
import { AddOrUpdateItemModal } from "./AddOrUpdateItemModal";
import Profile from "../homemadeFood/Profile";
import Footer from "../Footer";

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
    <div className="flex min-h-screen bg-[#1E201E]">
      <KitchenOwnerNavbar />
      <main className="flex min-w-0 flex-1 flex-col pt-20 md:pt-6">
        <div className="flex-1 p-6">
          <Profile />

          <button
            onClick={() => {
              setModalState((prevState) => ({
                ...prevState,
                isOpen: true,
                action: 'Add',
                payload: {} }));
            }}
            className="mt-4 w-[120px] rounded bg-[#697565] px-4 py-2 text-white hover:bg-[#3C3D37]"
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
                  action: 'Add' });
                handleItemSuccess('Item added/updated successfully!');
              }}
            />
          )}

          {successMessage && (
            <div className="mt-4 rounded bg-green-500 p-2 text-white">
              {successMessage}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default KitchenOwnerProfile;
