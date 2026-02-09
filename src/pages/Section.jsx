import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Section() {
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", school_id: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get school_id from user data in localStorage
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
      
      // Handle both response formats
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

  // Initialize form with school_id on modal open
  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({ name: "", school_id: schoolId });
    setEditId(null);
    setShowModal(true);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sections</h2>
        <button 
          onClick={handleOpenModal} 
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          + Add Section
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

      <div className="bg-slate-800 rounded-lg p-4">
        {loading ? (
          <div className="text-center py-4">Loading sections...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">School</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.length > 0 ? (
                sections.map((section, i) => (
                  <tr key={section.id} className="border-b border-gray-700 hover:bg-slate-700/40">
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{section.name}</td>
                    <td className="py-2 px-3 text-gray-300">
                      {section.school?.name || "N/A"}
                    </td>
                    <td className="py-2 px-3 text-right space-x-3">
                      <button 
                        onClick={() => handleEdit(section)} 
                        className="text-yellow-400 hover:text-yellow-300 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(section.id)} 
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-lg">No sections found</p>
                      <p className="text-sm mt-1">Add your first section to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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