import React from "react";

const Marquee = ({ text, className = "" }) => {
  return (
    <div
      className={`w-full text-white overflow-hidden whitespace-nowrap py-2 border-b border-[#5a6a5a] ${className}`}
      style={{
        background:
          "linear-gradient(to bottom, rgba(152, 169, 152, 0.8) 0%, rgba(105, 117, 101, 1) 64%)" }}
    >
      <div className="flex animate-marquee hover:[animation-play-state:paused] w-max">
        <span className="mx-8 text-sm sm:text-base font-semibold">{text}</span>
        <span className="mx-8 text-sm sm:text-base font-semibold">{text}</span>
      </div>
    </div>
  );
};

export default Marquee;
