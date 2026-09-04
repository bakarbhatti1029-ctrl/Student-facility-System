const mongoose = require('mongoose');

// A review is written by a student about a whole hostel or a whole kitchen
// (not an individual room/dish). target_id points at the HostelOwner document
// (for hostels) or the KitchenOwner document (for kitchens) — the same _id the
// detail pages already use. review_text is optional so a student can leave a
// star-only rating. A student can only have ONE review per place (enforced by
// the unique index below); posting again updates their existing review.
const reviewSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    target_type: { type: String, enum: ['hostel', 'kitchen'], required: true },
    target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review_text: { type: String, default: '', trim: true, maxlength: 1000 },
}, { timestamps: true });

// One review per student per place (prevents spam; allows editing your own).
reviewSchema.index({ student_id: 1, target_type: 1, target_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
