import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, CheckCircle, XCircle, Users, BarChart, PieChart } from "lucide-react";

export default function Poll() {
  const [polls, setPolls] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");

  const [form, setForm] = useState({
    meeting_id: "",
    question: "",
    options: ["", ""],
    correct_answer: ""
  });
  const [editId, setEditId] = useState(null);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchAll = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const params = { school_id: schoolId };
      if (filterMeeting) params.meeting_id = filterMeeting;

      const [pollsRes, meetingsRes] = await Promise.all([
        api.get("/polls", { params }),
        api.get("/meetings", { params: { school_id: schoolId } })
      ]);
      
      setPolls(pollsRes.data?.data || pollsRes.data || []);
      setMeetings(meetingsRes.data?.data?.data || meetingsRes.data?.data || []);
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [filterMeeting]);

  const handleAddOption = () => {
    setForm({ ...form, options: [...form.options, ""] });
  };

  const handleRemoveOption = (index) => {
    if (form.options.length <= 2) {
      toast.error("Poll must have at least 2 options");
      return;
    }
    const newOptions = form.options.filter((_, i) => i !== index);
    setForm({ ...form, options: newOptions });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setSaveLoading(false);
      return;
    }

    // Filter out empty options
    const filteredOptions = form.options.filter(opt => opt.trim() !== "");
    if (filteredOptions.length < 2) {
      toast.error("Please provide at least 2 valid options");
      setSaveLoading(false);
      return;
    }

    // Check if correct_answer is in options
    if (!filteredOptions.includes(form.correct_answer)) {
      toast.error("Correct answer must be one of the options");
      setSaveLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        school_id: schoolId,
        options: filteredOptions
      };

      if (editId) {
        await api.put(`/polls/${editId}`, payload);
        toast.success("Poll updated successfully");
      } else {
        await api.post("/polls", payload);
        toast.success("Poll created successfully");
      }
      
      setShowModal(false);
      resetForm();
      await fetchAll();
      
    } catch (error) {
      console.error("❌ Save error:", error);
      
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save poll");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (poll) => {
    setForm({
      meeting_id: poll.meeting_id || "",
      question: poll.question || "",
      options: poll.options || ["", ""],
      correct_answer: poll.correct_answer || ""
    });
    setEditId(poll.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/polls/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Poll deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete poll");
    }
  };

  const handleViewResults = async (poll) => {
    setSelectedPoll(poll);
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      const res = await api.get(`/polls/${poll.id}/results`, {
        params: { school_id: schoolId }
      });
      setPollResults(res.data?.data);
      setShowResultsModal(true);
    } catch (error) {
      console.error("❌ Fetch results error:", error);
      toast.error("Failed to fetch poll results");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      meeting_id: "",
      question: "",
      options: ["", ""],
      correct_answer: ""
    });
    setEditId(null);
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Question", accessor: "question", width: "250px" },
    { header: "Meeting", accessor: "meeting_title", width: "180px" },
    { header: "Options", accessor: "options_count", width: "100px" },
    { header: "Responses", accessor: "responses_count", width: "100px" },
    { header: "Created By", accessor: "created_by", width: "150px" },
  ];

  const getTableData = () => {
    return polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      meeting_title: poll.meeting?.title || "N/A",
      options_count: poll.options?.length || 0,
      responses_count: poll.poll_responses?.length || 0,
      created_by: poll.created_by_user?.name || "N/A",
      original: poll
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleViewResults(row.original)}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View Results"
      >
        <BarChart className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEdit(row.original)}
        className="text-yellow-400 hover:text-yellow-300 p-1"
        title="Edit"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(row.original.id)}
        className="text-red-400 hover:text-red-300 p-1"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Polls</h2>
          <p className="text-gray-400 text-sm">Create and manage polls for meetings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Create Poll"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Meeting</label>
          <select
            value={filterMeeting}
            onChange={(e) => setFilterMeeting(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Meetings</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Poll List"
        searchPlaceholder="Search by question or meeting..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.question?.toLowerCase().includes(lowerTerm) ||
            item.meeting_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Modal - Create/Edit Poll */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Poll" : "Create New Poll"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Meeting <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.meeting_id}
                  onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Select Meeting</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Question <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter poll question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Options <span className="text-red-400">*</span>
                </label>
                {form.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                      disabled={saveLoading}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white disabled:opacity-50"
                      disabled={saveLoading || form.options.length <= 2}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  disabled={saveLoading}
                >
                  <Plus className="h-4 w-4" /> Add Option
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Correct Answer <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Select Correct Answer</option>
                  {form.options.filter(opt => opt.trim() !== "").map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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
                  {saveLoading ? "Saving..." : (editId ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && pollResults && selectedPoll && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Poll Results</h3>
              <button
                onClick={() => { setShowResultsModal(false); setSelectedPoll(null); setPollResults(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <h4 className="text-lg font-medium text-white">{selectedPoll.question}</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Total Responses: {pollResults.total_responses || 0}
                </p>
              </div>

              <div className="space-y-3">
                {pollResults.results?.map((result, index) => (
                  <div key={index} className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-300">{result.option}</span>
                      <span className="text-sm text-gray-400">
                        {result.count} ({result.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          result.option === pollResults.correct_answer 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                    {result.option === pollResults.correct_answer && (
                      <span className="text-xs text-green-400 mt-1 inline-block">
                        ✓ Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Correct Answer</p>
                <p className="text-green-400 font-medium">{pollResults.correct_answer}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Correct Responses: {pollResults.correct_count || 0} ({pollResults.correct_percentage || 0}%)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}