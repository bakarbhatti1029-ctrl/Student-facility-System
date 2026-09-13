const Student = require('../../models/student/Student');
const Admin = require('../../models/admin/Admin');
const PendingRegistration = require('../../models/PendingRegistration');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const sendEmail = require('../../utils/emailService');
const { generateVerificationToken, maxTokenTime } = require('../../utils/Utils');

exports.registerAdmin = async (req, res) => {
    try {
        const { first_name, last_name, email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        // Check if any admin exists yet
        const adminCount = await Admin.countDocuments();

        let role;

        if (adminCount === 0) {
            // First ever admin → automatically becomes super_admin, no token needed
            role = 'super_admin';
        } else {
            // Subsequent admins → must be created by a super_admin (check token)
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: "Only super_admin can create new admins. Provide a super_admin token." });
            }

            const jwt = require('jsonwebtoken');
            const token = authHeader.split(' ')[1];
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (e) {
                return res.status(401).json({ message: "Invalid or expired token." });
            }

            if (decoded.role !== 'super_admin') {
                return res.status(403).json({ message: "Only super_admin can create new admins." });
            }

            // Check mini admin limit (max 4)
            const miniAdminCount = await Admin.countDocuments({ role: 'admin' });
            if (miniAdminCount >= 4) {
                return res.status(400).json({ message: "Maximum 4 mini admins allowed." });
            }

            role = 'admin';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Mini admins must verify their email before the account is created —
        // proves the email is real/reachable instead of trusting whatever the
        // super admin typed in. The super_admin bootstrap path above (first
        // admin ever) is unaffected — that one still goes live immediately,
        // matching the documented Postman-based first-time setup.
        if (role === 'admin') {
            const otp = generateVerificationToken();
            const otpString = otp.toString();

            // Atomic upsert (avoids the same email-uniqueness race condition
            // fixed earlier in student/owner registration).
            await PendingRegistration.findOneAndUpdate(
                { email },
                {
                    email,
                    role: 'admin',
                    registrationData: { first_name, last_name, email, password: hashedPassword, role: 'admin' },
                    verification_token: otpString,
                    verification_token_time: maxTokenTime(),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            try {
                await sendEmail(
                    email,
                    'Verify Your SFS Admin Account',
                    `A Student Facility System admin account is being created for ${email}.\n\nVerification code: ${otpString}\n\nGive this code to the super admin who is setting up your account (or enter it yourself if you're doing this from the dashboard). If you didn't expect this, you can ignore this email.`
                );
            } catch (emailError) {
                await PendingRegistration.findOneAndDelete({ email, role: 'admin' });
                return res.status(500).json({
                    message: "Failed to send verification email. Please try again.",
                    error: emailError.message
                });
            }

            return res.status(200).json({
                message: `Verification code sent to ${email}. Enter it to confirm and activate this admin account.`,
                requiresVerification: true,
                email,
            });
        }

        const admin = new Admin({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role,
        });

        await admin.save();

        res.status(201).json({
            message: 'Super Admin registered successfully',
            role,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Verify a mini admin's email and finalize account creation ─────────
// (super_admin only — the OTP proves the entered email is real/reachable)
exports.verifyNewAdmin = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and verification code are required." });
        }

        const pendingRegistration = await PendingRegistration.findOne({
            email,
            role: 'admin',
            verification_token: otp.toString(),
            verification_token_time: { $gt: new Date() }
        });

        if (!pendingRegistration) {
            return res.status(400).json({ message: "Invalid or expired code. Please create the admin again." });
        }

        const miniAdminCount = await Admin.countDocuments({ role: 'admin' });
        if (miniAdminCount >= 4) {
            await PendingRegistration.findByIdAndDelete(pendingRegistration._id);
            return res.status(400).json({ message: "Maximum 4 mini admins allowed." });
        }

        const admin = new Admin({ ...pendingRegistration.registrationData, email_verified: true });
        await admin.save();
        await PendingRegistration.findByIdAndDelete(pendingRegistration._id);

        res.status(201).json({
            message: `Admin ${admin.first_name} ${admin.last_name} verified and created successfully.`,
            admin: {
                _id: admin._id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Sign token with actual role from DB (super_admin or admin)
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            admin: {
                _id: admin._id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all hostel owners
exports.getHostelOwners = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const hostelOwners = await Hostelowner.find().select('-password');
        res.status(200).json(hostelOwners);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all kitchen owners
exports.getKitchenOwners = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const kitchenOwners = await Kitchenowner.find().select('-password');
        res.status(200).json(kitchenOwners);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all hostels (returns HostelOwner records which represent the hostel listings)
exports.getAllHostels = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const hostels = await Hostelowner.find({ isApproved: true }).select(
            'owner_id first_name last_name email phone_number hostel_name hostel_picture hostel_type hostel_address hostel_description facilities nearby_institutes rooms isApproved isBanned status createdAt'
        ).populate({
            path: 'rooms',
            select: 'name capacity price availability description imageUrls beds',
            populate: { path: 'beds', select: 'bed_number isBooked bookingStatus paymentStatus' }
        });
        // Map fields to match frontend expectations
        const mapped = hostels.map(h => ({
            _id: h._id,
            hostelName: h.hostel_name,
            hostelPicture: h.hostel_picture,
            hostelType: h.hostel_type,
            hostel_owner_id: {
                first_name: h.first_name,
                last_name: h.last_name,
                email: h.email,
                phone_number: h.phone_number,
                owner_id: h.owner_id,
            },
            address: h.hostel_address,
            description: h.hostel_description,
            facilities: h.facilities,
            nearbyInstitutes: h.nearby_institutes,
            rooms: h.rooms,
            createdAt: h.createdAt,
        }));
        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all kitchens
exports.getAllKitchens = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const kitchens = await Kitchenowner.find({ isApproved: true })
            .select('provider_id first_name last_name email phone_number kitchen_name address kitchen_description kitchen_picture dishes isApproved isBanned status createdAt')
            .populate('dishes', 'name description price imageUrls category availability');
        res.status(200).json(kitchens);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Approve Hostel Owner Registration
exports.approveHostelOwner = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const { id } = req.params;

        const hostelOwner = await Hostelowner.findById(id);
        if (!hostelOwner) {
            return res.status(404).json({ message: "Hostel owner not found" });
        }

        hostelOwner.isApproved = true;
        hostelOwner.status = 'active';
        await hostelOwner.save();

        res.status(200).json({ message: "Hostel owner approved successfully", hostelOwner });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reject Hostel Owner Registration
exports.rejectHostelOwner = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const { id } = req.params;

        const hostelOwner = await Hostelowner.findByIdAndDelete(id);
        if (!hostelOwner) {
            return res.status(404).json({ message: "Hostel owner not found" });
        }

        res.status(200).json({ message: "Hostel owner registration rejected and deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Approve Kitchen Owner Registration
exports.approveKitchenOwner = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const { id } = req.params;

        const kitchenOwner = await Kitchenowner.findById(id);
        if (!kitchenOwner) {
            return res.status(404).json({ message: "Kitchen owner not found" });
        }

        kitchenOwner.isApproved = true;
        kitchenOwner.status = 'active';
        await kitchenOwner.save();

        res.status(200).json({ message: "Kitchen owner approved successfully", kitchenOwner });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reject Kitchen Owner Registration
exports.rejectKitchenOwner = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const { id } = req.params;

        const kitchenOwner = await Kitchenowner.findByIdAndDelete(id);
        if (!kitchenOwner) {
            return res.status(404).json({ message: "Kitchen owner not found" });
        }

        res.status(200).json({ message: "Kitchen owner registration rejected and deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Ban/Remove Hostel Owner
exports.banHostelOwner = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const { id } = req.params;

        const hostelOwner = await Hostelowner.findById(id);
        if (!hostelOwner) {
            return res.status(404).json({ message: "Hostel owner not found" });
        }

        hostelOwner.isBanned = true;
        hostelOwner.status = 'banned';
        await hostelOwner.save();

        res.status(200).json({ message: "Hostel owner banned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete Hostel Owner permanently
exports.deleteHostelOwner = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const Hostelroom = require('../../models/hostelowner/Hostelroom');
        const { id } = req.params;

        // Delete all hostels owned by this owner
        await Hostelroom.deleteMany({ hostelId: id }); // hostelId is the correct field in Hostelroom model

        // Delete the owner
        const hostelOwner = await Hostelowner.findByIdAndDelete(id);
        if (!hostelOwner) {
            return res.status(404).json({ message: "Hostel owner not found" });
        }

        res.status(200).json({ message: "Hostel owner and all their hostels deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Ban/Remove Kitchen Owner
exports.banKitchenOwner = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const { id } = req.params;

        const kitchenOwner = await Kitchenowner.findById(id);
        if (!kitchenOwner) {
            return res.status(404).json({ message: "Kitchen owner not found" });
        }

        kitchenOwner.isBanned = true;
        kitchenOwner.status = 'banned';
        await kitchenOwner.save();

        res.status(200).json({ message: "Kitchen owner banned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete Kitchen Owner permanently
exports.deleteKitchenOwner = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const Dish = require('../../models/kitchenowner/Dish');
        const { id } = req.params;

        // Delete all dishes by this owner
        await Dish.deleteMany({ kitchen_owner_id: id });

        // Delete the owner
        const kitchenOwner = await Kitchenowner.findByIdAndDelete(id);
        if (!kitchenOwner) {
            return res.status(404).json({ message: "Kitchen owner not found" });
        }

        res.status(200).json({ message: "Kitchen owner and all their dishes deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Remove/Ban a specific hostel (by HostelOwner id since hostel IS the owner record)
exports.removeHostel = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const Hostelroom = require('../../models/hostelowner/Hostelroom');
        const { id } = req.params;

        // Remove rooms under this hostel owner first
        await Hostelroom.deleteMany({ hostelId: id });

        const hostel = await Hostelowner.findByIdAndDelete(id);
        if (!hostel) {
            return res.status(404).json({ message: "Hostel not found" });
        }

        res.status(200).json({ message: "Hostel removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Remove a specific kitchen owner and all their dishes
exports.removeKitchen = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const Dish = require('../../models/kitchenowner/Dish');
        const { id } = req.params;

        // Delete all dishes by this kitchen owner first
        await Dish.deleteMany({ kitchen_owner_id: id });

        const kitchen = await Kitchenowner.findByIdAndDelete(id);
        if (!kitchen) {
            return res.status(404).json({ message: "Kitchen not found" });
        }

        res.status(200).json({ message: "Kitchen and all related dishes removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Ban Student
exports.banStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        student.isBanned = true;
        student.status = 'banned';
        await student.save();

        res.status(200).json({ message: "Student banned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const Hostelroom = require('../../models/hostelowner/Hostelroom');
        const Dish = require('../../models/kitchenowner/Dish');
        const Booking = require('../../models/student/Booking');
        const Order = require('../../models/student/Order');

        const totalStudents = await Student.countDocuments();
        const totalHostelOwners = await Hostelowner.countDocuments();
        const totalKitchenOwners = await Kitchenowner.countDocuments();
        const totalHostels = await Hostelowner.countDocuments({ isApproved: true }); // Approved hostels (1 owner = 1 hostel)
        const totalKitchens = await Kitchenowner.countDocuments({ isApproved: true }); // Approved kitchens (1 owner = 1 kitchen)
        const totalBookings = await Booking.countDocuments();
        const totalOrders = await Order.countDocuments();

        const pendingHostelOwners = await Hostelowner.countDocuments({ isApproved: false });
        const pendingKitchenOwners = await Kitchenowner.countDocuments({ isApproved: false });

        // Owners still pending 48+ hours after registering breach our KYC turnaround target.
        const slaDeadline = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const overdueHostelOwners = await Hostelowner.countDocuments({ isApproved: false, createdAt: { $lt: slaDeadline } });
        const overdueKitchenOwners = await Kitchenowner.countDocuments({ isApproved: false, createdAt: { $lt: slaDeadline } });

        res.status(200).json({
            totalStudents,
            totalHostelOwners,
            totalKitchenOwners,
            totalHostels,
            totalKitchens,
            totalBookings,
            totalOrders,
            pendingHostelOwners,
            pendingKitchenOwners,
            overdueHostelOwners,
            overdueKitchenOwners
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Platform-wide signups/bookings/orders, bucketed by calendar month, for the
// last 6 months (current month inclusive) — powers the overview growth chart.
exports.getMonthlyGrowthStats = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const Booking = require('../../models/student/Booking');
        const Order = require('../../models/student/Order');

        const MONTHS_BACK = 5; // + current month = 6 buckets
        const now = new Date();
        const rangeStart = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);

        const [students, hostelOwners, kitchenOwners, bookings, orders] = await Promise.all([
            Student.find({ createdAt: { $gte: rangeStart } }).select('createdAt').lean(),
            Hostelowner.find({ createdAt: { $gte: rangeStart } }).select('createdAt').lean(),
            Kitchenowner.find({ createdAt: { $gte: rangeStart } }).select('createdAt').lean(),
            Booking.find({ booking_date: { $gte: rangeStart } }).select('booking_date').lean(),
            Order.find({ orderPlacedAt: { $gte: rangeStart } }).select('orderPlacedAt').lean(),
        ]);

        const buckets = [];
        for (let i = MONTHS_BACK; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                students: 0, hostelOwners: 0, kitchenOwners: 0, bookings: 0, orders: 0,
            });
        }
        const bucketByKey = new Map(buckets.map(b => [b.key, b]));
        const tally = (docs, dateField, statKey) => docs.forEach(doc => {
            const d = new Date(doc[dateField]);
            const bucket = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
            if (bucket) bucket[statKey] += 1;
        });
        tally(students, 'createdAt', 'students');
        tally(hostelOwners, 'createdAt', 'hostelOwners');
        tally(kitchenOwners, 'createdAt', 'kitchenOwners');
        tally(bookings, 'booking_date', 'bookings');
        tally(orders, 'orderPlacedAt', 'orders');

        res.status(200).json({ data: buckets.map(({ key, ...rest }) => rest) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//get students

exports.getStudents = async (req, res) => {
    try {
        logger.debug("get students");
        // logger.debug(await Student.find());
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        logger.debug(error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// ── Unban Student ─────────────────────────────────────────────────────
exports.unbanStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        student.isBanned = false;
        student.status = 'active';
        await student.save();
        res.status(200).json({ message: "Student unbanned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Unban Hostel Owner ────────────────────────────────────────────────
exports.unbanHostelOwner = async (req, res) => {
    try {
        const Hostelowner = require('../../models/hostelowner/Hostelowner');
        const owner = await Hostelowner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Hostel owner not found" });
        owner.isBanned = false;
        owner.status = 'active';
        await owner.save();
        res.status(200).json({ message: "Hostel owner unbanned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Unban Kitchen Owner ───────────────────────────────────────────────
exports.unbanKitchenOwner = async (req, res) => {
    try {
        const Kitchenowner = require('../../models/kitchenowner/Kitchenowner');
        const owner = await Kitchenowner.findById(req.params.id);
        if (!owner) return res.status(404).json({ message: "Kitchen owner not found" });
        owner.isBanned = false;
        owner.status = 'active';
        await owner.save();
        res.status(200).json({ message: "Kitchen owner unbanned successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── List Mini Admins (super_admin only) ───────────────────────────────
exports.listMiniAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Delete Mini Admin (super_admin only) ──────────────────────────────
exports.deleteMiniAdmin = async (req, res) => {
    try {
        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "Admin not found" });
        if (target.role === 'super_admin') {
            return res.status(403).json({ message: "Super Admin accounts cannot be deleted." });
        }
        if (target._id.toString() === req.admin._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }
        await Admin.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: `Admin ${target.first_name} ${target.last_name} removed successfully.` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Reset Mini Admin Password (super_admin only) ──────────────────────
exports.resetMiniAdminPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "Admin not found." });
        if (target.role === 'super_admin') {
            return res.status(403).json({ message: "Super Admin password cannot be reset from the dashboard. Use the resetSuperAdminPassword.js script." });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await Admin.findByIdAndUpdate(req.params.id, { password: hashed });
        res.status(200).json({ message: `Password for ${target.first_name} ${target.last_name} reset successfully.` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ── Change Own Password (any logged-in admin) ─────────────────────────────────
exports.changeOwnPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const admin = await Admin.findById(req.admin._id || req.admin.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();

        res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ── Update Own Profile Picture (any logged-in admin) ──────────────────
// Accepts a Cloudinary URL already uploaded via POST /api/upload/image
// (same flow students/owners use) — this endpoint just saves the URL.
exports.updateOwnProfilePicture = async (req, res) => {
    try {
        const { profile_picture } = req.body;

        const admin = await Admin.findByIdAndUpdate(
            req.admin._id || req.admin.id,
            { profile_picture: profile_picture || '' },
            { new: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        res.json({
            message: 'Profile picture updated.',
            admin: {
                _id: admin._id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                role: admin.role,
                profile_picture: admin.profile_picture,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
