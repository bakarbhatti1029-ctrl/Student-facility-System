const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/hostelownercontroller/bookingController');
const authenticateToken = require('../../middlewares/AuthToken');  // Ensure the user is authenticated

// const authMiddleware = require('../../middlewares/AuthToken');


// Route to get room details
// router.get("/room/:roomId",authenticateToken, bookingController.getRoomDetails);

// Add this new route
router.get('/booked-rooms', authenticateToken, bookingController.getBookedRooms);

router.get('/HostelOwnerBookedBeds', authenticateToken, bookingController.getHostelOwnerBookedBeds);

router.get('/monthly-stats', authenticateToken, bookingController.getMonthlyBookingStats);

// Regenerates and streams the receipt PDF for a booking (student who booked it, or the hostel owner)
router.get('/receipt/:bookingId', authenticateToken, bookingController.getBookingReceipt);

// Route to book a specific bed in a room
router.post('/book/:hostelId/:roomId/:bedId',authenticateToken, bookingController.bookBed);

// An owning hostel owner can make one final decision on a pending request.
router.patch('/:bookingId/approve', authenticateToken, bookingController.approveBooking);
router.patch('/:bookingId/reject', authenticateToken, bookingController.rejectBooking);
router.patch('/:bookingId/complete', authenticateToken, bookingController.completeBooking);
router.patch('/:bookingId/archive', authenticateToken, bookingController.archiveBooking);

// Route to unbook a room
router.delete('/unbookBed/:bookingId', authenticateToken, bookingController.unbookRoom);

module.exports = router;
