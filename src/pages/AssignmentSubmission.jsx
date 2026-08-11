import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, CheckCircle, XCircle, FileText, User, Calendar, Award } from "lucide-react";

export default function AssignmentSubmission() {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterAssignment, setFilterAssignment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    assignment_id: "",
    student_id: "",
    submission_text: "",
    attachment: ""
  });
  
  const [gradeForm, setGradeForm] = useState({
    score: "",
    remark: ""
  });

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
      if (filterAssignment) params.assignment_id = filterAssignment;
      if (filterStatus) params.status = filterStatus;

      const [submissionsRes, assignmentsRes, studentsRes] = await Promise.all([
        api.get("/assignment-submissions", { params }),
        api.get("/assignments", { params: { school_id: schoolId } }),
        api.get("/students", { params: { school_id: schoolId } })
      ]);
      
      setSubmissions(submissionsRes.data?.data?.data || submissionsRes.data?.data || []);
      setAssignments(assignmentsRes.data?.data?.data || assignmentsRes.data?.data || []);
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
  }, [filterAssignment, filterStatus]);

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
      const payload = {
        ...form,
        school_id: schoolId
      };

      await api.post("/assignment-submissions", payload);
      toast.success("Assignment submitted successfully");
      
      setShowModal(false);
      resetForm();
      await fetchAll();
      
    } catch (error) {
      console.error("❌ Submission error:", error);
      
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit assignment");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      const schoolId = getSchoolId();
      await api.post(`/assignment-submissions/${selectedSubmission.id}/grade`, {
        ...gradeForm,
        school_id: schoolId
      });
      
      toast.success("Assignment graded successfully");
      setShowGradeModal(false);
      setSelectedSubmission(null);
      resetGradeForm();
      await fetchAll();
      
    } catch (error) {
      console.error("❌ Grade error:", error);
      
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to grade assignment");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/assignment-submissions/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Submission deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete submission");
    }
  };

  const resetForm = () => {
    setForm({
      assignment_id: "",
      student_id: "",
      submission_text: "",
      attachment: ""
    });
  };

  const resetGradeForm = () => {
    setGradeForm({
      score: "",
      remark: ""
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      submitted: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500", label: "Submitted" },
      graded: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Graded" },
      late: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Late" }
    };
    const s = statusMap[status] || statusMap.submitted;
    return <span className={`px-2 py-1 rounded text-xs border ${s.color}`}>{s.label}</span>;
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

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Student", accessor: "student_name", width: "180px" },
    { header: "Assignment", accessor: "assignment_title", width: "200px" },
    { header: "Submitted", accessor: "submitted_at", width: "150px" },
    { header: "Score", accessor: "score", width: "80px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    return submissions.map((submission) => ({
      id: submission.id,
      student_name: submission.student?.name || "N/A",
      assignment_title: submission.assignment?.title || "N/A",
      submitted_at: formatDate(submission.submitted_at),
      score: submission.score !== null ? submission.score : "Pending",
      status_badge: getStatusBadge(submission.status),
      original: submission
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedSubmission(row.original); setShowGradeModal(true); }}
        className="text-green-400 hover:text-green-300 p-1"
        title="Grade"
        disabled={row.original.status === 'graded'}
      >
        <Award className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold">Assignment Submissions</h2>
          <p className="text-gray-400 text-sm">Manage student assignment submissions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Submit Assignment"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Assignment</label>
          <select
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Late</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Submissions List"
        searchPlaceholder="Search by student or assignment..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.student_name?.toLowerCase().includes(lowerTerm) ||
            item.assignment_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Modal - Submit Assignment */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Submit Assignment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Assignment <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.assignment_id}
                    onChange={(e) => setForm({ ...form, assignment_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Student <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Submission Text <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Enter your submission text"
                  value={form.submission_text}
                  onChange={(e) => setForm({ ...form, submission_text: e.target.value })}
                  rows="4"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Attachment URL
                </label>
                <input
                  type="text"
                  placeholder="Enter attachment URL (optional)"
                  value={form.attachment}
                  onChange={(e) => setForm({ ...form, attachment: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
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
                  {saveLoading ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Grade Submission */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Grade Submission</h3>
              <button
                onClick={() => { setShowGradeModal(false); setSelectedSubmission(null); resetGradeForm(); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-sm text-gray-400">Student</p>
              <p className="text-white font-medium">{selectedSubmission.student?.name || "N/A"}</p>
              <p className="text-sm text-gray-400 mt-2">Assignment</p>
              <p className="text-white font-medium">{selectedSubmission.assignment?.title || "N/A"}</p>
            </div>

            <form onSubmit={handleGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Score <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter score"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
                <p className="text-sm text-gray-400 mt-1">Max Score: {selectedSubmission.assignment?.max_score || "N/A"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Remark
                </label>
                <textarea
                  placeholder="Add feedback or remark (optional)"
                  value={gradeForm.remark}
                  onChange={(e) => setGradeForm({ ...gradeForm, remark: e.target.value })}
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowGradeModal(false); setSelectedSubmission(null); resetGradeForm(); }}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:bg-gray-400 transition-colors font-medium"
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Grading..." : "Grade Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}