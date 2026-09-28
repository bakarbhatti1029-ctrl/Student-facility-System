const { getUserModel } = require('../../utils/Utils');
const PendingRegistration = require('../../models/PendingRegistration');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
const { setSessionCookie, setCsrfCookie } = require('../../utils/sessionCookie');

exports.verifyEmail = async (req, res, next) => {
    try {
        logger.debug('Starting email verification');
        logger.debug('Request body:', req.body);

        const { email, role } = req.user; // Get decoded token data from req.user
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required" });
        }

        logger.debug("Verification OTP:", otp);

        // Convert the token to string for comparison
        const token = otp.toString();

        // Find the pending registration
        const pendingRegistration = await PendingRegistration.findOne({
            email: email,
            verification_token: token,
            verification_token_time: { $gt: new Date() }
        });

        if (!pendingRegistration) {
            return res.status(400).json({
                message: "Invalid or expired OTP. Please request a new verification code."
            });
        }

        // Verify role matches
        if (pendingRegistration.role !== role) {
            return res.status(400).json({
                message: "Role mismatch. Please register again."
            });
        }

        // Get the appropriate user model
        const User = getUserModel(role);
        if (!User) {
            return res.status(400).json({ message: "Invalid user role" });
        }

        logger.debug('Creating verified user in database:', email);

        // Create the actual user with email_verified set to true
        const userData = {
            ...pendingRegistration.registrationData,
            email_verified: true // Set to true immediately
        };

        // Remove verification fields (they're not needed)
        delete userData.verification_token;
        delete userData.verification_token_time;

        const user = new User(userData);

        try {
            await user.save();
            logger.debug('User saved successfully:', email);
        } catch (saveError) {
            logger.error('Error saving verified user:', saveError);

            // Handle duplicate key errors
            if (saveError.code === 11000) {
                if (saveError.keyPattern.email) {
                    return res.status(400).json({
                        message: "Email already exists. This account may have been created already."
                    });
                }

                // Retry with new IDs for specific roles
                if (saveError.keyPattern.provider_id && role === 'kitchenOwner') {
                    user.provider_id = "KIT" + Math.floor(100000 + Math.random() * 900000);
                    await user.save();
                } else if (saveError.keyPattern.owner_id && role === 'hostelOwner') {
                    user.owner_id = "HST" + Math.floor(100000 + Math.random() * 900000);
                    await user.save();
                } else if (saveError.keyPattern.student_id && role === 'student') {
                    user.student_id = "STU" + Math.floor(100000 + Math.random() * 900000);
                    await user.save();
                } else {
                    throw saveError;
                }
            } else {
                throw saveError;
            }
        }

        // Delete the pending registration after successful user creation
        await PendingRegistration.findByIdAndDelete(pendingRegistration._id);
        logger.debug('Pending registration deleted for:', email);

        // Create final JWT token with the actual user ID
        const payload = { id: user._id, email: user.email, role: user.role };
        const finalToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
        setSessionCookie(res, finalToken);
        setCsrfCookie(res);

        const safeUser = user.toObject ? user.toObject() : { ...user };
        delete safeUser.password;
        delete safeUser.reset_password_token;
        delete safeUser.reset_password_token_time;
        delete safeUser.verification_token;
        delete safeUser.verification_token_time;
        res.status(200).json({
            message: "Email verified successfully! Your account has been created.",
            user: safeUser
        });
    } catch (error) {
        logger.error('Verification error:', error);
        res.status(500).json({
            message: "Verification failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
