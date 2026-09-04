const {getUserModel} = require('../../utils/Utils');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');


// Reset Password
exports.resetPassword = async (req, res, next) => {
    logger.debug('hello check rest password');
    const { id, role } = req.user;
    // logger.debug(req.user);
    logger.debug('req.body', req.body);
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password are required.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        const User = getUserModel(role);
        logger.debug(User);
        const user = await User.findById(id);
        logger.debug(user);
        if (!user) {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.reset_password_token = undefined;
        user.reset_password_token_time = undefined;
        // user.verification_token = null;
        // user.verification_token_time = null;
        await user.save();

        res.json({ message: 'Password reset successfully. Please login with your new password.' });
    } catch (error) {
        next(error);
    }
};
