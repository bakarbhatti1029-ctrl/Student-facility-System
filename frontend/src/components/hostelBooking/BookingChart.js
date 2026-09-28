import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BookingChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {

        const res = await axios.get(`${API_BASE_URL}/api/bookings/monthly-stats`, {
          headers: { } });
        setData(res.data.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load booking stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p className="text-white">Loading booking chart...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {/* Display month names on the X-axis */}
          <XAxis dataKey="month" />
          {/* Display bookings count on the Y-axis */}
          <YAxis allowDecimals={false} label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {/* Line for booking data */}
          <Line type="monotone" dataKey="bookings" stroke="#82ca9d" fill="#82ca9d" />
          <Brush />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingChart;
