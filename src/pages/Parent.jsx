import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Parent() {
  const [parents, setParents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    school_id: "" // Added school_id to form
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
      
      // Handle API response format
      if (res.data.status === 'success') {
        setParents(res.data.data || []);
      } else {
        setParents(res.data || []);
      }
      
    } catch (error) {
      console.error("❌ Fetch parents error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
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

      if (editId) {
        await api.put(`/parents/${editId}`, payload);
        toast.success("Parent updated successfully");
      } else {
        await api.post("/parents", payload);
        toast.success("Parent added successfully");
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

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parents</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Add Parent"}
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Parents:</strong> {parents.length} records found
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading parents...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Address</th>
                <th className="py-3 px-4 font-semibold">School</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.length > 0 ? (
                parents.map((parent, index) => (
                  <tr key={parent.id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{parent.name}</td>
                    <td className="py-3 px-4">{parent.phone}</td>
                    <td className="py-3 px-4">
                      {parent.email ? (
                        <a href={`mailto:${parent.email}`} className="text-blue-300 hover:text-blue-200 hover:underline">
                          {parent.email}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={parent.address}>
                      {parent.address || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {parent.school?.name || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(parent)}
                        className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-400/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(parent.id)}
                        className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    {!loading && "No parents found. Click 'Add Parent' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
    </div>
  );
}