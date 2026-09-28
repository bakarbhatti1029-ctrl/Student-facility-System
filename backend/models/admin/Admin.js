const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    profile_picture: { type: String, required: false, default: '' },
    email_verified: { type: Boolean, required: true, default: false },
    verification_token: { type: String, required: false },
    verification_token_time: { type: Date, required: false },
    reset_password_token: { type: String, required: false },
    reset_password_token_time: { type: Date, required: false },
    role: { type: String, default: 'admin', enum: ['admin', 'super_admin'], required: true }
}, { timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
