// Seeds and repairs the curated campus-location cache.
// Standalone: node seedKnownInstitutes.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const KnownInstitute = require('./models/KnownInstitute');
const {
  universityDatabase,
  seededUniversityDatabase,
} = require('./utils/universityResolver');

async function seedKnownInstitutes() {
  try {
    const entries = Object.entries(seededUniversityDatabase);
    const verifiedKeys = new Set(entries.map(([key]) => key));
    const retiredLegacyKeys = Object.keys(universityDatabase)
      .filter(key => !verifiedKeys.has(key));

    // Delete only keys that came from the old bundled static list. Records
    // learned later through live geocoding are not touched.
    await KnownInstitute.deleteMany({ key: { $in: retiredLegacyKeys } });

    await KnownInstitute.bulkWrite(entries.map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, name: value.name, lat: value.lat, lng: value.lng } },
        upsert: true,
      },
    })));

    console.log(`Upserted ${entries.length} verified campus names and aliases into KnownInstitute.`);
  } catch (error) {
    console.error('Error seeding KnownInstitute:', error.message);
  }
}

module.exports = seedKnownInstitutes;

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
