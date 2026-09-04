// controllers/studentcontroller/profile.js
const Student = require('../../models/student/Student');

// Fetch student profile - returns all fields needed by StudentProfile and food Checkout
exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findById(studentId)
      .select('first_name last_name email phone_number address gender cnic profile_picture student_id');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
