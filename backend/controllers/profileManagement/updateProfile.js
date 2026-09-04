// controllers/updateProfileController.js

const util = require('../../utils/Utils');  // Adjust the path according to your structure

// Fields that users are allowed to update
const allowedUpdates = {
    student: ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'gender'],
    admin: ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture'],
    hostelOwner: ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'hostel_name', 'hostel_description', 'hostel_address', 'hostel_picture', 'gender'],
    kitchenOwner: ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'kitchen_name', 'kitchen_description', 'kitchen_picture', 'gender']
  };  

// Update Profile
const updateProfile = async (req, res, next) => {
  try {
    // Extract user information from the request
    const user = req.user;
    const userId = user.id;
    const userRole = user.role;

    // Determine the model to use based on the user's role
    const Model = util.getUserModel(userRole); // Example roles: 'student', 'admin', 'hostelOwner', 'kitchenOwner'

    // Prepare the update data
    const updateData = req.body;
    const updateFields = Object.keys(updateData);

    // Validate the update fields
    const allowedFields = allowedUpdates[userRole] || [];
    const isValidUpdate = updateFields.every(field => allowedFields.includes(field));
    if (!isValidUpdate) {
      return res.status(400).json({ message: 'Invalid updates!' });
    }

    // Find the profile by ID and update it with the new data
    const profile = await Model.findById(userId);
    if (!profile) {
      // If profile is not found, send a 404 response with a message
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update the profile with the provided data
    updateFields.forEach(field => {
      profile[field] = updateData[field];
    });

    // Save the updated profile to the database
    await profile.save();

    // Send the updated profile as the response
    res.json(profile);
  } catch (error) {
    // If there is any error during the process, pass it to the next middleware
    next(error);
  }
};

module.exports = updateProfile;
