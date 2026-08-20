import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, CheckCircle, XCircle } from "lucide-react";

export default function Option() {
  const { question_id } = useParams();
  const [options, setOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    question_id: "",
    option_text: "",
    option_image: "",
    is_correct: false
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchOptions = async () => {
    if (!question_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/CBT/questions/${question_id}/options`);
      setOptions(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Option fetch failed:", err);
      toast.error("Failed to fetch choice matrices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [question_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    const payload = {
      ...form,
      question_id: question_id,
      is_correct: form.is_correct ? 1 : 0
    };

    try {
      if (editId) {
        await api.put(`/CBT/options/${editId}`, payload);
        toast.success("Option variations updated cleanly.");
      } else {
        await api.post("/CBT/options", payload);
        toast.success("New choice element deployed into pool.");
      }
      setShowModal(false);
      resetForm();
      fetchOptions();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Process error altering answer target structure.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (opt) => {
    setForm({
      question_id: question_id,
      option_text: opt.option_text || "",
      option_image: opt.option_image || "",
      is_correct: !!opt.is_correct
    });
    setEditId(opt.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this option from the question layout structural map?")) return;
    try {
      await api.delete(`/CBT/options/${id}`);
      toast.success("Choice item cleanly expunged.");
      fetchOptions();
    } catch (err) {
      toast.error("Failed to drop selected database structural choice row.");
    }
  };

  const toggleCorrectStatus = async (opt) => {
    try {
      const payload = {
        ...opt,
        is_correct: opt.is_correct ? 0 : 1
      };
      await api.put(`/CBT/options/${opt.id}`, payload);
      toast.success("Answer blueprint map state alternated successfully.");
      fetchOptions();
    } catch (err) {
      toast.error("Failed to mutate response truth configuration.");
    }
  };

  const resetForm = () => {
    setForm({
      question_id: question_id,
      option_text: "",
      option_image: "",
      is_correct: false
    });
    setEditId(null);
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "60px" },
    { header: "Option Text Content Variant", accessor: "option_text", width: "550px" },
    { header: "Truth Verification", accessor: "status_badge", width: "150px" }
  ];

  const getTableData = () => {
    return options.map((opt, index) => ({
      id: opt.id,
      index: index + 1,
      option_text: opt.option_text,
      status_badge: opt.is_correct ? (
        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800 w-max">
          <CheckCircle className="h-3.5 w-3.5" /> TRUE ANSWER
        </span>
      ) : (
        <span className="flex items-center gap-1 text-slate-400 text-xs bg-slate-900/50 px-2 py-1 rounded border border-slate-700 w-max">
          <XCircle className="h-3.5 w-3.5" /> DISTRACTOR
        </span>
      ),
      original: opt
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">Option Choice Modeler</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Bound to Query Context Instance: #{question_id}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Selection Item
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Mapped Choice Distribution Matrix"
        searchPlaceholder="Filter options text structures..."
        onSearch={(d, t) => d.filter(i => i.option_text.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => toggleCorrectStatus(row.original)} className={`p-1 rounded ${row.original.is_correct ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-400 hover:text-white'}`} title="Toggle Target Accuracy Flag">
              <CheckCircle className="h-4 w-4" />
            </button>
            <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1"><Edit className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">{editId ? "Modify Alternative Structural Item" : "Create Distractor or Solution Item"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Option String Core Data *</label>
                <textarea rows="3" value={form.option_text} onChange={e => setForm({...form, option_text: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white text-sm" placeholder="Define choice text..." required></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Choice Diagram Link CDN URL</label>
                <input type="text" placeholder="https://resource-matrix.cdn/paths/opt.png" value={form.option_image} onChange={e => setForm({...form, option_image: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white font-mono text-xs" />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-emerald-400 cursor-pointer font-medium bg-emerald-950/20 p-2.5 rounded border border-emerald-900/40">
                  <input type="checkbox" checked={form.is_correct} onChange={e => setForm({...form, is_correct: e.target.checked})} className="accent-emerald-500 h-4 w-4" /> Define this instance as the structural valid answer.
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-600 rounded font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded font-medium text-white disabled:bg-blue-400">{saveLoading ? "Writing Option Configuration..." : "Commit Matrix Choice"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}