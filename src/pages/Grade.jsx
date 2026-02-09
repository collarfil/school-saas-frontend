import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Grade() {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", section_id: "", school_id: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Get school ID and user from localStorage
  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  };

  const fetchGrades = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("School information not found. Please log in again.");
      return;
    }

    try {
      setIsFetching(true);
      const res = await api.get("/grades", {
        params: { school_id: schoolId }
      });
      
      // Handle API response format
      const gradesData = res.data?.data || res.data || [];
      setGrades(gradesData);
      
    } catch (error) {
      console.error("❌ Fetch grades error:", error);
      
      if (error.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to fetch grades");
      }
      
      setGrades([]);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchSections = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    try {
      const res = await api.get("/sections", {
        params: { school_id: schoolId }
      });
      
      // Handle API response format
      const sectionsData = res.data?.data || res.data || [];
      setSections(sectionsData);
      
    } catch (error) {
      console.error("❌ Fetch sections error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  useEffect(() => {
    const user = getUser();
    if (!user) {
      toast.error("Please log in to access this page");
      return;
    }
    
    fetchGrades();
    fetchSections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("School information not found");
      return;
    }

    if (!form.name || !form.section_id) {
      toast.error("Grade name and section are required");
      return;
    }

    setLoading(true);
    try {
      // Prepare data with school_id
      const submitData = {
        name: form.name.trim(),
        section_id: form.section_id,
        school_id: schoolId
      };

      if (editId) {
        await api.put(`/grades/${editId}`, submitData);
        toast.success("Grade updated successfully!");
      } else {
        await api.post("/grades", submitData);
        toast.success("Grade added successfully!");
      }
      
      // Reset form and close modal
      setShowModal(false);
      resetForm();
      
      // Refresh data
      fetchGrades();
      
    } catch (error) {
      console.error("❌ Save grade error:", error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          Object.values(errors).forEach(errorArray => {
            errorArray.forEach(message => toast.error(message));
          });
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        }
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save grade. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (grade) => {
    setForm({
      name: grade.name || "",
      section_id: grade.section_id?.toString() || "",
      school_id: getSchoolId()
    });
    setEditId(grade.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this grade?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/grades/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Grade deleted successfully");
      
      // Update local state
      setGrades(prev => prev.filter(grade => grade.id !== id));
      
    } catch (error) {
      console.error("❌ Delete grade error:", error);
      toast.error(error.response?.data?.message || "Failed to delete grade");
    }
  };

  const getSectionName = (sectionId) => {
    if (!sectionId) return "N/A";
    const section = sections.find(s => s.id === sectionId || s.id?.toString() === sectionId?.toString());
    return section ? section.name : "N/A";
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({ 
      name: "", 
      section_id: "", 
      school_id: schoolId 
    });
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Get user info for display
  const user = getUser();
  const schoolId = getSchoolId();

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Grades</h2>
          <p className="text-gray-400 text-sm">
            Manage class grades for {user?.school?.name || "your school"}
          </p>
        </div>
        <button 
          onClick={openAddModal} 
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading || isFetching}
        >
          + Add Grade
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {schoolId || "Not found"}
          <br />
          <strong>Grades:</strong> {grades.length} records found • 
          <strong> Sections:</strong> {sections.length} available
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-slate-800 rounded-lg p-4">
        {isFetching ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading grades...
          </div>
        ) : grades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No grades found.</p>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Create Your First Grade
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Grade Name</th>
                <th className="py-3 px-4 font-semibold">Section</th>
                <th className="py-3 px-4 font-semibold">School</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={grade.id} className="border-b border-gray-700 hover:bg-slate-700/40">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">{grade.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                      {getSectionName(grade.section_id)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {grade.school?.name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      onClick={() => handleEdit(grade)}
                      className="text-yellow-400 hover:text-yellow-300 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(grade.id)}
                      className="text-red-400 hover:text-red-300 font-medium"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Grade" : "Add New Grade"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Grade Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Primary 1, JSS 1, SSS 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Section <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.section_id}
                  onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading || sections.length === 0}
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                {sections.length === 0 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    No sections available. Create sections first in the Sections page.
                  </p>
                )}
              </div>
              
              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This grade will be added to your school (School ID: {schoolId})
                </p>
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