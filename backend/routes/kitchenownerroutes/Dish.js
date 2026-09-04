const express = require('express');
const router = express.Router();
const dishController = require('../../controllers/kitchenownercontroller/dishController');
const authMiddleware = require('../../middlewares/AuthToken');

// Dish routes with authentication middleware

// Create a new dish
router.post('/createDish', authMiddleware, dishController.createDish);

// Get all dishes
router.get('/getAllDishes', authMiddleware, dishController.getDishes);

// Get a single dish by ID
router.get('/getDish/:id', authMiddleware, dishController.getDishById);

// Update a dish by ID
router.put('/updateDish/:id', authMiddleware, dishController.updateDish);

// Delete a dish by ID
router.delete('/deleteDish/:id', authMiddleware, dishController.deleteDish);

module.exports = router;
