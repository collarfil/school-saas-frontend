import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function School() {
  const [schools, setSchools] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    owner: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all schools - handle paginated response
  const fetchAll = async () => {
    try {
      console.log("🔄 Fetching schools...");
      const res = await api.get("/schools");
      
      console.log("✅ Schools API Response:", res);
      console.log("📊 Response data:", res.data);
      
      // Handle paginated response
      let schoolsData = res.data;
      
      // If it's a paginated response, extract the data array
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        console.log("📄 Paginated response detected, using data.data");
        schoolsData = res.data.data;
      }
      // If it's a direct array, use it as is
      else if (Array.isArray(res.data)) {
        console.log("📄 Direct array response detected");
        schoolsData = res.data;
      }
      
      console.log("🎯 Schools data to display:", schoolsData);
      setSchools(schoolsData || []);
      
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch schools");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🔹 Handle Add or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.owner || !form.name) {
      toast.error("Owner and Name are required");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/schools/${editId}`, form);
        toast.success("School updated successfully!");
      } else {
        await api.post("/schools", form);
        toast.success("School added successfully!");
      }

      setForm({
        owner: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        logo: "",
      });
      setEditId(null);
      setShow(false);
      
      // Refresh the list
      setTimeout(() => {
        fetchAll();
      }, 300);
      
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      toast.error("Failed to save school record");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete a record
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this school?")) return;
    try {
      await api.delete(`/schools/${id}`);
      toast.success("Deleted successfully");
      fetchAll();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete school");
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schools</h2>
        <button
          onClick={() => setShow(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition"
        >
          + Add School
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-blue-900/20 rounded text-sm border border-blue-700">
        <div className="text-blue-300">
          <strong>Debug:</strong> Showing {schools.length} schools | 
          Check browser console for API response details
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 p-4 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-300 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Owner</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Address</th>
              <th className="p-2">Logo</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.length > 0 ? (
              schools.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-700 hover:bg-slate-700/40"
                >
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{s.owner}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.email || "-"}</td>
                  <td className="p-2">{s.phone || "-"}</td>
                  <td className="p-2">{s.address || "-"}</td>
                  <td className="p-2">
                    {s.logo ? (
                      <img
                        src={s.logo}
                        alt="logo"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <button
                      onClick={() => {
                        setForm(s);
                        setEditId(s.id);
                        setShow(true);
                      }}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-400">
                  No schools found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit School" : "Add School"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {["owner", "name", "email", "phone", "address", "logo"].map(
                (key) => (
                  <input
                    key={key}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={
                      key.charAt(0).toUpperCase() + key.slice(1)
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400"
                  />
                )
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShow(false)}
                  className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
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