const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }, // Change 'HostelRoom' to 'Room'
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
    bed_number: { type: Number, default: null },
    room_name: { type: String, default: null },
    payment_status: { type: String, default: null },
    hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelOwner', required: true }, // Change 'Hostel' to 'HostelOwner'
    booking_date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Booked', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    decided_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    owner_hidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
