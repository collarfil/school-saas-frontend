import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Eye, User, CheckCircle, XCircle, Clock } from "lucide-react";

export default function PollResponse() {
  const [responses, setResponses] = useState([]);
  const [polls, setPolls] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPoll, setFilterPoll] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

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
      if (filterPoll) params.poll_id = filterPoll;

      const [responsesRes, pollsRes, studentsRes] = await Promise.all([
        api.get("/poll-responses", { params }),
        api.get("/polls", { params: { school_id: schoolId } }),
        api.get("/students", { params: { school_id: schoolId } })
      ]);
      
      setResponses(responsesRes.data?.data || responsesRes.data || []);
      setPolls(pollsRes.data?.data || pollsRes.data || []);
      setStudents(studentsRes.data?.data || studentsRes.data || []);
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [filterPoll]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this poll response?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/poll-responses/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Poll response deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete poll response");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCorrect = (response) => {
    return response.selected_option === response.poll?.correct_answer;
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Student", accessor: "student_name", width: "180px" },
    { header: "Poll Question", accessor: "poll_question", width: "250px" },
    { header: "Selected Option", accessor: "selected_option", width: "150px" },
    { header: "Correct", accessor: "is_correct", width: "80px" },
    { header: "Answered At", accessor: "answered_at", width: "150px" },
  ];

  const getTableData = () => {
    return responses.map((response) => ({
      id: response.id,
      student_name: response.student?.name || "N/A",
      poll_question: response.poll?.question || "N/A",
      selected_option: response.selected_option || "N/A",
      is_correct: isCorrect(response) ? (
        <span className="text-green-400"><CheckCircle className="h-4 w-4 inline" /> Yes</span>
      ) : (
        <span className="text-red-400"><XCircle className="h-4 w-4 inline" /> No</span>
      ),
      answered_at: formatDate(response.answered_at),
      original: response
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedResponse(row.original); setShowViewModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View"
      >
        <Eye className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold">Poll Responses</h2>
          <p className="text-gray-400 text-sm">View and manage poll responses from students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Poll</label>
          <select
            value={filterPoll}
            onChange={(e) => setFilterPoll(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Polls</option>
            {polls.map((poll) => (
              <option key={poll.id} value={poll.id}>{poll.question}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Poll Responses"
        searchPlaceholder="Search by student or poll..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.student_name?.toLowerCase().includes(lowerTerm) ||
            item.poll_question?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* View Modal */}
      {showViewModal && selectedResponse && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Poll Response Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedResponse(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Student</p>
                <p className="text-white font-medium">{selectedResponse.student?.name || "N/A"}</p>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Poll Question</p>
                <p className="text-white font-medium">{selectedResponse.poll?.question || "N/A"}</p>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Selected Option</p>
                <p className={`font-medium ${isCorrect(selectedResponse) ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedResponse.selected_option || "N/A"}
                  {isCorrect(selectedResponse) ? ' ✓' : ' ✗'}
                </p>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Correct Answer</p>
                <p className="text-green-400 font-medium">{selectedResponse.poll?.correct_answer || "N/A"}</p>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Answered At</p>
                <p className="text-white">{formatDate(selectedResponse.answered_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}