import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ResultLocker() {
  const [locks, setLocks] = useState([]);
  const [options, setOptions] = useState({ grades: [], sessions: [], terms: [] });
  const [form, setForm] = useState({ 
    grade_id: "", 
    school_session_id: "", 
    term: "", 
    action: "lock" 
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Get school_id from user data
  const getSchoolId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.school?.id || user?.school_id;
      }
    } catch (error) {
      console.error("Error getting school ID:", error);
    }
    return null;
  };

  // Helper function to extract array data from API responses
  const extractArrayData = (response) => {
    if (!response || !response.data) return [];
    
    const data = response.data;
    
    if (data?.status === 'success') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
      if (data.data && Array.isArray(data.data.items)) return data.data.items;
      return [];
    }
    
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.results && Array.isArray(data.results)) return data.results;
    
    console.warn("Could not extract array data from response:", data);
    return [];
  };

  const loadAll = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const [locksRes, optionsRes] = await Promise.all([
        api.get("/result-lock", { params: { school_id: schoolId } }),
        api.get("/result-lock/options", { params: { school_id: schoolId } })
      ]);
      
      const locksData = extractArrayData(locksRes);
      const optionsData = optionsRes.data;
      
      setLocks(locksData);
      
      // Handle options response format
      if (optionsData?.status === 'success') {
        setOptions(optionsData.data || { grades: [], sessions: [], terms: [] });
      } else {
        setOptions(optionsData || { grades: [], sessions: [], terms: [] });
      }

      console.log("✅ Loaded locks:", locksData);
      console.log("✅ Loaded options:", optionsData);

    } catch (err) {
      console.error("❌ Load error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
        school_id: schoolId  // Added school_id
      };

      const endpoint = form.action === "lock" ? "/result-lock/lock" : "/result-lock/unlock";
      await api.post(endpoint, payload);
      
      toast.success(`Results ${form.action}ed successfully`);
      resetForm();
      setShow(false);
      await loadAll();
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Error processing request");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      grade_id: "", 
      school_session_id: "", 
      term: "", 
      action: "lock" 
    });
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const getGradeName = (gradeId) => {
    const grade = options.grades?.find(g => g.id === gradeId);
    return grade?.name || gradeId || 'N/A';
  };

  const getSessionName = (sessionId) => {
    const session = options.sessions?.find(s => s.id === sessionId);
    return session?.name || sessionId || 'N/A';
  };

  // Safe array variables
  const locksArray = Array.isArray(locks) ? locks : [];
  const gradesArray = Array.isArray(options.grades) ? options.grades : [];
  const sessionsArray = Array.isArray(options.sessions) ? options.sessions : [];
  const termsArray = Array.isArray(options.terms) ? options.terms : [];

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Result Lock Manager</h2>
        <div className="text-sm text-gray-400">
          {locksArray.length} Lock configurations
        </div>
        <button
          onClick={() => setShow(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Lock/Unlock Results"}
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Locks Data Type:</strong> {typeof locks}
          <br />
          <strong>Is Locks Array?:</strong> {Array.isArray(locks) ? "Yes" : "No"}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading lock status...
          </div>
        ) : locksArray.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Result Locks Found</h3>
            <p className="text-gray-400 mb-4">Create your first result lock configuration</p>
            <button
              onClick={() => setShow(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
            >
              Create First Lock
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Grade</th>
                <th className="py-3 px-4 font-semibold">Session</th>
                <th className="py-3 px-4 font-semibold">Term</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {locksArray.map((lock, index) => (
                <tr key={lock.id || index} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">
                    {lock.grade?.name || lock.grade_name || getGradeName(lock.grade_id)}
                  </td>
                  <td className="py-3 px-4">
                    {lock.school_session?.name || lock.session_name || getSessionName(lock.school_session_id)}
                  </td>
                  <td className="py-3 px-4">
                    {lock.term || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lock.is_locked 
                        ? 'bg-red-500/20 text-red-300' 
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {lock.is_locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              Lock/Unlock Results
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Grade <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Select Grade</option>
                  {gradesArray.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
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
                  disabled={saveLoading}
                >
                  <option value="">Select Session</option>
                  {sessionsArray.map(session => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
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
                  {termsArray.map(term => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Action <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="lock">Lock Results</option>
                  <option value="unlock">Unlock Results</option>
                </select>
              </div>

              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This action will be recorded for your school (School ID: {getSchoolId()})
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
                  disabled={saveLoading}
                >
                  {saveLoading ? "Processing..." : (form.action === "lock" ? "Lock Results" : "Unlock Results")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}