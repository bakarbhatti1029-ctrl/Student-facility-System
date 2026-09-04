const express = require('express');
const router = express.Router();
const { getStudentProfile } = require('../../controllers/studentcontroller/profile');
const authenticateToken = require('../../middlewares/AuthToken');

// Student profile (registration/verification/login are handled by the shared
// auth routes in routes/authRoutes/authUsers.js).
router.get('/profile', authenticateToken, getStudentProfile);

module.exports = router;
