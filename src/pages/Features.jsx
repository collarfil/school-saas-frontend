// src/pages/Features.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Wallet,
  FileText,
  Calendar,
  BookOpen,
  BarChart3,
  Shield,
  Globe,
  MessageCircle,
  CreditCard,
  Briefcase,
  Video,
  ClipboardList,
  Settings,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function Features() {
  const featureGroups = [
    {
      title: "Student Management",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      items: [
        "Student enrollment & admissions",
        "Guardian/parent linking",
        "Student profiles & documents",
        "Class & grade assignment",
      ],
    },
    {
      title: "Academic Management",
      icon: <BookOpen className="w-6 h-6" />,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      items: [
        "Sessions, terms & sections",
        "Grades, subjects & curriculum",
        "Timetables & schedules",
        "Results & report cards",
      ],
    },
    {
      title: "Finance & Fees",
      icon: <Wallet className="w-6 h-6" />,
      color: "text-green-400",
      bg: "bg-green-500/20",
      items: [
        "Fee setup per grade",
        "Online fee payments (Paystack, Flutterwave)",
        "Offline payments & receipts",
        "Income & expense tracking",
      ],
    },
    {
      title: "Employee Management",
      icon: <Briefcase className="w-6 h-6" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
      items: [
        "Teaching & non-teaching staff",
        "Role-based access control",
        "Employee-subject assignment",
        "Attendance tracking",
      ],
    },
    {
      title: "Communication",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
      items: [
        "Live chat between users",
        "WhatsApp integration",
        "Announcements & notifications",
        "Parent-teacher association (PTA)",
      ],
    },
    {
      title: "Online Learning",
      icon: <Video className="w-6 h-6" />,
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      items: [
        "Live classes & meetings",
        "Assignments & submissions",
        "Recorded sessions",
        "Whiteboards & polls",
      ],
    },
    {
      title: "CBT & Exams",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
      items: [
        "Computer-based tests",
        "Exam sessions & types",
        "Automated grading",
        "Instant results",
      ],
    },
    {
      title: "Reports & Analytics",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
      items: [
        "Financial reports",
        "Academic performance",
        "Employee reports",
        "Custom analytics dashboards",
      ],
    },
    {
      title: "Security & Roles",
      icon: <Shield className="w-6 h-6" />,
      color: "text-red-400",
      bg: "bg-red-500/20",
      items: [
        "Multi-tenant architecture",
        "JWT authentication",
        "Encrypted gateway keys",
        "Granular permissions",
      ],
    },
    {
      title: "Payments Integration",
      icon: <CreditCard className="w-6 h-6" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      items: [
        "Paystack integration",
        "Flutterwave integration",
        "Webhook support",
        "Multi-gateway switching",
      ],
    },
    {
      title: "Subscriptions",
      icon: <Settings className="w-6 h-6" />,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      items: [
        "Termly & yearly plans",
        "Per-student pricing",
        "Super admin controls",
        "Free trial for new schools",
      ],
    },
    {
      title: "Access Control",
      icon: <Lock className="w-6 h-6" />,
      color: "text-teal-400",
      bg: "bg-teal-500/20",
      items: [
        "Role-based dashboards",
        "Per-module permissions",
        "Multi-school support",
        "Audit logs",
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      {/* Hero */}
      <section className="px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 px-4 py-1.5 rounded-full text-sm mb-6"
          >
            <Globe className="w-4 h-4" />
            Everything You Need
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            Powerful <span className="text-indigo-400">Features</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Every module your school needs — built in, integrated, and ready to use.
          </motion.p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureGroups.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 transition group"
            >
              <div className={`inline-flex p-3 ${group.bg} rounded-xl mb-4`}>
                <span className={group.color}>{group.icon}</span>
              </div>
              <h3 className="text-lg font-bold mb-4">{group.title}</h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            See it in action
          </h2>
          <p className="text-gray-300 mb-6">
            Check out our pricing plans or get in touch to schedule a demo.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            View Pricing Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}