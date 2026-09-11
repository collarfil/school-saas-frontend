import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, UserCheck, X } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State for shared-credentials account picker
  const [accounts, setAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const routeForUser = (user, defaultDashboard) => {
    if (user.role === "super_admin") return "/super-admin/dashboard";
    if (user.role === "admin") {
      return user.school?.is_unlocked
        ? "/school/dashboard"
        : "/school/subscriptions";
    }
    if (user.role === "employee") {
      if (user.employee_type === "teaching") return "/employee/dashboard";
      if (user.employee_type === "account") return "/account/dashboard";
    }
    if (user.role === "student") return "/student/dashboard";
    if (user.role === "parent") return "/parent/dashboard";
    return defaultDashboard;
  };

  const handleSubmit = async (e, selectedUserId = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const payload = { ...form };
      if (selectedUserId) {
        payload.user_id = selectedUserId;
      }

      const res = await api.post("/auth/login", payload);

      // Multiple accounts share these credentials — show the picker
      // and stop here. Do NOT treat this as a successful login.
      if (res.data?.status === "ACCOUNT_SELECTION_REQUIRED") {
        setAccounts(res.data.accounts || []);
        setShowAccountModal(true);
        setLoading(false);
        return;
      }

      const { access_token: token, user, default_dashboard: defaultDashboard } = res.data;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      toast.success("Login successful!");
      setShowAccountModal(false);

      if (user.must_change_password) {
        navigate("/change-password", { replace: true });
        return;
      }

      const frontendRoute = routeForUser(user, defaultDashboard);
      navigate(frontendRoute, { replace: true });
    } catch (err) {
      console.error("Login error:", err.response || err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error(errorMessage);
      setShowAccountModal(false);
    } finally {
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
    toast(`Demo ${role.replace("_", " ")} credentials loaded`, { icon: "ℹ️" });
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] mx-auto text-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/images/badge2.png"
            alt="Badge"
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
            Portal Login
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

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-5 text-left">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="email"
                placeholder="Email, Phone or Username"
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

      {/* Account Selector Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-6 w-6 text-indigo-400" />
                <h3 className="text-lg font-bold">Select Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-300 mb-4">
              Multiple accounts share these login credentials. Please select which profile you want to enter:
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, acc.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-700/60 hover:bg-indigo-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">{acc.name}</p>
                    <p className="text-xs text-gray-400">{acc.email}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase px-2 py-1 bg-slate-800 text-indigo-300 rounded-md">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}