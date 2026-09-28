const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admincontroller/controller');
const { adminAuth, superAdminOnly } = require('../../middlewares/adminAuth');

// ── Public routes (no auth) ───────────────────────────────────────────
router.post('/register', ctrl.registerAdmin);
router.post('/login', ctrl.loginAdmin);
router.post('/forgot-password', ctrl.requestAdminPasswordReset);
router.post('/verify-password-reset-otp', ctrl.verifyAdminPasswordResetOtp);
router.patch('/reset-password', ctrl.resetAdminPassword);
router.post('/resend-superadmin-verification', ctrl.resendSuperAdminVerification);
router.post('/verify-superadmin', ctrl.verifySuperAdmin);

// ── All routes below require valid admin JWT ──────────────────────────
router.use(adminAuth);
router.get('/me', (req, res) => res.json({ admin: req.admin }));

// Change own password (any logged-in admin including super_admin)
router.patch('/change-password', ctrl.changeOwnPassword);

// Update own profile picture (any logged-in admin including super_admin)
router.patch('/profile-picture', ctrl.updateOwnProfilePicture);

// Dashboard statistics
router.get('/stats', ctrl.getDashboardStats);
router.get('/growth-stats', ctrl.getMonthlyGrowthStats);

// Student management
router.get('/students', ctrl.getStudents);
router.delete('/students/:id', ctrl.deleteStudent);
router.patch('/students/:id/ban', ctrl.banStudent);
router.patch('/students/:id/unban', ctrl.unbanStudent);

// Hostel Owner management
router.get('/hostel-owners', ctrl.getHostelOwners);
router.patch('/hostel-owners/:id/approve', ctrl.approveHostelOwner);
router.delete('/hostel-owners/:id/reject', ctrl.rejectHostelOwner);
router.patch('/hostel-owners/:id/ban', ctrl.banHostelOwner);
router.patch('/hostel-owners/:id/unban', ctrl.unbanHostelOwner);
router.delete('/hostel-owners/:id', ctrl.deleteHostelOwner);

// Kitchen Owner management
router.get('/kitchen-owners', ctrl.getKitchenOwners);
router.patch('/kitchen-owners/:id/approve', ctrl.approveKitchenOwner);
router.delete('/kitchen-owners/:id/reject', ctrl.rejectKitchenOwner);
router.patch('/kitchen-owners/:id/ban', ctrl.banKitchenOwner);
router.patch('/kitchen-owners/:id/unban', ctrl.unbanKitchenOwner);
router.delete('/kitchen-owners/:id', ctrl.deleteKitchenOwner);

// Hostel management
router.get('/hostels', ctrl.getAllHostels);
router.delete('/hostels/:id', ctrl.removeHostel);

// Kitchen management
router.get('/kitchens', ctrl.getAllKitchens);
router.delete('/kitchens/:id', ctrl.removeKitchen);

// ── Super Admin only routes ───────────────────────────────────────────
router.post('/verify-new-admin', superAdminOnly, ctrl.verifyNewAdmin);
router.get('/list', superAdminOnly, ctrl.listMiniAdmins);
router.delete('/:id/delete', superAdminOnly, ctrl.deleteMiniAdmin);
router.patch('/:id/reset-password', superAdminOnly, ctrl.resetMiniAdminPassword);

module.exports = router;
