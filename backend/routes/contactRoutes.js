const express = require('express');
const router = express.Router();
const {
  submitContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} = require('../controllers/contactController');
const verifyJWT = require('../middlewares/AuthToken');
const { adminAuth } = require('../middlewares/adminAuth');
const { validateContactMessage } = require('../validators/requestValidators');

// Authenticated users only — only registered users may submit complaints
router.post('/submit', verifyJWT, validateContactMessage, submitContactMessage);

// Admin only — view, update, delete contact messages
router.get('/all', adminAuth, getAllContactMessages);
router.patch('/:id/status', adminAuth, updateContactMessageStatus);
router.delete('/:id', adminAuth, deleteContactMessage);

module.exports = router;
