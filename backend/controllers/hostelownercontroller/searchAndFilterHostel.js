const HostelOwner = require('../../models/hostelowner/Hostelowner');
const KnownInstitute = require('../../models/KnownInstitute');
const getLatLngFromAddress = require('../../utils/geocodingService');
const logger = require('../../utils/logger');
const { resolveUniversityFromKnown } = require('../../utils/universityResolver');

// --- Real distance between two lat/lng points (Haversine formula, in km) ---
// Dependency-free so nothing extra needs installing.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple in-memory cache so we don't re-geocode the same university name repeatedly.
const universityCoordCache = new Map();

// Resolve a searched university NAME to coordinates, most-trustworthy source first:
//   1) in-memory cache
//   2) self-growing MongoDB cache — centrally verified, no network
//   3) known universities database — centrally verified, no network
//   4) coordinates a hostel owner typed in their own nearby_institutes (no
//      network, but only as a last resort before geocoding — a single
//      owner's self-reported value can be stale/wrong, so it must never
//      override the centrally-maintained sources above it)
//   5) live geocode via Nominatim (network, persisted afterwards)
async function resolveUniversityCoords(universityName, hostels) {
  const key = universityName.trim().toLowerCase();
  if (universityCoordCache.has(key)) return universityCoordCache.get(key);

  // 2) Self-growing MongoDB cache — anything anyone has ever successfully
  // resolved before (seeded from universityDatabase, or persisted below
  // after a live geocode). Exact key first, then a contains-match.
  try {
    let doc = await KnownInstitute.findOne({ key });
    if (!doc) {
      doc = await KnownInstitute.findOne({ key: { $regex: escapeRegex(key), $options: 'i' } });
    }
    if (doc) {
      const found = { name: doc.name, lat: doc.lat, lng: doc.lng };
      universityCoordCache.set(key, found);
      logger.debug(`Resolved ${universityName} from KnownInstitute: ${doc.lat}, ${doc.lng}`);
      return found;
    }
  } catch (e) {
    logger.debug('KnownInstitute lookup failed:', e.message);
  }

  // 3) Static file fallback (kept for redundancy/offline safety).
  const knownUni = resolveUniversityFromKnown(universityName);
  if (knownUni) {
    const found = { name: knownUni.name, lat: knownUni.lat, lng: knownUni.lng };
    universityCoordCache.set(key, found);
    logger.debug(`Resolved ${universityName} from known universities: ${knownUni.lat}, ${knownUni.lng}`);
    return found;
  }

  // 4) Look through the hostels we already loaded for a matching institute w/ coords.
  for (const h of hostels) {
    for (const inst of h.nearby_institutes || []) {
      if (
        inst.university &&
        inst.university.toLowerCase().includes(key) &&
        inst.university_lat != null &&
        inst.university_lng != null
      ) {
        const found = { name: inst.university, lat: inst.university_lat, lng: inst.university_lng };
        universityCoordCache.set(key, found);
        return found;
      }
    }
  }

  // 5) Live geocode as a last resort (add "Lahore, Pakistan" for accuracy, like registration).
  try {
    const geo = await getLatLngFromAddress(`${universityName}, Lahore, Pakistan`);
    if (geo && geo.lat != null && geo.lng != null) {
      const found = { name: universityName, lat: geo.lat, lng: geo.lng };
      universityCoordCache.set(key, found);
      // Persist so every future search for this name is instant — this is
      // what makes the database grow on its own instead of needing anyone
      // to hand-maintain a list.
      KnownInstitute.updateOne(
        { key },
        { $setOnInsert: { key, name: universityName, lat: geo.lat, lng: geo.lng } },
        { upsert: true }
      ).catch((e) => logger.debug('Failed to persist KnownInstitute:', e.message));
      return found;
    }
  } catch (e) {
    logger.debug('University geocode failed:', e.message);
  }

  universityCoordCache.set(key, null);
  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Controller: filter hostels by university (real distance), facilities, and max distance.
const getFilteredHostels = async (req, res) => {
  try {
    logger.debug('Filter query:', req.query);
    const { university, facilities, maxDistance } = req.query;

    if (!university && !maxDistance && !(facilities && facilities.trim())) {
      return res.status(400).json({
        success: false,
        message: 'At least one filter criteria is required',
      });
    }

    // Base filter: only live (approved, not banned) hostels.
    // NOTE: we deliberately do NOT filter by university name in the DB query —
    // the university filter is applied by *calculated distance* below, so that a
    // hostel shows up near a university even if the owner never listed it.
    const filter = { isApproved: true, isBanned: false };

    if (facilities && facilities.trim() !== '') {
      const facilityList = facilities.split(',').map((f) => f.trim()).filter(Boolean);
      if (facilityList.length === 1) {
        filter.facilities = { $regex: new RegExp(facilityList[0], 'i') };
      } else if (facilityList.length > 1) {
        filter.facilities = { $all: facilityList.map((f) => new RegExp(`^${f}$`, 'i')) };
      }
    }

    const hostels = await HostelOwner.find(filter)
      .select(
        'hostel_name hostel_address hostel_lat hostel_lng hostel_type hostel_description hostel_picture facilities nearby_institutes'
      )
      .populate({ path: 'rooms', select: 'name capacity price availability description imageUrls' })
      .lean();

    logger.debug(`Base match: ${hostels.length} hostels`);

    // No university → just return the facility-filtered list (distance needs an anchor).
    if (!university || !university.trim()) {
      return res.status(200).json({ success: true, data: hostels, university: null });
    }

    // Resolve the searched university to coordinates.
    const uni = await resolveUniversityCoords(university, hostels);
    if (!uni) {
      return res.status(200).json({
        success: true,
        data: [],
        university: null,
        message: `Could not locate "${university}". Try the full official name.`,
      });
    }

    const maxDist = maxDistance ? parseFloat(maxDistance) : null;

    // Compute real distance from each hostel to the university, keep the ones
    // that have coordinates, optionally within maxDistance, sorted nearest-first.
    const withDistance = hostels
      .filter((h) => h.hostel_lat != null && h.hostel_lng != null)
      .map((h) => ({
        ...h,
        calculated_distance: Number(
          haversineKm(h.hostel_lat, h.hostel_lng, uni.lat, uni.lng).toFixed(2)
        ),
      }))
      .filter((h) => maxDist == null || isNaN(maxDist) ? true : h.calculated_distance <= maxDist)
      .sort((a, b) => a.calculated_distance - b.calculated_distance);

    logger.debug(`Near ${uni.name}: ${withDistance.length} hostels`);

    return res.status(200).json({
      success: true,
      data: withDistance,
      university: uni, // { name, lat, lng } — used by the map to center + draw routes
    });
  } catch (error) {
    console.error('Error fetching filtered hostels:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while searching hostels',
      error: error.message,
    });
  }
};

module.exports = getFilteredHostels;
