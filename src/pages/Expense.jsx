import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ 
    amount: "", 
    date: new Date().toISOString().split('T')[0], 
    note: "",
    school_id: ""
  });
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Get school_id from user data
  const getSchoolId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.school?.id || user?.school_id;
      }
    } catch (error) {
      console.error("Error getting school ID:", error);
    }
    return null;
  };

  // Helper function to extract array data from API responses
  const extractArrayData = (response) => {
    if (!response || !response.data) {
      console.warn("No response data found");
      return [];
    }

    const data = response.data;
    
    if (data?.status === 'success') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
      if (data.data && Array.isArray(data.data.items)) return data.data.items;
      return [];
    }
    
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.results && Array.isArray(data.results)) return data.results;
    
    console.warn("Could not extract array data from response:", data);
    return [];
  };

  const loadAll = async () => {
    setLoading(true);
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/expenses", {
        params: { school_id: schoolId }
      });

      console.log("📊 Expenses API Response:", res.data);
      
      const expensesData = extractArrayData(res);
      
      console.log("✅ Extracted expenses:", expensesData);

      // Ensure we always set an array
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (err) {
      console.error("❌ Load expenses error:", err);
      
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to load expense records");
      }
      
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
        amount: parseFloat(form.amount),
        date: form.date,
        note: form.note,
        school_id: schoolId
      };

      if (editId) {
        await api.put(`/expenses/${editId}`, payload);
        toast.success("Expense updated successfully");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense recorded successfully");
      }

      resetForm();
      setShow(false);
      await loadAll();
    } catch (err) {
      console.error("❌ Save expense error:", err.response?.data || err);
      
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.status === 422) {
        toast.error("Validation error. Please check all fields.");
      } else {
        toast.error("Error saving expense record");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/expenses/${id}`, {
          params: { school_id: schoolId }
        });
        toast.success("Expense record deleted successfully");
        loadAll();
      } catch (err) {
        console.error("❌ Delete expense error:", err);
        toast.error("Failed to delete expense record");
      }
    }
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({ 
      amount: "", 
      date: new Date().toISOString().split('T')[0], 
      note: "",
      school_id: schoolId
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShow(false);
    resetForm();
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '₦0';
    return `₦${typeof amount === 'number' ? amount.toLocaleString() : parseFloat(amount || 0).toLocaleString()}`;
  };

  const handleOpenModal = () => {
    const schoolId = getSchoolId();
    setForm({ 
      amount: "", 
      date: new Date().toISOString().split('T')[0], 
      note: "",
      school_id: schoolId
    });
    setEditId(null);
    setShow(true);
  };

  // Safe array variable
  const expensesArray = Array.isArray(expenses) ? expenses : [];

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expense Records</h2>
        <div className="text-sm text-gray-400">
          {expensesArray.length} Records
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "Loading..." : "+ Add Expense"}
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Expenses Data Type:</strong> {typeof expenses}
          <br />
          <strong>Is Expenses Array?:</strong> {Array.isArray(expenses) ? "Yes" : "No"}
          <br />
          <strong>Expenses Count:</strong> {expensesArray.length}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading expense records...
          </div>
        ) : expensesArray.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Expense Records Found</h3>
            <p className="text-gray-400 mb-4">Add your first expense record</p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Note</th>
                <th className="py-3 px-4 font-semibold">School</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expensesArray.map((expense, index) => (
                <tr key={expense.id || index} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {formatAmount(expense.amount)}
                  </td>
                  <td className="py-3 px-4">
                    {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {expense.note || (
                      <span className="text-gray-400 italic">No note</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {expense.school?.name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        const schoolId = getSchoolId();
                        setForm({
                          amount: expense.amount || "",
                          date: expense.date || new Date().toISOString().split('T')[0],
                          note: expense.note || "",
                          school_id: schoolId
                        });
                        setEditId(expense.id);
                        setShow(true);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-400/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
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
              {editId ? "Edit Expense Record" : "Add New Expense"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Add a note (optional)"
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  disabled={saveLoading}
                />
              </div>

              <div className="p-3 bg-slate-700/50 rounded text-sm">
                <p className="text-gray-300">
                  <strong>Note:</strong> This expense will be recorded for your school (School ID: {getSchoolId()})
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