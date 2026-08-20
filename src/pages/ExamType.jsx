import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ExamType() {
  const [examTypes, setExamTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    school_id: "",
    school_session_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const getContextIds = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const activeSession = JSON.parse(localStorage.getItem('active_session'));
    return {
      schoolId: user?.school?.id || user?.school_id,
      schoolSessionId: activeSession?.id || user?.school_session_id
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    const { schoolId, schoolSessionId } = getContextIds();
    
    if (!schoolId || !schoolSessionId) {
      toast.error("Active context values missing. Please check your session.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/CBT/exam-types", { 
        params: { school_id: schoolId, school_session_id: schoolSessionId } 
      });
      setExamTypes(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch CBT configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
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
    setSaveLoading(true);
    
    const { schoolId, schoolSessionId } = getContextIds();
    if (!schoolId || !schoolSessionId) {
      toast.error("Missing valid runtime parameter context keys.");
      setSaveLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        school_id: schoolId,
        school_session_id: schoolSessionId
      };

      if (editId) {
        await api.put(`/CBT/exam-types/${editId}`, payload);
        toast.success("Exam type context updated successfully");
      } else {
        await api.post("/CBT/exam-types", payload);
        toast.success("Exam type ruleset registered successfully");
      }
      
      setShowModal(false);
      resetForm();
      await fetchAll();
    } catch (error) {
      console.error("❌ Save configuration error:", error);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to map CBT blueprint entry parameters.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (type) => {
    const { schoolId, schoolSessionId } = getContextIds();
    setForm({
      name: type.name || "",
      slug: type.slug || "",
      school_id: schoolId,
      school_session_id: schoolSessionId
    });
    setEditId(type.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to drop this CBT configuration blueprint?")) return;
    
    try {
      await api.delete(`/CBT/exam-types/${id}`);
      toast.success("Blueprint rule entry securely purged.");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to drop selected exam type configuration matrix.");
    }
  };

  const resetForm = () => {
    const { schoolId, schoolSessionId } = getContextIds();
    setForm({
      name: "",
      slug: "",
      school_id: schoolId,
      school_session_id: schoolSessionId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "80px" },
    { header: "Assessment Name", accessor: "name", width: "400px" },
    { header: "System Routing Slug", accessor: "slug", width: "400px" },
  ];

  const getTableData = () => {
    return examTypes.map((type, index) => ({
      id: type.id,
      index: index + 1,
      name: type.name,
      slug: type.slug,
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

  const handleTableSearch = (data, term) => {
    const lowerTerm = term.toLowerCase();
    return data.filter(item => 
      item.name?.toLowerCase().includes(lowerTerm) ||
      item.slug?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">CBT Classification Modules</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Blueprint"}
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Active Exam Types Matrix"
        searchPlaceholder="Search category elements by name or routing signature..."
        onSearch={handleTableSearch}
        actions={renderTableActions}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              {editId ? "Modify Blueprint Parameters" : "Establish New CBT Layout"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assessment Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., First Term Continuous Assessment"
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Routing Slug Reference <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="auto-generated-url-path"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  required
                  disabled={saveLoading}
                />
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
                  {saveLoading ? "Saving Structural Parameters..." : (editId ? "Update" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}