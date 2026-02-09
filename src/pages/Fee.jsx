import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Fee() {
  const [fees, setFees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ 
    grade_id: "", 
    school_session_id: "", 
    term: "", 
    amount: "", 
    description: "",
    school_id: "" // Added school_id
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const terms = ['First Term', 'Second Term', 'Third Term'];

  // Get school_id from user data
  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchAllData = async () => {
    setLoading(true);
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const [feesRes, gradesRes, sessionsRes] = await Promise.all([
        api.get("/fees", { params: { school_id: schoolId } }),
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } })
      ]);

      console.log("🔍 API Responses:", {
        fees: feesRes.data,
        grades: gradesRes.data,
        sessions: sessionsRes.data
      });

      // Helper function to safely extract array from response
      const extractArray = (responseData) => {
        // If responseData is already an array
        if (Array.isArray(responseData)) {
          return responseData;
        }
        
        // If response has standard success format with data property
        if (responseData?.status === 'success' && responseData?.data) {
          // If data is an array
          if (Array.isArray(responseData.data)) {
            return responseData.data;
          }
          // If data is an object with nested array (Laravel pagination)
          if (responseData.data?.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
          }
          // If data is an object, check its values for arrays
          if (responseData.data && typeof responseData.data === 'object') {
            const values = Object.values(responseData.data);
            for (const value of values) {
              if (Array.isArray(value)) {
                return value;
              }
            }
          }
        }
        
        // Fallback: return empty array
        return [];
      };

      const feesData = extractArray(feesRes.data);
      const gradesData = extractArray(gradesRes.data);
      const sessionsData = extractArray(sessionsRes.data);

      console.log("✅ Extracted Data:", {
        fees: feesData,
        grades: gradesData,
        sessions: sessionsData
      });

      setFees(feesData);
      setGrades(gradesData);
      setSessions(sessionsData);

      console.log("✅ Data loaded:", {
        feesCount: feesData.length,
        gradesCount: gradesData.length,
        sessionsCount: sessionsData.length
      });

    } catch (err) {
      console.error("❌ Fetch data error:", err);
      
      // Check for specific error types
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (err.response?.status === 403) {
        toast.error("Access denied. Please check your permissions.");
      } else if (err.response?.status === 401) {
        toast.error("Please log in again.");
      } else {
        toast.error("Failed to load data");
      }
      
      // Set empty arrays on error
      setFees([]);
      setGrades([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setSaveLoading(false);
      return;
    }

    try {
      const payload = {
        grade_id: parseInt(form.grade_id),
        school_session_id: parseInt(form.school_session_id),
        term: form.term,
        amount: parseFloat(form.amount),
        description: form.description,
        school_id: schoolId // Added school_id
      };

      console.log("📤 Sending payload:", payload);

      if (editId) {
        await api.put(`/fees/${editId}`, payload);
        toast.success("Fee updated successfully");
      } else {
        await api.post("/fees", payload);
        toast.success("Fee added successfully");
      }
      
      resetForm();
      setShow(false);
      await fetchAllData();
    } catch (err) {
      console.error("❌ Save fee error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 422) {
        toast.error("Validation error. Please check all fields.");
      } else {
        toast.error("Failed to save fee");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this fee?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/fees/${id}`, {
          params: { school_id: schoolId }
        });
        toast.success("Fee deleted successfully");
        fetchAllData();
      } catch (err) {
        console.error("❌ Delete fee error:", err);
        toast.error("Failed to delete fee");
      }
    }
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({ 
      grade_id: "", 
      school_session_id: "", 
      term: "", 
      amount: "", 
      description: "",
      school_id: schoolId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const getGradeName = (grade) => {
    return grade?.name || grade?.grade_name || 'N/A';
  };

  const getSessionName = (session) => {
    return session?.name || session?.session_name || 'N/A';
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({ 
      grade_id: "", 
      school_session_id: "", 
      term: "", 
      amount: "", 
      description: "",
      school_id: schoolId
    });
    setEditId(null);
    setShow(true);
  };

  // Create safe versions of arrays to prevent map errors
  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Fees Management</h2>
        <div className="text-sm text-gray-400">
          {fees.length} Fees • {safeGrades.length} Classes • {safeSessions.length} Sessions
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Add Fee"}
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Fees:</strong> {fees.length} records found
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading fees...
          </div>
        ) : fees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No fees found.</p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              Create Your First Fee
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Class</th>
                <th className="py-3 px-4 font-semibold">Session</th>
                <th className="py-3 px-4 font-semibold">Term</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">School</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, index) => (
                <tr key={fee.id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">
                    {getGradeName(fee.grade)}
                  </td>
                  <td className="py-3 px-4">
                    {getSessionName(fee.schoolsession)}
                  </td>
                  <td className="py-3 px-4">{fee.term}</td>
                  <td className="py-3 px-4">{fee.description || "-"}</td>
                  <td className="py-3 px-4 font-mono">
                    ₦{typeof fee.amount === 'number' ? fee.amount.toLocaleString() : fee.amount}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {fee.school?.name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        setForm({
                          grade_id: fee.grade_id || "",
                          school_session_id: fee.school_session_id || "",
                          term: fee.term || "",
                          amount: fee.amount || "",
                          description: fee.description || "",
                          school_id: getSchoolId()
                        });
                        setEditId(fee.id);
                        setShow(true);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-400/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Fee" : "Add New Fee"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Class <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading || safeGrades.length === 0}
                >
                  <option value="">Select Class</option>
                  {safeGrades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {getGradeName(grade)}
                    </option>
                  ))}
                </select>
                {safeGrades.length === 0 && !loading && (
                  <p className="text-amber-400 text-sm mt-1">
                    No classes available. Please create classes first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Session <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.school_session_id}
                  onChange={(e) => setForm({ ...form, school_session_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading || safeSessions.length === 0}
                >
                  <option value="">Select Session</option>
                  {safeSessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {getSessionName(session)}
                    </option>
                  ))}
                </select>
                {safeSessions.length === 0 && !loading && (
                  <p className="text-amber-400 text-sm mt-1">
                    No sessions available. Please create a school session first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Term <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Select Term</option>
                  {terms.map(term => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Fee description (optional)"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This fee will be added to your school (School ID: {getSchoolId()})
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:bg-gray-400 transition-colors font-medium"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                  disabled={saveLoading || safeGrades.length === 0 || safeSessions.length === 0}
                >
                  {saveLoading ? "Saving..." : (editId ? "Update" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}