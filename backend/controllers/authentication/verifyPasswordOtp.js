const {getUserModel} = require('../../utils/Utils');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
 

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
    const { email, role } = req.user;
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required.' });
    }

    try {
        const User = getUserModel(role);
        logger.debug('User', User);
        const token = otp.toString();
        const user = await User.findOne({ reset_password_token: token, reset_password_token_time: { $gt: new Date() } });
        logger.debug('user', user);
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        // user.verification_token = undefined;
        // user.verification_token_time = undefined;
        // logger.debug('user', user);
        // await user.save();


        // Generate JWT for password reset
        const tokenJwt = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '10h' });
        res.json({ message: 'OTP verified.', token: tokenJwt });
    } catch (error) {
        next(error);
    }
};