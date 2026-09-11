// src/pages/Pricing.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Check,
  Crown,
  Sparkles,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function Pricing() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await axios.get(`${baseURL}/api/subscriptions/pricing`);
        const data = res.data?.data?.pricing || res.data?.data || {};

        // Normalize to array
        const list = Array.isArray(data)
          ? data
          : Object.entries(data).map(([key, value]) => ({
              plan_type: key,
              ...value,
            }));

        setPricing(list);
      } catch (err) {
        console.error("Failed to load pricing:", err);
        // Fallback pricing
        setPricing([
          {
            plan_type: "termly",
            base_price: 20000,
            per_student: 2000,
            duration_days: 120,
            description: "Per term subscription",
          },
          {
            plan_type: "yearly",
            base_price: 50000,
            per_student: 5000,
            duration_days: 365,
            description: "Annual subscription",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const formatCurrency = (amount) =>
    `₦${Number(amount || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white">
      {/* Hero */}
      <section className="px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-1.5 rounded-full text-sm mb-6"
          >
            <Crown className="w-4 h-4" />
            Simple, Transparent Pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            Choose Your <span className="text-indigo-400">Plan</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Pay only for the students you have. No hidden fees. Cancel anytime.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pricing.map((plan, i) => {
                const isYearly = plan.plan_type === "yearly";
                return (
                  <motion.div
                    key={plan.plan_type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`relative bg-slate-800/60 border rounded-2xl p-8 ${
                      isYearly
                        ? "border-indigo-500/50 shadow-2xl shadow-indigo-500/20"
                        : "border-slate-700"
                    }`}
                  >
                    {isYearly && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        {isYearly ? (
                          <Crown className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Calendar className="w-5 h-5 text-indigo-400" />
                        )}
                        <h3 className="text-xl font-bold capitalize">
                          {plan.plan_type} Plan
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        {plan.description || `${plan.duration_days} days`}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold">
                          {formatCurrency(plan.base_price)}
                        </span>
                        <span className="text-gray-400 text-sm">base</span>
                      </div>
                      <div className="mt-2 text-gray-300">
                        <span className="text-2xl font-bold text-indigo-400">
                          + {formatCurrency(plan.per_student)}
                        </span>
                        <span className="text-gray-400 text-sm ml-1">
                          per student
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {[
                        "All core modules included",
                        "Unlimited staff accounts",
                        "Online fee payments",
                        "CBT & online learning",
                        "Reports & analytics",
                        "Email support",
                      ].map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/register/super-admin"
                      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                        isYearly
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Example Calculation */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold">Example Cost</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            For a school with 250 students on the yearly plan:
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Base price:</span>
              <span>{formatCurrency(50000)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>250 students × ₦5,000:</span>
              <span>{formatCurrency(1250000)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2 mt-2 font-bold text-white">
              <span>Total for the year:</span>
              <span className="text-indigo-400">{formatCurrency(1300000)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Questions about pricing?
          </h2>
          <p className="text-gray-300 mb-6">
            Contact us to discuss custom plans for school groups.
          </p>
          <Link
            to="/schools"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            See Schools Using Our Platform
          </Link>
        </div>
      </section>
    </div>
  );
}