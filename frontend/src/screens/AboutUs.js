import React from "react";

import Footer from "../components/Footer";
import Mission from "../components/Mission";
import Reviews from "../components/reviews";
import HeroSection from "../components/Hero";
import Navbar from "../components/Navbar";
import SEO from "../components/common/SEO";

const AboutUs = () => {
  return (
    <div className="bg-[#1E201E]">
      <SEO
        title="About Us"
        description="Learn about Student Facility System, a platform connecting students in Lahore with hostels and homemade food kitchens."
      />
      <Navbar module={"home"} />
      {/* Background Image with Text */}
      <div
        className="relative bg-cover bg-center h-screen"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGlsbHVzdHJhdGlvbiUyMGJhY2tncm91bmQlMjAlMjBwaWMlMjBmb3IlMjBhYm91dCUyMHVzJTIwcGFnZSUyMHdpdGglMjBhJTIwaG9zdGVsJTIwYW5kJTIwa2l0Y2hlbiUyMHBpY3R1cmV8ZW58MHx8MHx8fDA%3D')",
          height: "500px" }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">About Us</h1>
          <div className="text-white pt-4 max-w-2xl">
            <p className="text-white text-center">
              At our core, we provide students with everything they need to thrive,
            </p>
            <p className="text-center">
               offering comfortable accommodations near universities and
              fresh,
            </p>
            <p className="text-center">homemade meals to support their health and success</p>
          </div>
        </div>
      </div>

      {/* Mission Component */}
      <div className="bg-[#1E201E]">
      <div className='container mt-8 md:mt-24  bg-[#25292e] border border-[#59636e]  rounded-lg mx-auto flex flex-col '>
        
        <HeroSection />
        
        <Mission />
        <Reviews /> 
      </div>
</div>
      <Footer />
    </div>
  );
};

export default AboutUs;
