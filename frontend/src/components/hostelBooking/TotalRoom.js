// TotalRoom.js
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllRooms,
  fetchRoom,
  deleteRoom,
} from "../../store/hostelSlice";
import HostelNavbar from "./HostelOwnerNavbar";
import { AddOrUpdateRoomModal } from "./AddOrUpdateRoomModal/AddOrUpdateRoomModal";
import ErrorState from "../common/ErrorState";

const TotalRoom = () => {
  const dispatch = useDispatch();
  const { rooms, loading, error } = useSelector((state) => state.hostels);
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "",
    payload: {},
  });

  useEffect(() => {
    dispatch(fetchAllRooms());
  }, [dispatch]);

  const handleEdit = (roomId) => {
    dispatch(fetchRoom(roomId)).then((result) => {
      setModalState({
        isOpen: true,
        action: "edit",
        payload: result.payload,
      });
    });
  };

  const handleDelete = (roomId) => {
    dispatch(deleteRoom(roomId));
  };

  const handleAddRoom = () => {
    setModalState({
      isOpen: true,
      action: "add",
      payload: {},
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, action: "", payload: {} });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <HostelNavbar />
      <main className="flex-1 pt-20 md:pt-6">
        <ErrorState message={error} onRetry={() => dispatch(fetchAllRooms())} />
      </main>
    </div>
  );

  return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <HostelNavbar />
      <main className="flex-1 p-6 pt-20 md:pt-6 text-white">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="border-2 border-[#59636e] m-2 text-center"
            >
              <img
                src={room.imageUrls[0]}
                alt={room.name}
                className="w-full h-64 object-cover"
              />
              <h2 className="text-2xl font-bold text-center pt-3">
                Room No: {room.name}
              </h2>
              <p className="text-xl">
                Capacity of the Beds: {room.capacity}
              </p>
              <p className="text-xl">Price per Month: PKR {room.price}</p>
              <p className="text-xl">Description: {room.description}</p>
              <p className="text-xl">
                Availability:{" "}
                {room.availability ? "Available" : "Not Available"}
              </p>
              <p>
                Beds: {room.beds.filter((b) => b.isBooked).length} of {room.beds.length} occupied
              </p>
              <div className="flex mt-2 mb-2 justify-center">
                <button
                  onClick={() => handleEdit(room._id)}
                  className="bg-[#697565] hover:bg-[#3C3D37] text-white px-4 py-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Render Modal Outside the Loop */}
        {modalState.isOpen && (
          <AddOrUpdateRoomModal
            action={modalState.action}
            payload={modalState.payload}
            handleClose={handleCloseModal}
          />
        )}
      </main>
    </div>
  );
};

export default TotalRoom;
