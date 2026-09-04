const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    student_id: {
        type: String,
        unique: true,
        required: true,
        default: function() {
            // Generate a random 6-digit student ID
            return "STU" + Math.floor(100000 + Math.random() * 900000);
        }
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String, required: true },
    cnic: { type: String, required: true },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    profile_picture: { type: String, required: true },
    email_verified: { type: Boolean, required: true, default: false },
    verification_token: { type: String, required: false },
    verification_token_time: { type: Date, required: false },
    reset_password_token: { type: String, required: false },
    reset_password_token_time: { type: Date, required: false },

    // Admin control fields
    isBanned: { type: Boolean, default: false },
    status: { type: String, default: 'active', enum: ['active', 'banned'] },

    role: { type: String, default: 'student', enum: ['student'], required: true }
}, { timestamps: true });

// Add a pre-save middleware to ensure student_id is set
studentSchema.pre('save', async function(next) {
    if (!this.student_id) {
        let unique = false;
        while (!unique) {
            const randomId = "STU" + Math.floor(100000 + Math.random() * 900000);
            const existingStudent = await this.constructor.findOne({ student_id: randomId });
            if (!existingStudent) {
                this.student_id = randomId;
                unique = true;
            }
        }
    }
    next();
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
