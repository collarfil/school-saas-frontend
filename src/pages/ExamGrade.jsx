import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ExamGrade() {
  const { exam_id } = useParams();
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    exam_id: "",
    grade_name: "",
    min_percentage: "",
    max_percentage: "",
    remark: ""
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchGrades = async () => {
    if (!exam_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/CBT/exams/${exam_id}/grades`);
      setGrades(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Evaluation metrics extraction dropped:", err);
      toast.error("Failed to extract target evaluation scales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [exam_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(form.min_percentage) > parseFloat(form.max_percentage)) {
      toast.error("Minimum benchmark constraint cannot eclipse maximum bounds threshold.");
      return;
    }

    setSaveLoading(true);
    const payload = { ...form, exam_id: exam_id };

    try {
      if (editId) {
        await api.put(`/CBT/exam-grades/${editId}`, payload);
        toast.success("Grade classification parameter re-calibrated.");
      } else {
        await api.post("/CBT/exam-grades", payload);
        toast.success("Scale classification benchmark locked down.");
      }
      setShowModal(false);
      resetForm();
      fetchGrades();
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Process structural conflict on verification thresholds validation keys.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (g) => {
    setForm({
      exam_id: exam_id,
      grade_name: g.grade_name || "",
      min_percentage: g.min_percentage || "",
      max_percentage: g.max_percentage || "",
      remark: g.remark || ""
    });
    setEditId(g.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Flush this ranking scale benchmark entirely?")) return;
    try {
      await api.delete(`/CBT/exam-grades/${id}`);
      toast.success("Scale array tier purged successfully.");
      fetchGrades();
    } catch (err) {
      toast.error("Failed to drop selected grade mapping reference matrix.");
    }
  };

  const resetForm = () => {
    setForm({
      exam_id: exam_id,
      grade_name: "",
      min_percentage: "",
      max_percentage: "",
      remark: ""
    });
    setEditId(null);
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "60px" },
    { header: "Grade Badge Name", accessor: "grade_name", width: "180px" },
    { header: "Target Boundary Threshold Scale", accessor: "range", width: "300px" },
    { header: "Academic Review Summary", accessor: "remark", width: "320px" }
  ];

  const getTableData = () => {
    return grades.sort((a,b) => b.min_percentage - a.min_percentage).map((g, index) => ({
      id: g.id,
      index: index + 1,
      grade_name: g.grade_name,
      range: `${g.min_percentage}% to ${g.max_percentage}% Scope Range`,
      remark: g.remark || "N/A structural review notation",
      original: g
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">Automated Assessment Scale</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Bound Evaluator Array Model: Exam Target #{exam_id}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" /> Establish Grade Metric
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Grading Curve Matrix Tiers"
        searchPlaceholder="Search target classification matrix designations..."
        onSearch={(d, t) => d.filter(i => i.grade_name.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1"><Edit className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">{editId ? "Recalibrate Target Scale Block" : "Map Grading Scale Node"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Grade Designation Identifier *</label>
                <input type="text" placeholder="e.g., A+, Distinction, Credit" value={form.grade_name} onChange={e => setForm({...form, grade_name: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white focus:border-blue-500 font-bold" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Min Boundary % *</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.min_percentage} onChange={e => setForm({...form, min_percentage: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white font-mono" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Boundary % *</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.max_percentage} onChange={e => setForm({...form, max_percentage: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white font-mono" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Auditor Comment Notation</label>
                <input type="text" placeholder="e.g., Exceptional subject domain mastery demonstrated." value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none text-white text-sm" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 bg-gray-600 rounded font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded font-medium text-white disabled:bg-blue-400">{saveLoading ? "Recalibrating Matrix Tiers..." : "Commit Grade Setup"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}