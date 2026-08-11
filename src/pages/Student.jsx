import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import CredentialsModal from "../components/CredentialsModal";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Search, ChevronDown, Check, X } from "lucide-react";

export default function Student() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [parents, setParents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);

  // Searchable Parent Dropdown States
  const [parentSearch, setParentSearch] = useState("");
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const parentDropdownRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    admission_number: "",
    roll_number: "",
    phone: "",
    grade_id: "",
    parent_id: "",
    gender: "",
    email: "",
    school_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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
      
      setStudents(studentsRes.data?.data || studentsRes.data || []);
      setGrades(gradesRes.data?.data || gradesRes.data || []);
      setParents(parentsRes.data?.data || parentsRes.data || []);
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Close parent searchable dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target)) {
        setIsParentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        phone: form.phone,
        school_id: schoolId
      };

      let response;
      if (editId) {
        await api.put(`/students/${editId}`, payload);
        toast.success("Student updated successfully");
      } else {
        response = await api.post("/students", payload);
        toast.success("Student added successfully");
        
        if (response.data?.credentials) {
          setNewCredentials(response.data.credentials);
          setShowCredentialsModal(true);
        }
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
    const parentId = student.parents_id || student.parent_id || "";
    setForm({
      name: student.name || "",
      admission_number: student.admission_number || "",
      roll_number: student.roll_number || "",
      grade_id: student.grade_id || "",
      parent_id: parentId,
      gender: student.gender || "",
      email: student.email || "",
      phone: student.phone || "",
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
    if (student.grade_name) return student.grade_name;
    if (student.grade && student.grade.name) return student.grade.name;
    if (student.grade_id) {
      const grade = grades.find(g => g.id === student.grade_id);
      return grade ? grade.name : `Grade ${student.grade_id}`;
    }
    return "No Grade";
  };

  const getParentName = (student) => {
    if (student.parent_name && student.parent_name !== 'No Parent') return student.parent_name;
    if (student.parent && student.parent.name) return student.parent.name;
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
      phone: "",
      school_id: schoolId
    });
    setParentSearch("");
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

  // Helper to get selected parent object
  const selectedParent = parents.find(p => p.id === form.parent_id);

  // Filter parents for searchable select
  const filteredParents = parents.filter(parent => 
    parent.name?.toLowerCase().includes(parentSearch.toLowerCase()) ||
    parent.phone?.includes(parentSearch)
  );

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Admission No", accessor: "admission_number", width: "150px" },
    { header: "Name", accessor: "name", width: "200px" },
    { header: "Phone", accessor: "phone", width: "150px" },
    { header: "Grade", accessor: "grade_name", width: "120px" },
    { header: "Parent", accessor: "parent_name", width: "180px" },
    { header: "Gender", accessor: "gender", width: "100px" },
    { header: "Email", accessor: "email", width: "200px" },
  ];

  const getTableData = () => {
    return students.map((student, index) => ({
      id: student.id,
      index: index + 1,
      admission_number: student.admission_number || "N/A",
      name: student.name,
      phone: student.phone || "N/A",
      grade_name: getGradeName(student),
      parent_name: getParentName(student),
      gender: student.gender || "N/A",
      email: student.email || "N/A",
      original: student
    }));
  };

  const renderTableActions = (row) => (
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
      item.admission_number?.toLowerCase().includes(lowerTerm) ||
      item.parent_name?.toLowerCase().includes(lowerTerm) ||
      item.email?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Students</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Student"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Student Records"
        searchPlaceholder="Search by name, admission number, parent or email..."
        onSearch={handleTableSearch}
        actions={renderTableActions}
      />

      {/* Modal - Add/Edit Student */}
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
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
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

              {/* SEARCHABLE PARENT DROPDOWN */}
              <div className="relative" ref={parentDropdownRef}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Parent
                </label>
                <div 
                  onClick={() => !saveLoading && setIsParentDropdownOpen(!isParentDropdownOpen)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white flex items-center justify-between cursor-pointer hover:border-slate-500 transition-colors"
                >
                  <span className={selectedParent ? "text-white" : "text-gray-400"}>
                    {selectedParent 
                      ? `${selectedParent.name} ${selectedParent.phone ? `(${selectedParent.phone})` : ''}`
                      : "Select Parent (Optional)"}
                  </span>
                  <div className="flex items-center gap-1">
                    {form.parent_id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, parent_id: "" });
                        }}
                        className="text-gray-400 hover:text-white p-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isParentDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-slate-800 border-b border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search parent by name or phone..."
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-400 outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="py-1">
                      <div
                        onClick={() => {
                          setForm({ ...form, parent_id: "" });
                          setIsParentDropdownOpen(false);
                          setParentSearch("");
                        }}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-gray-400 flex items-center justify-between"
                      >
                        <span>None (Optional)</span>
                        {!form.parent_id && <Check className="h-4 w-4 text-blue-400" />}
                      </div>

                      {filteredParents.length > 0 ? (
                        filteredParents.map((parent) => (
                          <div
                            key={parent.id}
                            onClick={() => {
                              setForm({ ...form, parent_id: parent.id });
                              setIsParentDropdownOpen(false);
                              setParentSearch("");
                            }}
                            className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-white flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{parent.name}</p>
                              {parent.phone && <p className="text-xs text-gray-400">{parent.phone}</p>}
                            </div>
                            {form.parent_id === parent.id && <Check className="h-4 w-4 text-blue-400" />}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-sm text-gray-400">
                          No parents found
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setNewCredentials(null);
        }}
        credentials={newCredentials}
        entityType="student"
      />
    </div>
  );
}