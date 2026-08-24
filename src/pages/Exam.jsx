import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, ChevronDown, Check, Search, X } from "lucide-react";

// --- Utility to derive label text across varying API models ---
const getOptionLabel = (opt) => {
  if (!opt) return "";
  return opt.name || opt.title || opt.label || opt.type_name || `ID: ${opt.id}`;
};

// --- Single Searchable Dropdown ---
function SearchableSelect({ label, options, value, onChange, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.id) === String(value));

  const filteredOptions = options.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label} {required && "*"}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-left flex justify-between items-center text-white focus:outline-none focus:border-blue-500"
      >
        <span className={selectedOption ? "text-white" : "text-gray-400"}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder || "Select option..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-700 flex items-center gap-2 bg-slate-900">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700 ${
                    String(opt.id) === String(value) ? "bg-blue-600/30 text-blue-300" : "text-gray-200"
                  }`}
                >
                  <span>{getOptionLabel(opt)}</span>
                  {String(opt.id) === String(value) && <Check className="h-4 w-4 text-blue-400" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Multi-Select Searchable Dropdown for Grades/Classes ---
function MultiSearchableSelect({ label, options, selectedIds = [], onChange, placeholder, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const filteredOptions = options.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label} {required && "*"}
        </label>
      )}

      {/* Selected Chips Container */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] bg-slate-700 border border-slate-600 rounded px-2 py-1.5 flex flex-wrap items-center gap-1.5 cursor-pointer"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="bg-blue-600/40 text-blue-200 border border-blue-500/50 text-xs px-2 py-1 rounded-md flex items-center gap-1"
            >
              {getOptionLabel(opt)}
              <X
                className="h-3 w-3 hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(opt.id);
                }}
              />
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm px-1">{placeholder || "Select target grades..."}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-700 flex items-center gap-2 bg-slate-900">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-500"
              placeholder="Search grades/classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700 ${
                      isSelected ? "bg-blue-600/20 text-blue-300" : "text-gray-200"
                    }`}
                  >
                    <span>{getOptionLabel(opt)}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">No grades found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to safely extract response arrays
const extractArray = (res) => {
  if (!res) return [];
  const payload = res.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export default function Exam() {
  const [exams, setExams] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    exam_type_id: "",
    subject_id: "",
    employee_id: "",
    grade_ids: [],
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
    status: "draft",
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const getContextIds = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const activeSession = JSON.parse(
        localStorage.getItem("active_session") || localStorage.getItem("session") || "{}"
      );

      const schoolId = user?.school_id || user?.school?.id || 2;

      // Look for explicit integer IDs across stored keys
      const schoolSessionId =
        activeSession?.id ||
        activeSession?.school_session_id ||
        user?.school_session_id ||
        user?.active_session_id;

      return { schoolId, schoolSessionId };
    } catch (e) {
      console.error("Error reading context from localStorage:", e);
      return { schoolId: null, schoolSessionId: null };
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let { schoolId, schoolSessionId } = getContextIds();

    if (!schoolId) {
      toast.error("Active school context missing.");
      setLoading(false);
      return;
    }

    // Fallback: If schoolSessionId is missing, fetch active sessions from backend
    if (!schoolSessionId) {
      try {
        const sessionRes = await api.get("/school-sessions", { params: { school_id: schoolId, is_active: 1 } });
        const sessions = extractArray(sessionRes);
        const active = sessions.find((s) => s.is_active || s.status === "active") || sessions[0];

        if (active?.id) {
          schoolSessionId = active.id;
          localStorage.setItem("active_session", JSON.stringify(active));
        }
      } catch (err) {
        console.warn("Could not dynamically resolve active session ID:", err);
      }
    }

    if (!schoolSessionId) {
      toast.error("No active academic session selected. Please select a valid session in settings.");
      setLoading(false);
      return;
    }

    const params = {
      school_id: schoolId,
      school_session_id: schoolSessionId,
    };

    try {
      const [examsRes, typesRes, subjectsRes, staffRes, gradesRes] = await Promise.allSettled([
        api.get("/cbt/exams", { params }),
        api.get("/cbt/exam-types", { params }),
        api.get("/subjects", { params: { school_id: schoolId } }),
        api.get("/employees", { params: { school_id: schoolId } }),
        api.get("/grades", { params: { school_id: schoolId } }),
      ]);

      if (examsRes.status === "fulfilled") setExams(extractArray(examsRes.value));
      if (typesRes.status === "fulfilled") setExamTypes(extractArray(typesRes.value));
      if (subjectsRes.status === "fulfilled") setSubjects(extractArray(subjectsRes.value));

      if (staffRes.status === "fulfilled") {
        const rawStaff = extractArray(staffRes.value);
        const formattedStaff = rawStaff.map((emp) => {
          const directName = emp.name;
          const splitName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
          const userName = emp.user ? `${emp.user.first_name || ""} ${emp.user.last_name || ""}`.trim() : "";
          const resolvedName = directName || splitName || userName || emp.user?.name || `Employee #${emp.id}`;

          return { ...emp, name: resolvedName };
        });
        setEmployees(formattedStaff);
      }

      if (gradesRes.status === "fulfilled") setGrades(extractArray(gradesRes.value));

    } catch (err) {
      console.error("❌ Data retrieval breakdown:", err);
      toast.error("Failed to populate assessment matrices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.exam_type_id) return toast.error("Please select an Exam Category Type.");
    if (!form.subject_id) return toast.error("Please select a Target Subject.");
    if (!form.employee_id) return toast.error("Please assign a Proctor / Examiner.");
    if (!form.grade_ids || form.grade_ids.length === 0) return toast.error("Please assign at least one target Grade/Class.");

    setSaveLoading(true);
    const { schoolId, schoolSessionId } = getContextIds();

    if (!schoolSessionId) {
      toast.error("Missing active session context.");
      setSaveLoading(false);
      return;
    }

    const payload = {
      ...form,
      school_id: schoolId,
      school_session_id: schoolSessionId,
      randomize_questions: form.randomize_questions ? 1 : 0,
      randomize_options: form.randomize_options ? 1 : 0,
      show_result_immediately: form.show_result_immediately ? 1 : 0,
      allow_late_submission: form.allow_late_submission ? 1 : 0,
    };

    try {
      if (editId) {
        await api.put(`/cbt/exams/${editId}`, payload);
        toast.success("CBT configuration updated.");
      } else {
        await api.post("/cbt/exams", payload);
        toast.success("CBT core structure deployed successfully.");
      }
      closeModal();
      fetchAll();
    } catch (error) {
      console.error("❌ Process failure:", error);
      toast.error(error.response?.data?.message || "Validation error across core dependencies.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (exam) => {
    setForm({
      exam_type_id: exam.exam_type_id || "",
      subject_id: exam.subject_id || "",
      employee_id: exam.employee_id || "",
      grade_ids: exam.grades ? exam.grades.map((g) => g.id) : [],
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
      status: exam.status || "draft",
    });
    setEditId(exam.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entire examination block and linked questions?")) return;
    try {
      await api.delete(`/cbt/exams/${id}`);
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
      grade_ids: [],
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
      status: "draft",
    });
    setEditId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Exam Sheet Title", accessor: "title", width: "200px" },
    { header: "Classification", accessor: "type_name", width: "120px" },
    { header: "Subject", accessor: "subject_name", width: "120px" },
    { header: "Proctor", accessor: "proctor_name", width: "130px" },
    { header: "Target Grades", accessor: "grades_list", width: "150px" },
    { header: "Duration", accessor: "duration", width: "90px" },
    { header: "Status", accessor: "status", width: "90px" },
  ];

  const getTableData = () => {
    return exams.map((exam, index) => {
      const proctorName = exam.employee
        ? exam.employee.name || `${exam.employee.first_name || ""} ${exam.employee.last_name || ""}`.trim() || `Employee #${exam.employee.id}`
        : "Unassigned";

      return {
        id: exam.id,
        index: index + 1,
        title: exam.title,
        type_name: exam.exam_type?.name || exam.exam_type?.title || "Unassigned",
        subject_name: exam.subject?.name || exam.subject?.title || "Generic",
        proctor_name: proctorName,
        grades_list: exam.grades && exam.grades.length > 0 ? exam.grades.map((g) => g.name || g.title).join(", ") : "All Grades",
        duration: `${exam.duration_minutes} Mins`,
        status: (exam.status || "DRAFT").toUpperCase(),
        original: exam,
      };
    });
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">CBT Scheduling Desk</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Deploy Active Exam
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Deployed Assessment Matrix"
        searchPlaceholder="Filter exam configurations..."
        onSearch={(d, t) => d.filter((i) => i.title.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleEdit(row.original)} className="text-yellow-400 hover:text-yellow-300 p-1">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              {editId ? "Modify Exam Configurations" : "Deploy New Exam Ruleset"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Assessment Sheet Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Exam Type Dropdown */}
              <div>
                <SearchableSelect
                  label="CBT Exam Category Type"
                  options={examTypes}
                  value={form.exam_type_id}
                  onChange={(id) => setForm({ ...form, exam_type_id: id })}
                  placeholder="Select Exam Category"
                  required
                />
              </div>

              {/* Subject Dropdown */}
              <div>
                <SearchableSelect
                  label="Target Subject"
                  options={subjects}
                  value={form.subject_id}
                  onChange={(id) => setForm({ ...form, subject_id: id })}
                  placeholder="Select Subject"
                  required
                />
              </div>

              {/* Searchable Proctor Dropdown */}
              <div>
                <SearchableSelect
                  label="Assigned Proctor / Examiner"
                  options={employees}
                  value={form.employee_id}
                  onChange={(id) => setForm({ ...form, employee_id: id })}
                  placeholder="Select Assigned Proctor"
                  required
                />
              </div>

              {/* Multi-Select Grade/Class Dropdown */}
              <div>
                <MultiSearchableSelect
                  label="Target Grade(s) / Class(es)"
                  options={grades}
                  selectedIds={form.grade_ids}
                  onChange={(selected) => setForm({ ...form, grade_ids: selected })}
                  placeholder="Select Target Grades"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Allowed Duration (Minutes) *</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Window Open Timeline *</label>
                <input
                  type="datetime-local"
                  value={form.available_from}
                  onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Closing Cutoff Due Date *</label>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Max Ceiling Score *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.max_score}
                  onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Baseline Pass Mark *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pass_mark}
                  onChange={(e) => setForm({ ...form, pass_mark: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Operational Instructions</label>
                <textarea
                  rows="2"
                  value={form.instruction}
                  onChange={(e) => setForm({ ...form, instruction: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none placeholder-gray-400 text-sm"
                  placeholder="Define mandatory assessment instructions parameters..."
                ></textarea>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.randomize_questions}
                    onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })}
                    className="accent-blue-600 h-4 w-4"
                  />
                  Randomize Questions
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.randomize_options}
                    onChange={(e) => setForm({ ...form, randomize_options: e.target.checked })}
                    className="accent-blue-600 h-4 w-4"
                  />
                  Randomize Options
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_result_immediately}
                    onChange={(e) => setForm({ ...form, show_result_immediately: e.target.checked })}
                    className="accent-blue-600 h-4 w-4"
                  />
                  Immediate Scoring Display
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allow_late_submission}
                    onChange={(e) => setForm({ ...form, allow_late_submission: e.target.checked })}
                    className="accent-blue-600 h-4 w-4"
                  />
                  Allow Late Submission
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Workflow Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 outline-none"
                >
                  <option value="draft">DRAFT (Hidden)</option>
                  <option value="published">PUBLISHED (Active Verification)</option>
                  <option value="closed">CLOSED (Terminated Access)</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 rounded font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-blue-600 rounded font-medium disabled:bg-blue-400"
                >
                  {saveLoading ? "Deploying Matrix..." : "Save Assessment Layout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}