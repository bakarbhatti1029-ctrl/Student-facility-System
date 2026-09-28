import { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem, updateItem } from "../../store/kitchenSlice";

export const useAddOrUpdateItem = (action, payload, handleClose) => {
  const [itemDetails, setItemDetails] = useState(action === 'Add' ? {
    name: "",
    description: "",
    price: "",
    imageUrls: [""],
    category: "",
    availability: true } : { ...payload });
 
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!itemDetails.name) errors.name = "Name is required";
    if (!itemDetails.description) errors.description = "Description is required";
    if (!itemDetails.price || isNaN(itemDetails.price) || itemDetails.price <= 0) errors.price = "Valid price is required";
    if (!itemDetails.category) errors.category = "Category is required";
    if (itemDetails.availability === undefined) errors.availability = "Availability is required";

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if (!validate()) {
      return alert("Please fill all the credentials.");
    }

    const detailsToSend = { ...itemDetails, price: Number(itemDetails.price) };

    const resultAction = action === 'Add'
      ? await dispatch(addItem(detailsToSend))
      : await dispatch(updateItem({ id: payload._id, itemDetails: detailsToSend }));

    const succeeded = action === 'Add'
      ? addItem.fulfilled.match(resultAction)
      : updateItem.fulfilled.match(resultAction);

    if (succeeded) {
      handleClose();
    } else {
      alert(resultAction.payload?.message || 'Failed to save item. Please check the details and try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItemDetails({
      ...itemDetails,
      [name]: type === "checkbox" ? checked : value });
  };

  const handleImageUrlChange = (value) => {
    setItemDetails({
      ...itemDetails,
      imageUrls: [value] });
  };

  const state = { itemDetails };
  const handlers = {
    handleChange,
    handleImageUrlChange,
    handleSubmit
  };

  return { state, handlers };
};
