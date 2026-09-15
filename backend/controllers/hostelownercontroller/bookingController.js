const stripe = require('../../config/stripe');
const Room = require('../../models/hostelowner/Hostelroom');
const Bed = require('../../models/hostelowner/RoomBed');
const Student = require('../../models/student/Student');
const HostelOwner = require('../../models/hostelowner/Hostelowner');
const Booking = require('../../models/student/Booking');
const logger = require('../../utils/logger');
const generateInvoicePdf = require('../../utils/generateInvoicePdf');
const { uploadBufferToCloudinary, getSignedFileUrl } = require('../../utils/cloudinaryUpload');
const sendEmail = require('../../utils/emailService');
const mongoose = require('mongoose');
const { sendPushToUser } = require('../../services/pushNotificationService');

const BOOKING_RESPONSE_HOURS = Math.max(1, Number(process.env.BOOKING_RESPONSE_HOURS) || 24);
const getBookingDeadline = () => new Date(Date.now() + BOOKING_RESPONSE_HOURS * 60 * 60 * 1000);

// Controller function to book a bed and process payment
exports.bookBed = async (req, res) => {
    const { hostelId, roomId, bedId } = req.params;
    const { paymentMethodId } = req.body;
    const customerId = req.user.id;

    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, message: 'Only students can book beds.' });
    }

    if (!mongoose.Types.ObjectId.isValid(hostelId)
        || !mongoose.Types.ObjectId.isValid(roomId)
        || !Number.isInteger(Number(bedId))) {
        return res.status(400).json({
            success: false,
            message: 'Invalid hostel, room, or bed information. Please refresh the room page and try again.'
        });
    }

    try {
        // Find hostel and related data
        const hostel = await HostelOwner.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        const room = await Room.findOne({ _id: roomId, hostelId: hostelId });
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found or does not belong to the specified hostel' });
        }

        const bedToBook = await Bed.findOne({ roomId: room._id, bed_number: parseInt(bedId) });
        if (!bedToBook || bedToBook.isBooked) {
            return res.status(400).json({ success: false, message: 'This bed is already booked. Please choose another one.' });
        }

        const hostelOwner = await HostelOwner.findById(room.hostelId);
        if (!hostelOwner) {
            return res.status(400).json({ success: false, message: 'Invalid hostel owner' });
        }

        if (!paymentMethodId) {
            return res.status(400).json({ success: false, message: 'No payment method was provided. Please re-enter your card details.' });
        }

        // Create a payment intent with Stripe
        // NOTE: PKR requires your Stripe account to be enabled for Pakistani Rupees.
        // If PKR is not supported on your account, change to 'usd' and multiply amount accordingly.
        const stripeAmount = Math.round(Number(room.price) * 100);
        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: stripeAmount,
                currency: 'pkr',
                payment_method: paymentMethodId,
                confirm: true,
                automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
            });
        } catch (stripeError) {
            // Surface the REAL Stripe error to the frontend instead of a generic 500.
            // Common causes: PKR not enabled on the Stripe account, invalid card, test-mode mismatch.
            console.error('Stripe payment intent error:', stripeError.message);
            return res.status(402).json({
                success: false,
                message: stripeError.message || 'Payment was declined by Stripe. Please check your card details and try again.',
                code: stripeError.code,
            });
        }

        // Update bed booking status based on payment intent status
        bedToBook.isBooked = true;
        bedToBook.bookingStatus = 'Pending';
        bedToBook.paymentIntentId = paymentIntent.id;
        bedToBook.bookingDate = new Date();
        bedToBook.bookedBy = customerId;

        if (paymentIntent.status === 'requires_action') {
            bedToBook.paymentStatus = 'pending'; // Pending status if further action is needed
            await bedToBook.save();
            const newBooking = new Booking({
                student_id: customerId,
                room_id: roomId,
                bed_id: bedToBook._id,
                bed_number: bedToBook.bed_number,
                room_name: room.name,
                payment_status: bedToBook.paymentStatus,
                hostel_id: hostelId,
                booking_date: bedToBook.bookingDate,
                status: 'Pending',
                response_deadline: getBookingDeadline(),
            });
            await newBooking.save();
            return res.status(200).json({
                success: true,
                requiresAction: true,
                clientSecret: paymentIntent.client_secret,
                paymentData: { bed: bedToBook, booking: newBooking, room, hostel: hostelOwner },
            });
        }

        if (paymentIntent.status !== 'succeeded') {
            // Payment didn't go through and doesn't need further action either —
            // do not mark the bed as booked.
            return res.status(402).json({
                success: false,
                message: `Payment was not completed (status: ${paymentIntent.status}). Please try again.`,
            });
        }

        bedToBook.paymentStatus = 'completed';
        await bedToBook.save();

        const newBooking = new Booking({
            student_id: customerId,
            room_id: roomId,
            bed_id: bedToBook._id,
            bed_number: bedToBook.bed_number,
            room_name: room.name,
            payment_status: bedToBook.paymentStatus,
            hostel_id: hostelId,
            booking_date: bedToBook.bookingDate,
            status: 'Pending',
            response_deadline: getBookingDeadline(),
        });
        await newBooking.save();

        // Fetch the student once — used for the receipt display data below
        // and, if it succeeds, for the PDF/email step.
        const student = await Student.findById(customerId);
        const studentSummary = student && {
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            phone_number: student.phone_number,
            cnic: student.cnic,
        };

        // Alert the owner in real time and by email, so the request is still
        // noticed when their dashboard is closed.
        req.app.get('io').to(`room-hostel${hostelOwner._id}`).emit('newBooking', {
            _id: newBooking._id,
            studentName: student ? `${student.first_name} ${student.last_name}` : 'A student',
            roomName: room.name,
            bedNumber: bedToBook.bed_number,
            responseDeadline: newBooking.response_deadline,
        });
        await sendPushToUser(hostelOwner._id, {
            title: 'New hostel booking request',
            body: `${studentSummary ? `${studentSummary.first_name} ${studentSummary.last_name}` : 'A student'} requested Room ${room.name}, Bed ${bedToBook.bed_number}.`,
            url: '/booking',
            tag: `booking-${newBooking._id}`,
        });
        try {
            await sendEmail(
                hostelOwner.email,
                `New SFS hostel booking request - respond within ${BOOKING_RESPONSE_HOURS} hours`,
                `Hi ${hostelOwner.first_name}, ${studentSummary ? `${studentSummary.first_name} ${studentSummary.last_name}` : 'a student'} requested Bed ${bedToBook.bed_number} in ${room.name}. Please sign in and approve or reject it before ${newBooking.response_deadline.toLocaleString()}.`
            );
        } catch (notificationError) {
            console.error('Hostel owner notification email failed:', notificationError.message);
        }

        // Generate a PDF receipt, store it on Cloudinary, and email it to the
        // student. The card has already been charged at this point, so any
        // failure here is logged and swallowed — it must never turn a
        // successful booking into an error response.
        let invoiceUrl;
        try {
            const pdfBuffer = await generateInvoicePdf({
                student,
                hostel: hostelOwner,
                room,
                bed: bedToBook,
                booking: newBooking,
                paymentIntentId: paymentIntent.id,
            });

            // For resource_type 'raw', Cloudinary has no separate "format"
            // concept like it does for images — the extension must be part
            // of the public_id itself, or the delivered file has none and
            // serves as generic application/octet-stream.
            const uploadResult = await uploadBufferToCloudinary(pdfBuffer, {
                folder: 'sfs/invoices',
                resource_type: 'raw',
                public_id: `booking-${newBooking._id}.pdf`,
            });
            // Cloudinary denies unsigned delivery of raw/PDF files by default —
            // a signed URL is required to actually download this later.
            invoiceUrl = getSignedFileUrl(uploadResult.public_id, {
                resourceType: 'raw',
                version: uploadResult.version,
                attachmentFilename: `SFS-Receipt-${newBooking._id}`,
            });

            bedToBook.paymentReceiptUrl = invoiceUrl;
            await bedToBook.save();

            await sendEmail(
                student.email,
                'Your SFS Booking Receipt',
                `Hi ${student.first_name}, thank you for booking Bed ${bedToBook.bed_number} in ${room.name} at ${hostelOwner.hostel_name}. Your receipt is attached.`,
                [{ filename: `SFS-Receipt-${newBooking._id}.pdf`, content: pdfBuffer }]
            );
        } catch (invoiceError) {
            console.error('Invoice generation/upload/email failed (booking still succeeded):', invoiceError.message);
        }

        // Return success response with payment intent details.
        // `paymentData` is what the frontend's onSuccess callback consumes.
        res.status(200).json({
            success: true,
            requiresAction: false,
            paymentIntent,
            bedStatus: bedToBook,
            booking: newBooking,
            paymentData: { bed: bedToBook, booking: newBooking, room, hostel: hostelOwner, student: studentSummary, invoiceUrl },
        });

    } catch (error) {
        console.error('Error processing booking:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error while processing your booking.' });
    }
};


exports.getBookedRooms = async (req, res, next) => {
    logger.debug("I am in get booked rooms controller");
    const userId = req.user.id; // Assuming userId is the student's ID

    try {
        // Find all bookings for the student
        const bookings = await Booking.find({ student_id: userId })
            .populate('student_id')
            .populate({ path: 'room_id', populate: { path: 'beds' } }) // Deep populate beds
            .populate('hostel_id'); // Populate hostel details

        if (bookings.length === 0) {
            return res.status(200).json({ success: true, data: [] }); // Return empty array, not 404
        }

        const mergedBookings = {};

        bookings.forEach(booking => {
            const room = booking.room_id;
            const hostel = booking.hostel_id;
            const roomKey = `${hostel._id}-${room._id}`; // Create a unique key for each room-hostel combination

            if (!mergedBookings[roomKey]) {
                // If no entry exists for this room, create a new one
                mergedBookings[roomKey] = {
                    bookingId: booking._id,  // Keep the most recent booking ID
                    // studentName: booking.student_id.first_name + " " + booking.student_id.last_name,
                    // studentEmail: booking.student_id.email,
                    // studentPhone: booking.student_id.phone_number,
                    // studentGender: booking.student_id.gender,
                    // studentCNIC: booking.student_id.cnic,
                    hostelName: hostel.hostel_name,
                    hostelAddress: hostel.hostel_address,
                    roomId: room._id,
                    roomName: room.name,
                    bookingDate: booking.booking_date,
                    responseDeadline: booking.response_deadline,
                    status: booking.status,
                    beds: [] // Initialize beds array
                };
            }

            // Merge beds, avoiding duplicates based on the bed number (or _id)
            const newBeds = room.beds.filter(bed => bed.bookedBy && bed.bookedBy.toString() === userId);

            // Add new beds only if they don't already exist in the array (based on bed_number)
            newBeds.forEach(bed => {
                const existingBed = mergedBookings[roomKey].beds.find(b => b.bed_number === bed.bed_number);
                if (!existingBed) {
                    mergedBookings[roomKey].beds.push(bed);
                }
            });
        });

        const formattedBookings = Object.values(mergedBookings); // Convert the object back to an array
        res.status(200).json({ success: true, data: formattedBookings });
    } catch (error) {
        console.error('Error fetching booked rooms:', error);
        next(error); // Pass the error to the next middleware for centralized error handling
    }
};

// Real per-month booking counts for this owner's hostel, current calendar year.
exports.getMonthlyBookingStats = async (req, res, next) => {
    try {
        const hostelOwnerId = req.user.id;
        const year = new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const startOfNextYear = new Date(year + 1, 0, 1);

        const bookings = await Booking.find({
            hostel_id: hostelOwnerId,
            status: { $ne: 'Cancelled' },
            booking_date: { $gte: startOfYear, $lt: startOfNextYear },
        }).select('booking_date').lean();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const counts = new Array(12).fill(0);
        bookings.forEach((booking) => {
            const monthIndex = new Date(booking.booking_date).getMonth();
            counts[monthIndex] += 1;
        });

        const data = monthNames.map((month, i) => ({ month, bookings: counts[i] }));

        res.status(200).json({ success: true, year, data });
    } catch (error) {
        next(error);
    }
};

exports.getHostelOwnerBookedBeds = async (req, res, next) => {
    try {
        if (req.user.role !== 'hostelOwner') {
            return res.status(403).json({ success: false, message: 'Only hostel owners can view booking requests.' });
        }
        const hostelOwnerId = req.user.id;

        const rooms = await Room.find({ hostelId: hostelOwnerId }).populate('beds');

        const bookings = await Booking.find({
            hostel_id: hostelOwnerId,
            owner_hidden: { $ne: true }
        })
            .populate('student_id', 'first_name last_name cnic email phone_number profile_picture')
            .lean();

        if (rooms.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const roomById = new Map(rooms.map(room => [room._id.toString(), room]));
        const allBeds = rooms.flatMap(room => room.beds.map(bed => ({ bed, room })));
        const usedBedIds = new Set();

        // Build rows from booking history, not only from currently occupied
        // beds. This keeps rejected/refunded records available to real UI
        // filters and gives every booking exactly one row.
        const flatBookings = bookings.map(booking => {
            const room = roomById.get(booking.room_id.toString());
            let match = booking.bed_id
                ? allBeds.find(({ bed }) => bed._id.toString() === booking.bed_id.toString())
                : null;

            if (!match && booking.status === 'Rejected') {
                match = allBeds.find(({ bed, room: bedRoom }) =>
                    bedRoom._id.toString() === booking.room_id.toString()
                    && bed.paymentStatus === 'refunded'
                    && !usedBedIds.has(bed._id.toString()));
            }

            if (!match && booking.student_id) {
                const candidates = allBeds.filter(({ bed, room: bedRoom }) =>
                    bedRoom._id.toString() === booking.room_id.toString()
                    && bed.bookedBy
                    && bed.bookedBy.toString() === booking.student_id._id.toString()
                    && !usedBedIds.has(bed._id.toString()));
                candidates.sort((a, b) =>
                    Math.abs(new Date(a.bed.bookingDate || 0) - new Date(booking.booking_date))
                    - Math.abs(new Date(b.bed.bookingDate || 0) - new Date(booking.booking_date)));
                match = candidates[0];
            }

            const bed = match?.bed;
            if (bed) usedBedIds.add(bed._id.toString());
            const student = booking.student_id;
            return {
                bookingId: booking._id,
                roomId: room?._id || booking.room_id,
                roomNumber: booking.room_name || room?.name || 'N/A',
                bedNumber: booking.bed_number ?? bed?.bed_number ?? 'N/A',
                bookingDate: booking.booking_date,
                responseDeadline: booking.response_deadline,
                status: booking.status,
                paymentStatus: booking.payment_status || bed?.paymentStatus || (booking.status === 'Rejected' ? 'refunded' : 'unknown'),
                studentName: student ? `${student.first_name} ${student.last_name}` : 'N/A',
                cnic: student?.cnic || 'N/A',
                email: student?.email || 'N/A',
                phoneNumber: student?.phone_number || 'N/A',
                profilePicture: student?.profile_picture || ''
            };
        });

        res.status(200).json({ success: true, data: flatBookings });
    } catch (error) {
        next(error);
    }
};

const findBedForBooking = async booking => {
    if (booking.bed_id) {
        return Bed.findOne({ _id: booking.bed_id, roomId: booking.room_id });
    }

    // Compatibility for records made before bookings stored bed_id. This is
    // safe for the remaining reservation after another bed has been rejected,
    // because rejected beds are no longer booked by the student.
    const candidates = await Bed.find({
        roomId: booking.room_id,
        bookedBy: booking.student_id._id || booking.student_id,
        isBooked: true,
    });
    return candidates.sort((a, b) =>
        Math.abs(new Date(a.bookingDate || 0) - new Date(booking.booking_date))
        - Math.abs(new Date(b.bookingDate || 0) - new Date(booking.booking_date))
    )[0] || null;
};

// Shared UC-07 decision handler. It validates the actor, booking identifier,
// ownership and current state before making an irreversible status change.
const decideBooking = async (req, res, decision) => {
    const { bookingId } = req.params;

    if (req.user.role !== 'hostelOwner') {
        return res.status(403).json({ success: false, message: 'Only hostel owners can approve or reject bookings.' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    try {
        const booking = await Booking.findById(bookingId).populate('student_id', 'first_name last_name email');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.hostel_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'This booking does not belong to your hostel.' });
        }
        if (booking.status !== 'Pending') {
            return res.status(409).json({
                success: false,
                message: `This booking has already been ${booking.status.toLowerCase()}.`,
            });
        }
        if (booking.response_deadline && new Date() > booking.response_deadline) {
            return res.status(409).json({
                success: false,
                message: 'This booking request has expired and its refund is being processed.',
            });
        }

        const bed = await findBedForBooking(booking);
        if (!bed) {
            return res.status(409).json({ success: false, message: 'The bed assigned to this booking could not be found.' });
        }
        const room = await Room.findById(booking.room_id).select('name').lean();
        booking.bed_number = booking.bed_number ?? bed.bed_number;
        booking.room_name = booking.room_name || room?.name;
        booking.payment_status = booking.payment_status || bed.paymentStatus;

        if (decision === 'Rejected') {
            // The existing checkout charges before owner review. Refund first so
            // a rejected request can never leave the student charged.
            if (bed.paymentIntentId && bed.paymentStatus === 'completed') {
                try {
                    await stripe.refunds.create({ payment_intent: bed.paymentIntentId });
                } catch (refundError) {
                    console.error('Booking rejection refund failed:', refundError.message);
                    return res.status(502).json({
                        success: false,
                        message: 'The payment refund failed, so the booking remains pending. Please try again.',
                    });
                }
                bed.paymentStatus = 'refunded';
            }
            booking.payment_status = bed.paymentStatus;
            bed.isBooked = false;
            bed.bookingStatus = null;
            bed.bookedBy = null;
            // Keep bookingDate as audit metadata so legacy rejected bookings
            // can still be paired with their exact bed in booking history.
            await bed.save();
        } else {
            bed.bookingStatus = 'Approved';
            await bed.save();
        }

        booking.status = decision;
        booking.decided_at = new Date();
        await booking.save();

        const student = booking.student_id;
        const studentMessage = decision === 'Approved'
            ? `Hi ${student.first_name}, your booking for Room ${room?.name || 'N/A'}, Bed ${bed.bed_number} has been approved by the hostel owner.`
            : `Hi ${student.first_name}, your booking for Room ${room?.name || 'N/A'}, Bed ${bed.bed_number} has been rejected by the hostel owner. Any completed card payment has been refunded.`;
        const ownerMessage = decision === 'Approved'
            ? `Booking for ${student.first_name} ${student.last_name} has been approved.`
            : `Booking for ${student.first_name} ${student.last_name} has been rejected and the bed is now available.`;

        // Status persistence is the source of truth. Notification delivery is
        // best-effort and must not roll back a completed owner decision.
        req.app.get('io')?.to(`room-user${student._id}`).emit('bookingStatusUpdate', {
            bookingId: booking._id,
            status: decision,
            message: studentMessage,
        });
        sendPushToUser(student._id, {
            title: `Hostel booking ${decision.toLowerCase()}`,
            body: studentMessage,
            url: '/profile', tag: `booking-${booking._id}`,
        }).catch(error => console.error('Booking decision push failed:', error.message));
        let notificationSent = false;
        if (student.email) {
            try {
                await sendEmail(
                    student.email,
                    `Hostel booking ${decision.toLowerCase()} - Room ${room?.name || 'N/A'}, Bed ${bed.bed_number}`,
                    studentMessage
                );
                notificationSent = true;
            } catch (error) {
                console.error('Booking decision email failed:', error.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: ownerMessage,
            notificationSent,
            notificationMessage: notificationSent
                ? `An email notification was sent to ${student.email}.`
                : 'The booking was updated, but the email notification could not be sent.',
            data: booking
        });
    } catch (error) {
        console.error(`Error marking booking as ${decision}:`, error);
        return res.status(500).json({ success: false, message: 'Unable to update the booking status.' });
    }
};

exports.approveBooking = (req, res) => decideBooking(req, res, 'Approved');
exports.rejectBooking = (req, res) => decideBooking(req, res, 'Rejected');

// Ends an approved stay without deleting its history. The bed becomes
// available again and the booking remains visible as Completed.
exports.completeBooking = async (req, res) => {
    const { bookingId } = req.params;
    if (req.user.role !== 'hostelOwner') {
        return res.status(403).json({ success: false, message: 'Only hostel owners can complete bookings.' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.hostel_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'This booking does not belong to your hostel.' });
        }
        if (!['Approved', 'Booked'].includes(booking.status)) {
            return res.status(409).json({ success: false, message: 'Only an approved booking can be checked out.' });
        }

        const bed = await findBedForBooking(booking);
        const room = await Room.findById(booking.room_id).select('name').lean();
        booking.room_name = booking.room_name || room?.name;
        const bedStillBelongsToBooking = bed
            && bed.isBooked
            && bed.bookedBy
            && bed.bookedBy.toString() === booking.student_id.toString();
        if (bedStillBelongsToBooking) {
            booking.bed_number = booking.bed_number ?? bed.bed_number;
            booking.payment_status = booking.payment_status || bed.paymentStatus;
            bed.isBooked = false;
            bed.bookingStatus = null;
            bed.bookedBy = null;
            // Preserve payment and booking metadata for the audit trail.
            await bed.save();
        }

        booking.status = 'Completed';
        booking.completed_at = new Date();
        await booking.save();

        return res.status(200).json({
            success: true,
            message: bedStillBelongsToBooking
                ? 'Student checked out and the bed is now available.'
                : 'Booking marked as completed. Its history has been preserved.',
            data: booking,
        });
    } catch (error) {
        console.error('Error completing booking:', error);
        return res.status(500).json({ success: false, message: 'Unable to complete this booking.' });
    }
};

// Soft-removes a finished record from the owner's view. The booking remains
// in MongoDB for reporting/auditing and no bed state is changed.
exports.archiveBooking = async (req, res) => {
    const { bookingId } = req.params;
    if (req.user.role !== 'hostelOwner') {
        return res.status(403).json({ success: false, message: 'Only hostel owners can manage booking history.' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.hostel_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'This booking does not belong to your hostel.' });
        }
        if (!['Completed', 'Rejected', 'Cancelled'].includes(booking.status)) {
            return res.status(409).json({
                success: false,
                message: 'Active bookings cannot be removed from history. Check the student out first.'
            });
        }

        booking.owner_hidden = true;
        await booking.save();
        return res.status(200).json({
            success: true,
            message: 'Booking removed from your history view. The audit record is preserved.'
        });
    } catch (error) {
        console.error('Error archiving booking:', error);
        return res.status(500).json({ success: false, message: 'Unable to remove this history record.' });
    }
};


// Regenerates the receipt PDF on demand and streams it directly from our own
// server. Cloudinary's raw-file CDN delivery turned out to be blocked on this
// account (401 "deny or ACL failure") regardless of signing — Cloudinary is
// still used as an archival copy at booking time, but the actual download
// never depends on it, so this always works.
exports.getBookingReceipt = async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;

    try {
        const booking = await Booking.findById(bookingId)
            .populate('student_id')
            .populate('room_id')
            .populate('hostel_id');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isOwningStudent = booking.student_id._id.toString() === userId;
        const isOwningHostel = booking.hostel_id._id.toString() === userId;
        if (!isOwningStudent && !isOwningHostel) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this receipt' });
        }

        const bed = await findBedForBooking(booking);

        const pdfBuffer = await generateInvoicePdf({
            student: booking.student_id,
            hostel: booking.hostel_id,
            room: booking.room_id,
            bed: bed || { bed_number: 'N/A' },
            booking,
            paymentIntentId: bed?.paymentIntentId,
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="SFS-Receipt-${booking._id}.pdf"`,
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating booking receipt:', error);
        res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
};


exports.unbookRoom = async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

    try {
        // Find the booking by ID
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Allow either the student who made the booking, or the owner of the
        // hostel it belongs to, to cancel/remove it.
        const isOwningStudent = booking.student_id.toString() === userId;
        const isOwningHostel = booking.hostel_id.toString() === userId;
        if (!isOwningStudent && !isOwningHostel) {
            return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
        }

        // Find the bed associated with the booking and update its booking status.
        // Match on the student who actually holds the bed, not on whoever is
        // making the request (the hostel owner's own ID would never match here).
        const bedToUnbook = await findBedForBooking(booking);

        // Old history can outlive its student or bed relationship. If the bed
        // still exists, release it; otherwise there is nothing left to free
        // and the stale booking can still be archived successfully.
        if (bedToUnbook) {
            bedToUnbook.isBooked = false;
            bedToUnbook.bookingStatus = null;
            bedToUnbook.bookedBy = null;
            bedToUnbook.paymentIntentId = null;
            bedToUnbook.paymentStatus = 'pending';
            bedToUnbook.bookingDate = null;
            await bedToUnbook.save();
        }

        // Update booking status to 'Cancelled'
        booking.status = 'Cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            message: bedToUnbook
                ? 'Booking removed and bed released successfully.'
                : 'Old booking history removed successfully.'
        });
    } catch (error) {
        console.error('Error unbooking room:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
