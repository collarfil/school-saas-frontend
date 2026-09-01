import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/register/check-super-admin');
        
        if (res.data.super_admin_exists) {
          return;
        } else {
          navigate('/register/super-admin');
        }
      } catch (err) {
        console.error('System status check failed:', err);
        console.log('Showing home page despite check failure');
      }
    };

    checkSystemStatus();
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1920&q=80')",
        }}
      ></div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6 text-center">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Empowering Education with Smart Technology
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-gray-300 max-w-3xl mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Manage your students, teachers, fees, and results all in one
          intelligent platform designed for schools of the future.
        </motion.p>

        <motion.a
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition"
          whileHover={{ scale: 1.05 }}
        >
          Get Started
        </motion.a>
      </div>

      {/* Carousel */}
      <div className="absolute bottom-0 w-full pb-10">
        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          interval={4000}
        >
          <div>
            <p className="text-lg text-gray-200">
              "Our school's operations became 3x faster after adopting this
              system!"
            </p>
          </div>
          <div>
            <p className="text-lg text-gray-200">
              "Fee management and result tracking made easy — simply powerful."
            </p>
          </div>
          <div>
            <p className="text-lg text-gray-200">
              "Designed for schools that value innovation and growth."
            </p>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default Home;