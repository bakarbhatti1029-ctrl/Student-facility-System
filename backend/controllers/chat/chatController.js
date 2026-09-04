// controllers/chatController.js

const Chat = require('../../models/chat/chatModel');
const Order = require('../../models/student/Order');

exports.getMessages = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isCustomer = order.customerId.toString() === req.user.id;
        const isKitchen = order.kitchenOwnerId.toString() === req.user.id;
        if (!isCustomer && !isKitchen) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        const chat = await Chat.findOne({ orderId: req.params.orderId });
        res.json(chat ? chat.messages : []); // Return only messages array
    } catch (error) {
        next(error);
    }
};

