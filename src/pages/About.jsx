// src/pages/About.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  Target,
  Award,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function About() {
  const values = [
    {
      icon: <Target className="w-8 h-8 text-indigo-400" />,
      title: "Our Mission",
      description:
        "To empower schools with modern technology that simplifies administration, improves learning outcomes, and connects every stakeholder in the education ecosystem.",
    },
    {
      icon: <Award className="w-8 h-8 text-yellow-400" />,
      title: "Our Vision",
      description:
        "A future where every school — from single-classroom setups to large multi-campus institutions — runs on intelligent, affordable, and reliable software.",
    },
    {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      title: "Our Promise",
      description:
        "Secure data, transparent pricing, and a platform built with the realities of African schools in mind — no over-promises, just tools that work.",
    },
  ];

  const highlights = [
    "Built for multi-tenant school management",
    "Handles admissions, fees, results, and more",
    "Integrated online payment gateways",
    "Real-time dashboards for every role",
    "Scalable for single schools and school groups",
    "Designed with a modern, intuitive interface",
  ];

  return (
   <div className="min-h-screen w-full bg-slate-900 text-white">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm mb-6"
          >
            <GraduationCap className="w-4 h-4" />
            About Our Platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            Smart School Management{" "}
            <span className="text-indigo-400">Made Simple</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            We build tools that help schools focus on what matters most — teaching and
            learning — by automating the administrative burden.
          </motion.p>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 hover:border-indigo-500/50 transition"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">
              What Makes Us Different
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "100%", label: "Cloud Based" },
            { value: "24/7", label: "Availability" },
            { value: "6+", label: "User Roles" },
            { value: "∞", label: "Scalability" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 text-center"
            >
              <p className="text-3xl font-bold text-indigo-400 mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-10">
          <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to modernize your school?
          </h2>
          <p className="text-gray-300 mb-6">
            Explore our features or reach out to learn how we can help your institution.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Explore Features
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}