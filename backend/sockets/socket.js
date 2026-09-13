const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('../models/chat/chatModel');
const Order = require('../models/student/Order');
const logger = require('../utils/logger');

const connectSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN
        ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000'],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  // Every connection must present a valid JWT (same one used for REST auth) —
  // without this, anyone could connect anonymously and join/read/write any
  // order's chat or notification room.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected:', socket.id, socket.user?.id);

    // A socket may only join its own notification room, or an order's chat
    // room it's actually a participant in — never someone else's.
    socket.on('joinUserRoom', (userId) => {
      if (String(userId) !== String(socket.user.id)) return;
      socket.join(`room-user${userId}`);
    });

    socket.on('joinKitchenRoom', (kitchenId) => {
      if (String(kitchenId) !== String(socket.user.id)) return;
      socket.join(`room-kitchen${kitchenId}`);
    });

    socket.on('updateOrderStatus', (data) => {
      if (socket.user.role !== 'kitchenOwner' || !data?.userId) return;
      io.to(`room-user${data.userId}`).emit('orderUpdate', data);
    });

    // Join order-specific room — only if the connected user is actually the
    // customer or kitchen owner on that order.
    socket.on('joinOrderRoom', async ({ orderId }) => {
      try {
        if (!orderId) return;
        const order = await Order.findById(orderId);
        if (!order) return socket.emit('error', 'Order not found');

        const isCustomer = order.customerId.toString() === socket.user.id;
        const isKitchen = order.kitchenOwnerId.toString() === socket.user.id;
        if (!isCustomer && !isKitchen) {
          return socket.emit('error', 'Not authorized for this order chat');
        }

        socket.join(`order-${orderId}`);
      } catch (error) {
        socket.emit('error', 'Failed to join order room');
      }
    });

    // Handle chat messages. userId/kitchenId are derived from the order
    // itself (not trusted from the client) so a connected socket can't
    // impersonate the other party in the conversation.
    socket.on('sendMessage', async ({ orderId, message }) => {
      try {
        if (!orderId || typeof message !== 'string' || !message.trim()) {
          return socket.emit('error', 'orderId and message are required');
        }

        const order = await Order.findById(orderId);
        if (!order) return socket.emit('error', 'Order not found');

        const isCustomer = order.customerId.toString() === socket.user.id;
        const isKitchen = order.kitchenOwnerId.toString() === socket.user.id;
        if (!isCustomer && !isKitchen) {
          return socket.emit('error', 'Not authorized for this order chat');
        }

        const newMessage = {
          userId: socket.user.id,
          kitchenId: order.kitchenOwnerId,
          message: message.trim(),
          timestamp: new Date(),
        };

        // Update the chat document or create a new one if it doesn't exist
        await Chat.findOneAndUpdate(
          { orderId },
          { $push: { messages: newMessage } },
          { new: true, upsert: true }
        );

        // Emit the new message to the specific room
        socket.to(`order-${orderId}`).emit('receiveMessage', newMessage);
      } catch (error) {
        logger.error('Failed to send message:', error.message);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = connectSocket;
