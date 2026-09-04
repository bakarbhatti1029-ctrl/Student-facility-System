const express = require('express');
const router = express.Router();
const roomController = require('../../controllers/hostelownercontroller/roomController');
const authMiddleware = require('../../middlewares/AuthToken');

// Room routes with authentication middleware

// Create a new room
router.post('/createRoom', authMiddleware, roomController.createRoom);

// Get all rooms
router.get('/getAllRooms', authMiddleware, roomController.getRooms);

// Get a single room by ID
router.get('/getRoom/:id', authMiddleware, roomController.getRoomById);

// Update a room by ID
router.put('/updateRoom/:id', authMiddleware, roomController.updateRoom);

// Delete a room by ID
router.delete('/deleteRoom/:id', authMiddleware, roomController.deleteRoom);

module.exports = router;
