const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }, // Change 'HostelRoom' to 'Room'
    hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelOwner', required: true }, // Change 'Hostel' to 'HostelOwner'
    booking_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Booked', 'Cancelled', 'Completed'], default: 'Booked' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
