const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeCartItem, clearCart } = require('../../controllers/kitchenownercontroller/cartController');  // Import the controller
const authenticateToken = require('../../middlewares/AuthToken');  // Ensure the user is authenticated

// Route to add an item to the cart (POST)
router.post('/addItem', authenticateToken, addToCart);

// Route to get the user's cart (GET)
router.get('/getItem', authenticateToken, getCart);

// Route to update the quantity of a cart item (PUT)
router.put('/updateItem/:kitchenId/:productId', authenticateToken, updateCartItem);

// Route to remove an item from the cart (DELETE)
router.delete('/:kitchenId/:productId', authenticateToken, removeCartItem);

// Route to clear the entire cart (DELETE)
router.delete('/:kitchenId', authenticateToken, clearCart);

module.exports = router;
