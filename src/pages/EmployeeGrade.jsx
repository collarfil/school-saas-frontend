import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeGrade() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [grades, setGrades] = useState([]);

  const [form, setForm] = useState({
    employee_id: "",
    grade_id: "",
    school_id: ""
  });

  // Get school ID from localStorage
  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.school?.id || null;
    } catch (error) {
      console.error("Error getting school ID:", error);
      return null;
    }
  };

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      // Fetch mappings with school_id
      const mappingsRes = await api.get("/employee-grades", {
        params: { school_id: schoolId }
      });
      
      console.log("✅ Employee-Grade mappings data:", mappingsRes.data);
      
      let mappingsData = [];
      if (mappingsRes.data?.status === 'success') {
        mappingsData = mappingsRes.data.data || [];
      } else if (Array.isArray(mappingsRes.data)) {
        mappingsData = mappingsRes.data;
      } else if (mappingsRes.data?.data && Array.isArray(mappingsRes.data.data)) {
        mappingsData = mappingsRes.data.data;
      }
      
      setMappings(mappingsData);
      
      // Fetch dropdown data
      await fetchDropdownData(schoolId);
      
    } catch (err) {
      console.error("❌ Load mappings error:", err);
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async (schoolId) => {
    try {
      // Fetch employees for this school
      const employeesRes = await api.get("/employees", {
        params: { school_id: schoolId }
      });
      
      let employeesData = [];
      if (employeesRes.data?.status === 'success') {
        employeesData = employeesRes.data.data || [];
      } else if (Array.isArray(employeesRes.data)) {
        employeesData = employeesRes.data;
      }
      setEmployees(employeesData);
      
      // Fetch grades for this school
      const gradesRes = await api.get("/grades", {
        params: { school_id: schoolId }
      });
      
      let gradesData = [];
      if (gradesRes.data?.status === 'success') {
        gradesData = gradesRes.data.data || [];
      } else if (Array.isArray(gradesRes.data)) {
        gradesData = gradesRes.data;
      }
      setGrades(gradesData);
      
    } catch (err) {
      console.error("❌ Fetch dropdown data error:", err);
      toast.error(err.response?.data?.message || "Failed to load dropdown data");
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
        ...form,
        school_id: schoolId
      };

      await api.post("/employee-grades", payload);
      toast.success("Employee-Grade mapping added successfully");
      
      closeModal();
      await fetchAll();
      
    } catch (err) {
      console.error("❌ Save mapping error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to save mapping.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this mapping?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/employee-grades/${id}`, {
          params: { school_id: schoolId }
        });
        toast.success("Mapping deleted successfully");
        fetchAll();
      } catch (err) {
        console.error("❌ Delete mapping error:", err);
        toast.error("Failed to delete mapping.");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    const schoolId = getSchoolId();
    setForm({
      employee_id: "",
      grade_id: "",
      school_id: schoolId
    });
  };

  const openModal = () => {
    const schoolId = getSchoolId();
    setForm({
      employee_id: "",
      grade_id: "",
      school_id: schoolId
    });
    setShowModal(true);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id == employeeId);
    return employee ? employee.name : "Unknown";
  };

  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id == gradeId);
    return grade ? grade.name : "Unknown";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee-Grade Assignments</h1>
          <p className="text-gray-400">Assign grades to employees</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          + Assign Grade to Employee
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Employees:</strong> {employees.length} available
          <br />
          <strong>Grades:</strong> {grades.length} available
          <br />
          <strong>Mappings:</strong> {mappings.length} assignments found
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Current Assignments</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Loading assignments...</p>
            </div>
          ) : mappings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-4">No employee-grade assignments found</p>
              <button
                onClick={openModal}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                Create First Assignment
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">#</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Employee</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Grade</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping, index) => (
                  <tr key={mapping.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-4 px-6">{index + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">
                        {mapping.employee?.name || getEmployeeName(mapping.employee_id)}
                      </div>
                      {mapping.employee?.role && (
                        <div className="text-sm text-gray-400">
                          {mapping.employee.role}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">
                        {mapping.grade?.name || getGradeName(mapping.grade_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDelete(mapping.id)}
                        className="text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1.5 rounded hover:bg-red-400/10"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Assign Grade to Employee</h2>
              <p className="text-gray-400 text-sm mt-1">Select an employee and grade to assign</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Employee <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Choose an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role})
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    No employees found. Please add employees first.
                  </p>
                )}
              </div>

              {/* Grade Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Grade <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Choose a grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
                {grades.length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    No grades found. Please add grades first.
                  </p>
                )}
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  This assignment will be saved for School ID: {getSchoolId()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading || employees.length === 0 || grades.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {saveLoading ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}