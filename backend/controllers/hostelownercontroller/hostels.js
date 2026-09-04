const HostelOwner = require('../../models/hostelowner/Hostelowner');
const logger = require('../../utils/logger');

const getAllHostels = async (req, res, next) => {
    try {
        logger.debug('Fetching all hostels...');
        
        // Fetch all hostels and select only necessary fields
        const hostels = await HostelOwner.find({ isApproved: true, isBanned: false })
            .select('hostel_name hostel_address hostel_lat hostel_lng hostel_type hostel_description hostel_picture facilities nearby_institutes')
            .populate({
                path: 'rooms',
                select: 'name capacity price availability description imageUrls beds',
                populate: {
                    path: 'beds',
                    select: 'bed_number isBooked bookedBy paymentStatus',
                },
            });
        
        logger.debug(`Successfully fetched ${hostels.length} hostels`);
        
        // Send the fetched hostels as a response
        return res.status(200).json({
            success: true,
            data: hostels,
        });
    } catch (error) {
        console.error('Error fetching all hostels:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch hostels',
            error: error.message
        });
    }
};

module.exports = getAllHostels;
