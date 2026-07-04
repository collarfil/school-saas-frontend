import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Income() {
  const [incomes, setIncomes] = useState([]);
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

  const extractArrayData = (response) => {
    if (!response || !response.data) return [];
    const data = response.data;
    if (data?.status === 'success') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
      return [];
    }
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
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
      const res = await api.get("/incomes", { params: { school_id: schoolId } });
      const incomesData = extractArrayData(res);
      setIncomes(Array.isArray(incomesData) ? incomesData : []);
    } catch (err) {
      console.error("❌ Load incomes error:", err);
      if (err.response?.status === 422) {
        toast.error("School ID is required. Please refresh and try again.");
      } else {
        toast.error("Failed to load income records");
      }
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

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
      const payload = { amount: parseFloat(form.amount), date: form.date, note: form.note, school_id: schoolId };
      if (editId) {
        await api.put(`/incomes/${editId}`, payload);
        toast.success("Income updated successfully");
      } else {
        await api.post("/incomes", payload);
        toast.success("Income recorded successfully");
      }
      resetForm();
      setShow(false);
      await loadAll();
    } catch (err) {
      console.error("❌ Save income error:", err.response?.data || err);
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).forEach(messages => messages.forEach(message => toast.error(message)));
      } else {
        toast.error("Error saving income record");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this income record?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/incomes/${id}`, { params: { school_id: schoolId } });
        toast.success("Income record deleted successfully");
        loadAll();
      } catch (err) {
        console.error("❌ Delete income error:", err);
        toast.error("Failed to delete income record");
      }
    }
  };

  const resetForm = () => {
    const schoolId = getSchoolId();
    setForm({ amount: "", date: new Date().toISOString().split('T')[0], note: "", school_id: schoolId });
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
    setForm({ amount: "", date: new Date().toISOString().split('T')[0], note: "", school_id: schoolId });
    setEditId(null);
    setShow(true);
  };

  const incomesArray = Array.isArray(incomes) ? incomes : [];

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Amount", accessor: "amount_formatted", width: "150px" },
    { header: "Date", accessor: "date_formatted", width: "150px" },
    { header: "Note", accessor: "note", width: "300px" },
  ];

  const getTableData = () => {
    return incomesArray.map((income, index) => ({
      id: income.id,
      amount_formatted: formatAmount(income.amount),
      date_formatted: income.date ? new Date(income.date).toLocaleDateString() : 'N/A',
      note: income.note || <span className="text-gray-400 italic">No note</span>,
      original: income,
      index: index
    }));
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => {
        setForm({ amount: row.original.amount || "", date: row.original.date || new Date().toISOString().split('T')[0], note: row.original.note || "", school_id: getSchoolId() });
        setEditId(row.original.id);
        setShow(true);
      }} className="text-yellow-400 hover:text-yellow-300 p-1" title="Edit"><Edit className="h-4 w-4" /></button>
      <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  const handleTableSearch = (data, term) => {
    const lowerTerm = term.toLowerCase();
    return data.filter(item => item.note?.toString().toLowerCase().includes(lowerTerm));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold">Income Records</h2><p className="text-sm text-gray-400">{incomesArray.length} Records</p></div>
        <button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />{loading ? "Loading..." : "Add Income"}
        </button>
      </div>

      <div className="mb-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300"><strong>School ID:</strong> {getSchoolId() || "Not found"}<br /><strong>Incomes Count:</strong> {incomesArray.length}</div>
      </div>

      <DataTable columns={tableColumns} data={getTableData()} loading={loading} title="Income Records" searchPlaceholder="Search by note..." onSearch={handleTableSearch} actions={renderActions} />

      {show && (<div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
        <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Income Record" : "Add New Income"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Amount <span className="text-red-400">*</span></label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required disabled={saveLoading} min="0" step="0.01" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Date <span className="text-red-400">*</span></label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" required disabled={saveLoading} /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Note</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Add a note (optional)" rows={3} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none" disabled={saveLoading} /></div>
            <div className="p-3 bg-slate-700/50 rounded text-sm"><p className="text-gray-300"><strong>Note:</strong> This income will be recorded for your school (School ID: {getSchoolId()})</p></div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500" disabled={saveLoading}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700" disabled={saveLoading}>{saveLoading ? "Saving..." : (editId ? "Update" : "Save")}</button>
            </div>
          </form>
        </div>
      </div>)}
    </div>
  );
}