const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'kitchenOwner', 'hostelOwner', 'admin']
    },
    registrationData: {
        type: mongoose.Schema.Types.Mixed, // Stores all registration fields
        required: true
    },
    verification_token: {
        type: String,
        required: true
    },
    verification_token_time: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Document will be automatically deleted after 24 hours (86400 seconds)
    }
});

// Index for faster lookups
pendingRegistrationSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
