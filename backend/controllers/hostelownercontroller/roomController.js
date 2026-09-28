const Room = require('../../models/hostelowner/Hostelroom');
const HostelOwner = require('../../models/hostelowner/Hostelowner');
const Bed = require('../../models/hostelowner/RoomBed');
const Booking = require('../../models/student/Booking');
const logger = require('../../utils/logger');

// Create a new room
exports.createRoom = async (req, res, next) => {
    try {
        logger.debug('Creating room with data:', req.body);
        
        // Ensure the user is a hostel owner
        if (req.user.role !== 'hostelOwner' && req.user.role !== 'hostelowner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Extract room details from the request body
        const { name, capacity, price, description, imageUrls, beds, availability } = req.body;
        const hostelId = req.user.id;

        // Create a new room instance
        const newRoom = new Room({
            name,
            capacity: parseInt(capacity),
            price: parseFloat(price),
            description,
            imageUrls,
            hostelId, // Changed from hostelOwner to hostelId
            availability: availability === "true" || availability === true,
            beds: [] // Initialize empty beds array
        });

        // Save the new room to the database
        const savedRoom = await newRoom.save();
        
        // Create beds for the room
        const bedPromises = [];
        if (beds && Array.isArray(beds)) {
            for (const bedData of beds) {
                const newBed = new Bed({
                    bed_number: bedData.bed_number,
                    isBooked: bedData.isBooked || false,
                    roomId: savedRoom._id
                });
                
                bedPromises.push(newBed.save().then(savedBed => {
                    // Add bed reference to room's beds array
                    savedRoom.beds.push(savedBed._id);
                    return savedBed;
                }));
            }
        }
        
        // Wait for all beds to be created
        await Promise.all(bedPromises);
        
        // Save the room again to update its beds array
        await savedRoom.save();

        // Update the HostelOwner to include this room
        await HostelOwner.findByIdAndUpdate(hostelId, {
            $push: { rooms: savedRoom._id }
        });

        res.status(201).json(savedRoom);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ 
            message: 'Failed to create room', 
            error: error.message 
        });
    }
};

// Get all rooms for the authenticated hostel owner
exports.getRooms = async (req, res, next) => {
    try {
        logger.debug('Fetching all rooms...');
        // Ensure the user is a hostel owner
        if (req.user.role !== 'hostelOwner' && req.user.role !== 'hostelowner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find all rooms associated with the hostel owner
        const rooms = await Room.find({ hostelId: req.user.id }).populate('beds');
        logger.debug('Rooms:', rooms);
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ 
            message: 'Failed to fetch rooms', 
            error: error.message 
        });
    }
};

// Get a single room by its ID
exports.getRoomById = async (req, res, next) => {
    try {
        const isHostelOwner = req.user.role === 'hostelOwner' || req.user.role === 'hostelowner';

        // Hostel owners can only view/edit their own room (used by the
        // owner's Edit-room flow); any other authenticated user (e.g. a
        // student browsing to book a bed) can view any room's details.
        const query = isHostelOwner
            ? { _id: req.params.id, hostelId: req.user.id }
            : { _id: req.params.id };

        const room = await Room.findOne(query).populate('beds');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        // Older reserved beds may predate Bed.bookingStatus. Derive the label
        // from the booking record so existing pending requests are not shown
        // to students as fully occupied/approved.
        const activeBookings = await Booking.find({
            room_id: room._id,
            status: { $in: ['Pending', 'Approved'] }
        }).select('student_id status').lean();
        const statusByStudent = new Map(
            activeBookings.map(booking => [booking.student_id.toString(), booking.status])
        );
        const roomResponse = room.toObject();
        roomResponse.beds = roomResponse.beds.map(bed => ({
            ...bed,
            bookingStatus: bed.bookingStatus || (bed.bookedBy ? statusByStudent.get(bed.bookedBy.toString()) : null),
        }));

        res.status(200).json(roomResponse);
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ 
            message: 'Failed to fetch room', 
            error: error.message 
        });
    }
};

// Update a room by its ID
exports.updateRoom = async (req, res, next) => {
    try {
        // Ensure the user is a hostel owner
        if (req.user.role !== 'hostelOwner' && req.user.role !== 'hostelowner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Extract updated room details from the request body
        const { name, capacity, price, description, imageUrls, beds, availability } = req.body;

        // Find the room 
        const room = await Room.findOne({ _id: req.params.id, hostelId: req.user.id });
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        // Update room fields
        room.name = name;
        room.capacity = parseInt(capacity);
        room.price = parseFloat(price);
        room.description = description;
        room.imageUrls = imageUrls;
        room.availability = availability === "true" || availability === true;
        
        // Update beds
        if (beds && Array.isArray(beds)) {
            if (Number.isInteger(Number(capacity)) && beds.length > Number(capacity)) {
                return res.status(400).json({ message: 'Room capacity cannot be lower than the number of beds.' });
            }
            // Get existing bed IDs to track which ones to remove
            const existingBedIds = room.beds.map(bedId => bedId.toString());
            const updatedBedIds = [];
            
            for (const bedData of beds) {
                if (bedData._id) {
                    const existingBed = await Bed.findOne({ _id: bedData._id, roomId: room._id });
                    if (!existingBed) return res.status(400).json({ message: 'Invalid bed for this room.' });
                    if (existingBed.isBooked && (Number(bedData.bed_number) !== existingBed.bed_number || bedData.isBooked === false)) {
                        return res.status(409).json({ message: 'A booked bed cannot be renumbered or made available.' });
                    }
                    // Update existing bed
                    existingBed.bed_number = bedData.bed_number;
                    if (!existingBed.isBooked) existingBed.isBooked = Boolean(bedData.isBooked);
                    await existingBed.save();
                    updatedBedIds.push(bedData._id.toString());
                } else {
                    // Create new bed
                    const newBed = new Bed({
                        bed_number: bedData.bed_number,
                        isBooked: bedData.isBooked || false,
                        roomId: room._id
                    });
                    const savedBed = await newBed.save();
                    room.beds.push(savedBed._id);
                    updatedBedIds.push(savedBed._id.toString());
                }
            }
            
            // Remove beds that are no longer in the updated list
            const bedsToRemove = existingBedIds.filter(id => !updatedBedIds.includes(id));
            const bookedBed = bedsToRemove.length && await Bed.findOne({ _id: { $in: bedsToRemove }, isBooked: true });
            if (bookedBed) {
                return res.status(409).json({ message: 'A booked bed cannot be removed from a room.' });
            }
            for (const bedId of bedsToRemove) {
                await Bed.findByIdAndDelete(bedId);
                room.beds = room.beds.filter(id => id.toString() !== bedId);
            }
        }
        
        // Save the updated room
        const updatedRoom = await room.save();
        
        res.status(200).json(updatedRoom);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ 
            message: 'Failed to update room', 
            error: error.message 
        });
    }
};

// Delete a room by its ID
exports.deleteRoom = async (req, res, next) => {
    try {
        // Ensure the user is a hostel owner
        if (req.user.role !== 'hostelOwner' && req.user.role !== 'hostelowner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find the room by its ID, ensuring it belongs to the hostel owner
        const room = await Room.findOne({ _id: req.params.id, hostelId: req.user.id });
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        const activeBooking = await Booking.findOne({ room_id: room._id, status: { $in: ['Pending', 'Approved', 'Booked', 'Expiring'] } });
        if (activeBooking) {
            return res.status(409).json({ message: 'This room has an active booking and cannot be deleted.' });
        }
        
        // Delete all beds associated with this room
        await Bed.deleteMany({ roomId: room._id });
        
        // Delete the room
        await Room.findByIdAndDelete(room._id);

        // Also remove the room ID from the HostelOwner's rooms array
        await HostelOwner.findByIdAndUpdate(req.user.id, {
            $pull: { rooms: req.params.id }
        });

        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ 
            message: 'Failed to delete room', 
            error: error.message 
        });
    }
};
