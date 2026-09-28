import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaPaperPlane } from 'react-icons/fa';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/common/SEO";
import API_BASE_URL from "../utils/api";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const SUBJECT_OPTIONS = [
    'General Inquiry',
    'Booking Issue',
    'Payment Problem',
    'Account / Login Issue',
    'Hostel Complaint',
    'Kitchen / Food Complaint',
    'Report a Bug',
    'Other',
  ];

  useEffect(() => {

    axios.get(`${API_BASE_URL}/auth/me`).then(({ data }) => {
        const parsedUser = data.user;
        setIsAuthenticated(true);
        setFormData((prev) => ({
          ...prev,
          name: `${parsedUser.first_name || parsedUser.firstName || ''} ${parsedUser.last_name || parsedUser.lastName || ''}`.trim(),
          phone: parsedUser.phone_number || parsedUser.phone || prev.phone,
          email: parsedUser.email || prev.email }));
    }).catch(() => setIsAuthenticated(false));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isAuthenticated) {
      setError('Please log in to submit a complaint.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/contact/submit`, formData, {
        headers: { } });
      setSubmitted(true);
      setFormData({ name: formData.name, phone: formData.phone, email: formData.email, subject: 'General Inquiry', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E201E] min-h-screen">
      <SEO
        title="Contact Us"
        description="Get in touch with Student Facility System for questions about hostel bookings, food orders, or account support."
      />
      <Navbar module="home" />
      <div className="relative bg-cover bg-center" style={{ backgroundImage:`url('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=60')`, height:'350px' }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white text-4xl font-bold">Contact Us</h1>
          <p className="text-gray-300 mt-2 text-lg">We are here to help — reach out any time</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <div className="space-y-5">
              {[
                { icon: <FaUser />, label: 'Developer', value: 'Aqib Awan (Aqib Ejaz)', href: 'https://aqibawan2003.vercel.app', external: true },
                { icon: <FaEnvelope />, label: 'Email', value: 'aqibawan0102@gmail.com', href: 'mailto:aqibawan0102@gmail.com' },
                { icon: <FaPhone />, label: 'Phone', value: '+92-310-4693600', href: 'tel:+923104693600' },
                { icon: <FaMapMarkerAlt />, label: 'Location', value: 'Shalimar College, Lahore, Pakistan' },
                { icon: <FaClock />, label: 'Support Hours', value: 'Monday to Saturday, 9 AM to 6 PM PKT' },
              ].map(({ icon, label, value, href, external }) => (
                <div key={label} className="flex items-start gap-4 bg-[#25292e] rounded-xl p-4">
                  <span className="text-2xl mt-0.5">{icon}</span>
                  <div>
                    <p className="font-semibold">{label}</p>
                    {href
                      ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="text-blue-400 hover:text-blue-300 transition">{value}</a>
                      : <p className="text-gray-400">{value}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#25292e] shadow-lg rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">Send a Message</h2>
            {!isAuthenticated && (
              <div className="mb-4 p-3 bg-yellow-900 border border-yellow-500 text-yellow-200 rounded-lg text-center">
                You must be logged in to submit a complaint. <a href="/loginform" className="underline">Login here</a>.
              </div>
            )}
            {submitted && <div className="mb-4 p-3 bg-green-900 border border-green-500 text-green-300 rounded-lg text-center">Message sent successfully! We will get back to you soon.</div>}
            {error && <div className="mb-4 p-3 bg-red-900 border border-red-500 text-red-300 rounded-lg text-center">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Your Name', name: 'name', type: 'text', placeholder: 'Your name', disabled: true },
                { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+92-300-0000000', disabled: true },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', disabled: true },
              ].map(({ label, name, type, placeholder, disabled }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                  <input type={type} name={name} value={formData[name]} onChange={handleChange} required
                    disabled={disabled}
                    className="w-full bg-[#1E201E] border border-[#59636e] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#697565] disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <select name="subject" value={formData.subject} onChange={handleChange} required
                  className="w-full bg-[#1E201E] border border-[#59636e] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#697565]">
                  {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={4}
                  className="w-full bg-[#1E201E] border border-[#59636e] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#697565] resize-none"
                  placeholder="How can we help you?" />
              </div>
              <button type="submit" disabled={loading || !isAuthenticated} className="w-full bg-[#697565] hover:bg-[#3C3D37] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <FaPaperPlane /> {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
