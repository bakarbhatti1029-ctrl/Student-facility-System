const {getUserModel} = require('../../utils/Utils');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
const { setSessionCookie, setCsrfCookie } = require('../../utils/sessionCookie');
 

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
    const { email, role, userId, purpose } = req.user;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required.' });
    }

    try {
        if (purpose !== 'password-reset-otp' || !email || !role || !userId) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        const User = getUserModel(role);
        if (!User) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        const token = otp.toString();
        // Atomically consume an OTP belonging to this exact reset request.
        // This prevents cross-account OTP reuse and replay races.
        const user = await User.findOneAndUpdate({
            _id: userId,
            email,
            reset_password_token: token,
            reset_password_token_time: { $gt: new Date() }
        }, {
            $unset: { reset_password_token: 1, reset_password_token_time: 1 }
        }, { new: true });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        // Generate JWT for password reset
        const tokenJwt = jwt.sign({ id: user._id, role, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });
        setSessionCookie(res, tokenJwt);
        setCsrfCookie(res);
        res.json({ message: 'OTP verified.' });
    } catch (error) {
        next(error);
    }
};
