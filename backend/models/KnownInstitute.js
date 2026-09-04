const mongoose = require('mongoose');

// A self-growing cache of resolved university/college names → coordinates.
// Seeded once from utils/universityResolver.js's static list, then grows
// permanently every time a live geocode succeeds for a name nobody has
// searched before — so no one has to hand-maintain a list forever.
const knownInstituteSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.models.KnownInstitute || mongoose.model('KnownInstitute', knownInstituteSchema);
