// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const getProfile  = require('../../controllers/profileManagement/getProfile'); // Adjust the path according to your structure
const updateProfile  = require('../../controllers/profileManagement/updateProfile'); // Adjust the path according to your structure
const authMiddleware = require('../../middlewares/AuthToken'); // Middleware to check authentication

router.get('/User', authMiddleware, getProfile);
router.put('/User', authMiddleware, updateProfile);

module.exports = router;
