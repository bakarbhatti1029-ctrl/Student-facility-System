// models/hostelowner/Hostelroom.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    price: { type: Number, required: true },
    availability: { type: Boolean, default: true },
    description: { type: String },
    imageUrls: [{ type: String }],
    hostelId: { type: Schema.Types.ObjectId, ref: 'HostelOwner', required: true },
    beds: [{ type: Schema.Types.ObjectId, ref: 'Bed' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
