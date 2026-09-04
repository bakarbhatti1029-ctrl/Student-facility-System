const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenOwner', required: true },  // Optional for multi-kitchen support
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true }, // Use 'Dish' here instead of 'Product'
            quantity: { type: Number, required: true }
        }
    ],
    totalPrice: { type: Number, required: true, default: 0 }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
