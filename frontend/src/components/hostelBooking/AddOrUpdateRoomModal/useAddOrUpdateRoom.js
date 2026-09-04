import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addRoom, editRoom } from '../../../store/hostelSlice';

export const useAddOrUpdateRoom = (action, payload, handleClose) => {
  const [roomDetails, setRoomDetails] = useState(action === 'Add' ? {
    name: '',
    capacity: '',
    price: '',
    description: '',
    imageUrls: [''],
    beds: [{ bed_number: 1, isBooked: false }],
    availability: true,
  } : { ...payload });

  const [errors, setErrors] = useState({});
  
  const dispatch = useDispatch();

  const validate = () => {
    const errors = {};
    if (!roomDetails.name) errors.name = 'Room number is required';
    if (!roomDetails.capacity) errors.capacity = 'Room capacity is required';
    if (!roomDetails.price) errors.price = 'Price per month is required';
    if (!roomDetails.imageUrls.length || roomDetails.imageUrls.some(url => !url)) errors.imageUrls = 'At least one valid image URL is required';
    if (!roomDetails.beds.length || roomDetails.beds.some(bed => !bed.bed_number)) errors.beds = 'At least one valid bed number is required';
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async () => {
    if (!validate()) {
      alert("Please enter all the fields");
      return;
    }
    if (action === 'Add') {
      dispatch(addRoom(roomDetails));
    } else {
      dispatch(editRoom({ id: payload._id, roomDetails }));
    }
    handleClose();
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomDetails({
      ...roomDetails,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...roomDetails.imageUrls];
    newImageUrls[index] = value;
    setRoomDetails({
      ...roomDetails,
      imageUrls: newImageUrls,
    });
  };

  const handleAddImageUrl = () => {
    setRoomDetails({
      ...roomDetails,
      imageUrls: [...roomDetails.imageUrls, ''],
    });
  };

  const handleRemoveImageUrl = (index) => {
    const newImageUrls = roomDetails.imageUrls.filter((_, i) => i !== index);
    setRoomDetails({
      ...roomDetails,
      imageUrls: newImageUrls,
    });
  };

  const handleBedChange = (index, value) => {
    if (roomDetails.beds[index]?.isBooked) return; // renumbering would orphan the student's booking
    const newBeds = [...roomDetails.beds];
    newBeds[index].bed_number = value;
    setRoomDetails({
      ...roomDetails,
      beds: newBeds,
    });
  };

  const handleAddBed = () => {
    setRoomDetails({
      ...roomDetails,
      beds: [
        ...roomDetails.beds,
        { bed_number: roomDetails.beds.length + 1, isBooked: false },
      ],
    });
  };

  const handleRemoveBed = (index) => {
    if (roomDetails.beds[index]?.isBooked) return; // can't remove a bed a student is currently occupying
    const newBeds = roomDetails.beds.filter((_, i) => i !== index);
    setRoomDetails({
      ...roomDetails,
      beds: newBeds,
    });
  };

  const state = { roomDetails, errors };
  const handlers = {
    handleAddBed,
    handleAddImageUrl,
    handleBedChange,
    handleChange,
    handleImageUrlChange,
    handleRemoveBed,
    handleRemoveImageUrl,
    handleSubmit,
  };

  return {
    state,
    handlers,
  };
};
