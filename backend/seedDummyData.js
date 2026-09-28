// backend/seedDummyData.js
// Safe to run multiple times — checks existing data before inserting.
// Standalone: node seedDummyData.js
// Auto: called from server.js via mongoose 'open' event

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Student      = require('./models/student/Student');
const HostelOwner  = require('./models/hostelowner/Hostelowner');
const Room         = require('./models/hostelowner/Hostelroom');
const Bed          = require('./models/hostelowner/RoomBed');
const KitchenOwner = require('./models/kitchenowner/Kitchenowner');
const Dish         = require('./models/kitchenowner/Dish');
const KnownInstitute = require('./models/KnownInstitute');
const { resolveUniversityFromKnown } = require('./utils/universityResolver');
const getLatLngFromAddress = require('./utils/geocodingService');

// ─── Room Images ──────────────────────────────────────────────────────────────
const ROOM_IMAGES = [
  'https://i.imgur.com/UbPIVR8.jpeg',
  'https://i.imgur.com/i1aeTDo.jpeg',
  'https://i.imgur.com/7tAKLSW.jpeg',
  'https://i.imgur.com/xZQSw7U.jpeg',
  'https://i.imgur.com/GyHy7H2.jpeg',
  'https://i.imgur.com/zBe6Wtv.jpeg',
  'https://i.imgur.com/OAUvP0M.jpeg',
  'https://i.imgur.com/H3CK7q2.jpeg',
  'https://i.imgur.com/njHNXqR.jpeg',
  'https://i.imgur.com/7OhtKQs.jpeg',
  'https://i.imgur.com/8NVj72q.jpeg',
];

const HOSTEL_IMAGES = [
  'https://i.imgur.com/hAN1hxH.jpeg',
  'https://i.imgur.com/mxnVIJa.jpeg',
  'https://i.imgur.com/NKI0eWD.jpeg',
  'https://i.imgur.com/luOLHIW.jpeg',
  'https://i.imgur.com/byzx4Wk.jpeg',
  'https://i.imgur.com/OQhU0Ti.jpeg',
  'https://i.imgur.com/DXQCEvi.jpeg',
];

const hImg = (i) => HOSTEL_IMAGES[i % HOSTEL_IMAGES.length];
const rImg = (i) => ROOM_IMAGES[i % ROOM_IMAGES.length];

// ─── Real Lahore Universities (GPS verified) ──────────────────────────────────
// NOTE: no lat/lng here anymore — these used to be hand-typed guesses that
// silently diverged from reality (e.g. the old PU entry was ~7km off, and
// LUMS was ~52km off, placing it outside Lahore entirely). Coordinates are
// now resolved from the single verified source (universityResolver.js /
// the self-growing KnownInstitute cache) at seed time — see
// resolveDemoUniversityCoords() below.
const UNIVERSITIES = [
  { name: 'University of the Punjab (PU)' },
  { name: 'Government College University (GCU)' },
  { name: 'University of Engineering & Technology (UET)' },
  { name: 'Lahore University of Management Sciences (LUMS)' },
  { name: 'University of Central Punjab (UCP)' },
  { name: 'The University of Lahore (UOL)' },
  { name: 'Lahore College for Women University (LCWU)' },
  { name: 'University of Management & Technology (UMT)' },
  { name: 'Forman Christian College (FCCU)' },
  { name: 'Hajvery University (HU)' },
  { name: 'Superior University' },
  { name: 'Beaconhouse National University (BNU)' },
  { name: 'Information Technology University (ITU)' },
  { name: 'Minhaj University Lahore' },
  { name: 'National College of Arts (NCA)' },
  { name: 'Lahore Garrison University (LGU)' },
  { name: 'Govt. Shalimar Graduate College' },
  { name: 'University of Education Lahore' },
  { name: 'Punjab Tianjin University of Technology (PTUT)' },
  { name: 'Lahore Leads University' },
];

// Resolves each demo university's real coordinates: check the central
// verified database first (no network), and only live-geocode + persist
// for the handful not already known — same self-growing pattern used
// everywhere else, so this list can never drift out of sync again.
async function resolveDemoUniversityCoords() {
  const coords = {};
  for (const uni of UNIVERSITIES) {
    const known = resolveUniversityFromKnown(uni.name);
    if (known) {
      coords[uni.name] = { lat: known.lat, lng: known.lng };
      continue;
    }
    try {
      const query = /lahore/i.test(uni.name) ? `${uni.name}, Pakistan` : `${uni.name}, Lahore, Pakistan`;
      const geo = await getLatLngFromAddress(query);
      if (geo) {
        coords[uni.name] = { lat: geo.lat, lng: geo.lng };
        const key = uni.name.trim().toLowerCase();
        await KnownInstitute.updateOne(
          { key },
          { $setOnInsert: { key, name: uni.name, lat: geo.lat, lng: geo.lng } },
          { upsert: true }
        ).catch(() => {});
      } else {
        console.warn(`[Seeder] Could not resolve coordinates for "${uni.name}" — demo nearby_institutes entry will omit lat/lng.`);
      }
    } catch (e) {
      console.warn(`[Seeder] Geocoding failed for "${uni.name}":`, e.message);
    }
    await new Promise((r) => setTimeout(r, 1100)); // respect Nominatim's rate limit
  }
  return coords;
}

function distanceBetweenKm(fromLat, fromLng, toLat, toLng) {
  if ([fromLat, fromLng, toLat, toLng].some(value => !Number.isFinite(value))) return null;
  const radians = degrees => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latDelta = radians(toLat - fromLat);
  const lngDelta = radians(toLng - fromLng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(fromLat)) * Math.cos(radians(toLat))
    * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceKm(hostel, universityCoords) {
  const distance = distanceBetweenKm(
    hostel.hostel_lat,
    hostel.hostel_lng,
    universityCoords.lat,
    universityCoords.lng,
  );
  return distance == null ? null : `${distance.toFixed(1)} km`;
}

// ─── All 8 facilities that match both the filter dropdown and registration form ─
// IMPORTANT: These exact strings must match Hostels.js ALL_FACILITIES array
const ALL_FACILITIES = ['Wi-Fi', 'AC', 'CCTV', 'Generator', 'Laundry', 'Parking', 'Water Cooler', 'Study Room'];

// Each hostel gets a rotating combination of 3–5 facilities from the pool
const FACILITIES_SETS = [
  ['Wi-Fi', 'AC', 'CCTV', 'Generator'],
  ['Wi-Fi', 'Laundry', 'Parking', 'Water Cooler'],
  ['Wi-Fi', 'AC', 'Study Room', 'Generator'],
  ['Wi-Fi', 'CCTV', 'Laundry', 'Water Cooler'],
  ['Wi-Fi', 'AC', 'Parking', 'Study Room', 'Generator'],
  ['Wi-Fi', 'CCTV', 'Parking', 'Generator'],
  ['Wi-Fi', 'Laundry', 'AC', 'Study Room'],
  ['Wi-Fi', 'Parking', 'Water Cooler', 'CCTV'],
  ['Wi-Fi', 'Generator', 'Laundry', 'Study Room'],
  ['Wi-Fi', 'AC', 'CCTV', 'Parking', 'Water Cooler'],
];

// ─── Real Lahore Hostels ──────────────────────────────────────────────────────
const HOSTELS_DATA = [
  {
    hostel_name: 'Al-Madina Boys Hostel',
    hostel_address: 'Muslim Town, Near Canal Road, Lahore',
    hostel_lat: 31.5100, hostel_lng: 74.3520,
    hostel_type: 'Boys',   area: 'Muslim Town',
    nearby: [{ uni: 0, dist: '1 km' }, { uni: 9, dist: '2 km' }],
  },
  {
    hostel_name: 'Canal View Hostel',
    hostel_address: 'Canal Bank Road, Lahore',
    hostel_lat: 31.5060, hostel_lng: 74.3560,
    hostel_type: 'Boys',   area: 'Canal Road',
    nearby: [{ uni: 0, dist: '2 km' }, { uni: 8, dist: '3 km' }],
  },
  {
    hostel_name: 'Anarkali Student Hostel',
    hostel_address: 'Anarkali Bazaar, Near GCU, Lahore',
    hostel_lat: 31.5680, hostel_lng: 74.3210,
    hostel_type: 'Boys',   area: 'Anarkali',
    nearby: [{ uni: 1, dist: '1 km' }, { uni: 14, dist: '3 km' }],
  },
  {
    hostel_name: 'Nila Gumbad Hostel',
    hostel_address: 'Nila Gumbad Chowk, Lahore',
    hostel_lat: 31.5700, hostel_lng: 74.3200,
    hostel_type: 'Co-Ed', area: 'Nila Gumbad',
    nearby: [{ uni: 1, dist: '1 km' }, { uni: 17, dist: '2 km' }],
  },
  {
    hostel_name: 'Al-Falah Hostel',
    hostel_address: 'Near UET Gate, Mughalpura, Lahore',
    hostel_lat: 31.5230, hostel_lng: 74.4010,
    hostel_type: 'Boys',   area: 'Mughalpura',
    nearby: [{ uni: 2, dist: '1 km' }, { uni: 16, dist: '4 km' }],
  },
  {
    hostel_name: 'UET Gate Hostel',
    hostel_address: 'G.T. Road, Mughalpura, Lahore',
    hostel_lat: 31.5240, hostel_lng: 74.4020,
    hostel_type: 'Boys',   area: 'Mughalpura',
    nearby: [{ uni: 2, dist: '1 km' }, { uni: 16, dist: '4 km' }],
  },
  {
    hostel_name: 'DHA Guest House Hostel',
    hostel_address: 'DHA Phase 5, Bedian Road, Lahore',
    hostel_lat: 31.4720, hostel_lng: 74.2740,
    hostel_type: 'Co-Ed', area: 'DHA Phase 5',
    nearby: [{ uni: 3, dist: '1 km' }, { uni: 15, dist: '2 km' }],
  },
  {
    hostel_name: 'Al-Rehman Hostel',
    hostel_address: 'Johar Town, Near UCP, Lahore',
    hostel_lat: 31.4690, hostel_lng: 74.2720,
    hostel_type: 'Boys',   area: 'Johar Town',
    nearby: [{ uni: 4, dist: '1 km' }, { uni: 7, dist: '1 km' }],
  },
  {
    hostel_name: 'Johar Town Student Lodges',
    hostel_address: 'Johar Town Block E, Lahore',
    hostel_lat: 31.4710, hostel_lng: 74.2730,
    hostel_type: 'Boys',   area: 'Johar Town',
    nearby: [{ uni: 4, dist: '2 km' }, { uni: 7, dist: '2 km' }],
  },
  {
    hostel_name: 'Raiwind Road Student House',
    hostel_address: 'Defence Road, Near UOL, Lahore',
    hostel_lat: 31.4310, hostel_lng: 74.2810,
    hostel_type: 'Boys',   area: 'Raiwind Road',
    nearby: [{ uni: 5, dist: '1 km' }, { uni: 11, dist: '3 km' }],
  },
  {
    hostel_name: 'Gulberg Girls Hostel',
    hostel_address: 'Gulberg III, Near Jail Road, Lahore',
    hostel_lat: 31.5200, hostel_lng: 74.3587,
    hostel_type: 'Girls',  area: 'Gulberg III',
    nearby: [{ uni: 6, dist: '3 km' }, { uni: 8, dist: '2 km' }],
  },
  {
    hostel_name: 'Ferozepur Road Hostel',
    hostel_address: 'Ferozepur Road, Near FCCU, Lahore',
    hostel_lat: 31.5360, hostel_lng: 74.3170,
    hostel_type: 'Boys',   area: 'Ferozepur Road',
    nearby: [{ uni: 8, dist: '1 km' }, { uni: 6, dist: '4 km' }],
  },
  {
    hostel_name: 'Muslim Town Boys Hostel',
    hostel_address: 'Muslim Town, Canal Road, Lahore',
    hostel_lat: 31.5140, hostel_lng: 74.3490,
    hostel_type: 'Boys',   area: 'Muslim Town',
    nearby: [{ uni: 9, dist: '1 km' }, { uni: 0, dist: '2 km' }],
  },
  {
    hostel_name: 'Shalimar Student Hostel',
    hostel_address: 'Shalimar Town, GT Road, Lahore',
    hostel_lat: 31.5720, hostel_lng: 74.4000,
    hostel_type: 'Boys',   area: 'Shalimar',
    nearby: [{ uni: 16, dist: '1 km' }, { uni: 2, dist: '5 km' }],
  },
  {
    hostel_name: 'ITU Student Residency',
    hostel_address: 'Punjab Government Building, Lahore',
    hostel_lat: 31.5160, hostel_lng: 74.3110,
    hostel_type: 'Co-Ed', area: 'Township',
    nearby: [{ uni: 12, dist: '1 km' }, { uni: 0, dist: '3 km' }],
  },
];

// ─── Room types ───────────────────────────────────────────────────────────────
const ROOM_TYPES = [
  { name: 'Single Room',  capacity: 1, price: 8000 },
  { name: 'Double Room',  capacity: 2, price: 6000 },
  { name: 'Triple Room',  capacity: 3, price: 5000 },
  { name: 'Quad Room',    capacity: 4, price: 4000 },
  { name: 'Dormitory',    capacity: 6, price: 3000 },
];

// ─── Students ─────────────────────────────────────────────────────────────────
const STUDENTS_DATA = [
  { first: 'Ali',     last: 'Hassan',   area: 'Gulberg',     gender: 'male'   },
  { first: 'Sara',    last: 'Ahmed',    area: 'DHA',         gender: 'female' },
  { first: 'Usman',   last: 'Malik',    area: 'Johar Town',  gender: 'male'   },
  { first: 'Fatima',  last: 'Khan',     area: 'Iqbal Town',  gender: 'female' },
  { first: 'Bilal',   last: 'Raza',     area: 'Model Town',  gender: 'male'   },
  { first: 'Ayesha',  last: 'Siddiqui', area: 'Garden Town', gender: 'female' },
  { first: 'Hamza',   last: 'Tariq',    area: 'Faisal Town', gender: 'male'   },
  { first: 'Mahnoor', last: 'Iqbal',    area: 'Allama Iqbal', gender: 'female'},
  { first: 'Zain',    last: 'Abbas',    area: 'Wapda Town',  gender: 'male'   },
  { first: 'Hira',    last: 'Baig',     area: 'Valencia',    gender: 'female' },
  { first: 'Omar',    last: 'Farooq',   area: 'Bahria Town', gender: 'male'   },
  { first: 'Amna',    last: 'Javed',    area: 'Cantt',       gender: 'female' },
  { first: 'Talha',   last: 'Sheikh',   area: 'Shadman',     gender: 'male'   },
  { first: 'Sana',    last: 'Riaz',     area: 'Muslim Town', gender: 'female' },
  { first: 'Ahsan',   last: 'Butt',     area: 'Gulshan-e-Ravi', gender: 'male'},
];

// ─── Kitchen owners & dishes ──────────────────────────────────────────────────
const KITCHENS_DATA = [
  { name: 'Ammi ki Rasoi',       address: 'Muslim Town, Lahore',      area: 'Muslim Town'   },
  { name: 'Desi Khana Corner',   address: 'Johar Town, Lahore',       area: 'Johar Town'    },
  { name: 'Student Bhojan',      address: 'Gulberg, Lahore',          area: 'Gulberg'       },
  { name: 'Ghar ka Khana',       address: 'DHA Phase 5, Lahore',      area: 'DHA'           },
  { name: 'Lahori Zaika',        address: 'Ferozepur Road, Lahore',   area: 'Ferozepur Rd'  },
  { name: 'Punjabi Dhaba',       address: 'Mughalpura, Lahore',       area: 'Mughalpura'    },
  { name: 'Shalimar Kitchen',    address: 'Shalimar, Lahore',         area: 'Shalimar'      },
  { name: 'Campus Catering',     address: 'Model Town, Lahore',       area: 'Model Town'    },
  { name: 'Anarkali Bites',      address: 'Anarkali, Lahore',         area: 'Anarkali'      },
  { name: 'Fresh Meals Johar',   address: 'Johar Town Block E, Lahore', area: 'Johar Town'  },
  { name: 'Gharelo Pakwan',      address: 'Cantt, Lahore',            area: 'Cantt'         },
  { name: 'Daal Chawal House',   address: 'Garden Town, Lahore',      area: 'Garden Town'   },
  { name: 'Naan & Salan Hut',    address: 'Iqbal Town, Lahore',       area: 'Iqbal Town'    },
  { name: 'Hostel Meals Wala',   address: 'Canal Road, Lahore',       area: 'Canal Road'    },
  { name: 'Zaiqa e Lahore',      address: 'Valencia, Lahore',         area: 'Valencia'      },
];

const ALL_DISHES = [
  { name: 'Daal Chawal',       desc: 'Classic lentil rice combo, freshly cooked.',           price: 150, cat: 'Lunch'   },
  { name: 'Aloo Gosht',        desc: 'Tender mutton with potatoes in rich gravy.',            price: 220, cat: 'Lunch'   },
  { name: 'Chicken Karahi',    desc: 'Spicy wok-tossed chicken with tomatoes.',               price: 280, cat: 'Dinner'  },
  { name: 'Paratha Roll',      desc: 'Crispy paratha wrapped with spiced filling.',           price: 120, cat: 'Snack'   },
  { name: 'Halwa Puri',        desc: 'Traditional Lahori breakfast combo.',                   price: 130, cat: 'Breakfast'},
  { name: 'Biryani',           desc: 'Fragrant basmati rice with spiced chicken.',            price: 250, cat: 'Lunch'   },
  { name: 'Nihari',            desc: 'Slow-cooked beef stew, classic Lahori style.',          price: 300, cat: 'Breakfast'},
  { name: 'Chana Masala',      desc: 'Spiced chickpeas in tomato-onion gravy.',               price: 140, cat: 'Lunch'   },
  { name: 'Palak Paneer',      desc: 'Spinach and cottage cheese curry.',                     price: 180, cat: 'Dinner'  },
  { name: 'Mutton Pulao',      desc: 'Aromatic rice cooked with tender mutton.',              price: 320, cat: 'Dinner'  },
  { name: 'Saag',              desc: 'Mustard greens slow-cooked Punjabi style.',             price: 160, cat: 'Lunch'   },
  { name: 'Egg Bhurji',        desc: 'Spiced scrambled eggs, quick and filling.',             price: 100, cat: 'Breakfast'},
  { name: 'Fried Fish',        desc: 'Crispy river fish with chutney.',                       price: 260, cat: 'Dinner'  },
  { name: 'Seekh Kebab',       desc: 'Minced beef kebabs grilled on skewers.',                price: 200, cat: 'Snack'   },
  { name: 'Kheer',             desc: 'Creamy rice pudding with cardamom.',                    price: 90,  cat: 'Snack'   },
  { name: 'Paye',              desc: 'Slow-cooked trotters in spiced gravy.',                 price: 280, cat: 'Breakfast'},
  { name: 'Vegetable Curry',   desc: 'Seasonal vegetables in light curry sauce.',             price: 130, cat: 'Lunch'   },
  { name: 'Beef Qeema',        desc: 'Minced beef cooked with peas and spices.',              price: 190, cat: 'Dinner'  },
  { name: 'Lassi',             desc: 'Thick chilled yoghurt drink.',                          price: 60,  cat: 'Snack'   },
  { name: 'Roghni Naan',       desc: 'Buttery baked naan from tandoor.',                     price: 40,  cat: 'Snack'   },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────────
async function seedDummyData() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
      console.log('[Seeder] Connected to MongoDB');
    }

    const [existingStudents, existingHostels, existingKitchens] = await Promise.all([
      Student.countDocuments(),
      HostelOwner.countDocuments(),
      KitchenOwner.countDocuments(),
    ]);

    if (existingStudents >= 15 && existingHostels >= 15 && existingKitchens >= 15) {
      console.log('[Seeder] Dummy data already present — skipping.');
      return;
    }

    const defaultPassword = await bcrypt.hash('password123', 10);

    // ── 1. Students ────────────────────────────────────────────────────────────
    if (existingStudents < 15) {
      const students = STUDENTS_DATA.map((s, i) => ({
        first_name: s.first,
        last_name: s.last,
        email: `${s.first.toLowerCase()}.${s.last.toLowerCase()}${i}@student.sfs.pk`,
        password: defaultPassword,
        phone_number: `030${String(10000000 + i).padStart(8, '0').slice(-8)}`,
        cnic: `35202-${String(1234567 + i * 111).slice(0, 7)}-${i % 9}`,
        address: `${s.area}, Lahore`,
        gender: s.gender,
        profile_picture: hImg(i),
        email_verified: true,
        isBanned: false,
        status: 'active',
        role: 'student',
      }));
      await Student.insertMany(students, { ordered: false }).catch(() => {});
      console.log('[Seeder] ✓ 15 students seeded');
    } else {
      console.log('[Seeder] Students already present — skipping');
    }

    // ── 2. Hostel Owners + Hostels + Rooms + Beds ──────────────────────────────
    if (existingHostels < 15) {
      const uniCoords = await resolveDemoUniversityCoords();

      for (let i = 0; i < 15; i++) {
        const h = HOSTELS_DATA[i];
        const uni1 = UNIVERSITIES[h.nearby[0].uni];
        const uni2 = UNIVERSITIES[h.nearby[1].uni];
        const uni1Coords = uniCoords[uni1.name] || {};
        const uni2Coords = uniCoords[uni2.name] || {};
        const uni1Distance = formatDistanceKm(h, uni1Coords);
        const uni2Distance = formatDistanceKm(h, uni2Coords);
        const facilities = FACILITIES_SETS[i % FACILITIES_SETS.length];

        const hostelOwner = new HostelOwner({
          first_name: `Owner${i + 1}`,
          last_name: 'Sahib',
          email: `hostelowner${i + 1}@sfs.pk`,
          password: defaultPassword,
          phone_number: `031${String(10000000 + i).padStart(8, '0').slice(-8)}`,
          cnic: `35201-${String(2345678 + i * 111).slice(0, 7)}-${i % 9}`,
          address: `${h.area}, Lahore`,
          gender: i % 2 === 0 ? 'male' : 'female',
          profile_picture: hImg(i),
          hostel_name: h.hostel_name,
          hostel_address: h.hostel_address,
          hostel_lat: h.hostel_lat,
          hostel_lng: h.hostel_lng,
          hostel_type: h.hostel_type,
          hostel_description: `${h.hostel_name} provides comfortable and affordable accommodation for students in ${h.area}, Lahore.${uni1Distance ? ` Located approximately ${uni1Distance} from ${uni1.name}.` : ''} Clean rooms, 24/7 security, uninterrupted power supply, and a friendly environment for focused studies.`,
          hostel_picture: hImg(i + 2),
          facilities,
          nearby_institutes: [
            { university: uni1.name, distance: uni1Distance, university_lat: uni1Coords.lat, university_lng: uni1Coords.lng },
            { university: uni2.name, distance: uni2Distance, university_lat: uni2Coords.lat, university_lng: uni2Coords.lng },
          ],
          email_verified: true,
          isApproved: true,
          isBanned: false,
          status: 'active',
          role: 'hostelOwner',
          stripeAccountId: 'acct_demo_hostel',
          rooms: [],
        });

        await hostelOwner.save();

        const roomIds = [];
        for (let r = 0; r < 5; r++) {
          const rt = ROOM_TYPES[r];
          const room = new Room({
            name: `${rt.name} ${r + 1}`,
            capacity: rt.capacity,
            price: rt.price,
            availability: true,
            description: `${rt.name} with ${rt.capacity} bed(s). Includes attached bathroom, ${facilities.slice(0, 2).join(', ')}, and 24/7 electricity.`,
            imageUrls: [rImg(i + r), rImg(i + r + 1)],
            hostelId: hostelOwner._id,
            beds: [],
          });
          await room.save();

          const bedIds = [];
          for (let b = 0; b < rt.capacity; b++) {
            const bed = new Bed({ bed_number: b + 1, isBooked: false, roomId: room._id });
            await bed.save();
            bedIds.push(bed._id);
          }
          room.beds = bedIds;
          await room.save();
          roomIds.push(room._id);
        }

        hostelOwner.rooms = roomIds;
        await hostelOwner.save();
      }
      console.log('[Seeder] ✓ 15 hostel owners with rooms and beds seeded');
    } else {
      console.log('[Seeder] Hostel owners already present — skipping');
    }

    // ── 3. Kitchen Owners + Dishes ─────────────────────────────────────────────
    if (existingKitchens < 15) {
      for (let i = 0; i < 15; i++) {
        const k = KITCHENS_DATA[i];

        const kitchenOwner = new KitchenOwner({
          first_name: `Chef${i + 1}`,
          last_name: 'Bhai',
          email: `kitchen${i + 1}@sfs.pk`,
          password: defaultPassword,
          phone_number: `032${String(10000000 + i).padStart(8, '0').slice(-8)}`,
          cnic: `35200-${String(3456789 + i * 111).slice(0, 7)}-${i % 9}`,
          gender: i % 2 === 0 ? 'male' : 'female',
          profile_picture: hImg(i + 4),
          kitchen_name: k.name,
          address: k.address,
          kitchen_description: `${k.name} serves fresh, home-cooked desi food to students daily in ${k.area}, Lahore. Hygienic kitchen, affordable prices, and on-time service. Our menu features authentic Punjabi dishes prepared with quality ingredients.`,
          kitchen_picture: hImg(i + 1),
          email_verified: true,
          isApproved: true,
          isBanned: false,
          status: 'active',
          role: 'kitchenOwner',
          dishes: [],
        });
        await kitchenOwner.save();

        const dishIds = [];
        for (let d = 0; d < 5; d++) {
          const dt = ALL_DISHES[(i * 5 + d) % ALL_DISHES.length];
          const dish = new Dish({
            name: dt.name,
            description: dt.desc,
            price: dt.price,
            imageUrls: [hImg(i + d)],
            kitchenOwner: kitchenOwner._id,
            category: dt.cat,
            availability: true,
          });
          await dish.save();
          dishIds.push(dish._id);
        }
        kitchenOwner.dishes = dishIds;
        await kitchenOwner.save();
      }
      console.log('[Seeder] ✓ 15 kitchen owners with dishes seeded');
    } else {
      console.log('[Seeder] Kitchen owners already present — skipping');
    }

    console.log('[Seeder] ✅ All dummy data seeded!');
    console.log('[Seeder] Login password for all accounts: password123');

  } catch (err) {
    console.error('[Seeder] ❌ Error:', err.message);
  }
}

// Standalone run
if (require.main === module) {
  (async () => {
    await seedDummyData();
    await mongoose.disconnect();
    process.exit(0);
  })();
}

module.exports = seedDummyData;
