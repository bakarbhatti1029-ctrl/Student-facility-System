import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaUser, FaHome, FaInfoCircle, FaBuilding, FaUtensils } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#1E201E] border-t border-gray-600 pt-12 text-white py-10">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-5">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold mb-4">Student Facility System</h2>
          <p className="text-sm text-gray-400">Connecting students with quality hostel accommodations and homemade food services across Lahore.</p>
          <p className="text-xs text-gray-500 mt-3">Final Year Project — Shalimar College, Lahore</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-gray-400 hover:text-white transition flex items-center gap-2"><FaHome /> Home</Link></li>
            <li><Link to="/AboutUs" className="text-gray-400 hover:text-white transition flex items-center gap-2"><FaInfoCircle /> About Us</Link></li>
            <li><Link to="/hostel-booking" className="text-gray-400 hover:text-white transition flex items-center gap-2"><FaBuilding /> Hostel Booking</Link></li>
            <li><Link to="/home-made-food" className="text-gray-400 hover:text-white transition flex items-center gap-2"><FaUtensils /> Homemade Food</Link></li>
            <li><Link to="/ContactUs" className="text-gray-400 hover:text-white transition flex items-center gap-2"><FaPhone /> Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="flex items-center gap-2"><FaMapMarkerAlt /> Shalimar College, Lahore, Pakistan</p>
            <p className="flex items-center gap-2"><FaEnvelope /><a href="mailto:aqibawan0102@gmail.com" className="hover:text-white transition">aqibawan0102@gmail.com</a></p>
            <p className="flex items-center gap-2"><FaPhone /><a href="tel:+923104693600" className="hover:text-white transition">+92-310-4693600</a></p>
            <p className="mt-2 font-medium text-white flex items-center gap-2"><FaUser /> Aqib Awan (Aqib Ejaz)</p>
          </div>
        </div>
      </div>
      <div className="text-center mt-8 border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Student Facility System. Developed by <a href="mailto:aqibawan0102@gmail.com" className="text-gray-400 hover:text-white transition">Aqib Awan</a>. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
