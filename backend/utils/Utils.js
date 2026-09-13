const Student = require('../models/student/Student');
const KitchenOwner = require('../models/kitchenowner/Kitchenowner');
const HostelOwner = require('../models/hostelowner/Hostelowner');
const Admin = require('../models/admin/Admin');
const stripe = require('../config/stripe');
require('dotenv').config();



exports.getUserModel = (role) => {
    // Normalize the role name to handle different formats
    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'student') {
        return Student;
    } else if (normalizedRole === 'hostelowner') {
        return HostelOwner;
    } else if (normalizedRole === 'kitchenowner') {
        return KitchenOwner;
    } else if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
        return Admin;
    } else {
        console.error('Invalid role:', role);
        return null;
    }
};


exports.generateVerificationToken = () => {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
}



exports.maxTokenTime = () => { 
        // Date stores an absolute point in time, so no timezone adjustment is
        // needed. MongoDB and JavaScript will compare the UTC instants correctly.
        return new Date(Date.now() + 5 * 60 * 1000);
}
    
 
exports.isEmailUnique = async (email) => {
    // Check the Student collection
    let user = await Student.findOne({ email });
    if (user) return false;

    // Check the KitchenOwner collection
    user = await KitchenOwner.findOne({ email });
    if (user) return false;

    // Check the HostelOwner collection
    user = await HostelOwner.findOne({ email });
    if (user) return false;

    // Check the Admin collection
    user = await Admin.findOne({ email });
    if (user) return false;

    // If no user is found in any collection, the email is unique
    return true;
};

exports.findUserByEmail = async (email) => {
    // Check all collections and return the user with their role if found
    let user = await Student.findOne({ email });
    if (user) return { user, role: 'student', Model: Student };

    user = await KitchenOwner.findOne({ email });
    if (user) return { user, role: 'kitchenOwner', Model: KitchenOwner };

    user = await HostelOwner.findOne({ email });
    if (user) return { user, role: 'hostelOwner', Model: HostelOwner };

    user = await Admin.findOne({ email });
    if (user) return { user, role: 'admin', Model: Admin };

    return null;
};


exports.validateAdditionalFields = (role, additionalFields) => {
    switch (role) {
        case 'kitchenOwner':
            if (!additionalFields.kitchen_name) {
                throw new Error('Missing required fields for kitchenOwner');
            }
            return {
                kitchen_name: additionalFields.kitchen_name,
                kitchen_address: additionalFields.kitchen_address,
                kitchen_description: additionalFields.kitchen_description,
                kitchen_picture: additionalFields.kitchen_picture, // Assuming kitchen_picture is an optional
            };
        case 'hostelOwner':
            if (!additionalFields.hostel_name || !additionalFields.hostel_address || !additionalFields.hostel_type) {
                throw new Error('Missing required fields for hostelOwner');
            }
            return {
                hostel_name: additionalFields.hostel_name,
                hostel_address: additionalFields.hostel_address,
                hostel_type: additionalFields.hostel_type,
                hostel_description: additionalFields.hostel_description, // Assuming hostel_description is an optional field
                hostel_picture: additionalFields.hostel_picture, // Assuming hostel_picture is an optional field
                facilities: additionalFields.facilities, // Assuming facilities is an optional field
                stripeAccountId: additionalFields.stripe_account_id // Assuming stripeAccountId is an optional field
            };
        case 'student':
        case 'admin':
            // No additional fields to validate for student or admin
            return {};
        default:
            throw new Error('Invalid role');
    }
};
