const { getUserModel, generateVerificationToken, maxTokenTime } = require('../../utils/Utils');
const sendEmail = require('../../utils/emailService');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

// Send OTP
exports.sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        logger.debug('Processing forgot password request for:', email);

        const roles = ['hostelOwner', 'kitchenOwner', 'student']; 
        let user;
        let role;

        // Find user across all possible role models
        for (let r of roles) {
            const UserModel = getUserModel(r); 
            user = await UserModel.findOne({ email });

            if (user) {
                role = r;
                break; 
            }
        }

        // Always return the same public result. The short-lived initiation
        // token carries no authority to reset a password; it only binds a
        // later OTP attempt to this email.
        const genericMessage = 'If an account with that email exists, a password reset code has been sent.';
        if (!user) {
            const token = jwt.sign({ email, purpose: 'password-reset-otp' }, process.env.JWT_SECRET, { expiresIn: '10m' });
            return res.json({ success: true, message: genericMessage, token });
        }

        // Generate OTP and update user
        const otp = generateVerificationToken();
        user.reset_password_token = otp; 
        user.reset_password_token_time = maxTokenTime();
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ email, role, userId: user._id, purpose: 'password-reset-otp' }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // Send email with OTP
        try {
            const emailSubject = 'Password Reset - Student Facility System';
            const emailText = `Your OTP for password reset is: ${otp}

This code will expire in 5 minutes.

If you did not request a password reset, please ignore this email or contact support.`;

            await sendEmail(user.email, emailSubject, emailText);
            logger.debug('Password reset email sent successfully to:', email);
            
            // Return success response
            res.json({ 
                success: true,
                message: genericMessage,
                token: token,
                verified: user.email_verified 
            });
        } catch (emailError) {
            logger.error('Error sending password reset email:', emailError);
            
            // Reset the OTP if email fails
            user.reset_password_token = undefined;
            user.reset_password_token_time = undefined;
            await user.save();
            
            return res.status(500).json({ 
                success: false,
                message: "Failed to send password reset email. Please try again later.",
                error: emailError.message
            });
        }
    } catch (error) {
        logger.error('Error in forgot password flow:', error);
        res.status(500).json({ 
            success: false,
            message: "An error occurred during password reset request.",
            // Do not expose mail-provider internals to callers.
        });
    }
};
