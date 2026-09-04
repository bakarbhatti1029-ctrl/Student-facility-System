// Minimal logger wrapper.
// Replaces scattered `console.log` debug calls across controllers.
// - debug(): only prints outside production (or when DEBUG_LOGS=true), so
//   Render/production logs stay clean and don't accidentally leak request
//   bodies, tokens, or emails into a log aggregator.
// - error(): always prints — errors should never be silenced.
const isDebugEnabled = process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true';

module.exports = {
  debug: (...args) => {
    if (isDebugEnabled) console.log(...args);
  },
  error: (...args) => console.error(...args),
};
