const Order = require('../models/student/Order');
const Booking = require('../models/student/Booking');
const Bed = require('../models/hostelowner/RoomBed');
const Student = require('../models/student/Student');
const stripe = require('../config/stripe');
const sendEmail = require('../utils/emailService');
const logger = require('../utils/logger');
const { sendPushToUser } = require('./pushNotificationService');

async function refundPayment(paymentIntentId, key) {
  if (!paymentIntentId) return;
  await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey: `sfs-auto-expiry-${key}` }
  );
}

async function expireFoodOrders(io, now) {
  const orders = await Order.find({ status: 'placed', responseDeadline: { $lte: now } });
  for (const order of orders) {
    try {
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, status: 'placed' }, { status: 'Expiring' }, { new: true }
      );
      if (!claimed) continue;
      if (order.paymentStatus === 'paid') {
        await refundPayment(order.stripePaymentIntentId, `order-${order._id}`);
      }
      const updated = await Order.findOneAndUpdate(
        { _id: order._id, status: 'Expiring' },
        {
          status: 'Cancelled',
          paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
          cancelledAt: now,
          cancellationReason: 'Kitchen did not confirm within the response time.',
        },
        { new: true }
      );
      if (!updated) continue;
      io.to(`room-user${order.customerId}`).emit('orderUpdate', updated);
      await sendPushToUser(order.customerId, {
        title: 'Food order cancelled',
        body: `${order.kitchenName} did not confirm in time. Your payment has been refunded.`,
        url: '/profile', tag: `order-${order._id}`,
      });
      const student = await Student.findById(order.customerId).select('email first_name');
      if (student?.email) {
        await sendEmail(student.email, 'Your SFS food order expired',
          `Hi ${student.first_name}, ${order.kitchenName} did not confirm your order in time. It has been cancelled${order.paymentStatus === 'paid' ? ' and your card payment has been refunded' : ''}.`);
      }
    } catch (error) {
      await Order.updateOne({ _id: order._id, status: 'Expiring' }, { status: 'placed' }).catch(() => {});
      logger.error(`Could not expire order ${order._id}:`, error.message);
    }
  }
}

async function expireHostelBookings(io, now) {
  const bookings = await Booking.find({ status: 'Pending', response_deadline: { $lte: now } });
  for (const booking of bookings) {
    try {
      const claimed = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'Pending' }, { status: 'Expiring' }, { new: true }
      );
      if (!claimed) continue;
      const bed = booking.bed_id ? await Bed.findById(booking.bed_id) : null;
      if (bed?.paymentStatus === 'completed') {
        await refundPayment(bed.paymentIntentId, `booking-${booking._id}`);
      }
      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'Expiring' },
        { status: 'Rejected', decided_at: now, payment_status: bed?.paymentStatus === 'completed' ? 'refunded' : booking.payment_status },
        { new: true }
      );
      if (!updated) continue;
      if (bed) {
        bed.isBooked = false;
        bed.bookingStatus = null;
        bed.bookedBy = null;
        bed.bookingDate = null;
        if (bed.paymentStatus === 'completed') bed.paymentStatus = 'refunded';
        await bed.save();
      }
      io.to(`room-user${booking.student_id}`).emit('bookingUpdate', updated);
      await sendPushToUser(booking.student_id, {
        title: 'Hostel request expired',
        body: 'The hostel did not respond in time. The bed was released and your payment was refunded.',
        url: '/profile', tag: `booking-${booking._id}`,
      });
      const student = await Student.findById(booking.student_id).select('email first_name');
      if (student?.email) {
        await sendEmail(student.email, 'Your SFS hostel request expired',
          `Hi ${student.first_name}, the hostel owner did not respond within the allowed time. Your request was cancelled, the bed was released, and any completed card payment was refunded.`);
      }
    } catch (error) {
      await Booking.updateOne({ _id: booking._id, status: 'Expiring' }, { status: 'Pending' }).catch(() => {});
      logger.error(`Could not expire booking ${booking._id}:`, error.message);
    }
  }
}

function startRequestExpiryWorker(io) {
  const run = async () => {
    const now = new Date();
    await Promise.all([expireFoodOrders(io, now), expireHostelBookings(io, now)]);
  };
  run().catch(error => logger.error('Request expiry worker failed:', error.message));
  const timer = setInterval(() => run().catch(error => logger.error('Request expiry worker failed:', error.message)), 60 * 1000);
  timer.unref();
}

module.exports = startRequestExpiryWorker;
