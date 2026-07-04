import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError("");

    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    // In Login.jsx - update the navigation part after successful login

try {
  const res = await api.post("/auth/login", form); // Note: added /v1 prefix
  
  const token = res.data.access_token;
  const user = res.data.user;
  const defaultDashboard = res.data.default_dashboard;

  if (!token || !user) throw new Error("Invalid login response");

  // Save token and user to localStorage
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  toast.success("Login successful!");

  // STEP 1: Redirect to change-password if required
  if (user.must_change_password) {
    console.log("🔐 Password change required");
    navigate("/change-password", { replace: true });
    return;
  }

  // STEP 2: Map backend dashboard routes to frontend routes
      let frontendRoute = defaultDashboard;

      // Fix route mapping for super admin
      if (user.role === 'super_admin') {
          frontendRoute = '/super-admin/dashboard';
      } 
      // School admin - check subscription status
      else if (user.role === 'admin') {
          // Check if school is unlocked (has active subscription)
          if (user.school?.is_unlocked) {
              frontendRoute = '/school/dashboard';
          } else {
              frontendRoute = '/school/subscriptions';  // Send to payment page
          }
      }
      // Employee dashboard
      else if (user.role === 'employee') {
          if (user.employee_type === 'teaching') {
              frontendRoute = '/employee/dashboard';
          } else if (user.employee_type === 'account') {
              frontendRoute = '/account/dashboard';
          }
      }
      // Student dashboard
      else if (user.role === 'student') {
          frontendRoute = '/student/dashboard';
      }
      // Parent dashboard
      else if (user.role === 'parent') {
          frontendRoute = '/parent/dashboard';
      }

      console.log(`👤 User role: ${user.role}, School unlocked: ${user.school?.is_unlocked}, Redirecting to: ${frontendRoute}`);
      navigate(frontendRoute, { replace: true });

    } catch (err) {
      console.error("Login error:", err.response || err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleDemoLogin = (role) => {
    const demo = {
      super_admin: { email: "superadmin@system.com", password: "password" },
      admin: { email: "admin@school.com", password: "password" },
    };
    setForm(demo[role]);
    toast.info(`Demo ${role.replace("_", " ")} credentials loaded`);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] mx-auto text-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/images/school-logo 2.png"
            alt="School Logo"
            className="h-24 mb-3 drop-shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            SCHOOL MANAGEMENT PORTAL
          </h1>
          <p className="text-indigo-400 text-sm font-medium mt-2">
            Excellence & Innovation in Education
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-slate-600 shadow-xl">
          <h2 className="text-gray-100 text-lg font-semibold mb-6">
            Admin Login
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-300 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleDemoLogin("super_admin")}
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Demo Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Demo School Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleInputChange}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                disabled={loading}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors pr-10"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Login to Dashboard</span>
              )}
            </button>
          </form>
           // Add this after the login button, before the create super admin section
          <div className="text-right mt-2">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Forgot Password?
          </button>
        </div>
          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-sm text-gray-400 text-center">
              Setting up the system for the first time?{" "}
              <button
                onClick={() => navigate("/register/super-admin")}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Create Super Admin Account
              </button>
            </p>
          </div>
        </div>
       
      </div>
    </div>
    
  );
}
