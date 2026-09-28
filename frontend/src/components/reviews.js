import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules"; // Correct import of Navigation module
import "swiper/css"; // Core Swiper styles
import "swiper/css/navigation"; // Swiper Navigation styles
import { FaStar } from "react-icons/fa"; // Import FontAwesome star icon

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const reviewsData = [
  {
    id: 1,
    name: "John Doe",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBl97nFLorG3ZPgZ8Kme4YadR3O-RAIRn74gOyMuYZFCrsPgg3IKov1vZ1-jOlgdAlQYg&usqp=CAU",
    review:
      "Booking my hostel near the university from home was such a relief! The process was smooth, and the hostel is even better than I expected. It’s cozy, secure, and super close to campus. It’s been a great experience so far!",
    rating: 4.5,
    date: "2023-09-10" },
  {
    id: 2,
    name: "Jane Smith",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRexo_WFhMwaXkLM3XKlVqxD8nitpZlS8HpDkfjZyg4bcjNfRnWP72soV2CWSDuEDn5Fog&usqp=CAU",
    review:
      "As an out-of-city student, I was worried about finding the right accommodation, but this hostel facility made everything easy. The staff is supportive, and the amenities are fantastic. I can focus on my studies without any distractions.",
    rating: 5,
    date: "2023-09-05" },
  {
    id: 3,
    name: "Alice Johnson",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpFuVdBXSr-dNzWMRUya1PocqgluQWwklH0JNStNwwR8J9UxMsje_heF0XqYBlgFuPaeA&usqp=CAU",
    review:
      "The hostel environment is so peaceful and well-maintained. The convenience of being close to the university makes a big difference. I feel safe, and I’ve made some great friends here too.",
    rating: 4,
    date: "2023-09-01" },
  {
    id: 4,
    name: "Michael Brown",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSewGOTANlYupzhNfra1p0av17U5dboKP3GDi70rxqBOHKb1nCSLxX3um69ckeQaeIbdg8&usqp=CAU",
    review:
      "The homemade food service is a lifesaver! I don’t have to worry about cooking or finding healthy meals. The food is always fresh, tasty, and delivered on time. It’s the perfect solution for students like me with busy schedules.",
    rating: 4.8,
    date: "2023-08-28" },
  {
    id: 5,
    name: "Emma Wilson",
    image:
      "https://media.istockphoto.com/id/1364917563/photo/businessman-smiling-with-arms-crossed-on-white-background.jpg?s=612x612&w=0&k=20&c=NtM9Wbs1DBiGaiowsxJY6wNCnLf0POa65rYEwnZymrM=",
    review:
      "The homemade food service is one of the best parts of staying here. The meals are delicious and remind me of home. It’s great to know I’m eating healthy, even on the busiest days. I highly recommend it!",
    rating: 5,
    date: "2023-08-22" },
  {
    id: 6,
    name: "Chris Green",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKCqDcZcE5S-fTen3PpfRUUDg-CuvWhGoekxHzDwVP1NiXPDdX25kajTBTpcq_oT9eRHk&usqp=CAU",
    review:
      "The homemade food delivery is incredibly convenient and affordable. The meals are well-balanced, and the variety keeps things interesting. It’s such a relief not to worry about cooking while managing my studies!",
    rating: 4.2,
    date: "2023-08-15" },
];

const Reviews = () => {
  // Real reviews submitted by students (loaded from the backend).
  const [realReviews, setRealReviews] = useState([]);

  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_BASE_URL}/api/reviews/recent`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) setRealReviews(res.data);
      })
      .catch(() => {
        // If the request fails, we simply show the built-in testimonials below.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Real reviews first, then the built-in testimonials (never removed).
  // Every item uses the exact same card shape, so the design is unchanged.
  const allReviews = [...realReviews, ...reviewsData];

  return (
    <section className="reviews-section border bg-[#25292e] border-b border-[#59636e] mt-12 w-full h-full relative">
      <h2 className="text-3xl font-bold text-center mb-8 pt-12 text-white">
        What Our Users Say
      </h2>
      <div className="flex justify-center mb-20 mt-24 items-center w-full h-full">
        <Swiper
          spaceBetween={20}
          slidesPerView={3}
          loop={true}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev" }}
          modules={[Navigation]} // Use the Navigation module
          breakpoints={{
            320: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 } }}
          className="w-full max-w-5xl"
        >
          {allReviews.map((review) => (
            <SwiperSlide
              key={review.id}
              className="bg-[#1E201E] border-2 border-[#59636e] shadow-md rounded-md mb-10 text-white flex flex-col items-center justify-between text-center p-4 transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl hover:shadow-[#aa828f]/50"
              style={{ height: "500px", width: "min(300px, 85vw)" }} // Adjusted height and width for better display
            >
              <div className="flex relative flex-col items-center justify-center h-full">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-24 h-24 mt-12 rounded-full mb-4 object-cover"
                />
                <h3 className="text-xl font-bold mb-1">{review.name}</h3>
                {review.targetName && (
                  <p className="text-xs text-[#a5b68d] mb-2">
                    {review.targetType === "kitchen" ? "Kitchen: " : "Hostel: "}
                    {review.targetName}
                  </p>
                )}
                <p className="flex-grow mb-4">{review.review}</p>
              </div>

              {/* Rating Stars */}
             
              <div className="flex absolute left-0 right-0 justify-center bottom-2 items-center mb-2 pb-12">
                {[...Array(5)].map((_, index) => (
                  <FaStar
                    key={index}
                    color={index < Math.floor(review.rating) ? "#FFD700" : "#ccc"}
                  />
                ))}
                <span className="ml-2">({review.rating})</span>
               
              </div>
        

              {/* Date of Review */}
            </SwiperSlide>
          ))}

          {/* Custom Navigation Buttons */}
          <div className="swiper-button-next"></div>
          <div className="swiper-button-prev"></div>
        </Swiper>
      </div>

      <style>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: #59636e;
          transition: color 0.3s;
          position: absolute; /* Make the buttons position absolute */
          top: 50%; /* Center vertically */
          transform: translateY(-50%); /* Adjust vertical positioning */
          z-index: 20; /* Ensure buttons are above the Swiper */
          width: 30px; /* Adjust width for better click area */
          height: 30px; /* Adjust height for better click area */
        }

        .swiper-button-next {
          right: 0; /* Position to the right edge of the card */
        }

        .swiper-button-prev {
          left: 0; /* Position to the left edge of the card */
        }

        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          color: #a5b68d; /* Change color on hover */
        }
      `}</style>
    </section>
  );
};

export default Reviews;
