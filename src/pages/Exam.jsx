import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus } from "lucide-react";

export default function Exam() {
  const [exams, setExams] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    exam_type_id: "",
    subject_id: "",
    employee_id: "",
    title: "",
    instruction: "",
    available_from: "",
    due_date: "",
    duration_minutes: "",
    max_score: "",
    pass_mark: "",
    randomize_questions: false,
    randomize_options: false,
    show_result_immediately: true,
    allow_late_submission: false,
    status: "draft"
  });
  
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const getContextIds = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const activeSession = JSON.parse(localStorage.getItem('active_session'));
    return {
      schoolId: user?.school?.id || user?.school_id,
      schoolSessionId: activeSession?.id || user?.school_session_id
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    const { schoolId, schoolSessionId } = getContextIds();

    try {
      const [examsRes, typesRes, subjectsRes, staffRes] = await Promise.all([
        api.get("/CBT/exams", { params: { school_id: schoolId, school_session_id: schoolSessionId } }),
        api.get("/CBT/exam-types", { params: { school_id: schoolId, school_session_id: schoolSessionId } }),
        api.get("/subjects", { params: { school_id: schoolId } }),
        api.get("/employees", { params: { school_id: schoolId } })
      ]);

      setExams(examsRes.data?.data || examsRes.data || []);
      setExamTypes(typesRes.data?.data || typesRes.data || []);
      setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
      setEmployees(staffRes.data?.data || staffRes.data || []);
    } catch (err) {
      console.error("❌ Data retrieval breakdown:", err);
      toast.error("Failed to populate core deployment matrices.");
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
    const { schoolId, schoolSessionId } = getContextIds();

    const payload = {
      ...form,
      school_id: schoolId,
      school_session_id: schoolSessionId,
      randomize_questions: form.randomize_questions ? 1 : 0,
      randomize_options: form.randomize_options ? 1 : 0,
      show_result_immediately: form.show_result_immediately ? 1 : 0,
      allow_late_submission: form.allow_late_submission ? 1 : 0
    };

    try {
      if (editId) {
        await api.put(`/CBT/exams/${editId}`, payload);
        toast.success("CBT configuration ruleset updated.");
      } else {
        await api.post("/CBT/exams", payload);
        toast.success("CBT core structure deployed successfully.");
      }
      setShowModal(false);
      resetForm();
      fetchAll();
    } catch (error) {
      console.error("❌ Process failure:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Validation breakdown across core dependencies.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (exam) => {
    setForm({
      exam_type_id: exam.exam_type_id || "",
      subject_id: exam.subject_id || "",
      employee_id: exam.employee_id || "",
      title: exam.title || "",
      instruction: exam.instruction || "",
      available_from: exam.available_from ? exam.available_from.replace(" ", "T").substring(0, 16) : "",
      due_date: exam.due_date ? exam.due_date.replace(" ", "T").substring(0, 16) : "",
      duration_minutes: exam.duration_minutes || "",
      max_score: exam.max_score || "",
      pass_mark: exam.pass_mark || "",
      randomize_questions: !!exam.randomize_questions,
      randomize_options: !!exam.randomize_options,
      show_result_immediately: !!exam.show_result_immediately,
      allow_late_submission: !!exam.allow_late_submission,
      status: exam.status || "draft"
    });
    setEditId(exam.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entire examination block and linked questions?")) return;
    try {
      await api.delete(`/CBT/exams/${id}`);
      toast.success("Exam matrix dropped.");
      fetchAll();
    } catch (err) {
      toast.error("Failed to clear transactional exam entry rows.");
    }
  };

  const resetForm = () => {
    setForm({
      exam_type_id: "",
      subject_id: "",
      employee_id: "",
      title: "",
      instruction: "",
      available_from: "",
      due_date: "",
      duration_minutes: "",
      max_score: "",
      pass_mark: "",
      randomize_questions: false,
      randomize_options: false,
      show_result_immediately: true,
      allow_late_submission: false,
      status: "draft"
    });
    setEditId(null);
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Exam Sheet Title", accessor: "title", width: "220px" },
    { header: "Classification", accessor: "type_name", width: "130px" },
    { header: "Subject Course", accessor: "subject_name", width: "130px" },
    { header: "Duration", accessor: "duration", width: "100px" },
    { header: "Score Map", accessor: "scores", width: "120px" },
    { header: "Status Flags", accessor: "status", width: "100px" }
  ];

  const getTableData = () => {
    return exams.map((exam, index) => ({
      id: exam.id,
      index: index + 1,
      title: exam.title,
      type_name: exam.exam_type?.name || "Unassigned",
      subject_name: exam.subject?.name || "Generic Structure",
      duration: `${exam.duration_minutes} Mins`,
      scores: `${exam.pass_mark} / ${exam.max_score}`,
      status: exam.status.toUpperCase(),
      original: exam
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">CBT Scheduling Desk</h2>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" /> Deploy Active Exam
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Deployed Assessment Matrix"
        searchPlaceholder="Filter exams configurations directly..."
        onSearch={(d, t) => d.filter(i => i.title.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1"><Edit className="h-4 w-4" /></button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">{editId ? "Modify Exam Configurations" : "Deploy New Exam Ruleset"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Assessment Sheet Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none focus:border-blue-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">CBT Exam Category Type *</label>
                <select value={form.exam_type_id} onChange={e => setForm({...form, exam_type_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required>
                  <option value="">Select Category Matrix</option>
                  {examTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Subject *</label>
                <select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required>
                  <option value="">Select Linked Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Examiner Examiner *</label>
                <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required>
                  <option value="">Select Assigned Proctors</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Allowed Duration (Minutes) *</label>
                <input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Window Open Timeline *</label>
                <input type="datetime-local" value={form.available_from} onChange={e => setForm({...form, available_from: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none font-mono text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Closing Cutoff Due Date *</label>
                <input type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none font-mono text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Ceiling Score *</label>
                <input type="number" step="0.01" value={form.max_score} onChange={e => setForm({...form, max_score: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Baseline Pass Mark *</label>
                <input type="number" step="0.01" value={form.pass_mark} onChange={e => setForm({...form, pass_mark: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none" required />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Operational Instructions Sheets</label>
                <textarea rows="2" value={form.instruction} onChange={e => setForm({...form, instruction: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none placeholder-gray-400 text-sm" placeholder="Define mandatory assessment instructions parameters..."></textarea>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.randomize_questions} onChange={e => setForm({...form, randomize_questions: e.target.checked})} className="accent-blue-600 h-4 w-4" /> Randomize Questions
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.randomize_options} onChange={e => setForm({...form, randomize_options: e.target.checked})} className="accent-blue-600 h-4 w-4" /> Randomize Options
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.show_result_immediately} onChange={e => setForm({...form, show_result_immediately: e.target.checked})} className="accent-blue-600 h-4 w-4" /> Immediate Scoring Display
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.allow_late_submission} onChange={e => setForm({...form, allow_late_submission: e.target.checked})} className="accent-blue-600 h-4 w-4" /> Allow Late Submission
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Workflow Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none">
                  <option value="draft">DRAFT (Hidden)</option>
                  <option value="published">PUBLISHED (Active Verification)</option>
                  <option value="closed">CLOSED (Terminated Access)</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 rounded font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded font-medium disabled:bg-blue-400">{saveLoading ? "Deploying Matrix..." : "Save Assessment Layout"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}