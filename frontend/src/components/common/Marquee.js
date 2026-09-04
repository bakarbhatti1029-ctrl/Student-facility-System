import React from "react";

const Marquee = ({ text, className = "" }) => {
  return (
    <div
      className={`w-full text-white overflow-hidden whitespace-nowrap py-2 border-b border-[rgba(35,83,138,1)] ${className}`}
      style={{
        background:
          "linear-gradient(to bottom, rgba(167,207,223,1) 0%, rgba(35,83,138,1) 64%)",
      }}
    >
      <div className="flex animate-marquee hover:[animation-play-state:paused] w-max">
        <span className="mx-8 text-sm sm:text-base font-semibold">{text}</span>
        <span className="mx-8 text-sm sm:text-base font-semibold">{text}</span>
      </div>
    </div>
  );
};

export default Marquee;
