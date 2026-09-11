// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { 
  Menu, 
  X, 
  ChevronDown, 
  GraduationCap, 
  FileCheck, 
  Search,
  LogOut,
  User
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admissionDropdownOpen, setAdmissionDropdownOpen] = useState(false);
  const [mobileAdmissionOpen, setMobileAdmissionOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!token;

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/register/check-super-admin');
        if (res.data.super_admin_exists) return;
        navigate('/register/super-admin');
      } catch (err) {
        console.error('System status check failed:', err);
      }
    };
    checkSystemStatus();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdmissionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getDashboardPath = () => {
    const role = user?.role;
    if (role === 'super_admin') return '/super-admin/dashboard';
    if (role === 'admin') return '/school/dashboard';
    if (role === 'employee') {
      return user?.employee_type === 'teaching' ? '/employee/dashboard' : '/account/dashboard';
    }
    if (role === 'student') return '/student/dashboard';
    if (role === 'parent') return '/parent/dashboard';
    return '/login';
  };

  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Schools', path: '/schools' },
  ];

  // ✅ CORRECT PATHS matching your AppRouter.jsx
  const admissionLinks = [
    { 
      name: 'Apply for Admission', 
      path: '/admission/apply', 
      icon: <GraduationCap className="w-4 h-4" />,
      description: 'Start a new admission application'
    },
    { 
      name: 'Check Admission List', 
      path: '/admission/lists', 
      icon: <FileCheck className="w-4 h-4" />,
      description: 'View list of admitted students'
    },
    { 
      name: 'Check Application Status', 
      path: '/admission/status', 
      icon: <Search className="w-4 h-4" />,
      description: 'Track your application progress'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1920&q=80')",
        }}
      ></div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black"></div>

      {/* NAVIGATION BAR */}
      <nav className="relative z-30 w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/ohis.png" alt="Logo" className="h-12 drop-shadow-lg" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'text-white border-b-2 border-indigo-500 pb-1'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Admission Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAdmissionDropdownOpen(!admissionDropdownOpen)}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    location.pathname.startsWith('/admission')
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Admission
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      admissionDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {admissionDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 right-0 w-72 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                  >
                    <div className="py-2">
                      {admissionLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setAdmissionDropdownOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 mt-0.5">
                            {link.icon}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{link.name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{link.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Login/Logout Top Right */}
            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition text-sm"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden mt-4 bg-slate-800/95 backdrop-blur-md rounded-xl p-4 border border-slate-700"
            >
              <div className="flex flex-col gap-2">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"
                  >
                    {link.name}
                  </Link>
                ))}

                <div>
                  <button
                    onClick={() => setMobileAdmissionOpen(!mobileAdmissionOpen)}
                    className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"
                  >
                    <span>Admission</span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${
                        mobileAdmissionOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  
                  {mobileAdmissionOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {admissionLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileAdmissionOpen(false);
                          }}
                          className="flex items-center gap-2 text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-700/50 text-sm"
                        >
                          {link.icon}
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-3 mt-2">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-700/50"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full text-red-400 hover:text-red-300 py-2 px-3 rounded-lg hover:bg-red-500/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* HERO CONTENT - Clean, No buttons */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-200px)] w-full px-6 text-center">
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Empowering Education with{" "}
          <span className="text-indigo-400">Smart Technology</span>
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
      </div>

      {/* Carousel */}
      <div className="absolute bottom-0 w-full pb-6 z-20">
        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          showIndicators={true}
          interval={4000}
          className="max-w-3xl mx-auto px-4"
        >
          <div>
            <p className="text-lg text-gray-200 italic">
              "Our school's operations became 3x faster after adopting this system!"
            </p>
            <p className="text-sm text-gray-400 mt-2">— Principal, ABC School</p>
          </div>
          <div>
            <p className="text-lg text-gray-200 italic">
              "Fee management and result tracking made easy — simply powerful."
            </p>
            <p className="text-sm text-gray-400 mt-2">— Administrator, XYZ Academy</p>
          </div>
          <div>
            <p className="text-lg text-gray-200 italic">
              "Designed for schools that value innovation and growth."
            </p>
            <p className="text-sm text-gray-400 mt-2">— Founder, Future Schools</p>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default Home;