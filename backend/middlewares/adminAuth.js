const jwt = require('jsonwebtoken');
const Admin = require('../models/admin/Admin');

// Allows both admin and super_admin
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Admin access required.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Attach full admin object so controllers can access req.admin._id, req.admin.role
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) return res.status(401).json({ message: 'Admin not found.' });

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Only super_admin can access
const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

module.exports = { adminAuth, superAdminOnly };
