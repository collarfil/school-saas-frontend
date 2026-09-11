// src/pages/Schools.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  School,
  Users,
  GraduationCap,
  MapPin,
  Loader2,
  Search,
  Building,
  ArrowRight,
} from "lucide-react";

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await axios.get(`${baseURL}/api/public/schools`);
        const list = res.data?.data || res.data || [];
        setSchools(Array.isArray(list) ? list : []);
        setFiltered(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load schools:", err);
        // Fallback: empty list
        setSchools([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(schools);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      schools.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      )
    );
  }, [query, schools]);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      {/* Hero */}
      <section className="px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-1.5 rounded-full text-sm mb-6"
          >
            <Building className="w-4 h-4" />
            Our Growing Network
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            Schools Using <span className="text-indigo-400">Our Platform</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Join a growing community of forward-thinking institutions.
          </motion.p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schools by name or location..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* Schools Grid */}
      <section className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/60 border border-slate-700 rounded-2xl">
              <School className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {query
                  ? "No schools match your search."
                  : "No schools available yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((school, i) => (
                <motion.div
                  key={school.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 transition"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {school.logo ? (
                      <img
                        src={school.logo}
                        alt={school.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <School className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">
                        {school.name}
                      </h3>
                      {school.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{school.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {school.owner && (
                    <p className="text-sm text-gray-400 mb-3">
                      <span className="text-gray-500">Owner:</span> {school.owner}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-10">
          <GraduationCap className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Want your school listed here?
          </h2>
          <p className="text-gray-300 mb-6">
            Get started today and join our growing network of schools.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admission/apply"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              <Users className="w-4 h-4" />
              Apply for Admission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}