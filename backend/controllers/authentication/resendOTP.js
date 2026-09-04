const { generateVerificationToken, maxTokenTime } = require('../../utils/Utils');
const PendingRegistration = require('../../models/PendingRegistration');
const sendEmail = require('../../utils/emailService');
const logger = require('../../utils/logger');

exports.resendOTP = async (req, res, next) => {
    try {
        const { email, role, isPending } = req.user; // Get decoded token data from req.user

        logger.debug(`Resend OTP request for ${email} with role ${role}, isPending: ${isPending}`);

        // Only allow resending OTP for pending registrations
        if (!isPending) {
            return res.status(400).json({
                success: false,
                message: "This account is already verified. Please login."
            });
        }

        // Find the pending registration
        const pendingRegistration = await PendingRegistration.findOne({ email, role });

        if (!pendingRegistration) {
            return res.status(404).json({
                success: false,
                message: "No pending registration found. Please register again."
            });
        }

        // Generate new OTP
        const otp = generateVerificationToken();
        const otpString = otp.toString();

        // Update pending registration with new OTP
        pendingRegistration.verification_token = otpString;
        pendingRegistration.verification_token_time = maxTokenTime();
        await pendingRegistration.save();

        logger.debug('Generated new OTP for:', email);

        // Send verification email
        try {
            const emailSubject = 'Email Verification - Student Facility System (Resent)';
            const emailText = `Your new OTP for email verification is: ${otpString}

This code will expire in 30 minutes.

Thank you for registering with Student Facility System!`;

            await sendEmail(email, emailSubject, emailText);
            logger.debug('Verification email resent successfully to:', email);

            return res.status(200).json({
                success: true,
                message: "OTP resent successfully. Please check your email."
            });
        } catch (emailError) {
            console.error('Failed to resend OTP:', emailError);

            return res.status(500).json({
                success: false,
                message: "Failed to send OTP email. Please try again later.",
                error: emailError.message
            });
        }
    } catch (error) {
        console.error('Error in resendOTP:', error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resending OTP",
            error: error.message
        });
    }
};
