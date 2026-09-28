const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const HostelOwner = require('./models/hostelowner/Hostelowner');
const Room = require('./models/hostelowner/Hostelroom');
const Bed = require('./models/hostelowner/RoomBed');
const bcrypt = require('bcryptjs');

// Connect to MongoDB - uses the same MONGODB_URI as the real server so this
// seeds whichever database your .env points at (local or Atlas), instead of
// always hitting a hardcoded local instance.
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_facility')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample data
const hostels = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('password123', 10),
    phone_number: '1234567890',
    cnic: '1234567890123',
    gender: 'male',
    hostel_name: 'GC Hostel 1',
    hostel_address: 'Gulberg 1, Lahore',
    hostel_lat: 31.5106,
    hostel_lng: 74.3531,
    hostel_type: 'Male',
    hostel_description: 'A comfortable hostel for male students',
    hostel_picture: 'https://example.com/hostel1.jpg',
    facilities: ['Wi-Fi', 'Parking', 'Air Conditioning'],
    nearby_institutes: [
      {
        university: 'GC University',
        distance: '1.5km',
        university_lat: 31.5731518,
        university_lng: 74.3083536
      }
    ],
    email_verified: true
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    password: bcrypt.hashSync('password123', 10),
    phone_number: '0987654321',
    cnic: '3210987654321',
    gender: 'female',
    hostel_name: 'GC Hostel 2',
    hostel_address: 'Gulberg 2, Lahore',
    hostel_lat: 31.5156,
    hostel_lng: 74.3551,
    hostel_type: 'Female',
    hostel_description: 'A comfortable hostel for female students',
    hostel_picture: 'https://example.com/hostel2.jpg',
    facilities: ['Wi-Fi', 'Parking', 'Laundry'],
    nearby_institutes: [
      {
        university: 'GC University',
        distance: '2.5km',
        university_lat: 31.5731518,
        university_lng: 74.3083536
      }
    ],
    email_verified: true
  },
  {
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike@example.com',
    password: bcrypt.hashSync('password123', 10),
    phone_number: '5678901234',
    cnic: '5678901234567',
    gender: 'male',
    hostel_name: 'GC Hostel 3',
    hostel_address: 'Gulberg 3, Lahore',
    hostel_lat: 31.5176,
    hostel_lng: 74.3571,
    hostel_type: 'Mixed',
    hostel_description: 'A comfortable hostel for all students',
    hostel_picture: 'https://example.com/hostel3.jpg',
    facilities: ['Wi-Fi', 'Meals', 'Gym'],
    nearby_institutes: [
      {
        university: 'GC University',
        distance: '3.5km',
        university_lat: 31.5731518,
        university_lng: 74.3083536
      }
    ],
    email_verified: true
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await HostelOwner.deleteMany({});
    await Room.deleteMany({});
    await Bed.deleteMany({});

    console.log('Cleared existing data');

    // Create hostels and associated rooms
    for (const hostelData of hostels) {
      const hostel = await HostelOwner.create(hostelData);
      console.log(`Created hostel: ${hostel.hostel_name}`);

      // Create rooms for each hostel
      for (let i = 1; i <= 3; i++) {
        const room = await Room.create({
          name: `Room ${i}`,
          capacity: 4,
          price: 10000 + (i * 1000),
          availability: true,
          description: `Room ${i} in ${hostel.hostel_name}`,
          imageUrls: ['https://example.com/room.jpg'],
          hostelId: hostel._id
        });

        // Add room to hostel's rooms array
        hostel.rooms.push(room._id);
        
        console.log(`Created room: ${room.name} in ${hostel.hostel_name}`);

        // Create beds for each room
        for (let j = 1; j <= room.capacity; j++) {
          const bed = await Bed.create({
            bed_number: j,
            isBooked: false,
            roomId: room._id
          });
          
          // Add bed to room's beds array
          room.beds.push(bed._id);
          console.log(`Created bed: ${bed.bed_number} in ${room.name}`);
        }
        
        // Save the room with its beds
        await room.save();
      }
      
      // Save the hostel with its rooms
      await hostel.save();
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
