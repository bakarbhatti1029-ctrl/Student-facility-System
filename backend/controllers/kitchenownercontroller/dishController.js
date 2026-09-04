const Dish = require('../../models/kitchenowner/Dish');
const KitchenOwner = require('../../models/kitchenowner/Kitchenowner');

// Create a new dish
exports.createDish = async (req, res, next) => {
    try {
        // Ensure the user is a kitchen owner
        if (req.user.role !== 'kitchenOwner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Extract dish details from the request body
        const { name, description, price, imageUrls, category, availability } = req.body;
        const kitchenOwner = req.user.id;

        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ message: 'Price must be a non-negative number' });
        }

        // Create a new dish instance
        const newDish = new Dish({
            name,
            description,
            price,
            imageUrls,
            kitchenOwner,
            category,
            availability
        });

        // Save the new dish to the database
        const savedDish = await newDish.save();

        // Update the KitchenOwner to include this dish
        await KitchenOwner.findByIdAndUpdate(kitchenOwner, {
            $push: { dishes: savedDish._id }
        });

        res.status(201).json(savedDish);
    } catch (error) {
        next(error);
    }
};

// Get all dishes for the authenticated kitchen owner
exports.getDishes = async (req, res, next) => {
    try {
        // Ensure the user is a kitchen owner
        if (req.user.role !== 'kitchenOwner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find all dishes associated with the kitchen owner
        const dishes = await Dish.find({ kitchenOwner: req.user.id });
        res.status(200).json(dishes);
    } catch (error) {
        next(error);
    }
};

// Get a single dish by its ID
exports.getDishById = async (req, res, next) => {
    try {
        // Ensure the user is a kitchen owner
        if (req.user.role !== 'kitchenOwner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find the dish by its ID and ensure it belongs to the kitchen owner
        const dish = await Dish.findOne({ _id: req.params.id, kitchenOwner: req.user.id });
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        res.status(200).json(dish);
    } catch (error) {
        next(error);
    }
};

// Update a dish by its ID
exports.updateDish = async (req, res, next) => {
    try {
        // Ensure the user is a kitchen owner
        if (req.user.role !== 'kitchenOwner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Extract updated dish details from the request body
        const { name, description, price, imageUrls, category, availability } = req.body;

        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ message: 'Price must be a non-negative number' });
        }

        // Find and update the dish by its ID, ensuring it belongs to the kitchen owner
        const updatedDish = await Dish.findOneAndUpdate(
            { _id: req.params.id, kitchenOwner: req.user.id },
            { name, description, price, imageUrls, category, availability },
            { new: true }
        );

        if (!updatedDish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        res.status(200).json(updatedDish);
    } catch (error) {
        next(error);
    }
};

// Delete a dish by its ID
exports.deleteDish = async (req, res, next) => {
    try {
        // Ensure the user is a kitchen owner
        if (req.user.role !== 'kitchenOwner') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find and delete the dish by its ID, ensuring it belongs to the kitchen owner
        const deletedDish = await Dish.findOneAndDelete({ _id: req.params.id, kitchenOwner: req.user.id });
        if (!deletedDish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        // Also remove the dish ID from the KitchenOwner's dishes array
        await KitchenOwner.findByIdAndUpdate(req.user.id, {
            $pull: { dishes: req.params.id }
        });

        res.status(200).json({ message: 'Dish deleted successfully' });
    } catch (error) {
        next(error);
    }
};
