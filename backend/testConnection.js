const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();  // 🛑 Very important

console.log('Connecting to MongoDB URI:', process.env.MONGODB_URI); // Debug print

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB connection successful ✅');
  process.exit(0); // Exit after success
})
.catch((error) => {
  console.error('MongoDB connection error ❌:', error);
  process.exit(1); // Exit after error
});
