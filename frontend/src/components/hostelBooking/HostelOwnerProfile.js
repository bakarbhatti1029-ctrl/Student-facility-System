import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HostelNavbar from "./HostelOwnerNavbar";
import { AddOrUpdateRoomModal } from "./AddOrUpdateRoomModal/AddOrUpdateRoomModal";
import Profile from "./Profile";
import Footer from "../Footer";

const HostelOwnerProfile = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "Add",
    payload: {} });
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
    <div className="flex min-h-screen bg-[#1E201E]">
      <HostelNavbar />
      <main className="flex min-w-0 flex-1 flex-col pt-20 md:pt-6">
        <div className="flex-1 p-6">
          <Profile />

          <button
            onClick={() => {
              setModalState({
                isOpen: true,
                action: "Add",
                payload: {} });
            }}
            className="mt-4 w-[120px] rounded bg-[#697565] px-4 py-2 text-white hover:bg-[#3C3D37]"
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
                  action: "Add" });
              }}
            />
          )}

          {successMessage && (
            <div className="mt-4 rounded bg-[#ECDFCC] p-2 text-white">
              {successMessage}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default HostelOwnerProfile;
