const Stripe = require('stripe');

// ─────────────────────────────────────────────────────────────────────
// STRIPE_MOCK mode — for LOCAL TESTING ONLY.
//
// If Stripe is unreachable from your network (e.g. IP/region blocks),
// set STRIPE_MOCK=true in backend/.env to simulate successful payments
// so you can test everything that happens AFTER payment (order tracking,
// chat, reviews, bookings).
//
// Safety: mock mode is HARD-DISABLED in production. Even if the flag is
// accidentally set on Render, real Stripe is used when NODE_ENV=production.
// ─────────────────────────────────────────────────────────────────────
const MOCK_ENABLED =
  process.env.STRIPE_MOCK === 'true' && process.env.NODE_ENV !== 'production';

let stripe;

if (MOCK_ENABLED) {
  console.warn('');
  console.warn('⚠️  ⚠️  ⚠️  STRIPE_MOCK=true — PAYMENTS ARE SIMULATED  ⚠️  ⚠️  ⚠️');
  console.warn('    No real Stripe calls are made. Every payment "succeeds".');
  console.warn('    For local testing only. Remove the flag to use real Stripe.');
  console.warn('');

  const intents = new Map();

  const makeIntent = (params = {}) => ({
    id: 'pi_mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    object: 'payment_intent',
    status: 'succeeded',
    amount: params.amount ?? 0,
    currency: params.currency || 'pkr',
    payment_method: params.payment_method || 'pm_mock',
    description: params.description || '',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
  });

  stripe = {
    paymentIntents: {
      create: async (params) => {
        const pi = makeIntent(params);
        intents.set(pi.id, pi);
        console.log(`[StripeMock] payment_intent created: ${pi.id} (${pi.amount} ${pi.currency})`);
        return pi;
      },
      retrieve: async (id) => {
        return intents.get(id) || { ...makeIntent(), id, status: 'succeeded' };
      },
    },
    refunds: {
      create: async ({ payment_intent }) => ({
        id: 're_mock_' + Date.now(),
        object: 'refund',
        payment_intent,
        status: 'succeeded',
      }),
    },
  };
} else {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });
}

module.exports = stripe;
