import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Mail, Lock, User, Phone, Shield, ArrowLeft } from "lucide-react";

export default function SchoolRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    password_confirmation: "", 
    role: "employee", 
    phone: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      // Get current user to check school status
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Check if school is unlocked before allowing user registration
      if (currentUser.school && !currentUser.school.is_unlocked) {
        toast.error("Your school account is locked. Please complete subscription first.");
        navigate("/admin/subscriptions");
        return;
      }

      if (!currentUser.school_id) {
        toast.error("No school associated with your account");
        setError("No school associated with your account");
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
        phone: form.phone.trim() || null,
        school_id: currentUser.school_id // Include school_id in payload
      };

      console.log("Registering user with payload:", payload);

      // Try different possible endpoints
      let res;
      try {
        // First try the school-specific endpoint
        res = await api.post("/school/register-user", payload);
      } catch (firstError) {
        if (firstError.response?.status === 404) {
          // Fallback to admin endpoint
          console.log("School endpoint not found, trying admin endpoint...");
          res = await api.post("/admin/auth/register-school-user", payload);
        } else {
          throw firstError;
        }
      }
      
      toast.success("User registered successfully!");
      
      // Reset form
      setForm({ 
        name: "", 
        email: "", 
        password: "", 
        password_confirmation: "", 
        role: "employee", 
        phone: "" 
      });
      
    } catch (err) {
      console.error('Register error:', err.response?.data || err.message);
      
      let message = "Registration failed. Please try again.";
      
      if (err.response?.status === 403) {
        message = "You don't have permission to register users.";
      } else if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors?.email) {
          message = Array.isArray(errors.email) ? errors.email[0] : errors.email;
        } else if (errors?.password) {
          message = Array.isArray(errors.password) ? errors.password[0] : errors.password;
        } else if (errors?.name) {
          message = Array.isArray(errors.name) ? errors.name[0] : errors.name;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else {
          message = "Validation error. Please check your input.";
        }
      } else if (err.response?.status === 401) {
        message = "Session expired. Please login again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later.";
      } else if (err.response?.status === 404) {
        message = "Registration endpoint not found. Please contact support.";
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        message = "Network error. Please check if the server is running.";
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "employee", label: "Employee", description: "Teacher/staff access" },
    { value: "student", label: "Student", description: "Student portal access" },
    { value: "parent", label: "Parent", description: "Parent portal access" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors mb-4 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">Register New User</h1>
          <p className="text-gray-400">Create new user accounts for your school</p>
        </div>

        {/* Register Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-300 px-3 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Role Selection */}
            <div className="relative">
              <Shield className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-colors"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
        </div>
      </div>
    </div>
  );
}