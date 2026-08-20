import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Question() {
  const { exam_id } = useParams(); // Directly bounded structurally by parent layout context route
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    exam_id: "",
    question_text: "",
    question_image: "",
    type: "single", // single, multiple, boolean, theory
    mark: "1.00"
  });
  
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchQuestions = async () => {
    if (!exam_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/CBT/exams/${exam_id}/questions`);
      setQuestions(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Problem fetching core structure parameters:", err);
      toast.error("Failed to fetch questions tracking sheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [exam_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    const payload = {
      ...form,
      exam_id: exam_id
    };

    try {
      if (editId) {
        await api.put(`/CBT/questions/${editId}`, payload);
        toast.success("Question parameters updated cleanly.");
      } else {
        await api.post("/CBT/questions", payload);
        toast.success("Question structural layout registered.");
      }
      setShowModal(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Process error handling item entry matrices configuration properties.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (q) => {
    setForm({
      exam_id: exam_id,
      question_text: q.question_text || "",
      question_image: q.question_image || "",
      type: q.type || "single",
      mark: q.mark || "1.00"
    });
    setEditId(q.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you certain you want to purge this question line along with choices?")) return;
    try {
      await api.delete(`/CBT/questions/${id}`);
      toast.success("Question dropped cleanly from structural array mappings safely.");
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to drop selected structural element entry arrays.");
    }
  };

  const resetForm = () => {
    setForm({
      exam_id: exam_id,
      question_text: "",
      question_image: "",
      type: "single",
      mark: "1.00"
    });
    setEditId(null);
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "60px" },
    { header: "Question Content Context Details", accessor: "question_text", width: "550px" },
    { header: "Structural Execution Mode", accessor: "type_label", width: "180px" },
    { header: "Allocated Weight", accessor: "mark", width: "100px" }
  ];

  const getTableData = () => {
    return questions.map((q, index) => ({
      id: q.id,
      index: index + 1,
      question_text: q.question_text.length > 90 ? `${q.question_text.substring(0, 90)}...` : q.question_text,
      type_label: q.type.toUpperCase(),
      mark: `${q.mark} Pts`,
      original: q
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">Examination Question Bank</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Assigned Blueprint Scope Focus: ID #{exam_id}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Question Entry
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Active Content Matrix Questions"
        searchPlaceholder="Filter items within current item parameters scope..."
        onSearch={(d, t) => d.filter(i => i.original.question_text.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1"><Edit className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">{editId ? "Modify Question Structural Unit" : "Construct New Exam Query Item"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Processing Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none focus:border-blue-500 text-white" required>
                  <option value="single">Single Choice Objective (Radio option)</option>
                  <option value="multiple">Multiple Choice Multi-Select (Checkbox options)</option>
                  <option value="boolean">Boolean Variant (True/False Binary options)</option>
                  <option value="theory">Theoretical Text Input (Free text area format)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Question Content Formulation *</label>
                <textarea rows="4" value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white text-sm" placeholder="Draft technical query layout body contents details explicitly here..." required></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Optional Visual Vector Media Location URL</label>
                <input type="text" placeholder="https://resource-matrix.cdn/paths/image.png" value={form.question_image} onChange={e => setForm({...form, question_image: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white font-mono text-xs" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fractional Score Allocation Weight *</label>
                <input type="number" step="0.01" value={form.mark} onChange={e => setForm({...form, mark: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white font-mono" required />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-600 rounded font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded font-medium text-white disabled:bg-blue-400">{saveLoading ? "Processing Element Layout..." : "Commit Bank Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}