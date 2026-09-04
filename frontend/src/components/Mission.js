import React from "react";

const Mission = () => {
  return (
    <section className="mission-section p-4 mt-12 bg-[#25292e] border border-[#59636e] border-b border-gray-600">
      <h2 className="text-3xl font-bold text-white text-center pt-24 pb-24">
        Our Mission
      </h2>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Hostel Card */}
        <div className="card bg-[#1E201E] border-2 border-[#59636e] w-full md:w-[48%] h-auto shadow-md p-6 rounded-md text-white transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-[#aa828f]/50">
          <h3 className="text-2xl font-bold mb-4">Hostel Facility</h3>
          <p>
            Our hostel facility is designed to meet the needs of students,
            especially those coming from out of the city. We offer the
            convenience of booking hostels near their university from the
            comfort of their homes, allowing students to secure their
            accommodation before arriving on campus. Each hostel is fully
            furnished and equipped with modern amenities, providing a safe and
            comfortable environment where students can focus on their studies.
            Located close to universities and public transport, our hostels
            ensure easy access to campus life. Additionally, we provide
            round-the-clock support to ensure a smooth move-in process and a
            hassle-free stay throughout the academic year. With security,
            student welfare, and flexible room options, our hostels offer the
            perfect balance of comfort, convenience, and peace of mind.
          </p>
        </div>

        {/* Homemade Food Card */}
        <div className="card bg-[#1E201E] border-2 border-[#59636e] w-full md:w-[48%] h-auto shadow-md p-6 rounded-md text-white transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-[#6d8aa0]/50">
          <h3 className="text-2xl font-bold mb-4">Homemade Food Facilities</h3>
          <p>
            We understand the importance of maintaining a healthy lifestyle
            while studying, which is why we offer a homemade food service for
            our hostel residents. Our meals are freshly prepared by trusted
            local kitchens and delivered straight to students, ensuring they
            have access to nutritious and delicious food every day. Whether it’s
            breakfast, lunch, or dinner, we cater to a variety of tastes and
            dietary preferences, all while keeping the quality and freshness of
            homemade cooking. Our goal is to make sure students stay
            well-nourished and energized, so they can focus on their academic
            success. With affordable meal plans, flexible options, and the
            convenience of daily deliveries, we make eating healthy both easy
            and accessible for busy students.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Mission;
