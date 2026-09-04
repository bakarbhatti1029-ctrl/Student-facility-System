// models/chat/chatModel.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    kitchenId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Kitchen'
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    messages: [messageSchema] // Store messages as an array of messageSchema
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
