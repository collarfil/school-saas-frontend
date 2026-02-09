import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    password: "", 
    password_confirmation: "" 
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.must_change_password) {
      navigate('/admin/dashboard');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success("Password changed successfully!");
      
      // Update local user data
      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Redirect based on school status
      if (updatedUser.school && !updatedUser.school.is_unlocked) {
        navigate('/admin/subscriptions', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] mx-auto text-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            SECURITY UPDATE REQUIRED
          </h1>
          <p className="text-indigo-400 text-sm font-medium mt-2">
            Change your password to continue
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-slate-600 shadow-xl">
          <h2 className="text-gray-100 text-lg font-semibold mb-6">
            Change Your Password
          </h2>
          
          <p className="text-slate-300 text-sm mb-6 text-left">
            You are required to change your password on first login for security reasons.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors pr-10"
                disabled={loading}
                required 
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={form.password_confirmation}
                onChange={(e) => setForm({...form, password_confirmation: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-10 py-2 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors pr-10"
                disabled={loading}
                required 
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg font-medium transition duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-slate-800/40 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-300 text-center">
              After changing your password, you'll be redirected to the appropriate dashboard based on your school's subscription status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}