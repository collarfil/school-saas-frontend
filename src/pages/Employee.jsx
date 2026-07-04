import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import CredentialsModal from "../components/CredentialsModal";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    employee_type: "teaching",
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
        name: form.name,
        email: form.email,
        phone: form.phone,
        employee_type: form.employee_type,
        school_id: schoolId
      };

      console.log("📤 Sending payload:", payload);

      let response;
      if (editId) {
        await api.put(`/employees/${editId}`, payload);
        toast.success("Employee updated successfully");
      } else {
        response = await api.post("/employees", payload);
        toast.success("Employee added successfully");
        
        // Show credentials modal for new employee
        if (response.data.credentials) {
          setNewCredentials(response.data.credentials);
          setShowCredentialsModal(true);
        }
      }
      
      resetForm();
      setShowModal(false);
      await fetchAll();
    } catch (err) {
      console.error("❌ Save employee error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        Object.keys(errors).forEach(field => {
          errors[field].forEach(message => toast.error(`${field}: ${message}`));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
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
      employee_type: "teaching",
      school_id: schoolId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({
      name: "",
      email: "",
      phone: "",
      employee_type: "teaching",
      school_id: schoolId
    });
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    const schoolId = getSchoolId();
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      employee_type: employee.employee_type || "teaching",
      school_id: schoolId
    });
    setEditId(employee.id);
    setShowModal(true);
  };

  const getEmployeeTypeLabel = (type) => {
    if (type === 'teaching') return 'Teaching Staff';
    if (type === 'non_teaching') return 'Non-Teaching Staff';
    return type || 'Unknown';
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Name", accessor: "name", width: "200px" },
    { header: "Email", accessor: "email", width: "250px" },
    { header: "Phone", accessor: "phone", width: "150px" },
    { header: "Type", accessor: "employee_type_label", width: "150px" },
  ];

  const getTableData = () => {
    return employees.map((employee, index) => ({
      id: employee.id,
      index: index + 1,
      name: employee.name,
      email: employee.email || "N/A",
      phone: employee.phone || "N/A",
      employee_type_label: getEmployeeTypeLabel(employee.employee_type),
      original: employee
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
      item.email?.toLowerCase().includes(lowerTerm) ||
      item.phone?.toLowerCase().includes(lowerTerm) ||
      item.employee_type_label?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employees</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Employee"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Employee Records"
        searchPlaceholder="Search by name, email, phone or type..."
        onSearch={handleTableSearch}
        actions={renderTableActions}
      />

      {/* Modal - Add/Edit Employee */}
      {showModal && (
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
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email will be used as username for login
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Phone will be used as temporary password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Employee Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.employee_type}
                  onChange={(e) => setForm({ ...form, employee_type: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="teaching">Teaching Staff</option>
                  <option value="non_teaching">Non-Teaching Staff</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Teaching staff can manage classes, take attendance, and enter results.<br />
                  Non-teaching staff can manage financial operations.
                </p>
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
      
      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setNewCredentials(null);
        }}
        credentials={newCredentials}
        entityType="employee"
      />
    </div>
  );
}