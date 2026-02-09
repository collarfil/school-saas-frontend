import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Student() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [parents, setParents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    admission_number: "",
    roll_number: "",
    grade_id: "",
    parent_id: "",
    gender: "",
    email: "",
    school_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Get school_id from user data
  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchAll = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const [studentsRes, gradesRes, parentsRes] = await Promise.all([
        api.get("/students", { params: { school_id: schoolId } }),
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/parents", { params: { school_id: schoolId } }).catch(() => ({ data: { data: [] } }))
      ]);
      
      // Handle API response format
      setStudents(studentsRes.data?.data || studentsRes.data || []);
      setGrades(gradesRes.data?.data || gradesRes.data || []);
      setParents(parentsRes.data?.data || parentsRes.data || []);
      
      console.log("📊 Loaded data:", {
        students: students.length,
        grades: grades.length,
        parents: parents.length
      });
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else {
        toast.error("Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
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
        name: form.name,
        admission_number: form.admission_number,
        roll_number: form.roll_number,
        grade_id: form.grade_id,
        parents_id: form.parent_id,
        gender: form.gender,
        email: form.email,
        school_id: schoolId
      };

      if (editId) {
        await api.put(`/students/${editId}`, payload);
        toast.success("Student updated successfully");
      } else {
        await api.post("/students", payload);
        toast.success("Student added successfully");
      }
      
      setShowModal(false);
      resetForm();
      await fetchAll();
      
    } catch (error) {
      console.error("❌ Save student error:", error);
      
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 422) {
        toast.error("Validation error. Please check all fields.");
      } else {
        toast.error("Failed to save student");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (student) => {
    const schoolId = getSchoolId();
    setForm({
      name: student.name || "",
      admission_number: student.admission_number || "",
      roll_number: student.roll_number || "",
      grade_id: student.grade_id || "",
      parent_id: student.parents_id || student.parent_id || "",
      gender: student.gender || "",
      email: student.email || "",
      school_id: schoolId
    });
    setEditId(student.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/students/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Student deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete student");
    }
  };

  const getGradeName = (student) => {
    if (student.grade && student.grade.name) {
      return student.grade.name;
    }
    if (student.grade_id) {
      const grade = grades.find(g => g.id === student.grade_id);
      return grade ? grade.name : `Grade ${student.grade_id}`;
    }
    return "No Grade";
  };

  const getParentName = (student) => {
    if (student.parent && student.parent.name) {
      return student.parent.name;
    }
    const parentId = student.parents_id || student.parent_id;
    if (parentId) {
      const parent = parents.find(p => p.id === parentId);
      return parent ? parent.name : `Parent ${parentId}`;
    }
    return "No Parent";
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({
      name: "",
      admission_number: "",
      roll_number: "",
      grade_id: "",
      parent_id: "",
      gender: "",
      email: "",
      school_id: schoolId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ADM-${year}-${random}`;
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm(prev => ({
      ...prev,
      admission_number: generateAdmissionNumber(),
      school_id: schoolId
    }));
    setEditId(null);
    setShowModal(true);
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Students</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Add Student"}
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Students:</strong> {students.length} records found
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading students...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Admission No</th>
                <th className="py-3 px-4 font-semibold">Roll No</th>
                <th className="py-3 px-4 font-semibold">Grade</th>
                <th className="py-3 px-4 font-semibold">Parent</th>
                <th className="py-3 px-4 font-semibold">Gender</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4 font-mono text-sm text-blue-300">
                      {student.admission_number}
                    </td>
                    <td className="py-3 px-4">{student.roll_number || "N/A"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.grade_id ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {getGradeName(student)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        (student.parents_id || student.parent_id) ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {getParentName(student)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.gender === 'Male' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : student.gender === 'Female'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {student.gender || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {student.email ? (
                        <a href={`mailto:${student.email}`} className="text-blue-300 hover:text-blue-200 hover:underline">
                          {student.email}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-400/10"
                        title="Edit student"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                        title="Delete student"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    No students found. {!loading && "Click 'Add Student' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Student" : "Add New Student"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Admission Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter admission number"
                  value={form.admission_number}
                  onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  required
                  disabled={saveLoading || editId}
                />
                {!editId && (
                  <p className="text-xs text-gray-400 mt-1">
                    Auto-generated admission number. You can modify it if needed.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  placeholder="Enter roll number (optional)"
                  value={form.roll_number}
                  onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
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
                  disabled={saveLoading}
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Parent
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                >
                  <option value="">Select Parent (Optional)</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} {parent.phone ? `(${parent.phone})` : ''}
                    </option>
                  ))}
                </select>
                {parents.length === 0 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    No parents available. You can add parents later.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                >
                  <option value="">Select Gender (Optional)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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