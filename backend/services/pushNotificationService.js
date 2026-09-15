const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger');

const configured = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT
);

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  logger.error('Web Push is disabled: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT are required.');
}

async function sendPushToUser(userId, payload) {
  if (!configured || !userId) return;
  const subscriptions = await PushSubscription.find({ userId: String(userId) });
  await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }, JSON.stringify(payload), { TTL: 60 * 60 });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
        return;
      }
      logger.error(`Push delivery failed for ${userId}:`, error.message);
    }
  }));
}

module.exports = { configured, sendPushToUser };
