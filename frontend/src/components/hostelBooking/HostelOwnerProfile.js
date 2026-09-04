import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HostelNavbar from "./HostelOwnerNavbar";
import { AddOrUpdateRoomModal } from "./AddOrUpdateRoomModal/AddOrUpdateRoomModal";
import Profile from "./Profile";

const HostelOwnerProfile = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "Add",
    payload: {},
  });
  const [successMessage, setSuccessMessage] = useState("");

  const dispatch = useDispatch();
  const hostels = useSelector((state) => state.hostels);

  const handleAddRoomSuccess = () => {
    setSuccessMessage("Room added successfully!");
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <HostelNavbar />
      <main className="flex-1 flex flex-col p-6 pt-20 md:pt-6">
        <Profile />

        <button
          onClick={() => {
            setModalState({
              isOpen: true,
              action: "Add",
              payload: {},
            });
          }}
          className="bg-[#697565] w-[120px] ml-6 hover:bg-[#3C3D37] md:mt-4 text-white px-4 py-2 rounded"
        >
          Add Room
        </button>

        {modalState.isOpen && (
          <AddOrUpdateRoomModal
            action={modalState.action}
            payload={modalState.payload}
            handleClose={() => {
              setModalState({
                isOpen: false,
                payload: {},
                action: "Add",
              });
            }}
          />
        )}

        {successMessage && (
          <div className="mt-4 p-2 bg-[#ECDFCC] text-white rounded">
            {successMessage}
          </div>
        )}
      </main>
    </div>
  );
};

export default HostelOwnerProfile;
