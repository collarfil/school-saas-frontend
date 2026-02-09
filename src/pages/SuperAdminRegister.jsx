import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, Lock, User, Phone, Crown } from "lucide-react";

export default function SuperAdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    password_confirmation: "", 
    phone: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check if super admin already exists
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/register/check-super-admin");
        
        if (res.data.super_admin_exists) {
          toast.error("Super admin already exists. Please login instead.");
          navigate("/login");
        }
      } catch (err) {
        console.error('Check super admin error:', err);
        toast.error("Failed to check super admin status");
      } finally {
        setChecking(false);
      }
    };

    checkSuperAdmin();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validation
    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.error("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone.trim() || null
      };

      console.log('Super admin register payload:', payload);

      const res = await axios.post("http://localhost:8000/api/register/super-admin", payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Super admin register response:', res.data);
      
      // Store token and user data
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.access_token}`;
      }
      
      toast.success("Super admin registered successfully!");
      
      // Navigate to super admin dashboard
      setTimeout(() => {
        navigate("/super-admin/dashboard");
      }, 1500);
      
    } catch (err) {
      console.error('Super admin register error:', err.response?.data || err.message);
      
      let message = "Registration failed. Please try again.";
      
      if (err.response?.status === 400) {
        message = err.response.data.message || "Super admin already exists";
      } else if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors?.email) {
          message = Array.isArray(errors.email) ? errors.email[0] : errors.email;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        }
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        message = "Network error. Please check if the server is running.";
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center py-8">
      <div className="w-full max-w-[480px] mx-auto text-center px-4">
        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Crown className="h-16 w-16 text-yellow-400 mb-2" />
            <img
              src="/images/school-logo 2.png"
              alt="School Logo"
              className="h-20 mb-3 drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            SUPER ADMIN SETUP
          </h1>
          <p className="text-yellow-400 text-sm font-medium">
            Initialize System Administrator
          </p>
        </div>

        {/* Register card */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-slate-600 shadow-xl">
          <h2 className="text-gray-100 text-lg font-semibold mb-6">
            Create Super Admin Account
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-300 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={loading}
                required
                minLength="2"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={loading}
                required
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={loading}
                required
                minLength="6"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 mt-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting Up System...
                </>
              ) : (
                "Initialize Super Admin"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-sm text-gray-400 text-center">
              This will create the first system administrator account.{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-yellow-400 hover:underline font-medium"
              >
                Already have an account?
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}