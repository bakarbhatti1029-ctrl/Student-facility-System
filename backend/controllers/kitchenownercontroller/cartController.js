const Cart = require('../../models/kitchenowner/Cart');
const Dish = require('../../models/kitchenowner/Dish');
const Kitchen = require('../../models/kitchenowner/Kitchenowner')
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
 
 
// 1. Add Item to Cart
exports.addToCart = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized or invalid user ID' });
    }
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can order food.' });
    }

    const { productId, quantity, kitchenId } = req.body;

    if (!productId || !kitchenId || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Missing productId/kitchenId, or quantity must be a positive integer" });
    }

    try {
        // Find the kitchen by kitchenId
        let kitchen = await Kitchen.findById(kitchenId);
        if (!kitchen) {
            return res.status(404).json({ message: 'Kitchen not found' });
        }

        // Find or create the cart for the user and kitchen
        let cart = await Cart.findOne({ userId: req.user.id, kitchenId });
        if (!cart) {
            cart = new Cart({ userId: req.user.id, kitchenId, items: [], totalPrice: 0 });
        }

        // Find dish by productId
        const dish = await Dish.findById(productId);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        if (!dish.availability) {
            return res.status(400).json({ message: 'This dish is currently not available' });
        }

        // Check if the dish is already in the cart
        const existingItem = cart.items.find(item => item.productId.equals(productId));
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        // Update total price
        cart.totalPrice += dish.price * quantity;

        // Save the updated cart
        await cart.save();

        // Recalculate itemCount and kitchenCount for the user
        const allCarts = await Cart.find({ userId: req.user.id });
        const totalItems = allCarts.reduce((total, kitchenCart) => {
            return total + kitchenCart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        const kitchenCount = allCarts.length; // Number of kitchens in the user's cart

        // Send back the updated cart summary
        res.status(200).json({
            message: 'Item added to cart',
            cartSummary: {
                itemCount: totalItems,
                kitchenCount: kitchenCount
            }
        });
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// 2. Get Cart
exports.getCart = async (req, res, next) => {
    const { id: userId } = req.user; // Assuming req.user has user details

    try {
        // Find all carts for the user (userId), potentially from multiple kitchens
        const carts = await Cart.find({ userId }).populate({
            path: 'items.productId',  // Populate the dish details
            select: 'name description imageUrls price'
        });

        if (!carts || carts.length === 0) {
            return res.status(404).json({ message: 'No items in cart' });
        }

        // For each cart, find the associated kitchen using the kitchenId
        const cartWithKitchens = await Promise.all(carts.map(async (cart) => {
            const kitchen = await Kitchen.findById(cart.kitchenId);
            if (!kitchen) {
                return { ...cart._doc, kitchenName: 'Unknown Kitchen' };  // Handle case where kitchen not found
            }
            return { ...cart._doc, kitchenName: kitchen.kitchen_name };  // Attach kitchen name to cart object
        }));

        // Send back all carts with associated kitchen information
        res.status(200).json({
            message: 'Cart retrieved successfully',
            carts: cartWithKitchens  // Array of carts, each with populated dish details and kitchen info
        });

    } catch (error) {
        console.error('Error in getCart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// 3. Update Cart Item Quantity
exports.updateCartItem = async (req, res, next) => {
    const { kitchenId, productId } = req.params;
    const { quantity } = req.body;
    const { id: userId } = req.user;  // Extract userId correctly

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    try {
        // Find the cart with the specified kitchenId and userId
        const cart = await Cart.findOne({ userId, kitchenId });

        if (!cart) {
            logger.debug(`Cart not found for userId: ${userId} and kitchenId: ${kitchenId}`);
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item in the cart by productId
        const item = cart.items.find(item => item.productId.equals(productId));
        if (!item) {
            logger.debug(`Item with productId: ${productId} not found in cart`);
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update the item's quantity
        item.quantity = quantity;

        // Recalculate the total price of the cart
        const dishes = await Dish.find({ _id: { $in: cart.items.map(i => i.productId) } });
        cart.totalPrice = cart.items.reduce((total, item) => {
            const dish = dishes.find(dish => dish._id.equals(item.productId));
            return total + (dish.price * item.quantity);
        }, 0);

        // Save the updated cart
        await cart.save();

        // Calculate updated item count across all kitchens
        const allUserCarts = await Cart.find({ userId });
        const totalItemCount = allUserCarts.reduce((total, userCart) => {
            return total + userCart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        // Return the cart summary (totalPrice and itemCount across all kitchens)
        res.status(200).json({
            message: 'Cart item updated',
            cartSummary: {
                totalPrice: cart.totalPrice,
                itemCount: totalItemCount
            }
        });

    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// 4. Remove Item from Cart
exports.removeCartItem = async (req, res, next) => {
    logger.debug('I am in the remove cart item Controller');
    const { kitchenId, productId } = req.params; // Extract both kitchenId and productId
    const { id: userId } = req.user; // Ensure userId is from req.user

    try {
        // Find the user's cart for the specific kitchen
        const cart = await Cart.findOne({ userId, kitchenId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the item to remove from the cart
        const itemIndex = cart.items.findIndex(item => item.productId._id.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Remove the item from the cart
        cart.items.splice(itemIndex, 1);

        // Recalculate the total price after the removal
        cart.totalPrice = cart.items.reduce((total, item) => {
            const itemPrice = item.productId.price || 0; // Fallback to 0 if price is undefined
            return total + item.quantity * itemPrice;
        }, 0);

        // Save the updated cart or delete it if it's empty
        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
        } else {
            await cart.save();
        }

        // Recalculate the total item count across all kitchens
        const allUserCarts = await Cart.find({ userId });
        const totalItemCount = allUserCarts.reduce((total, userCart) => {
            return total + userCart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        res.status(200).json({
            message: 'Item removed from cart',
            cartSummary: {
                totalPrice: cart.totalPrice,
                itemCount: totalItemCount
            }
        });
    } catch (error) {
        console.error('Error in removeCartItem:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// 5. Clear Cart for a specific kitchen
exports.clearCart = async (req, res, next) => {
    logger.debug('I am in the clear cart Controller');
    const { kitchenId } = req.params; // Get kitchenId from request params
    const { id: userId } = req.user;  // Get userId from req.user

    try {
        // Ensure kitchenId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(kitchenId)) {
            return res.status(400).json({ message: 'Invalid kitchenId format' });
        }

        // Find and remove the user's cart for the specific kitchen
        const result = await Cart.findOneAndDelete({ userId, kitchenId });
        if (!result) {
            return res.status(404).json({ message: 'Cart not found for this kitchen' });
        }

        // After removing the kitchen cart, calculate the total item count across all remaining kitchens
        const allCarts = await Cart.find({ userId });
        const totalItemCount = allCarts.reduce((total, cart) => {
            return total + cart.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        // Return the updated total item count (across all kitchens) after one kitchen cart is cleared
        res.status(200).json({
            message: 'Cart cleared for this kitchen',
            cartSummary: {
                itemCount: totalItemCount // Total item count across all kitchens after one is cleared
            }
        });
    } catch (error) {
        console.error('Error in clearCart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};






