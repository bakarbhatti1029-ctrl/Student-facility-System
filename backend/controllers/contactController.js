const ContactMessage = require('../models/ContactMessage');
const { getUserModel } = require('../utils/Utils');
const sendEmail = require('../utils/emailService');

// Submit a contact form message — saves to DB and emails the site owner
exports.submitContactMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const { id: userId, role: userRole } = req.user || {};

    let name = req.body.name;
    let phone = req.body.phone;
    let email = req.body.email;

    if (userId && userRole) {
      const UserModel = getUserModel(userRole);
      if (UserModel) {
        const user = await UserModel.findById(userId).lean();
        if (user) {
          const fullName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim();
          name = fullName || name;
          phone = user.phone_number || user.phone || phone;
          email = user.email || email;
        }
      }
    }

    if (!name || !phone || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Always save to DB first — this is the source of truth, email is best-effort
    const contactMessage = await ContactMessage.create({
      name,
      phone,
      email,
      subject: subject || 'General Inquiry',
      message,
      userId,
      userRole,
      userName: name,
      userEmail: email,
      userPhone: phone,
    });

    // Try to email the site owner — failure here should not fail the request,
    // since the message is already safely stored in the database
    let emailSent = false;
    try {
      const ownerEmail = process.env.CONTACT_NOTIFY_EMAIL || process.env.EMAIL;
      const emailSubject = `[${contactMessage.subject}] New Contact Message from ${name}`;
      const text = `
You received a new message from the Contact Us page.

Subject: ${contactMessage.subject}
Name: ${name}
Phone: ${phone}
Email: ${email}

Message:
${message}

Submitted: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
      `.trim();

      await sendEmail(ownerEmail, emailSubject, text);
      emailSent = true;
      contactMessage.emailSent = true;
      await contactMessage.save();
    } catch (emailErr) {
      console.error('Contact form email failed (message still saved to DB):', emailErr.message);
    }

    return res.status(201).json({
      message: 'Message sent successfully! We will get back to you soon.',
      emailSent,
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    return res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
};

// Admin: list all contact messages, newest first
exports.getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

// Admin: mark a message as read / resolved
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['new', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const updated = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Message not found.' });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating contact message:', error);
    return res.status(500).json({ message: 'Failed to update message.' });
  }
};

// Admin: delete a contact message
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Message not found.' });
    return res.status(200).json({ message: 'Message deleted.' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return res.status(500).json({ message: 'Failed to delete message.' });
  }
};
