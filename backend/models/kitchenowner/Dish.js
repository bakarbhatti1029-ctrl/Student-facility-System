const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dishSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrls: [{ type: String }],
    kitchenOwner: { type: Schema.Types.ObjectId, ref: 'KitchenOwner', required: true }, // Reference KitchenOwner
    category: { type: String, required: true },
    availability: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
