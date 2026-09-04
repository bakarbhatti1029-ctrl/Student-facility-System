// backend/seedKnownInstitutes.js
// Safe to run multiple times — no-ops once any KnownInstitute docs exist.
// Standalone: node seedKnownInstitutes.js
// Auto: called from server.js via mongoose 'open' event, alongside seedDummyData.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const KnownInstitute = require('./models/KnownInstitute');
const { universityDatabase } = require('./utils/universityResolver');

async function seedKnownInstitutes() {
  try {
    const existingCount = await KnownInstitute.countDocuments();
    if (existingCount > 0) {
      console.log(`KnownInstitute already seeded (${existingCount} docs) — skipping.`);
      return;
    }

    const docs = Object.entries(universityDatabase).map(([key, value]) => ({
      key,
      name: value.name,
      lat: value.lat,
      lng: value.lng,
    }));

    await KnownInstitute.insertMany(docs, { ordered: false });
    console.log(`Seeded KnownInstitute with ${docs.length} entries from universityResolver.js.`);
  } catch (error) {
    console.error('Error seeding KnownInstitute:', error.message);
  }
}

module.exports = seedKnownInstitutes;

// Allow standalone execution: node seedKnownInstitutes.js
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      await seedKnownInstitutes();
      process.exit(0);
    })
    .catch((err) => {
      console.error('DB connection failed:', err.message);
      process.exit(1);
    });
}
