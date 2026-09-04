// orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/kitchenownercontroller/orderController');
const authenticateToken = require('../../middlewares/AuthToken');  // Ensure the user is authenticated



// POST request to create a new order
router.post('/create',authenticateToken, orderController.createOrder);

// POST request to confirm payment after 3D Secure authentication
router.post('/confirm-payment', authenticateToken, orderController.confirmOrderPayment);

// GET request to retrieve orders for a kitchen owner
router.get('/kitchen',authenticateToken, orderController.getOrdersForKitchen);
router.get('/monthly-stats', authenticateToken, orderController.getMonthlyOrderStats);
router.patch('/update/:orderId', authenticateToken, orderController.updateOrderStatus);

// GET request to retrieve orders for a customer
router.get('/customer',authenticateToken, orderController.getOrdersForCustomer);

// DELETE request to delete an order
router.delete('/delete/:orderId',authenticateToken, orderController.deleteOrder);

module.exports = router;
