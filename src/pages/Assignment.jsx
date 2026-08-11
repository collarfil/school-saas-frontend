import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, Calendar, Clock, FileText, CheckCircle, XCircle, Send } from "lucide-react";

export default function Assignment() {
  const [assignments, setAssignments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [form, setForm] = useState({
    live_class_id: "",
    subject_id: "",
    employee_id: "",
    title: "",
    instruction: "",
    attachment: "",
    available_from: "",
    due_date: "",
    max_score: "",
    allow_late_submission: false,
    status: "draft"
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
      const [assignmentsRes, liveClassesRes, subjectsRes, employeesRes] = await Promise.all([
        api.get("/assignments", { params: { school_id: schoolId } }),
        api.get("/live-classes", { params: { school_id: schoolId } }),
        api.get("/subjects", { params: { school_id: schoolId } }),
        api.get("/employees", { params: { school_id: schoolId } })
      ]);
      
      setAssignments(assignmentsRes.data?.data?.data || assignmentsRes.data?.data || []);
      setLiveClasses(liveClassesRes.data?.data?.data || liveClassesRes.data?.data || []);
      setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
      setEmployees(employeesRes.data?.data || employeesRes.data || []);
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch data");
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
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setSaveLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        school_id: schoolId,
        max_score: parseFloat(form.max_score)
      };

      if (editId) {
        await api.put(`/assignments/${editId}`, payload);
        toast.success("Assignment updated successfully");
      } else {
        await api.post("/assignments", payload);
        toast.success("Assignment created successfully");
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
        toast.error("Failed to save assignment");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setForm({
      live_class_id: assignment.live_class_id || "",
      subject_id: assignment.subject_id || "",
      employee_id: assignment.employee_id || "",
      title: assignment.title || "",
      instruction: assignment.instruction || "",
      attachment: assignment.attachment || "",
      available_from: assignment.available_from ? new Date(assignment.available_from).toISOString().slice(0, 16) : "",
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : "",
      max_score: assignment.max_score || "",
      allow_late_submission: assignment.allow_late_submission || false,
      status: assignment.status || "draft"
    });
    setEditId(assignment.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/assignments/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Assignment deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const handlePublish = async (id) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/assignments/${id}/publish`, { school_id: schoolId });
      toast.success("Assignment published successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Publish error:", error);
      toast.error("Failed to publish assignment");
    }
  };

  const handleClose = async (id) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/assignments/${id}/close`, { school_id: schoolId });
      toast.success("Assignment closed successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Close error:", error);
      toast.error("Failed to close assignment");
    }
  };

  const resetForm = () => {
    setForm({
      live_class_id: "",
      subject_id: "",
      employee_id: "",
      title: "",
      instruction: "",
      attachment: "",
      available_from: "",
      due_date: "",
      max_score: "",
      allow_late_submission: false,
      status: "draft"
    });
    setEditId(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { color: "bg-gray-500/20 text-gray-300 border-gray-500", label: "Draft" },
      published: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Published" },
      closed: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Closed" }
    };
    const s = statusMap[status] || statusMap.draft;
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
    { header: "Title", accessor: "title", width: "200px" },
    { header: "Subject", accessor: "subject_name", width: "150px" },
    { header: "Teacher", accessor: "teacher_name", width: "150px" },
    { header: "Max Score", accessor: "max_score", width: "100px" },
    { header: "Due Date", accessor: "due_date", width: "150px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    return assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject_name: assignment.subject?.name || "N/A",
      teacher_name: assignment.employee?.name || "N/A",
      max_score: assignment.max_score || "N/A",
      due_date: formatDate(assignment.due_date),
      status_badge: getStatusBadge(assignment.status),
      original: assignment
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedAssignment(row.original); setShowViewModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {row.original.status === "draft" && (
        <button
          onClick={() => handlePublish(row.original.id)}
          className="text-green-400 hover:text-green-300 p-1"
          title="Publish"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      {row.original.status === "published" && (
        <button
          onClick={() => handleClose(row.original.id)}
          className="text-red-400 hover:text-red-300 p-1"
          title="Close"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
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
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-gray-400 text-sm">Manage assignments for live classes</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Assignment"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Assignment List"
        searchPlaceholder="Search by title, subject or teacher..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.title?.toLowerCase().includes(lowerTerm) ||
            item.subject_name?.toLowerCase().includes(lowerTerm) ||
            item.teacher_name?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Modal - Add/Edit Assignment */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Assignment" : "Create New Assignment"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Live Class <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.live_class_id}
                    onChange={(e) => setForm({ ...form, live_class_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Live Class</option>
                    {liveClasses.map((lc) => (
                      <option key={lc.id} value={lc.id}>{lc.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Teacher <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                >
                  <option value="">Select Teacher</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter assignment title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Instructions <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Enter assignment instructions"
                  value={form.instruction}
                  onChange={(e) => setForm({ ...form, instruction: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Available From <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.available_from}
                    onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Score <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter max score"
                    value={form.max_score}
                    onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={saveLoading}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <input
                  type="checkbox"
                  id="allow_late_submission"
                  checked={form.allow_late_submission}
                  onChange={(e) => setForm({ ...form, allow_late_submission: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  disabled={saveLoading}
                />
                <label htmlFor="allow_late_submission" className="text-sm text-gray-300">
                  Allow late submissions
                </label>
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

      {/* View Modal */}
      {showViewModal && selectedAssignment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Assignment Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedAssignment(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-white">{selectedAssignment.title}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getStatusBadge(selectedAssignment.status)}
                  <span className="text-sm text-gray-400">
                    Subject: {selectedAssignment.subject?.name || "N/A"}
                  </span>
                  <span className="text-sm text-gray-400">
                    Teacher: {selectedAssignment.employee?.name || "N/A"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Available From</p>
                  <p className="text-white">{formatDate(selectedAssignment.available_from)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Due Date</p>
                  <p className="text-white">{formatDate(selectedAssignment.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Max Score</p>
                  <p className="text-white font-bold">{selectedAssignment.max_score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Late Submissions</p>
                  <p className="text-white">{selectedAssignment.allow_late_submission ? "Allowed" : "Not Allowed"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Instructions</p>
                <div className="bg-slate-700/30 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                  {selectedAssignment.instruction || "No instructions provided."}
                </div>
              </div>

              {selectedAssignment.attachment && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Attachment</p>
                  <a
                    href={selectedAssignment.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    <FileText className="h-4 w-4 inline mr-1" />
                    View Attachment
                  </a>
                </div>
              )}

              {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Submissions ({selectedAssignment.submissions.length})</p>
                  <div className="bg-slate-700/30 p-4 rounded-lg max-h-48 overflow-y-auto">
                    {selectedAssignment.submissions.map((submission, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-slate-600 last:border-0">
                        <span className="text-gray-300">{submission.student?.name || "Unknown"}</span>
                        <span className={`text-sm ${submission.status === 'graded' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {submission.status === 'graded' ? `Score: ${submission.score}` : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}