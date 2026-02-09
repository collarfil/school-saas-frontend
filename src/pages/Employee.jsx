import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "teacher",
    school_id: "" // Added school_id
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
      const res = await api.get("/employees", {
        params: { school_id: schoolId }
      });
      
      console.log("✅ Employees API Response:", res.data);
      
      let employeesList = [];
      if (res.data.status === 'success') {
        employeesList = res.data.data || [];
      } else if (Array.isArray(res.data)) {
        employeesList = res.data;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        employeesList = res.data.data;
      }
      
      setEmployees(employeesList);
    } catch (err) {
      console.error("❌ Fetch employees error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (err.response?.data?.error) {
        toast.error(`Employees: ${err.response.data.error}`);
      } else {
        toast.error("Failed to fetch employees");
      }
      
      setEmployees([]);
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
        ...form,
        school_id: schoolId
      };

      if (editId) {
        await api.put(`/employees/${editId}`, payload);
        toast.success("Employee updated successfully");
      } else {
        await api.post("/employees", payload);
        toast.success("Employee added successfully");
      }
      
      resetForm();
      setShow(false);
      await fetchAll();
    } catch (err) {
      console.error("❌ Save employee error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 422) {
        toast.error("Validation error. Please check all fields.");
      } else {
        toast.error("Failed to save employee.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/employees/${id}`, {
          params: { school_id: schoolId }
        });
        toast.success("Employee deleted successfully");
        fetchAll();
      } catch (err) {
        console.error("❌ Delete employee error:", err);
        toast.error("Failed to delete employee.");
      }
    }
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "teacher",
      school_id: schoolId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "teacher",
      school_id: schoolId
    });
    setEditId(null);
    setShow(true);
  };

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employees</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Add Employee"}
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Employees:</strong> {employees.length} records found
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No employees found.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">School</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee.id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">{employee.name}</td>
                  <td className="py-3 px-4">{employee.email || "-"}</td>
                  <td className="py-3 px-4">{employee.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      employee.role === 'teacher' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {employee.role === 'teacher' ? 'Teacher' : 'Non-Teaching'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {employee.school?.name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        const schoolId = getSchoolId();
                        setForm({
                          name: employee.name || "",
                          email: employee.email || "",
                          phone: employee.phone || "",
                          role: employee.role || "teacher",
                          school_id: schoolId
                        });
                        setEditId(employee.id);
                        setShow(true);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-400/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
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

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Employee" : "Add New Employee"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email (optional)"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email must be unique within your school
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number (optional)"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="teacher">Teacher</option>
                  <option value="non-teaching">Non-Teaching</option>
                </select>
              </div>

              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This employee will be added to your school (School ID: {getSchoolId()})
                </p>
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