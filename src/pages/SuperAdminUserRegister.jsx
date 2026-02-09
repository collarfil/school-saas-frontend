import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, Lock, User, School, Phone, Shield } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    password_confirmation: "", 
    school_id: "", 
    role: "admin", 
    phone: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Fetch schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login first to register new users");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:8000/api/v1/schools", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        setSchools(res.data.data || res.data || []);
      } catch (err) {
        console.error('Fetch schools error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
        } else {
          toast.error("Failed to load schools");
        }
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
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

    if (!form.school_id) {
      setError("Please select a school");
      toast.error("Please select a school");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first to register new users");
        navigate("/login");
        return;
      }

      // Check current user role
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (currentUser.role !== 'super_admin') {
        toast.error("Only Super Admin can register new users");
        setError("Only Super Admin can register new users");
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        school_id: parseInt(form.school_id),
        role: form.role,
        phone: form.phone.trim() || null
      };

      const res = await axios.post("http://localhost:8000/api/v1/auth/register", payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      toast.success("User registered successfully!");
      
      // Reset form
      setForm({ 
        name: "", 
        email: "", 
        password: "", 
        password_confirmation: "", 
        school_id: "", 
        role: "admin", 
        phone: "" 
      });
      
      // Navigate to super admin dashboard
      setTimeout(() => {
        navigate("/super-admin/dashboard");
      }, 1500);
      
    } catch (err) {
      console.error('Register error:', err.response?.data || err.message);
      
      let message = "Registration failed. Please try again.";
      
      if (err.response?.status === 403) {
        message = "You don't have permission to register users. Only Super Admin can register new users.";
      } else if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors?.email) {
          message = Array.isArray(errors.email) ? errors.email[0] : errors.email;
        } else if (errors?.password) {
          message = Array.isArray(errors.password) ? errors.password[0] : errors.password;
        } else if (errors?.school_id) {
          message = Array.isArray(errors.school_id) ? errors.school_id[0] : errors.school_id;
        } else if (errors?.name) {
          message = Array.isArray(errors.name) ? errors.name[0] : errors.name;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else {
          message = "Validation error. Please check your input.";
        }
      } else if (err.response?.status === 401) {
        message = "Session expired. Please login again.";
        navigate("/login");
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        message = "Network error. Please check if the server is running.";
      } else if (err.response?.status === 404) {
        message = "Registration endpoint not found. Please check the API URL.";
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "admin", label: "School Admin", description: "Full access to school management" },
    { value: "employee", label: "Employee", description: "Teacher/staff access" },
    { value: "student", label: "Student", description: "Student portal access" },
    { value: "parent", label: "Parent", description: "Parent portal access" }
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center py-8">
      <div className="w-full max-w-[480px] mx-auto text-center px-4">
        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/images/school-logo 2.png"
            alt="School Logo"
            className="h-20 mb-3 drop-shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            REGISTER NEW USER
          </h1>
          <p className="text-indigo-400 text-sm font-medium">
            Create new user accounts
          </p>
        </div>

        {/* Register card */}
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-slate-600 shadow-xl">
          <h2 className="text-gray-100 text-lg font-semibold mb-6">
            User Registration
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
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                disabled={loading}
              />
            </div>

            {/* School Selection */}
            <div className="relative">
              <School className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <select
                value={form.school_id}
                onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                disabled={loading || loadingSchools}
                required
              >
                <option value="">Select School</option>
                {loadingSchools ? (
                  <option disabled>Loading schools...</option>
                ) : (
                  schools.map((school) => (
                    <option key={school.id} value={school.id} className="bg-slate-800">
                      {school.name}
                    </option>
                  ))
                )}
              </select>
              {loadingSchools && (
                <div className="text-xs text-gray-400 mt-1 ml-10">
                  Loading schools...
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="relative">
              <Shield className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                disabled={loading}
                required
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value} className="bg-slate-800">
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-1 ml-10">
                {roleOptions.find(r => r.value === form.role)?.description}
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || loadingSchools}
              className="w-full py-2 mt-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering User...
                </>
              ) : (
                "Register User"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-sm text-gray-400 text-center">
              Only Super Admin can register new users.{" "}
              <button
                onClick={() => navigate("/super-admin/dashboard")}
                className="text-indigo-400 hover:underline font-medium"
              >
                Back to Dashboard
              </button>
            </p>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="mt-6">
          <button
            onClick={() => navigate("/super-admin/dashboard")}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            disabled={loading}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}