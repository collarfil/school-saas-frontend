import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Session() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    term: "", 
    is_current: false 
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const fetchSessions = async () => {
  try {
    setLoading(true);
    console.log("📡 Fetching sessions...");
    
    // Get auth token
    const token = localStorage.getItem('token');
    console.log("🔑 Token exists:", !!token);
    
    // Get user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log("👤 User school ID:", user.school?.id);
    
    // Make API call
    const res = await api.get("/school-sessions");
    
    console.log("✅ API Response Status:", res.status);
    console.log("✅ Full Response Data:", res.data);
    
    // Check response structure
    if (!res.data) {
      console.error("❌ No data in response");
      toast.error("No data received from server");
      setSessions([]);
      return;
    }
    
    // Handle different response formats
    let sessionsData = [];
    
    // Method 1: Check if response.data has data property
    if (res.data.data && Array.isArray(res.data.data)) {
      sessionsData = res.data.data;
      console.log("📋 Using res.data.data (array)");
    }
    // Method 2: Check if response is directly an array
    else if (Array.isArray(res.data)) {
      sessionsData = res.data;
      console.log("📋 Using res.data (direct array)");
    }
    // Method 3: If it's an object, check for any array property
    else if (res.data && typeof res.data === 'object') {
      // Look for any array in the object
      for (const key in res.data) {
        if (Array.isArray(res.data[key])) {
          sessionsData = res.data[key];
          console.log(`📋 Found array in property: ${key}`);
          break;
        }
      }
    }
    
    console.log(`📋 Found ${sessionsData.length} sessions:`, sessionsData);
    
    // Ensure it's an array
    if (!Array.isArray(sessionsData)) {
      console.error("❌ sessionsData is not an array:", sessionsData);
      sessionsData = [];
    }
    
    setSessions(sessionsData);
    
    if (sessionsData.length === 0) {
      console.log("ℹ️ No sessions found. Possible reasons:");
      console.log("   1. No sessions created for this school");
      console.log("   2. API returned empty array");
      console.log("   3. School ID mismatch");
      
      // Show helpful message
      toast.info("No sessions found. Create your first session.");
    }
    
  } catch (error) {
    console.error("❌ Fetch error details:", {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 403) {
      toast.error("Access denied. Please check your permissions.");
      console.log("🔑 Current auth token:", localStorage.getItem('token'));
    } else if (error.response?.status === 401) {
      toast.error("Please log in again.");
      localStorage.clear();
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    } else {
      toast.error("Failed to load sessions: " + (error.message || "Unknown error"));
    }
    
    setSessions([]);
  } finally {
    setLoading(false);
  }
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Get user's school ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = user.school?.id;
      
      console.log("👤 Current User:", user);
      console.log("🏫 School ID:", schoolId);
      
      if (!schoolId) {
        toast.error("No school associated with your account");
        setLoading(false);
        return;
      }
      
      // Prepare payload with school_id
      const payload = {
        name: form.name,
        term: form.term,
        is_current: form.is_current || false,
        school_id: schoolId
      };
      
      console.log("📤 Sending payload:", payload);
      
      let response;
      if (editId) {
        console.log(`🔄 Updating session ${editId}`);
        response = await api.put(`/school-sessions/${editId}`, payload);
      } else {
        console.log("➕ Creating new session");
        response = await api.post("/school-sessions", payload);
      }
      
      console.log("✅ Save response:", response.data);
      
      if (response.data.status === 'success') {
        toast.success(editId ? "Session updated successfully" : "Session added successfully");
        setShowModal(false);
        setForm({ name: "", term: "", is_current: false });
        setEditId(null);
        fetchSessions(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
      
    } catch (error) {
      console.error("❌ Save session error:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          Object.values(errors).forEach(errorArray => {
            errorArray.forEach(message => toast.error(message));
          });
        } else {
          toast.error(error.response.data.message || "Validation failed");
        }
      } else if (error.response?.status === 500) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           'Server error. Please try again later.';
        toast.error(`Server Error: ${errorMessage}`);
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Please check your permissions.");
      } else {
        toast.error(error.response?.data?.message || "Failed to save session");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    console.log("✏️ Editing session:", item);
    setForm({
      name: item.name || "",
      term: item.term || "",
      is_current: item.is_current || false
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    try {
      console.log(`🗑️ Deleting session ${id}`);
      const response = await api.delete(`/school-sessions/${id}`);
      
      if (response.data.status === 'success') {
        toast.success("Session deleted successfully");
        fetchSessions();
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error("❌ Delete session error:", error);
      toast.error(error.response?.data?.message || "Failed to delete session");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Manually refreshing sessions...");
    fetchSessions();
  };

  // Debug: Log the current state
  useEffect(() => {
    console.log("🔍 Current sessions state:", {
      sessions,
      isArray: Array.isArray(sessions),
      length: sessions?.length || 0,
      type: typeof sessions,
      apiResponse
    });
  }, [sessions, apiResponse]);

  // Safe rendering - ensure sessions is always an array
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="text-white p-6 bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen">
      {/* Debug Panel */}
      <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-blue-300">Debug Info</h3>
          <button
            onClick={handleRefresh}
            className="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        <div className="text-xs space-y-1">
          <p className="text-blue-200">Sessions: {safeSessions.length} items</p>
          <p className="text-blue-200">Is Array: {Array.isArray(sessions) ? '✅ Yes' : '❌ No'}</p>
          <p className="text-blue-200">Type: {typeof sessions}</p>
          <button 
            onClick={() => {
              console.log("🔍 Full debug info:", {
                sessions,
                apiResponse,
                user: JSON.parse(localStorage.getItem('user') || '{}')
              });
              toast.success('Check console for debug info');
            }}
            className="mt-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
          >
            Log Debug Info
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">School Sessions</h2>
          <p className="text-gray-400">Manage academic sessions for your school</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="bg-slate-700 px-4 py-2 rounded hover:bg-slate-600 disabled:bg-slate-800 flex items-center space-x-2"
          >
            <span>Refresh</span>
            {loading && <span className="animate-spin">⟳</span>}
          </button>
          <button 
            onClick={() => {
              // Set default values
              const currentYear = new Date().getFullYear();
              const nextYear = currentYear + 1;
              
              setForm({ 
                name: `${currentYear}/${nextYear}`,
                term: "First Term",
                is_current: false 
              });
              setEditId(null);
              setShowModal(true);
            }} 
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2"
            disabled={loading}
          >
            <span>+ Add Session</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
        {loading && safeSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <div className="text-gray-300">Loading sessions...</div>
            <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
          </div>
        ) : safeSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-300 text-lg font-medium mb-2">No sessions found</div>
            <p className="text-gray-500 mb-4">Create your first academic session</p>
            <button 
              onClick={() => {
                const currentYear = new Date().getFullYear();
                const nextYear = currentYear + 1;
                
                setForm({ 
                  name: `${currentYear}/${nextYear}`,
                  term: "First Term",
                  is_current: false 
                });
                setEditId(null);
                setShowModal(true);
              }} 
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Create First Session
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-300 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Session Name</th>
                  <th className="py-3 px-4 font-medium">Term</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeSessions.map((session, index) => (
                  <tr key={session.id} className="border-b border-gray-700/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{session.name}</td>
                    <td className="py-3 px-4">{session.term}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        session.is_current 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {session.is_current ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {session.created_at ? formatDate(session.created_at) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <button 
                        onClick={() => handleEdit(session)} 
                        className="text-yellow-400 hover:text-yellow-300 hover:underline px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(session.id)} 
                        className="text-red-400 hover:text-red-300 hover:underline px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-gray-900 p-6 rounded-lg w-full max-w-md border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editId ? "Edit Session" : "Add Session"}</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm({ name: "", term: "", is_current: false });
                  setEditId(null);
                }}
                className="text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-1 transition-all"
                disabled={loading}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2024/2025"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">Format: Year/Year (e.g., 2024/2025)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Term *
                </label>
                <select
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                  disabled={loading}
                >
                  <option value="">Select Term</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={form.is_current}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="is_current" className="text-sm text-gray-300">
                  <span className="font-medium">Mark as current session</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Note: Setting this as current will automatically deactivate any other current session for your school.
                  </p>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setForm({ name: "", term: "", is_current: false });
                    setEditId(null);
                  }} 
                  className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{editId ? "Update" : "Create"} Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}