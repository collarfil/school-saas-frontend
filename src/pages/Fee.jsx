import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

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
    school_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const terms = ['First Term', 'Second Term', 'Third Term'];

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

      const extractArray = (responseData) => {
        if (Array.isArray(responseData)) return responseData;
        if (responseData?.status === 'success' && responseData?.data) {
          if (Array.isArray(responseData.data)) return responseData.data;
          if (responseData.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data;
          if (responseData.data && typeof responseData.data === 'object') {
            const values = Object.values(responseData.data);
            for (const value of values) {
              if (Array.isArray(value)) return value;
            }
          }
        }
        return [];
      };

      const feesData = extractArray(feesRes.data);
      const gradesData = extractArray(gradesRes.data);
      const sessionsData = extractArray(sessionsRes.data);

      setFees(feesData);
      setGrades(gradesData);
      setSessions(sessionsData);

    } catch (err) {
      console.error("❌ Fetch data error:", err);
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (err.response?.status === 403) {
        toast.error("Access denied. Please check your permissions.");
      } else {
        toast.error("Failed to load data");
      }
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
        school_id: schoolId
      };

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

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
  };

  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Class", accessor: "grade_name", width: "150px" },
    { header: "Session", accessor: "session_name", width: "150px" },
    { header: "Term", accessor: "term", width: "120px" },
    { header: "Description", accessor: "description", width: "200px" },
    { header: "Amount", accessor: "amount_formatted", width: "120px" },
  ];

  const getTableData = () => {
    return fees.map((fee, index) => ({
      id: fee.id,
      grade_name: getGradeName(fee.grade),
      session_name: getSessionName(fee.schoolsession),
      term: fee.term,
      description: fee.description || "-",
      amount_formatted: formatCurrency(fee.amount),
      original: fee,
      index: index
    }));
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => {
          setForm({
            grade_id: row.original.grade_id || "",
            school_session_id: row.original.school_session_id || "",
            term: row.original.term || "",
            amount: row.original.amount || "",
            description: row.original.description || "",
            school_id: getSchoolId()
          });
          setEditId(row.original.id);
          setShow(true);
        }}
        className="text-yellow-400 hover:text-yellow-300 p-1"
        title="Edit"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(row.original.id)}
        className="text-red-400 hover:text-red-300 p-1"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const handleTableSearch = (data, term) => {
    const lowerTerm = term.toLowerCase();
    return data.filter(item => 
      item.grade_name?.toLowerCase().includes(lowerTerm) ||
      item.term?.toLowerCase().includes(lowerTerm) ||
      item.description?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Fees Management</h2>
          <p className="text-sm text-gray-400">{fees.length} Fees • {safeGrades.length} Classes • {safeSessions.length} Sessions</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Fee"}
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

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Fee Records"
        searchPlaceholder="Search by class, term or description..."
        onSearch={handleTableSearch}
        actions={renderActions}
      />

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
                  <p className="text-amber-400 text-sm mt-1">No classes available. Please create classes first.</p>
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
                  <p className="text-amber-400 text-sm mt-1">No sessions available. Please create a school session first.</p>
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
                    <option key={term} value={term}>{term}</option>
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
                <p className="text-gray-300"><strong>Note:</strong> This fee will be added to your school (School ID: {getSchoolId()})</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:bg-gray-400 transition-colors font-medium" disabled={saveLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium" disabled={saveLoading || safeGrades.length === 0 || safeSessions.length === 0}>
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