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

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP and update user
        const otp = generateVerificationToken();
        user.reset_password_token = otp; 
        user.reset_password_token_time = maxTokenTime();
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ email, role, userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10h' });

        // Send email with OTP
        try {
            const emailSubject = 'Password Reset - Student Facility System';
            const emailText = `Your OTP for password reset is: ${otp}

This code will expire in 30 minutes.

If you did not request a password reset, please ignore this email or contact support.`;

            await sendEmail(user.email, emailSubject, emailText);
            logger.debug('Password reset email sent successfully to:', email);
            
            // Return success response
            res.json({ 
                success: true,
                message: 'Password reset OTP has been sent to your email.',
                token: token,
                verified: user.email_verified 
            });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            
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
        console.error('Error in forgot password flow:', error);
        res.status(500).json({ 
            success: false,
            message: "An error occurred during password reset request.",
            error: error.message
        });
    }
};
