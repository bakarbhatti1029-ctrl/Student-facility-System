const jwt = require('jsonwebtoken');
const { getUserModel } = require('../utils/Utils');
const { getSessionToken } = require('../utils/sessionCookie');
const logger = require('../utils/logger');

const verifyJWT = async (req, res, next) => {
    try {
        const token = getSessionToken(req);

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authorization token is required'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Reset-flow tokens intentionally do not require an active account
            // lookup. Every normal session does, so bans and deleted accounts
            // take effect immediately rather than after JWT expiry.
            if (!decoded.purpose && !decoded.isPending) {
                if (!decoded.id) {
                    return res.status(401).json({ success: false, message: 'Invalid token payload' });
                }
                const User = getUserModel(decoded.role);
                const user = User && await User.findById(decoded.id).select('isBanned status');
                if (!user || user.isBanned || user.status === 'banned') {
                    return res.status(403).json({ success: false, message: 'This account is no longer allowed to access the service.' });
                }
            }
            req.user = decoded; // Add the decoded token data to the request object
            next();
        } catch (jwtError) {
            logger.error('JWT verification error:', jwtError);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token',
                error: jwtError.message
            });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication error', 
            error: error.message 
        });
    }
};

module.exports = verifyJWT;
