// models/Bed.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bedSchema = new Schema({
    bed_number: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'Student' },
    bookingDate: { type: Date },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentIntentId: { type: String },
    paymentReceiptUrl: { type: String },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true } // Reference to Room
}, { timestamps: true });

module.exports = mongoose.model('Bed', bedSchema);


