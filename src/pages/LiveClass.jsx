import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, Calendar, Clock, Video, Users, Play, CheckCircle, XCircle, Link } from "lucide-react";

export default function LiveClass() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [form, setForm] = useState({
    grade_id: "",
    employee_id: "",
    subject_id: "",
    school_session_id: "",
    title: "",
    description: "",
    meeting_provider: "",
    meeting_url: "",
    meeting_id: "",
    meeting_password: "",
    start_time: "",
    end_time: "",
    status: "scheduled",
    recurring: false,
    recurrence_pattern: "",
    max_participants: 0
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
      const [liveClassesRes, gradesRes, employeesRes, subjectsRes, sessionsRes] = await Promise.all([
        api.get("/live-classes", { params: { school_id: schoolId } }),
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/employees", { params: { school_id: schoolId } }),
        api.get("/subjects", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } })
      ]);
      
      setLiveClasses(liveClassesRes.data?.data?.data || liveClassesRes.data?.data || []);
      setGrades(gradesRes.data?.data || gradesRes.data || []);
      setEmployees(employeesRes.data?.data || employeesRes.data || []);
      setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
      setSessions(sessionsRes.data?.data || sessionsRes.data || []);
      
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
        max_participants: parseInt(form.max_participants) || 0
      };

      if (editId) {
        await api.put(`/live-classes/${editId}`, payload);
        toast.success("Live class updated successfully");
      } else {
        await api.post("/live-classes", payload);
        toast.success("Live class created successfully");
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
        toast.error("Failed to save live class");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (liveClass) => {
    setForm({
      grade_id: liveClass.grade_id || "",
      employee_id: liveClass.employee_id || "",
      subject_id: liveClass.subject_id || "",
      school_session_id: liveClass.school_session_id || "",
      title: liveClass.title || "",
      description: liveClass.description || "",
      meeting_provider: liveClass.meeting_provider || "",
      meeting_url: liveClass.meeting_url || "",
      meeting_id: liveClass.meeting_id || "",
      meeting_password: liveClass.meeting_password || "",
      start_time: liveClass.start_time ? new Date(liveClass.start_time).toISOString().slice(0, 16) : "",
      end_time: liveClass.end_time ? new Date(liveClass.end_time).toISOString().slice(0, 16) : "",
      status: liveClass.status || "scheduled",
      recurring: liveClass.recurring || false,
      recurrence_pattern: liveClass.recurrence_pattern || "",
      max_participants: liveClass.max_participants || 0
    });
    setEditId(liveClass.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this live class?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/live-classes/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Live class deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete live class");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/live-classes/${id}/status`, { school_id: schoolId, status });
      toast.success(`Live class marked as ${status}`);
      fetchAll();
    } catch (error) {
      console.error("❌ Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setForm({
      grade_id: "",
      employee_id: "",
      subject_id: "",
      school_session_id: "",
      title: "",
      description: "",
      meeting_provider: "",
      meeting_url: "",
      meeting_id: "",
      meeting_password: "",
      start_time: "",
      end_time: "",
      status: "scheduled",
      recurring: false,
      recurrence_pattern: "",
      max_participants: 0
    });
    setEditId(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { color: "bg-blue-500/20 text-blue-300 border-blue-500", label: "Scheduled" },
      ongoing: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Ongoing" },
      completed: { color: "bg-gray-500/20 text-gray-300 border-gray-500", label: "Completed" },
      cancelled: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Cancelled" }
    };
    const s = statusMap[status] || statusMap.scheduled;
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
    { header: "Grade", accessor: "grade_name", width: "120px" },
    { header: "Start Time", accessor: "start_time", width: "150px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    return liveClasses.map((liveClass) => ({
      id: liveClass.id,
      title: liveClass.title,
      subject_name: liveClass.subject?.name || "N/A",
      teacher_name: liveClass.employee?.name || "N/A",
      grade_name: liveClass.grade?.name || "N/A",
      start_time: formatDate(liveClass.start_time),
      status_badge: getStatusBadge(liveClass.status),
      original: liveClass
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedLiveClass(row.original); setShowViewModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {row.original.meeting_url && (
        <a
          href={row.original.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 p-1"
          title="Join Meeting"
        >
          <Video className="h-4 w-4" />
        </a>
      )}
      {row.original.status === "scheduled" && (
        <button
          onClick={() => handleUpdateStatus(row.original.id, "ongoing")}
          className="text-green-400 hover:text-green-300 p-1"
          title="Start"
        >
          <Play className="h-4 w-4" />
        </button>
      )}
      {row.original.status === "ongoing" && (
        <button
          onClick={() => handleUpdateStatus(row.original.id, "completed")}
          className="text-blue-400 hover:text-blue-300 p-1"
          title="Complete"
        >
          <CheckCircle className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold">Live Classes</h2>
          <p className="text-gray-400 text-sm">Manage virtual classes and online sessions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Live Class"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Live Class List"
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

      {/* Modal - Add/Edit Live Class */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-3xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Live Class" : "Create New Live Class"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter class title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Enter class description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Grade <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.grade_id}
                    onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Grade</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>{grade.name}</option>
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

              <div className="grid grid-cols-2 gap-4">
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
                    Session <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.school_session_id}
                    onChange={(e) => setForm({ ...form, school_session_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting Provider <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Zoom, Google Meet, Teams"
                    value={form.meeting_provider}
                    onChange={(e) => setForm({ ...form, meeting_provider: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="Enter meeting URL"
                    value={form.meeting_url}
                    onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter meeting ID"
                    value={form.meeting_id}
                    onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={saveLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Meeting Password
                  </label>
                  <input
                    type="text"
                    placeholder="Enter meeting password"
                    value={form.meeting_password}
                    onChange={(e) => setForm({ ...form, meeting_password: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    placeholder="Enter max participants"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  disabled={saveLoading}
                />
                <label htmlFor="recurring" className="text-sm text-gray-300">
                  Recurring Class
                </label>
              </div>

              {form.recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Recurrence Pattern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Weekly, Bi-weekly, Monthly"
                    value={form.recurrence_pattern}
                    onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={saveLoading}
                  />
                </div>
              )}

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
      {showViewModal && selectedLiveClass && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Live Class Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedLiveClass(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-white">{selectedLiveClass.title}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getStatusBadge(selectedLiveClass.status)}
                  <span className="text-sm text-gray-400">
                    Grade: {selectedLiveClass.grade?.name || "N/A"}
                  </span>
                  <span className="text-sm text-gray-400">
                    Subject: {selectedLiveClass.subject?.name || "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {selectedLiveClass.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Teacher</p>
                  <p className="text-white">{selectedLiveClass.employee?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Session</p>
                  <p className="text-white">{selectedLiveClass.schoolSession?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="text-white">{formatDate(selectedLiveClass.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">End Time</p>
                  <p className="text-white">{formatDate(selectedLiveClass.end_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Meeting Provider</p>
                  <p className="text-white">{selectedLiveClass.meeting_provider || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Max Participants</p>
                  <p className="text-white">{selectedLiveClass.max_participants || "Unlimited"}</p>
                </div>
              </div>

              {selectedLiveClass.meeting_url && (
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Meeting Link</p>
                  <a
                    href={selectedLiveClass.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Join Meeting
                  </a>
                  {selectedLiveClass.meeting_id && (
                    <p className="text-sm text-gray-400 mt-2">ID: {selectedLiveClass.meeting_id}</p>
                  )}
                  {selectedLiveClass.meeting_password && (
                    <p className="text-sm text-gray-400">Password: {selectedLiveClass.meeting_password}</p>
                  )}
                </div>
              )}

              {selectedLiveClass.recurring && (
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Recurring Class</p>
                  <p className="text-white">{selectedLiveClass.recurrence_pattern || "Yes"}</p>
                </div>
              )}

              {selectedLiveClass.assignments && selectedLiveClass.assignments.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Assignments ({selectedLiveClass.assignments.length})</p>
                  <div className="bg-slate-700/30 p-4 rounded-lg max-h-48 overflow-y-auto">
                    {selectedLiveClass.assignments.map((assignment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-slate-600 last:border-0">
                        <span className="text-gray-300">{assignment.title}</span>
                        <span className={`text-sm ${assignment.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {assignment.status}
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