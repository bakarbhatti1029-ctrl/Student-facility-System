const KitchenOwner = require('../../models/kitchenowner/Kitchenowner');

const getAllKitchens = async (req, res, next) => {
    try {
        // Fetch all kitchens and populate the dishes field
        const kitchens = await KitchenOwner.find({}, 'kitchen_name address kitchen_description kitchen_picture')
                                           .populate('dishes', 'name description price imageUrls availability'); // Populate specific fields from dishes
  
        // Send the fetched kitchens as a response
        res.status(200).json({
            success: true,
            data: kitchens
        });
    } catch (error) {
        next(error);
    }
};

module.exports = getAllKitchens;
