import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  School,
  Mail,
  Phone,
  MapPin,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Unlock,
  Lock,
  Users,
  RefreshCw,
  Key,
  Copy,
  Check,
  LogOut
} from "lucide-react";

export default function SuperAdminSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    owner: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    logo: null,
  });

  // Fetch Schools
  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get("/schools");
      const schoolsData = res.data.data || res.data || [];
      setSchools(schoolsData);
      console.log("📋 Loaded schools:", schoolsData);
    } catch (err) {
      console.error("Failed to load schools:", err);
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  // Copy to clipboard function
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Copied ${field} to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Create School
  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (!form.owner || !form.name || !form.email || !form.phone) {
        toast.error("Owner, School Name, Email, and Phone are required");
        setFormLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("owner", form.owner);
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      if (form.address) formData.append("address", form.address);
      if (form.logo) formData.append("logo", form.logo);

      const response = await api.post("/schools", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("School creation response:", response.data);

      // Handle credentials display - FIXED VERSION
      if (response.data.admin_credentials) {
        // Use the structured credentials from backend
        setCredentials({
          email: response.data.admin_credentials.email,
          password: response.data.admin_credentials.password,
          schoolName: response.data.admin_credentials.schoolName,
          owner: response.data.admin_credentials.owner,
          note: response.data.admin_credentials.note || "Use your phone number as temporary password. You will be forced to change it on first login."
        });
      } else if (response.data.login_credentials && response.data.login_credentials.password) {
        // If backend returns password in login_credentials
        setCredentials({
          email: response.data.login_credentials.username || form.email,
          password: response.data.login_credentials.password,
          schoolName: form.name,
          owner: form.owner,
          note: "Use your phone number as temporary password. You will be forced to change it on first login."
        });
      } else {
        // Fallback - use phone number as password
        setCredentials({
          email: form.email,
          password: form.phone, // Use phone as password
          schoolName: form.name,
          owner: form.owner,
          note: "Use your phone number as temporary password. You will be forced to change it on first login."
        });
      }

      setShowCredentialsModal(true);
      toast.success(`School "${form.name}" created successfully!`);

      // Reset form and close modal
      setShowCreateModal(false);
      setForm({
        owner: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        logo: null,
      });

      // Reload schools list
      loadSchools();
    } catch (err) {
      console.error("Failed to create school:", err);
      
      // Enhanced error handling
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        toast.error(errorList.join(', ') || "School creation failed");
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.response?.data?.error || 
                            "School creation failed";
        toast.error(errorMessage);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Unlock/Lock School Functionality
  const handleToggleSchoolLock = async (schoolId, unlock = true) => {
    try {
      const endpoint = unlock ? 'unlock' : 'lock';
      await api.post(`/admin/schools/${schoolId}/${endpoint}`);
      toast.success(`School ${unlock ? 'unlocked' : 'locked'} successfully`);
      loadSchools();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${unlock ? 'unlock' : 'lock'} school`);
    }
  };

  // Filter Schools
  const filteredSchools = schools.filter((school) => {
    const term = searchTerm.toLowerCase();
    return (
      school.name?.toLowerCase().includes(term) ||
      school.email?.toLowerCase().includes(term) ||
      school.owner?.toLowerCase().includes(term) ||
      school.phone?.toLowerCase().includes(term)
    );
  });

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen bg-slate-900">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/super-admin/dashboard")}
            className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSchools}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate("/super-admin/settings")}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <School className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add School</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Schools</h1>
        <p className="text-gray-400">Create and manage educational institutions</p>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools by name, email, owner, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
            />
          </div>
          <div className="text-sm text-gray-400">
            {filteredSchools.length} of {schools.length} schools
          </div>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <School className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-400">
                    Owner: {school.owner}
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${
                school.is_unlocked 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {school.is_unlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-300 mb-4">
              {school.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" /> 
                  <span className="truncate">{school.email}</span>
                </div>
              )}
              {school.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" /> 
                  <span>{school.phone}</span>
                </div>
              )}
              {school.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words text-xs">{school.address}</span>
                </div>
              )}
              {school.users_count !== undefined && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" /> 
                  <span>{school.users_count} users</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-700 flex space-x-2">
              {!school.is_unlocked ? (
                <button
                  onClick={() => handleToggleSchoolLock(school.id, true)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Unlock</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleSchoolLock(school.id, false)}
                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Lock</span>
                </button>
              )}
              <button
                onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty States */}
      {filteredSchools.length === 0 && schools.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No schools found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search terms
          </p>
        </div>
      )}

      {schools.length === 0 && (
        <div className="text-center py-12">
          <School className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            No Schools Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating the first school
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-colors"
          >
            Create First School
          </button>
        </div>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create New School</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={formLoading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4">
              {/* Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
                  placeholder="Owner's full name"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Used to generate initial login credentials
                </p>
              </div>

              {/* School Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
                  placeholder="School name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
                  placeholder="school@example.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be the admin username for login
                </p>
              </div>

              {/* Phone - NOW REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
                  placeholder="+2348012345678"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be used as the temporary password for the school admin
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-colors"
                  placeholder="School address"
                ></textarea>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Logo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, logo: e.target.files[0] })}
                  className="w-full text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-white hover:file:bg-yellow-700"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium border border-slate-600"
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{formLoading ? "Creating..." : "Create School"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal - IMPROVED */}
      {showCredentialsModal && credentials && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-green-500/50">
            <div className="text-center mb-6">
              <div className="mx-auto bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-400">School Created Successfully!</h3>
              <p className="text-gray-400 mt-2">Save these login credentials for the school owner</p>
            </div>

            <div className="space-y-4 mb-6">
              {/* School Information */}
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h4 className="font-semibold text-white mb-2">School Information</h4>
                <p className="text-sm text-gray-300"><strong>School:</strong> {credentials.schoolName}</p>
                <p className="text-sm text-gray-300"><strong>Owner:</strong> {credentials.owner}</p>
              </div>

              {/* Login Credentials */}
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                <h4 className="font-semibold text-yellow-400 mb-3 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  School Admin Login Credentials
                </h4>
                
                {/* Username/Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username / Email:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-slate-600 px-3 py-2 rounded text-sm font-mono break-all">
                      {credentials.email}
                    </code>
                    <button
                      onClick={() => copyToClipboard(credentials.email, 'email')}
                      className="p-2 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                      title="Copy username"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password - SHOW PHONE AS PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Temporary Password:</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-slate-600 px-3 py-2 rounded text-sm font-mono break-all">
                      {credentials.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(credentials.password, 'password')}
                      className="p-2 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {credentials.note && (
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ {credentials.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Login Instructions */}
              <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                <h5 className="font-semibold text-blue-400 mb-2">Login Instructions:</h5>
                <ul className="text-xs text-blue-300 space-y-1">
                  <li>• Go to: <strong>{window.location.origin}/login</strong></li>
                  <li>• Use email: <strong>{credentials.email}</strong></li>
                  <li>• Use password: <strong>{credentials.password}</strong> (your phone number)</li>
                  <li>• You will be forced to change password on first login</li>
                  <li>• Complete subscription to unlock full access</li>
                </ul>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30 mb-4">
              <p className="text-xs text-red-400 text-center">
                ⚠️ <strong>Important:</strong> Save these credentials securely and share with the school owner. 
                This is the only time the password will be displayed.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentials(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(`SCHOOL ADMIN CREDENTIALS\n\nSchool: ${credentials.schoolName}\nOwner: ${credentials.owner}\nUsername: ${credentials.email}\nPassword: ${credentials.password}\nLogin URL: ${window.location.origin}/login\n\nInstructions:\n1. Login with above credentials\n2. Change password on first login\n3. Complete subscription payment\n4. Access full school management features`, 'all')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy All Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}