import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { 
  Trash2, 
  Plus, 
  Search, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronDown 
} from "lucide-react";

export default function Question() {
  const { exam_id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- View Mode & Bulk State ---
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [bulkQuestions, setBulkQuestions] = useState([createEmptyQuestion(1)]);
  const [savingBulk, setSavingBulk] = useState(false);

  // Helper generator for bulk entries
  function createEmptyQuestion(num) {
    return {
      temp_id: Date.now() + Math.random(),
      question_number: num,
      question_text: "",
      type: "single", // 'single', 'multiple', 'theory'
      marks: "1.00",
      explanation: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]
    };
  }

  // 1. Fetch Lookups (Grades & Subjects)
  const fetchLookups = useCallback(async () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const schoolId = user?.school?.id;

    if (!schoolId) {
      console.warn("⚠️ No school_id found on authenticated user session context.");
      return;
    }

    const params = { school_id: schoolId };

    try {
      const [gradesRes, subjectsRes] = await Promise.allSettled([
        api.get("/grades", { params }),
        api.get("/subjects", { params }),
      ]);

      if (gradesRes.status === "fulfilled") {
        const gradesData = gradesRes.value.data?.data || gradesRes.value.data || [];
        setGrades(gradesData);
      } else {
        toast.error("Failed to load grades list.");
      }

      if (subjectsRes.status === "fulfilled") {
        const subjectsData = subjectsRes.value.data?.data || subjectsRes.value.data || [];
        setSubjects(subjectsData);
      } else {
        toast.error("Failed to load subjects list.");
      }
    } catch (err) {
      console.error("❌ Unexpected error fetching lookups:", err);
    }
  }, []);

  // 2. Fetch Questions Bank
  const fetchQuestions = useCallback(async () => {
    if (!exam_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/cbt/exams/${exam_id}/questions`);
      setQuestions(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Problem fetching questions bank:", err);
      toast.error("Failed to fetch questions tracking sheets.");
    } finally {
      setLoading(false);
    }
  }, [exam_id]);

  useEffect(() => {
    fetchLookups();
    fetchQuestions();
  }, [fetchLookups, fetchQuestions]);

  const handleDelete = async (id) => {
    if (!confirm("Are you certain you want to purge this question line along with choices?")) return;
    try {
      await api.delete(`/cbt/questions/${id}`);
      toast.success("Question deleted successfully.");
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to drop selected question entry.");
    }
  };

  // --- Searchable Subjects Filter ---
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) =>
      (s.name || "").toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  const selectedSubjectName = subjects.find((s) => String(s.id) === String(subjectId))?.name;

  // --- Bulk Batch Operations ---
  const handleAddQuestionToBatch = () => {
    const nextNum = bulkQuestions.length + 1;
    setBulkQuestions((prev) => [...prev, createEmptyQuestion(nextNum)]);
    setActiveQuestionIndex(bulkQuestions.length);
  };

  const handleRemoveQuestionFromBatch = (index) => {
    if (bulkQuestions.length === 1) {
      toast.error("At least one question is required in the bulk batch.");
      return;
    }
    const updated = bulkQuestions.filter((_, i) => i !== index);
    const renumbered = updated.map((q, i) => ({ ...q, question_number: i + 1 }));
    setBulkQuestions(renumbered);
    setActiveQuestionIndex((prev) => Math.min(prev, renumbered.length - 1));
  };

  const updateActiveQuestionField = (field, value) => {
    setBulkQuestions((prev) => {
      const updated = [...prev];
      updated[activeQuestionIndex] = {
        ...updated[activeQuestionIndex],
        [field]: value
      };
      return updated;
    });
  };

  const updateOptionField = (optIndex, field, value) => {
    setBulkQuestions((prev) => {
      const updated = [...prev];
      const currentQ = { ...updated[activeQuestionIndex] };
      const updatedOptions = currentQ.options.map((opt, idx) => {
        if (idx !== optIndex) {
          if (field === "is_correct" && currentQ.type === "single" && value === true) {
            return { ...opt, is_correct: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      });

      currentQ.options = updatedOptions;
      updated[activeQuestionIndex] = currentQ;
      return updated;
    });
  };

  const addOptionToActiveQuestion = () => {
    const currentQ = bulkQuestions[activeQuestionIndex];
    if (currentQ.options.length >= 6) {
      toast.error("Maximum 6 options allowed per question.");
      return;
    }
    updateActiveQuestionField("options", [
      ...currentQ.options,
      { option_text: "", is_correct: false }
    ]);
  };

  const removeOptionFromActiveQuestion = (optIndex) => {
    const currentQ = bulkQuestions[activeQuestionIndex];
    if (currentQ.options.length <= 2) {
      toast.error("Question must have at least 2 options.");
      return;
    }
    const updatedOptions = currentQ.options.filter((_, i) => i !== optIndex);
    updateActiveQuestionField("options", updatedOptions);
  };

  const isQuestionComplete = (q) => {
    if (!q.question_text.trim()) return false;
    if (q.type !== "theory") {
      const hasCorrect = q.options.some((o) => o.is_correct);
      const hasEmpty = q.options.some((o) => !o.option_text.trim());
      if (!hasCorrect || hasEmpty) return false;
    }
    return true;
  };

  // --- Bulk Submit Handler ---
  const handleBulkSubmit = async () => {
    if (!gradeId) {
      toast.error("Please select a target Grade Class.");
      return;
    }
    if (!subjectId) {
      toast.error("Please select a target Subject.");
      return;
    }

    // Validate each question in the batch
    for (let i = 0; i < bulkQuestions.length; i++) {
      const q = bulkQuestions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question #${i + 1} is missing prompt text.`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.type !== "theory") {
        const hasCorrect = q.options.some((o) => o.is_correct);
        if (!hasCorrect) {
          toast.error(`Question #${i + 1} requires a correct option answer key.`);
          setActiveQuestionIndex(i);
          return;
        }
        const hasEmptyOption = q.options.some((o) => !o.option_text.trim());
        if (hasEmptyOption) {
          toast.error(`Question #${i + 1} contains blank option fields.`);
          setActiveQuestionIndex(i);
          return;
        }
      }
    }

    const payload = {
      exam_id: exam_id ? Number(exam_id) : null,
      grade_id: gradeId,
      subject_id: subjectId,
      questions: bulkQuestions.map(({ temp_id, question_number, ...rest }) => rest)
    };

    setSavingBulk(true);
    try {
      await api.post("/cbt/questions/bulk", payload);
      toast.success(`Successfully saved batch of ${bulkQuestions.length} questions!`);
      
      // Reset state and return to list view
      setIsBulkMode(false);
      setBulkQuestions([createEmptyQuestion(1)]);
      setActiveQuestionIndex(0);
      fetchQuestions();
    } catch (err) {
      console.error("❌ Bulk submission error:", err);
      toast.error(err.response?.data?.message || "Failed to submit questions batch.");
    } finally {
      setSavingBulk(false);
    }
  };

  // DataTable Configuration
  const tableColumns = [
    { header: "#", accessor: "index", width: "60px" },
    { header: "Grade / Subject", accessor: "taxonomy", width: "220px" },
    { header: "Question Content Context Details", accessor: "question_text", width: "450px" },
    { header: "Execution Mode", accessor: "type_label", width: "160px" },
    { header: "Allocated Weight", accessor: "marks", width: "120px" }
  ];

  const getTableData = () => {
    return questions.map((q, index) => ({
      id: q.id,
      index: index + 1,
      taxonomy: (
        <span className="text-xs bg-slate-700 px-2 py-1 rounded border border-slate-600 text-blue-300">
          {q.grade?.name || (q.grade_id ? `Grade #${q.grade_id}` : "General")} | {q.subject?.name || (q.subject_id ? `Subject #${q.subject_id}` : "General")}
        </span>
      ),
      question_text: q.question_text.length > 80 ? `${q.question_text.substring(0, 80)}...` : q.question_text,
      type_label: q.type ? q.type.toUpperCase() : "SINGLE",
      marks: `${q.marks || q.mark || 1.00} Pts`,
      original: q
    }));
  };

  const activeQ = bulkQuestions[activeQuestionIndex] || bulkQuestions[0];
  const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

  // ==========================================
  // VIEW 1: BULK BATCH ENTRY SUITE WORKSPACE
  // ==========================================
  if (isBulkMode) {
    return (
      <div className="text-white p-6 space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkMode(false)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
              title="Return to Question List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-blue-400">Bulk Question Entry Workspace</h1>
              <p className="text-xs text-slate-400 font-mono">
                Multi-Entry Batch Mode • Total Items: <span className="text-white font-bold">{bulkQuestions.length}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleBulkSubmit}
            disabled={savingBulk}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {savingBulk ? "Saving Batch..." : `Submit All Questions (${bulkQuestions.length})`}
          </button>
        </div>

        {/* Global Taxonomy Headers: Grade & Searchable Subject Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/90 p-4 rounded-xl border border-slate-700">
          {/* Target Grade Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Target Grade Class *
            </label>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">-- Select Target Grade Class --</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Searchable Target Subject Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Target Subject *
            </label>
            <div
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white cursor-pointer flex justify-between items-center"
            >
              <span className={selectedSubjectName ? "text-white" : "text-slate-400"}>
                {selectedSubjectName || "-- Search or Select Subject --"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {/* Dropdown Menu Overlay */}
            {isSubjectDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-40 p-2 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to filter subjects..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredSubjects.length === 0 ? (
                    <div className="p-2 text-xs text-slate-400 text-center">No subjects found</div>
                  ) : (
                    filteredSubjects.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSubjectId(s.id);
                          setIsSubjectDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 text-sm rounded cursor-pointer transition-colors ${
                          String(s.id) === String(subjectId) ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        {s.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor Layout: Left Index Navigator + Right Active Question Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Question Index Drawer */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 h-fit">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h3 className="font-semibold text-sm text-slate-300">Question Index</h3>
              <button
                onClick={handleAddQuestionToBatch}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Q
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {bulkQuestions.map((q, idx) => {
                const isActive = idx === activeQuestionIndex;
                const isDone = isQuestionComplete(q);

                return (
                  <button
                    key={q.temp_id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`relative p-2 rounded-lg font-semibold text-sm flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-blue-600 text-white ring-2 ring-blue-400"
                        : isDone
                        ? "bg-slate-700 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-700/60 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    Q{idx + 1}
                    {isDone && <CheckCircle2 className="w-3 h-3 absolute top-1 right-1 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Editor */}
          <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h2 className="text-lg font-bold text-blue-400">
                Editing Question #{activeQuestionIndex + 1}
              </h2>
              {bulkQuestions.length > 1 && (
                <button
                  onClick={() => handleRemoveQuestionFromBatch(activeQuestionIndex)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Remove Question
                </button>
              )}
            </div>

            {/* Type & Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Question Type
                </label>
                <select
                  value={activeQ.type}
                  onChange={(e) => updateActiveQuestionField("type", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="single">Single Choice (Radio)</option>
                  <option value="multiple">Multiple Choice (Checkbox)</option>
                  <option value="theory">Theory / Essay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Marks Allocated
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={activeQ.marks}
                  onChange={(e) => updateActiveQuestionField("marks", e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Question Text *
              </label>
              <textarea
                rows="3"
                value={activeQ.question_text}
                onChange={(e) => updateActiveQuestionField("question_text", e.target.value)}
                placeholder={`Enter prompt for Question #${activeQuestionIndex + 1}...`}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Answer Options & Key Selection */}
            {activeQ.type !== "theory" && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase text-slate-300">
                    Answer Options & Correct Answer Key *
                  </label>
                  <button
                    type="button"
                    onClick={addOptionToActiveQuestion}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Choice Option
                  </button>
                </div>

                {activeQ.options.map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className="flex items-center gap-3 bg-slate-700/50 p-2.5 rounded-lg border border-slate-600"
                  >
                    <span className="font-bold text-blue-400 text-sm w-6">
                      {OPTION_LETTERS[optIdx] || optIdx + 1}.
                    </span>

                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => updateOptionField(optIdx, "option_text", e.target.value)}
                      placeholder={`Option ${OPTION_LETTERS[optIdx]} text...`}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                    />

                    <label className="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer select-none">
                      <input
                        type={activeQ.type === "single" ? "radio" : "checkbox"}
                        name={`correct_option_${activeQ.temp_id}`}
                        checked={option.is_correct}
                        onChange={(e) => updateOptionField(optIdx, "is_correct", e.target.checked)}
                        className="accent-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      Correct Key
                    </label>

                    {activeQ.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOptionFromActiveQuestion(optIdx)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Explanation / Solution Context */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Explanation / Solution (Optional)
              </label>
              <textarea
                rows="2"
                value={activeQ.explanation}
                onChange={(e) => updateActiveQuestionField("explanation", e.target.value)}
                placeholder="Provide explanation shown during exam reviews..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN DATA TABLE VIEW
  // ==========================================
  return (
    <div className="text-white p-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">Examination Question Bank</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            Assigned Blueprint Scope Focus: Exam ID #{exam_id}
          </p>
        </div>
        <button 
          onClick={() => setIsBulkMode(true)} 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Questions (Bulk Batch)
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Active Content Matrix Questions"
        searchPlaceholder="Filter items within current scope..."
        onSearch={(d, t) => d.filter(i => i.original.question_text.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => handleDelete(row.original.id)} 
              className="text-red-400 hover:text-red-300 p-1"
              title="Delete Question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}