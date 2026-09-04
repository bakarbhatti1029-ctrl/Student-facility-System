import React from 'react';
import HostelNavbar from './HostelOwnerNavbar';
import BookingChart from './BookingChart';

const HostelOwnerDashboard = () => {
  return (
    <div className="bg-[#1E201E] min-h-screen flex">
      <HostelNavbar />
      <main className="mt-4 ml-6 mr-6 pt-20 md:pt-4 flex-1 text-white">
        <p className="mb-4 text-4xl font-bold">Booking chart</p>
        <div className="h-[500px] w-full overflow-x-auto">
          <BookingChart />
        </div>
      </main>
    </div>
  );
};

export default HostelOwnerDashboard;
