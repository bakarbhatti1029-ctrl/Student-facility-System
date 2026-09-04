// routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const { getMessages } = require('../../controllers/chat/chatController');
const verifyJWT = require('../../middlewares/AuthToken');


// Get chat messages by order ID (loads chat history on page load).
// Note: sending a message is handled entirely by the Socket.IO 'sendMessage'
// event (see sockets/socket.js), which writes to MongoDB itself — so there is
// deliberately no POST route here.
router.get('/:orderId', verifyJWT, getMessages);

module.exports = router;
