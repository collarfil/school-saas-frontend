import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Plus, Trash2, X } from "lucide-react";

export default function SingleScreenQuestionModal({ examId, grades = [], subjects = [], onClose, onSuccess }) {
  const [form, setForm] = useState({
    exam_id: examId || "",
    grade_id: "",
    subject_id: "",
    question_text: "",
    type: "single", // 'single', 'multiple', or 'theory'
    marks: "1.00",
    explanation: "",
    options: [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false }
    ]
  });

  const [saving, setSaving] = useState(false);
  const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...form.options];

    if (field === "is_correct") {
      if (form.type === "single") {
        updatedOptions.forEach((opt, i) => {
          opt.is_correct = i === index ? value : false;
        });
      } else {
        updatedOptions[index].is_correct = value;
      }
    } else {
      updatedOptions[index][field] = value;
    }

    setForm((prev) => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    if (form.options.length >= 6) {
      toast.error("Maximum 6 options allowed per question.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { option_text: "", is_correct: false }]
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) {
      toast.error("Objective questions must have at least 2 options.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.question_text.trim()) {
      toast.error("Question text is required.");
      return;
    }

    if (form.type !== "theory") {
      const hasCorrect = form.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        toast.error("Please select a correct answer key.");
        return;
      }

      const emptyOptions = form.options.some((o) => !o.option_text.trim());
      if (emptyOptions) {
        toast.error("Please fill in text for all options.");
        return;
      }
    }

    setSaving(true);
    try {
      await api.post("/cbt/questions", form);
      toast.success("Question and options saved successfully!");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 text-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700 mb-4">
          <h3 className="text-xl font-bold text-blue-400">Add New Question</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Grade & Subject Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Target Grade
              </label>
              <select
                value={form.grade_id}
                onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">Select Grade (Optional)</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Target Subject
              </label>
              <select
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">Select Subject (Optional)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Question Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
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
                required
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
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
              required
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2.5 text-sm text-white outline-none focus:border-blue-500"
              placeholder="e.g., Which of the following is a primary color?"
            />
          </div>

          {/* Options Builder Section */}
          {form.type !== "theory" && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Answer Choices & Correct Key *
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice
                </button>
              </div>

              {form.options.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-700/50 p-2.5 rounded border border-slate-600"
                >
                  <span className="font-bold text-blue-400 text-sm w-6">
                    {OPTION_LETTERS[idx] || idx + 1}.
                  </span>

                  <input
                    type="text"
                    required
                    value={option.option_text}
                    onChange={(e) => handleOptionChange(idx, "option_text", e.target.value)}
                    placeholder={`Option ${OPTION_LETTERS[idx]} text...`}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                  />

                  <label className="flex items-center gap-1.5 text-xs text-emerald-400 cursor-pointer select-none">
                    <input
                      type={form.type === "single" ? "radio" : "checkbox"}
                      name="correct_option"
                      checked={option.is_correct}
                      onChange={(e) => handleOptionChange(idx, "is_correct", e.target.checked)}
                      className="accent-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    Correct Key
                  </label>

                  {form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Explanation (Optional)
            </label>
            <textarea
              rows="2"
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="Brief explanation shown after exam review..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving Question..." : "Save Question & Options"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}