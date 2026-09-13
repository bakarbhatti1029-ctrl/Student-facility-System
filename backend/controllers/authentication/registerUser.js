const { getUserModel, generateVerificationToken, maxTokenTime, findUserByEmail } = require('../../utils/Utils');
const PendingRegistration = require('../../models/PendingRegistration');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../utils/emailService');
const bcrypt = require('bcryptjs');
const getLatLngFromAddress = require('../../utils/geocodingService');
const logger = require('../../utils/logger');
const { resolveUniversityFromKnown } = require('../../utils/universityResolver');
const KnownInstitute = require('../../models/KnownInstitute');

exports.signUpUser = async (req, res, next) => {
  try {
    logger.debug('Received registration request:', req.body);
    let {
      first_name,
      last_name,
      email,
      password,
      confirmPassword,
      phone_number,
      cnic,
      address,
      gender,
      profile_picture,
      role,
      kitchen_name,
      kitchen_address,
      kitchen_description,
      kitchen_picture,
      hostel_name,
      hostel_type,
      hostel_address,
      hostel_description,
      hostel_picture,
      hostel_lat,
      hostel_lng,
      facilities,
      nearby_institutes
    } = req.body;

    // Normalize role name
    if (role === 'kitchenowner') {
      role = 'kitchenOwner';
    } else if (role === 'hostelowner') {
      role = 'hostelOwner';
    }

    // Basic validation
    if (!first_name || !last_name || !email || !password || !phone_number || !cnic || !address || !role) {
      logger.debug('Missing required fields');
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      logger.debug('Password mismatch');
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if email already exists in VERIFIED users (main database)
    const existingVerifiedUser = await findUserByEmail(email);

    if (existingVerifiedUser) {
      // Email exists in main database (verified users only)
      if (existingVerifiedUser.role !== role) {
        logger.debug(`Email ${email} already exists under role: ${existingVerifiedUser.role}`);
        return res.status(400).json({
          message: `This email is already registered as a ${existingVerifiedUser.role}. Please use a different email or login with your existing account.`
        });
      } else {
        // Same role - user should login
        logger.debug(`Verified user with email ${email} already exists`);
        return res.status(400).json({
          message: "User with this email already exists. Please login instead."
        });
      }
    }


    // Validate role-specific fields
    const User = getUserModel(role);
    if (!User) {
      logger.debug('Invalid role:', role);
      return res.status(400).json({ message: "Invalid user role" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP for email verification
    const otp = generateVerificationToken();
    const otpString = otp.toString();

    // Prepare registration data based on role
    let registrationData = {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone_number,
      cnic,
      address,
      role
    };

    // Add role-specific fields
    if (role === 'student') {
      if (!gender || !profile_picture) {
        logger.debug('Missing student-specific fields');
        return res.status(400).json({ message: "Gender and profile picture are required for students" });
      }
      registrationData = {
        ...registrationData,
        gender,
        profile_picture
      };
    } else if (role === 'kitchenOwner') {
      if (!kitchen_name || !kitchen_description || !kitchen_picture) {
        logger.debug('Missing kitchen-specific fields');
        return res.status(400).json({ message: "Kitchen name, description, and picture are required for kitchen owners" });
      }

      const providerId = "KIT" + Math.floor(100000 + Math.random() * 900000);

      registrationData = {
        ...registrationData,
        kitchen_name,
        address: kitchen_address,
        kitchen_description,
        kitchen_picture,
        provider_id: providerId
      };
    } else if (role === 'hostelOwner') {
      if (!hostel_name || !hostel_type || !hostel_address || !hostel_description || !hostel_picture) {
        logger.debug('Missing hostel-specific fields');
        return res.status(400).json({ message: "Hostel details are required for hostel owners" });
      }

      const formattedNearbyInstitutes = nearby_institutes && Array.isArray(nearby_institutes)
        ? nearby_institutes
            .filter(inst => inst && inst.university)
            .map(inst => ({
              university: inst.university,
              distance: inst.distance || '1 km',
            }))
        : [];

      const stripeAccountId = "ACC" + Math.floor(100000 + Math.random() * 900000);
      const ownerId = "HST" + Math.floor(100000 + Math.random() * 900000);

      registrationData = {
        ...registrationData,
        hostel_name,
        hostel_type,
        hostel_address,
        hostel_description,
        hostel_picture,
        facilities: facilities || [],
        nearby_institutes: formattedNearbyInstitutes,
        stripeAccountId,
        owner_id: ownerId
      };

      // Prefer the owner's manually-pinned exact location (from the
      // registration map picker); only fall back to geocoding the free-text
      // address if they didn't use it — free-text geocoding is often
      // imprecise (wrong building/block).
      if (typeof hostel_lat === 'number' && typeof hostel_lng === 'number') {
        registrationData.hostel_lat = hostel_lat;
        registrationData.hostel_lng = hostel_lng;
        logger.debug(`Using pinned hostel location: ${hostel_lat}, ${hostel_lng}`);
      } else {
        try {
          const hostelLatLng = await getLatLngFromAddress(hostel_address + ', Lahore, Pakistan');
          if (hostelLatLng) {
            registrationData.hostel_lat = hostelLatLng.lat;
            registrationData.hostel_lng = hostelLatLng.lng;
            logger.debug(`Geocoded hostel: ${hostelLatLng.lat}, ${hostelLatLng.lng}`);
          }
        } catch (geoError) {
          console.error('Error geocoding hostel address:', geoError);
        }
      }

      // Geocode each university in nearby_institutes → university_lat, university_lng
      const geocodedInstitutes = [];
      for (const inst of formattedNearbyInstitutes) {
        let uniLatLng = null;
        const instKey = inst.university.trim().toLowerCase();

        // 1) Self-growing MongoDB cache — anything resolved before (by a
        // student search or a previous registration), no network needed.
        try {
          const known = await KnownInstitute.findOne({ key: instKey });
          if (known) {
            uniLatLng = { lat: known.lat, lng: known.lng };
            logger.debug(`Resolved ${inst.university} from KnownInstitute: ${uniLatLng.lat}, ${uniLatLng.lng}`);
          }
        } catch (e) {
          logger.debug('KnownInstitute lookup failed:', e.message);
        }

        // 2) Known universities static file (fast, no network)
        if (!uniLatLng) {
          const knownUni = resolveUniversityFromKnown(inst.university);
          if (knownUni) {
            uniLatLng = { lat: knownUni.lat, lng: knownUni.lng };
            logger.debug(`Resolved ${inst.university} from known database: ${uniLatLng.lat}, ${uniLatLng.lng}`);
          }
        }

        // 3) Fall back to live geocoding, persisting a success so every
        // future search/registration for this name is instant afterwards.
        if (!uniLatLng) {
          try {
            uniLatLng = await getLatLngFromAddress(inst.university + ', Lahore, Pakistan');
            if (uniLatLng) {
              logger.debug(`Geocoded ${inst.university}: ${uniLatLng.lat}, ${uniLatLng.lng}`);
              KnownInstitute.updateOne(
                { key: instKey },
                { $setOnInsert: { key: instKey, name: inst.university, lat: uniLatLng.lat, lng: uniLatLng.lng } },
                { upsert: true }
              ).catch((e) => logger.debug('Failed to persist KnownInstitute:', e.message));
            }
          } catch (geoError) {
            logger.debug(`Failed to geocode ${inst.university}:`, geoError.message);
          }
        }

        geocodedInstitutes.push({
          university: inst.university,
          distance: inst.distance,
          university_lat: uniLatLng ? uniLatLng.lat : null,
          university_lng: uniLatLng ? uniLatLng.lng : null,
        });
      }
      registrationData.nearby_institutes = geocodedInstitutes;
    }

    logger.debug('Creating pending registration for:', email);

    // Atomic upsert (NOT the actual user collection) — replaces any existing
    // pending registration for this email in one operation. Using a separate
    // find-then-delete-then-insert here previously raced when two requests
    // for the same email landed close together (e.g. a double-click while
    // waiting on a slow/cold-starting server), crashing with a duplicate key
    // error on the unique email index.
    const pendingRegistration = await PendingRegistration.findOneAndUpdate(
      { email },
      {
        email,
        role,
        registrationData,
        verification_token: otpString,
        verification_token_time: maxTokenTime()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send verification email
    try {
      const emailSubject = 'Email Verification - Student Facility System';
      const emailText = `Your OTP for email verification is: ${otpString}

This code will expire in 5 minutes.

Thank you for registering with Student Facility System!`;

      await sendEmail(email, emailSubject, emailText);
      logger.debug('Verification email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);

      // Delete pending registration if email fails and REQUIRE_EMAIL_SUCCESS is true
      if (process.env.REQUIRE_EMAIL_SUCCESS === 'true') {
        await PendingRegistration.findByIdAndDelete(pendingRegistration._id);
        return res.status(500).json({
          message: "Failed to send verification email. Please try again or contact support.",
          error: emailError.message
        });
      }
    }

    // Create temporary JWT token (used only for verification endpoint)
    const payload = { email, role, isPending: true };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.debug('Pending registration created for:', email);
    res.status(201).json({
      message: `Registration initiated. Please check your email for the OTP to complete your ${role} registration.`,
      token,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
