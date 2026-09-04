const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  customerName: { type: String, required: true },  // Name of the customer
  customerAddress: { type: String, required: true },  // Address of the customer
  kitchenOwnerId: { type: Schema.Types.ObjectId, ref: 'KitchenOwner', required: true },
  kitchenName: { type: String, required: true },  // Name of the kitchen
  dishes: [
    {
      dishId: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },  // Reference to the dish
      name: { type: String, required: true },  // Dish name
      quantity: { type: Number, required: true },  // Quantity of the dish
      price: { type: Number, required: true }  // Price of the dish
    }
  ],
  totalQuantity: { type: Number, required: true },  // Total quantity of dishes ordered
  totalPrice: { type: Number, required: true },  // Total price for the order
  status: {
    type: String,
    // NOTE: these values match exactly what the backend (orderController.js) and the
    // kitchen-owner UI (KitchenOwnersOrder.js "steps" array) actually read/write today.
    // Previously this enum used lowercase single words that the app never wrote,
    // so enum validation was silently skipped on findByIdAndUpdate. Fixed to reflect
    // reality so runValidators:true can safely be enabled in the future.
    enum: ['placed', 'Confirm Order', 'Preparing Order', 'Delivered', 'Completed'],
    default: 'placed',
    required: true
  },  // Order status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
    required: true
  },  // Payment status
  paymentMethod: { type: String, required: true },  // e.g., 'Stripe'
  stripePaymentIntentId: { type: String },  // Used to verify payment status server-side
  deliveryAddress: { type: String, required: true },  // Address for delivery
  orderPlacedAt: { type: Date, default: Date.now, required: true },  // Date when the order was placed
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
