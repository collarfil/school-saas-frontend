import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Section() {
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", school_id: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const schoolId = getSchoolId();
      
      if (!schoolId) {
        toast.error("No school ID found. Please login again.");
        return;
      }

      const res = await api.get("/sections", {
        params: { school_id: schoolId }
      });
      
      console.log("📂 Sections data:", res.data);
      
      if (res.data.status === 'success') {
        setSections(res.data.data || []);
      } else {
        setSections(res.data || []);
      }
    } catch (error) {
      console.error("❌ Fetch sections error:", error);
      
      if (error.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else {
        toast.error("Failed to fetch sections");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Section name is required");
      return;
    }

    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        school_id: schoolId
      };

      console.log("📤 Submitting section:", payload);
      
      if (editId) {
        await api.put(`/sections/${editId}`, payload);
        toast.success("Section updated successfully!");
      } else {
        await api.post("/sections", payload);
        toast.success("Section added successfully!");
      }
      
      setShowModal(false);
      setForm({ name: "", school_id: schoolId });
      setEditId(null);
      
      setTimeout(() => {
        fetchSections();
      }, 300);
      
    } catch (error) {
      console.error("❌ Save section error:", error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.values(errors).forEach(errorArray => {
          errorArray.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save section");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    console.log("✏️ Editing section:", section);
    setForm({
      name: section.name || "",
      school_id: getSchoolId()
    });
    setEditId(section.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/sections/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Section deleted successfully");
      fetchSections();
    } catch (error) {
      console.error("❌ Delete section error:", error);
      toast.error("Failed to delete section");
    }
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({ name: "", school_id: schoolId });
    setEditId(null);
    setShowModal(true);
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Name", accessor: "name", width: "300px" },
    { header: "School", accessor: "school_name", width: "300px" },
  ];

  const getTableData = () => {
    return sections.map((section, index) => ({
      id: section.id,
      name: section.name,
      school_name: section.school?.name || "N/A",
      original: section,
      index: index
    }));
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button 
        onClick={() => handleEdit(row.original)} 
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
      item.name?.toLowerCase().includes(lowerTerm) ||
      item.school_name?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sections</h2>
        <button 
          onClick={handleOpenModal} 
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Sections:</strong> {sections.length} records found
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Section Records"
        searchPlaceholder="Search by section name..."
        onSearch={handleTableSearch}
        actions={renderActions}
      />

      {/* Modal - Add/Edit Section */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Section" : "Add New Section"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Section Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Nursery, Primary, JSS, SSS"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}