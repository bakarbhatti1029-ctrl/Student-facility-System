const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userRole: { type: String, required: true, trim: true },
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    userPhone: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, default: 'General Inquiry' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'read', 'resolved'],
      default: 'new',
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
