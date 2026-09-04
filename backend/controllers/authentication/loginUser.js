const { getUserModel } = require('../../utils/Utils'); // Corrected path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Cart = require('../../models/kitchenowner/Cart'); // Assuming Cart is related to kitchens
const logger = require('../../utils/logger');

exports.loginUser = async (req, res, next) => {
    try {
        logger.debug('Request Body:', req.body);

        const { email, password } = req.body;

        // Define your roles
        const roles = ['hostelowner', 'kitchenowner', 'student', 'admin']; // lowercase to match getUserModel 
        let user;
        let role;

        // Iterate through roles to find the user
        for (let r of roles) {
            const UserModel = getUserModel(r); // Get the model for the current role
            user = await UserModel.findOne({ email });

            if (user) {
                role = r;
                break; // Exit loop once the user is found
            }
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in. Check your inbox for the verification code.",
                requiresVerification: true
            });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate a JWT token with the user's ID, email, and role
        // Use user.role (from DB) not the lookup key — DB stores 'hostelOwner'/'kitchenOwner' not 'hostelowner'/'kitchenowner'
        const payload = { id: user._id, email: user.email, role: user.role || role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Fetch cart summary for the user (assuming the user is a 'student' or related role)
        let cartSummary = { itemCount: 0, kitchenCount: 0 };

        if (role === 'student' || role?.toLowerCase() === 'student') {
            const cart = await Cart.find({ userId: user._id });

            if (cart && cart.length > 0) {
                // If multiple kitchens exist, count them and sum up the total number of items
                const itemCount = cart.reduce((totalItems, currentCart) => {
                    return totalItems + currentCart.items.reduce((count, item) => count + item.quantity, 0);
                }, 0);
                const kitchenCount = cart.length; // Number of different kitchens

                cartSummary = {
                    itemCount,
                    kitchenCount,
                };
            }
        }

        // Return the token, user information, and cart summary
        res.json({
            token,
            user,
            cartSummary // Include cart summary in the response
        });
    } catch (error) {
        console.error('Login Error:', error);
        next(error); // Pass the error to the next middleware (usually an error handler)
    }
};
