const mongoose = require('mongoose');

const kitchenOwnerSchema = new mongoose.Schema({
    // Owner Information
    first_name: { type: String, required: true }, // Owner's first name
    last_name: { type: String, required: true }, // Owner's last name
    email: { type: String, required: true, unique: true }, // Owner's email address
    password: { type: String, required: true }, // Hashed password
    gender: { type: String, required: false },
    phone_number: { type: String, required: true }, // Owner's phone number
    cnic: { type: String, required: true },
    profile_picture: { type: String, required: false }, // URL to the owner's profile picture

    // Kitchen Information
    kitchen_name: { type: String, required: true }, // Name of the kitchen
    address: { type: String, required: true }, // Address of the kitchen
    kitchen_description: { type: String, required: true }, // Description of the kitchen
    kitchen_picture: { type: String, required: true }, // URL to the kitchen picture
    
    // A unique identifier - set default to generate a random ID
    provider_id: { 
        type: String, 
        unique: true, 
        required: true,
        default: function() {
            return "KIT" + Math.floor(100000 + Math.random() * 900000);
        }
    },

    // Verification and Security
    email_verified: { type: Boolean, required: true, default: false }, // Email verification status
    verification_token: { type: String, required: false }, // Token for email verification
    verification_token_time: { type: Date, required: false }, // Time when the verification token was generated
    reset_password_token: { type: String, required: false }, // Token for password reset
    reset_password_token_time: { type: Date, required: false }, // Time when the reset password token was generated

    // Admin approval fields
    isApproved: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    status: { type: String, default: 'pending', enum: ['pending', 'active', 'banned'] },

    // Role and Access
    role: { type: String, default: 'kitchenOwner', enum: ['kitchenOwner'], required: true }, // Role of the user

    // Relations
    dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }] // Array of Dish IDs related to this kitchen
}, { timestamps: true });

// Add a pre-save hook to ensure provider_id is never null
kitchenOwnerSchema.pre('save', function(next) {
    if (!this.provider_id) {
        this.provider_id = "KIT" + Math.floor(100000 + Math.random() * 900000);
    }
    next();
});

module.exports = mongoose.models.KitchenOwner || mongoose.model('KitchenOwner', kitchenOwnerSchema);
