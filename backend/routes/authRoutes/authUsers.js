// routes/authRoutes/authUsers.js
const express = require('express');
const router = express.Router();
const {signUpUser} = require('../../controllers/authentication/registerUser');
const {loginUser} = require('../../controllers/authentication/loginUser');
const {verifyEmail} = require('../../controllers/authentication/verifyEmail');
const {resendOTP} = require('../../controllers/authentication/resendOTP');
const {sendOtp} = require('../../controllers/authentication/forgetPassword');
const {verifyOtp} = require('../../controllers/authentication/verifyPasswordOtp');
const {resetPassword} = require('../../controllers/authentication/resetPassword');
const verifyJWT = require('../../middlewares/AuthToken');
const { clearSessionCookie, setCsrfCookie } = require('../../utils/sessionCookie');
const util = require('../../utils/Utils');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
} = require('../../validators/requestValidators');




router.post('/register', validateRegister, signUpUser);
router.patch('/verifyEmail',verifyJWT, verifyEmail);
router.get('/resendOTP',verifyJWT, resendOTP);
router.post('/login', validateLogin, loginUser);
router.post('/forgot-password', validateForgotPassword, sendOtp);
router.post('/verify-otp',verifyJWT, verifyOtp);
router.patch('/reset-password',verifyJWT, resetPassword);
router.get('/csrf', (req, res) => {
  res.json({ csrfToken: setCsrfCookie(res) });
});
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});
router.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const Model = util.getUserModel(req.user.role);
    const user = await Model.findById(req.user.id)
      .select('-password -reset_password_token -reset_password_token_time -verification_token -verification_token_time')
      .lean();
    if (!user) return res.status(401).json({ message: 'Session is no longer valid.' });
    res.json({ user });
  } catch (error) { next(error); }
});

module.exports = router;
