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

// Controller function to book a bed and process payment
exports.bookBed = async (req, res) => {
    const { hostelId, roomId, bedId } = req.params;
    const { paymentMethodId } = req.body;
    const customerId = req.user.id;

    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, message: 'Only students can book beds.' });
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
        bedToBook.paymentIntentId = paymentIntent.id;
        bedToBook.bookingDate = new Date();
        bedToBook.bookedBy = customerId;

        if (paymentIntent.status === 'requires_action') {
            bedToBook.paymentStatus = 'pending'; // Pending status if further action is needed
            await bedToBook.save();
            const newBooking = new Booking({
                student_id: customerId,
                room_id: roomId,
                hostel_id: hostelId,
                booking_date: bedToBook.bookingDate,
                status: 'Booked',
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
            hostel_id: hostelId,
            booking_date: bedToBook.bookingDate,
            status: 'Booked',
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
        const hostelOwnerId = req.user.id;

        const rooms = await Room.find({ hostelId: hostelOwnerId }).populate('beds');

        const bookings = await Booking.find({ hostel_id: hostelOwnerId, status: { $ne: 'Cancelled' } })
            .populate('student_id', 'first_name last_name cnic email phone_number')
            .lean();

        if (rooms.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const flatBookings = [];

        rooms.forEach(room => {
            const roomBookings = bookings.filter(
                booking => booking.room_id.toString() === room._id.toString()
            );

            room.beds.forEach(bed => {
                if (!bed.isBooked || !bed.bookedBy) return;

                const booking = roomBookings.find(
                    b => b.student_id && b.student_id._id.toString() === bed.bookedBy.toString()
                );
                if (!booking) return;

                const student = booking.student_id;
                flatBookings.push({
                    bookingId: booking._id,
                    roomId: room._id,
                    roomNumber: room.name,
                    bedNumber: bed.bed_number,
                    bookingDate: booking.booking_date,
                    status: booking.status,
                    paymentStatus: bed.paymentStatus,
                    studentName: student ? `${student.first_name} ${student.last_name}` : 'N/A',
                    cnic: student ? student.cnic : 'N/A',
                    email: student ? student.email : 'N/A',
                    phoneNumber: student ? student.phone_number : 'N/A'
                });
            });
        });

        res.status(200).json({ success: true, data: flatBookings });
    } catch (error) {
        next(error);
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

        const bed = await Bed.findOne({ roomId: booking.room_id._id, bookedBy: booking.student_id._id });

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
        const bedToUnbook = await Bed.findOne({ roomId: booking.room_id, bookedBy: booking.student_id });

        if (!bedToUnbook) {
            return res.status(404).json({ error: 'Bed not found in the room for unbooking' });
        }

        // Reset bed booking status
        bedToUnbook.isBooked = false;
        bedToUnbook.bookedBy = null;
        bedToUnbook.paymentIntentId = null;
        bedToUnbook.paymentStatus = 'pending';
        bedToUnbook.bookingDate = null;

        await bedToUnbook.save();

        // Update booking status to 'Cancelled'
        booking.status = 'Cancelled';
        await booking.save();

        res.status(200).json({ success: true, message: 'Room unbooked successfully' });
    } catch (error) {
        console.error('Error unbooking room:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
