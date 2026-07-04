import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import CredentialsModal from "../components/CredentialsModal";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Parent() {
  const [parents, setParents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    school_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Get school_id from user data in localStorage
  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchParents = async () => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      
      if (!schoolId) {
        toast.error("No school ID found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("🔄 Fetching parents for school ID:", schoolId);
      const res = await api.get("/parents", {
        params: { school_id: schoolId }
      });
      
      console.log("✅ Parents API Response:", res.data);
      
      if (res.data.status === 'success') {
        setParents(res.data.data || []);
      } else {
        setParents(res.data || []);
      }
      
    } catch (error) {
      console.error("❌ Fetch parents error:", error.response?.data || error.message);
      
      if (error.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (error.response?.data?.error) {
        toast.error(`Parents Error: ${error.response.data.error}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to fetch parents");
      }
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
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

      let response;
      if (editId) {
        await api.put(`/parents/${editId}`, payload);
        toast.success("Parent updated successfully");
      } else {
        response = await api.post("/parents", payload);
        toast.success("Parent added successfully");
        
        // Show credentials modal for new parent
        if (response.data.credentials) {
          setNewCredentials(response.data.credentials);
          setShowCredentialsModal(true);
        }
      }
      setShowModal(false);
      resetForm();
      await fetchParents();
    } catch (error) {
      console.error("❌ Save parent error:", error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 422) {
        toast.error("Validation error. Please check all fields.");
      } else {
        toast.error("Failed to save parent");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (parent) => {
    const schoolId = getSchoolId();
    setForm({
      name: parent.name || "",
      phone: parent.phone || "",
      email: parent.email || "",
      address: parent.address || "",
      school_id: schoolId
    });
    setEditId(parent.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this parent?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/parents/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Parent deleted successfully");
      fetchParents();
    } catch (error) {
      console.error("❌ Delete parent error:", error);
      toast.error("Failed to delete parent");
    }
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
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
      phone: "",
      email: "",
      address: "",
      school_id: schoolId
    });
    setEditId(null);
    setShowModal(true);
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Name", accessor: "name", width: "200px" },
    { header: "Phone", accessor: "phone", width: "150px" },
    { header: "Email", accessor: "email", width: "250px" },
    { header: "Address", accessor: "address", width: "250px" },
  ];

  const getTableData = () => {
    return parents.map((parent, index) => ({
      id: parent.id,
      index: index + 1,
      name: parent.name,
      phone: parent.phone || "N/A",
      email: parent.email || "N/A",
      address: parent.address || "N/A",
      original: parent
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
      item.phone?.toLowerCase().includes(lowerTerm) ||
      item.email?.toLowerCase().includes(lowerTerm) ||
      item.address?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parents</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Parent"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Parent Records"
        searchPlaceholder="Search by name, phone, email or address..."
        onSearch={handleTableSearch}
        actions={renderTableActions}
      />

      {/* Modal - Add/Edit Parent */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Parent" : "Add New Parent"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter parent name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone <span className="text-red-400">*</span>
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
                <p className="text-xs text-gray-400 mt-1">
                  Phone must be unique within your school
                </p>
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
                <p className="text-xs text-gray-400 mt-1">
                  Email must be unique within your school
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  placeholder="Enter address (optional)"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-20 resize-none"
                  disabled={saveLoading}
                />
              </div>

              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This parent will be added to your school (School ID: {getSchoolId()})
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
        entityType="parent"
      />
    </div>
  );
}