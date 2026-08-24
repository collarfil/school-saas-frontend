import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ExamType() {
  const [examTypes, setExamTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    school_session_id: ""
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Safely extract context from user profile or local storage
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getStoredUser();
  const schoolId = user?.school_id || user?.school?.id;

  // 1. Fetch academic sessions safely
  const fetchSessions = async () => {
    try {
      const response = await api.get("/school-sessions");
      
      // Defensively parse array from common Laravel response structures
      let sessionList = [];
      if (Array.isArray(response.data)) {
        sessionList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        sessionList = response.data.data;
      } else if (Array.isArray(response.data?.data?.data)) {
        sessionList = response.data.data.data;
      }

      setSessions(sessionList);

      // Auto-select active session if available
      const active = sessionList.find(s => s.is_active || s.status === 'active');
      if (active) {
        setForm(prev => ({ ...prev, school_session_id: active.id }));
      }
      return sessionList;
    } catch (err) {
      console.warn("Could not load sessions automatically:", err);
      setSessions([]);
      return [];
    }
  };

  // 2. Fetch Exam Types with required school & session parameters
  const fetchAll = async (currentSessionId) => {
    setLoading(true);
    try {
      const targetSessionId = currentSessionId || form.school_session_id;

      // Pass query parameters to satisfy backend 422 validation
      const response = await api.get("/cbt/exam-types", {
        params: {
          school_id: schoolId,
          school_session_id: targetSessionId || undefined
        }
      });

      let list = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      }

      setExamTypes(list);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      // Don't show toast error on initial mount if it was just missing parameter selection
      if (err.response?.status !== 422) {
        toast.error("Failed to fetch CBT exam types");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      const sessionList = await fetchSessions();
      const active = sessionList.find(s => s.is_active || s.status === 'active');
      const activeId = active ? active.id : sessionList[0]?.id;
      
      fetchAll(activeId);
    };

    initData();
  }, []);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setForm(prev => ({
      ...prev,
      name: nameVal,
      slug: editId ? prev.slug : generateSlug(nameVal)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Assessment name is required");
      return;
    }

    if (!form.school_session_id) {
      toast.error("Please select an academic session");
      return;
    }

    setSaveLoading(true);

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        school_id: schoolId,
        school_session_id: form.school_session_id
      };

      if (editId) {
        await api.put(`/cbt/exam-types/${editId}`, payload);
        toast.success("Exam type updated successfully");
      } else {
        await api.post("/cbt/exam-types", payload);
        toast.success("Exam type created successfully");
      }

      closeModal();
      await fetchAll(form.school_session_id);
    } catch (error) {
      console.error("❌ Save error:", error);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || "Failed to save exam type");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (type) => {
    setForm({
      name: type.name || "",
      slug: type.slug || "",
      school_session_id: type.school_session_id || ""
    });
    setEditId(type.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this exam type?")) return;

    try {
      await api.delete(`/cbt/exam-types/${id}`);
      toast.success("Exam type deleted successfully.");
      fetchAll(form.school_session_id);
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete exam type.");
    }
  };

  const resetForm = () => {
    const sessionList = Array.isArray(sessions) ? sessions : [];
    const active = sessionList.find(s => s.is_active || s.status === 'active');
    setForm({
      name: "",
      slug: "",
      school_session_id: active ? active.id : (sessionList[0]?.id || "")
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "80px" },
    { header: "Assessment Name", accessor: "name", width: "300px" },
    { header: "Slug Path", accessor: "slug", width: "250px" },
    { header: "Academic Session", accessor: "session_name", width: "200px" },
  ];

  const getTableData = () => {
    const list = Array.isArray(examTypes) ? examTypes : [];
    return list.map((type, index) => ({
      id: type.id,
      index: index + 1,
      name: type.name,
      slug: type.slug,
      session_name: type.school_session?.name || type.school_session?.session_name || type.school_session_id || "N/A",
      original: type
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1" title="Edit">
        <Edit className="h-4 w-4" />
      </button>
      <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Safe array reference for select render
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">CBT Exam Types</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add Exam Type
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Exam Types Configuration"
        actions={renderTableActions}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              {editId ? "Edit Exam Type" : "New Exam Type"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Academic Session Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Academic Session <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.school_session_id}
                  onChange={(e) => {
                    const selectedSession = e.target.value;
                    setForm({ ...form, school_session_id: selectedSession });
                    fetchAll(selectedSession);
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Academic Session --</option>
                  {safeSessions.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.name || sess.session_name || sess.year || `Session #${sess.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Exam Type Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., First Term Examination"
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="first-term-examination"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white font-mono placeholder-gray-400 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  disabled={saveLoading}
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