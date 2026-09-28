// AddOrUpdateRoomModal.js
import { useAddOrUpdateRoom } from "./useAddOrUpdateRoom";
import InlineUploadButton from "../../common/InlineUploadButton";

export function AddOrUpdateRoomModal({ action, payload, handleClose }) {
  const { state, handlers } = useAddOrUpdateRoom(action, payload, handleClose);
  const { roomDetails } = state;
  const {
    handleAddBed,
    handleAddImageUrl,
    handleBedChange,
    handleChange,
    handleImageUrlChange,
    handleRemoveBed,
    handleRemoveImageUrl,
    handleSubmit } = handlers;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-h-[80vh] w-full max-w-2xl overflow-y-auto text-black">
        <h2 className="text-xl font-bold mb-4 capitalize">
          {action} Room
        </h2>

        {/* Room Number */}
        <div className="mb-4">
          <label className="block mb-2">Room No</label>
          <input
            type="text"
            name="name"
            value={roomDetails.name || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {/* Capacity */}
        <div className="mb-4">
          <label className="block mb-2">Room Capacity</label>
          <input
            type="number"
            name="capacity"
            value={roomDetails.capacity || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block mb-2">Price per Month</label>
          <input
            type="number"
            name="price"
            value={roomDetails.price || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {/* Availability */}
        <div className="mb-4">
          <label className="block mb-2">Availability</label>
          <input
            type="checkbox"
            name="availability"
            checked={roomDetails.availability || false}
            onChange={handleChange}
            className="mr-2"
          />
          Available
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            value={roomDetails.description || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Image URLs */}
        <div className="mb-4">
          <label className="block mb-2">Room Image URLs</label>
          {roomDetails.imageUrls.map((url, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={url || ""}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <InlineUploadButton
                uploadType="hostel"
                onUploaded={(url) => handleImageUrlChange(index, url)}
              />
              <button
                type="button"
                onClick={() => handleRemoveImageUrl(index)}
                className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Image URL
          </button>
        </div>

        {/* Beds */}
        <div className="mb-4">
          <label className="block mb-2">Beds</label>
          {roomDetails.beds.map((bed, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="number"
                value={bed.bed_number || ""}
                onChange={(e) => handleBedChange(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-500"
                disabled={bed.isBooked}
                required
              />
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  bed.isBooked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {bed.isBooked ? 'Occupied' : 'Available'}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveBed(index)}
                disabled={bed.isBooked}
                title={bed.isBooked ? "Can't remove an occupied bed" : undefined}
                className="ml-2 bg-red-500 text-white px-2 py-1 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddBed}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Bed
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Submit
          </button>
          <button
            onClick={handleClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
