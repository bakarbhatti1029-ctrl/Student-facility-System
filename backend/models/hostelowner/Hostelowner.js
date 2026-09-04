const mongoose = require('mongoose');

const hostelOwnerSchema = new mongoose.Schema({
    // Owner Information
    owner_id: {
        type: String,
        unique: true,
        required: true,
        default: function() {
            return "HST" + Math.floor(100000 + Math.random() * 900000);
        }
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String, required: true },
    cnic: { type: String, required: true },
    address: { type: String, required: true },
    gender: { type: String },
    profile_picture: { type: String },

    // Hostel Information
    hostel_name: { type: String, required: true },
    hostel_address: { type: String, required: true },
    hostel_lat: { type: Number },  // Latitude for hostel
    hostel_lng: { type: Number },  // Longitude for hostel
    hostel_type: { type: String, required: true },
    hostel_description: { type: String, required: true },
    hostel_picture: { type: String, required: true },
    facilities: [{ type: String }],

    nearby_institutes: [{
        university: { type: String },
        distance: { type: String },  // Distance in km
        university_lat: { type: Number },  // Latitude for university
        university_lng: { type: Number },  // Longitude for university
    }],

    email_verified: { type: Boolean, required: true, default: false },
    verification_token: { type: String },
    verification_token_time: { type: Date },
    reset_password_token: { type: String },
    reset_password_token_time: { type: Date },

    stripeAccountId: { type: String, default: '' },

    // Admin approval fields
    isApproved: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    status: { type: String, default: 'pending', enum: ['pending', 'active', 'banned'] },

    role: { type: String, default: 'hostelOwner', enum: ['hostelOwner'], required: true },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
}, { timestamps: true });

// Add a pre-save middleware to ensure owner_id is set
hostelOwnerSchema.pre('save', async function(next) {
    if (!this.owner_id) {
        let unique = false;
        while (!unique) {
            const randomId = "HST" + Math.floor(100000 + Math.random() * 900000);
            const existingOwner = await this.constructor.findOne({ owner_id: randomId });
            if (!existingOwner) {
                this.owner_id = randomId;
                unique = true;
            }
        }
    }
    next();
});

module.exports = mongoose.model('HostelOwner', hostelOwnerSchema);
