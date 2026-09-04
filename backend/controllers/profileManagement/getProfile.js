// controllers/getProfileController.js

const util = require('../../utils/Utils');  

// Get Profile
const getProfile = async (req, res, next) => {
  try {
    // Extract user information from the request
    const user = req.user;
    const userId = user.id;
    const userRole = user.role;

    // Determine the model to use based on the user's role
    const Model = util.getUserModel(userRole); // Example roles: 'student', 'admin', 'hostelOwner', 'kitchenOwner'

    // Fetch the profile data using the user's ID
    const profile = await Model.findById(userId);

    // Check if the profile was found
    if (!profile) {
      // If not found, send a 404 response with a message
      return res.status(404).json({ message: 'Profile not found' });
    }

    // If the profile is found, send it as the response
    res.json(profile);
  } catch (error) {
    // If there is any error during the process, pass it to the next middleware
    next(error);
  }
};

module.exports = getProfile;
