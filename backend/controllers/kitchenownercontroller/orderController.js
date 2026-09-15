const Order = require('../../models/student/Order');
const Student = require('../../models/student/Student'); // Import the Student model
const Dish = require('../../models/kitchenowner/Dish');
const KitchenOwner = require('../../models/kitchenowner/Kitchenowner');
const stripe = require('../../config/stripe');
const sendEmail = require('../../utils/emailService');
const { sendPushToUser } = require('../../services/pushNotificationService');
const logger = require('../../utils/logger');

const ORDER_RESPONSE_MINUTES = Math.max(1, Number(process.env.ORDER_RESPONSE_MINUTES) || 10);
const getResponseDeadline = () => new Date(Date.now() + ORDER_RESPONSE_MINUTES * 60 * 1000);

async function notifyKitchenOwner(kitchenOwnerId, order) {
  try {
    await sendPushToUser(kitchenOwnerId, {
      title: 'New food order',
      body: `${order.customerName} placed a PKR ${order.totalPrice} order. Confirm within ${ORDER_RESPONSE_MINUTES} minutes.`,
      url: '/kitchen-owner/orders',
      tag: `order-${order._id}`,
    });
    const owner = await KitchenOwner.findById(kitchenOwnerId).select('email first_name kitchen_name');
    if (!owner?.email) return;
    await sendEmail(
      owner.email,
      `New SFS food order - respond within ${ORDER_RESPONSE_MINUTES} minutes`,
      `Hi ${owner.first_name}, a new paid order from ${order.customerName} has arrived for ${owner.kitchen_name}. Total: PKR ${order.totalPrice}. Please sign in and confirm it before ${order.responseDeadline.toLocaleString()}; otherwise it will be cancelled and refunded automatically.`
    );
  } catch (error) {
    logger.error('Kitchen notification email failed:', error.message);
  }
}

// Create order with an in-page Stripe PaymentIntent.
// This replaces the old hosted-Checkout-redirect flow, which relied on a
// publicly reachable webhook URL to ever mark an order as paid — something
// that does not exist on localhost during development, so orders were never
// actually confirmed and were instead marked 'paid' immediately at creation
// regardless of whether the customer completed payment.
exports.createOrder = async (req, res, next) => {
  try {
    const { kitchenOwnerId, kitchenName, deliveryAddress, dishes, paymentMethod, paymentMethodId } = req.body;

    const customerId = req.user.id;
    const student = await Student.findById(customerId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ message: 'No payment method was provided. Please re-enter your card details.' });
    }
    if (!dishes || dishes.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Recompute price/quantity server-side from the DB — never trust amounts
    // sent by the client (a tampered request could otherwise pay almost
    // nothing for a real order).
    const dbDishes = await Dish.find({ _id: { $in: dishes.map((d) => d.id) } });
    const dbDishById = new Map(dbDishes.map((d) => [d._id.toString(), d]));

    let totalPrice = 0;
    let totalQuantity = 0;
    const orderDishes = [];
    for (const dish of dishes) {
      const dbDish = dbDishById.get(String(dish.id));
      if (!dbDish) {
        return res.status(400).json({ message: 'One or more dishes in your cart are no longer available.' });
      }
      const quantity = Number(dish.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${dbDish.name}.` });
      }
      totalPrice += dbDish.price * quantity;
      totalQuantity += quantity;
      orderDishes.push({ dishId: dbDish._id, name: dbDish.name, quantity, price: dbDish.price });
    }

    const studentFullName = `${student.first_name} ${student.last_name}`;
    const studentAddress = student.address;

    // Create and confirm a PaymentIntent in one step — same pattern as hostel
    // bed booking. PKR uses minor units (paisas) in Stripe, so we multiply by 100
    // to convert from rupees to paisas: 8000 PKR = 800000 paisas.
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100),
        currency: 'pkr',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: `Order from ${kitchenName}`,
      });
    } catch (stripeError) {
      console.error('Stripe payment intent error (order):', stripeError.message);
      return res.status(402).json({
        message: stripeError.message || 'Payment was declined by Stripe. Please check your card details and try again.',
        code: stripeError.code,
      });
    }

    if (paymentIntent.status === 'requires_action') {
      // 3D Secure or similar extra authentication needed — order saved as
      // pending, frontend will confirm via stripe.confirmCardPayment and
      // then call /api/order/confirm-payment to finalize it.
      const pendingOrder = new Order({
        customerId,
        customerName: studentFullName,
        customerAddress: studentAddress,
        kitchenOwnerId,
        kitchenName,
        dishes: orderDishes,
        totalQuantity,
        totalPrice,
        paymentStatus: 'pending',
        paymentMethod,
        deliveryAddress,
        status: 'placed',
        responseDeadline: getResponseDeadline(),
        stripePaymentIntentId: paymentIntent.id,
      });
      await pendingOrder.save();

      return res.status(200).json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        orderId: pendingOrder._id,
      });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({
        message: `Payment was not completed (status: ${paymentIntent.status}). Please try again.`,
      });
    }

    // Payment succeeded immediately — create the order as paid and notify the kitchen now
    const newOrder = new Order({
      customerId,
      customerName: studentFullName,
      customerAddress: studentAddress,
      kitchenOwnerId,
      kitchenName,
      dishes: orderDishes,
      totalQuantity,
      totalPrice,
      paymentStatus: 'paid',
      paymentMethod,
      deliveryAddress,
      status: 'placed',
      responseDeadline: getResponseDeadline(),
      stripePaymentIntentId: paymentIntent.id,
    });

    await newOrder.save();

    const io = req.app.get('io');
    // Shape customerId the same way getOrdersForKitchen's populate does, so
    // the kitchen owner's UI can read order.customerId.phone_number whether
    // the order arrived via a page load or this live socket event.
    io.to(`room-kitchen${kitchenOwnerId}`).emit('newOrder', {
      ...newOrder.toObject(),
      customerId: { _id: customerId, phone_number: student.phone_number },
    });
    await notifyKitchenOwner(kitchenOwnerId, newOrder);

    res.status(201).json({ success: true, requiresAction: false, order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

// Called by the frontend after stripe.confirmCardPayment() succeeds for an
// order that initially required extra authentication (3D Secure etc).
exports.confirmOrderPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to confirm this order' });
    }

    // Re-verify the actual PaymentIntent status with Stripe rather than
    // trusting the frontend's word that the payment succeeded.
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ message: 'Payment has not succeeded yet.' });
    }

    order.paymentStatus = 'paid';
    order.responseDeadline = getResponseDeadline();
    await order.save();

    const io = req.app.get('io');
    const student = await Student.findById(order.customerId, 'phone_number');
    io.to(`room-kitchen${order.kitchenOwnerId}`).emit('newOrder', {
      ...order.toObject(),
      customerId: { _id: order.customerId, phone_number: student?.phone_number },
    });
    await notifyKitchenOwner(order.kitchenOwnerId, order);

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error confirming order payment:', error);
    next(error);
  }
};

// Update order status and emit to user room
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.kitchenOwnerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (order.status === 'Cancelled') {
      return res.status(409).json({ message: 'This order has already been cancelled.' });
    }
    if (order.status === 'placed' && order.responseDeadline && new Date() > order.responseDeadline) {
      return res.status(409).json({ message: 'This order has expired and can no longer be accepted.' });
    }

    order.status = req.body.status;
    if (req.body.status === 'Confirm Order' && !order.acceptedAt) order.acceptedAt = new Date();
    await order.save();

    const io = req.app.get('io'); // Get Socket.IO instance

    // Emit event to the user room
    io.to(`room-user${order.customerId}`).emit('orderUpdate', order);
    sendPushToUser(order.customerId, {
      title: `Food order: ${order.status}`,
      body: `${order.kitchenName} updated your order to ${order.status}.`,
      url: '/profile', tag: `order-${order._id}`,
    }).catch(error => logger.error('Customer order push failed:', error.message));

    res.status(200).send({ message: "Order updated successfully", order });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersForKitchen = async (req, res, next) => {
  try {
    if (req.user.role !== 'kitchenOwner') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const orders = await Order.find({ kitchenOwnerId: req.user.id })
      .populate('customerId', 'phone_number');
    res.status(200).send(orders);
  } catch (error) {
    next(error); // Use next to handle errors
  }
};

exports.getOrdersForCustomer = async (req, res, next) => {
  logger.debug('Hi from getOrdersForCustomer');
  try {
    const customerId = req.user.id; // Extract from JWT token
    const orders = await Order.find({ customerId });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this customer." });
    }
    res.status(200).json(orders);
  } catch (error) {
    next(error); // Handle errors
  }
};

// Mirrors getMonthlyBookingStats on the hostel side: always returns all 12
// months of the current year (zero-filled), not just months that had
// orders, so the chart shows the same full-year shape on both dashboards.
exports.getMonthlyOrderStats = async (req, res, next) => {
    try {
        const kitchenOwnerId = req.user.id;
        const year = new Date().getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const startOfNextYear = new Date(year + 1, 0, 1);

        const orders = await Order.find({
            kitchenOwnerId,
            status: 'Completed',
            orderPlacedAt: { $gte: startOfYear, $lt: startOfNextYear },
        }).select('orderPlacedAt').lean();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const counts = new Array(12).fill(0);
        orders.forEach((order) => {
            const monthIndex = new Date(order.orderPlacedAt).getMonth();
            counts[monthIndex] += 1;
        });

        const data = monthNames.map((month, i) => ({ month, orders: counts[i] }));

        res.status(200).json({ success: true, year, data });
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    const isOwningCustomer = order.customerId.toString() === req.user.id;
    const isOwningKitchen = order.kitchenOwnerId.toString() === req.user.id;
    if (!isOwningCustomer && !isOwningKitchen) {
      return res.status(403).json({ message: 'Not authorized to delete this order' });
    }
    await Order.findByIdAndDelete(req.params.orderId);
    res.status(200).send({ message: "Order deleted successfully" });
  } catch (error) {
    next(error); // Use next to handle errors
  }
};
