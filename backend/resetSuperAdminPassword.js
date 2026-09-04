// =====================================================================
// resetSuperAdminPassword.js
// Run on server if super admin password is leaked/forgotten.
// No credentials are stored in this file — pass them as arguments:
//
//   Usage:  node resetSuperAdminPassword.js <email> <newPassword>
//   Example: node resetSuperAdminPassword.js admin@example.com "MyStr0ng!Pass"
// =====================================================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const Admin    = require('./models/admin/Admin');

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node resetSuperAdminPassword.js <email> <newPassword>');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('New password must be at least 8 characters.');
  process.exit(1);
}

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await Admin.findOne({ email, role: 'super_admin' });
    if (!admin) {
      console.error(`No super_admin found with email: ${email}`);
      process.exit(1);
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    console.log(`✅ Password reset for super_admin: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
