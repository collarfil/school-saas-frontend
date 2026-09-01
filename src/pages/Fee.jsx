import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, ChevronDown, Check, X } from "lucide-react";

export default function Fee() {
  const [fees, setFees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ 
    grade_ids: [], 
    school_session_id: "", 
    term: "", 
    amount: "", 
    description: "",
    school_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);

  const gradeDropdownRef = useRef(null);

  const terms = ['First Term', 'Second Term', 'Third Term'];

  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?.school?.id || user?.school_id || null;
    } catch {
      return null;
    }
  };

  // Close grade dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target)) {
        setShowGradeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      const extractArray = (responseData) => {
        if (!responseData) return [];
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

      setFees(extractArray(feesRes.data));
      setGrades(extractArray(gradesRes.data));
      setSessions(extractArray(sessionsRes.data));

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

  const toggleGrade = (gradeId) => {
    setForm(prev => {
      const exists = prev.grade_ids.includes(gradeId);
      if (exists) {
        return { ...prev, grade_ids: prev.grade_ids.filter(id => id !== gradeId) };
      } else {
        return { ...prev, grade_ids: [...prev.grade_ids, gradeId] };
      }
    });
  };

  const toggleAllGrades = () => {
    if (form.grade_ids.length === grades.length) {
      setForm(prev => ({ ...prev, grade_ids: [] }));
    } else {
      setForm(prev => ({ ...prev, grade_ids: grades.map(g => g.id) }));
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.grade_ids.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    setSaveLoading(true);
    const schoolId = getSchoolId();

    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setSaveLoading(false);
      return;
    }

    try {
      if (editId) {
        // Update single fee
        const payload = {
          grade_id: parseInt(form.grade_ids[0]),
          school_session_id: parseInt(form.school_session_id),
          term: form.term,
          amount: parseFloat(form.amount),
          description: form.description,
          school_id: schoolId
        };
        await api.put(`/fees/${editId}`, payload);
        toast.success("Fee updated successfully");
      } else {
        // --- DUPLICATE CHECK LOGIC ---
        const pendingGradeIds = form.grade_ids.map(id => parseInt(id));
        const sessionId = parseInt(form.school_session_id);
        const term = form.term;
        const description = (form.description || "").trim().toLowerCase();

        // Find classes that already have this specific fee registered
        const existingDuplicateGradeIds = fees
          .filter(fee => 
            fee.school_session_id === sessionId &&
            fee.term === term &&
            (fee.description || "").trim().toLowerCase() === description
          )
          .map(fee => fee.grade_id);

        // Filter to only new (non-duplicate) grades
        const newGradeIds = pendingGradeIds.filter(id => !existingDuplicateGradeIds.includes(id));

        if (newGradeIds.length === 0) {
          toast.error("Selected class(es) already have this fee record created for this term and session.");
          setSaveLoading(false);
          return;
        }

        if (newGradeIds.length < pendingGradeIds.length) {
          const skippedCount = pendingGradeIds.length - newGradeIds.length;
          toast.error(`Skipped ${skippedCount} duplicate entry/entries.`);
        }

        // Send requests only for non-duplicate classes
        const requests = newGradeIds.map(gradeId => {
          return api.post("/fees", {
            grade_id: gradeId,
            school_session_id: sessionId,
            term: term,
            amount: parseFloat(form.amount),
            description: form.description,
            school_id: schoolId
          });
        });

        await Promise.all(requests);
        toast.success(`Fee added successfully for ${newGradeIds.length} class(es)`);
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
      grade_ids: [], 
      school_session_id: "", 
      term: "", 
      amount: "", 
      description: "",
      school_id: schoolId
    });
    setEditId(null);
    setShowGradeDropdown(false);
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const getGradeName = (grade) => grade?.name || grade?.grade_name || 'N/A';
  const getSessionName = (session) => session?.name || session?.session_name || 'N/A';

  const handleOpenModal = () => {
    resetForm();
    setShow(true);
  };

  const formatCurrency = (amount) => `₦${parseFloat(amount || 0).toLocaleString()}`;

  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

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
            grade_ids: row.original.grade_id ? [row.original.grade_id] : [],
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

  const getSelectedClassesLabel = () => {
    if (form.grade_ids.length === 0) return "Select Class(es)";
    if (form.grade_ids.length === safeGrades.length && safeGrades.length > 0) return "All Classes Selected";
    if (form.grade_ids.length === 1) {
      const grade = safeGrades.find(g => g.id === form.grade_ids[0]);
      return getGradeName(grade);
    }
    return `${form.grade_ids.length} Classes Selected`;
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

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Fee Records"
        searchPlaceholder="Search by class, term or description..."
        onSearch={handleTableSearch}
        actions={renderActions}
      />

      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Fee" : "Add New Fee"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Multi-Select Grade Component */}
              <div ref={gradeDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Class(es) <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowGradeDropdown(!showGradeDropdown)}
                  disabled={saveLoading || safeGrades.length === 0}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-left text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none flex justify-between items-center"
                >
                  <span className={form.grade_ids.length === 0 ? "text-gray-400" : "text-white"}>
                    {getSelectedClassesLabel()}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showGradeDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {!editId && (
                      <div 
                        onClick={toggleAllGrades}
                        className="p-2 border-b border-slate-600 flex items-center gap-2 hover:bg-slate-600 cursor-pointer font-medium text-blue-400 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.grade_ids.length === safeGrades.length && safeGrades.length > 0}
                          onChange={() => {}} 
                          className="rounded border-slate-500 text-blue-600 focus:ring-0"
                        />
                        Select All Classes ({safeGrades.length})
                      </div>
                    )}
                    {safeGrades.map(grade => {
                      const isSelected = form.grade_ids.includes(grade.id);
                      return (
                        <div
                          key={grade.id}
                          onClick={() => {
                            if (editId) {
                              setForm(prev => ({ ...prev, grade_ids: [grade.id] }));
                              setShowGradeDropdown(false);
                            } else {
                              toggleGrade(grade.id);
                            }
                          }}
                          className="p-2.5 flex items-center justify-between hover:bg-slate-600 cursor-pointer text-sm border-b border-slate-600/50 last:border-none"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-500 text-blue-600 focus:ring-0"
                            />
                            <span className="text-white">{getGradeName(grade)}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}

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
                  placeholder="Fee description (e.g. Tuition, Bus Fee)"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors font-medium" disabled={saveLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400" disabled={saveLoading || safeGrades.length === 0 || safeSessions.length === 0}>
                  {saveLoading ? "Saving..." : (editId ? "Update" : `Save ${form.grade_ids.length > 1 ? `(${form.grade_ids.length} Fees)` : ''}`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}