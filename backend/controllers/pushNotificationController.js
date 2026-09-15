const PushSubscription = require('../models/PushSubscription');
const { configured } = require('../services/pushNotificationService');

exports.getPublicKey = (req, res) => {
  if (!configured) return res.status(503).json({ message: 'Push notifications are not configured.' });
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'A valid push subscription is required.' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: String(req.user.id), role: req.user.role, endpoint, keys },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) await PushSubscription.deleteOne({ endpoint, userId: String(req.user.id) });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
