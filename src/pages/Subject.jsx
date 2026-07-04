import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Subject() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", grade_id: "", school_id: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const schoolId = getSchoolId();
      
      if (!schoolId) {
        toast.error("No school ID found. Please login again.");
        return;
      }

      const res = await api.get("/subjects", {
        params: { school_id: schoolId }
      });
      
      console.log("📚 Subjects with grades:", res.data);
      
      const subjectsData = res.data?.data || res.data || [];
      setSubjects(subjectsData);
      
      if (subjectsData.length > 0) {
        const firstSubject = subjectsData[0];
        console.log("✅ First subject with grade:", {
          name: firstSubject.name,
          grade_id: firstSubject.grade_id,
          grade: firstSubject.grade
        });
      }
    } catch (error) {
      console.error("❌ Fetch subjects error:", error);
      
      if (error.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else {
        toast.error("Failed to fetch subjects");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const schoolId = getSchoolId();
      const res = await api.get("/grades", {
        params: { school_id: schoolId }
      });
      
      setGrades(res.data?.data || res.data || []);
    } catch (error) {
      console.error("❌ Fetch grades error:", error);
      toast.error("Failed to fetch grades");
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchGrades();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.grade_id) {
      toast.error("Subject name and grade are required");
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

      if (editId) {
        await api.put(`/subjects/${editId}`, payload);
        toast.success("Subject updated successfully!");
      } else {
        await api.post("/subjects", payload);
        toast.success("Subject added successfully!");
      }
      
      setShowModal(false);
      setForm({ name: "", grade_id: "", school_id: schoolId });
      setEditId(null);
      
      setTimeout(() => {
        fetchSubjects();
      }, 500);
      
    } catch (error) {
      console.error("❌ Save subject error:", error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.values(errors).forEach(errorArray => {
          errorArray.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save subject");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    const schoolId = getSchoolId();
    setForm({
      name: item.name || "",
      grade_id: item.grade_id || "",
      school_id: schoolId
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/subjects/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Subject deleted successfully");
      fetchSubjects();
    } catch (error) {
      console.error("❌ Delete subject error:", error);
      toast.error("Failed to delete subject");
    }
  };

  const getGradeName = (subject) => {
    if (subject.grade && subject.grade.name) {
      return subject.grade.name;
    }
    
    if (subject.grade_id) {
      const grade = grades.find(g => g.id === subject.grade_id);
      return grade ? grade.name : "N/A";
    }
    
    return "No Grade";
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({ name: "", grade_id: "", school_id: schoolId });
    setEditId(null);
    setShowModal(true);
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Name", accessor: "name", width: "250px" },
    { header: "Grade", accessor: "grade_name", width: "200px" },
    { header: "School", accessor: "school_name", width: "250px" },
  ];

  const getTableData = () => {
    return subjects.map((subject, index) => ({
      id: subject.id,
      name: subject.name,
      grade_name: getGradeName(subject),
      school_name: subject.school?.name || "N/A",
      original: subject,
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
      item.grade_name?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subjects</h2>
        <button 
          onClick={handleOpenModal} 
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Subjects:</strong> {subjects.length} records found
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Subject Records"
        searchPlaceholder="Search by subject name or grade..."
        onSearch={handleTableSearch}
        actions={renderActions}
      />

      {/* Modal - Add/Edit Subject */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Subject" : "Add New Subject"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Subject Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics, English, Science"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Grade <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={loading}
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
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