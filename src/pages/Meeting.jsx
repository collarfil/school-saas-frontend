import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, Video, Link, Play, XCircle } from "lucide-react";

export default function Meeting() {
  const [meetings, setMeetings] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ✅ Aligned with backend/DB: provider, started_at, ended_at
  const emptyForm = {
    live_class_id: "",
    employee_id: "",
    title: "",
    description: "",
    meeting_url: "",
    meeting_id: "",
    meeting_password: "",
    started_at: "",
    ended_at: "",
    status: "scheduled",
    max_participants: 0,
    provider: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem("user"));
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
      const [meetingsRes, liveClassesRes, employeesRes] = await Promise.all([
        api.get("/meetings", { params: { school_id: schoolId } }),
        api.get("/live-classes", { params: { school_id: schoolId } }),
        api.get("/employees", { params: { school_id: schoolId } }),
      ]);

      setMeetings(meetingsRes.data?.data?.data || meetingsRes.data?.data || []);
      setLiveClasses(liveClassesRes.data?.data?.data || liveClassesRes.data?.data || []);
      setEmployees(employeesRes.data?.data?.data || employeesRes.data?.data || []);
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
      // ✅ Build payload explicitly so field names match the DB columns
      const payload = {
        school_id: schoolId,
        live_class_id: form.live_class_id,
        provider: form.provider,
        meeting_id: form.meeting_id || `MEET-${Date.now()}`,
        meeting_password: form.meeting_password ?? "",  // DB is NOT NULL — never send null
        meeting_url: form.meeting_url,
        started_at: form.started_at || null,
        ended_at: form.ended_at || null,
        status: form.status || "scheduled",

        // Extra fields the backend also syncs onto the live class
        title: form.title,
        description: form.description,
        employee_id: form.employee_id || null,
        start_time: form.started_at || null,
        end_time: form.ended_at || null,
        max_participants: parseInt(form.max_participants) || 0,
      };

      console.log("📤 Meeting payload:", payload);

      if (editId) {
        await api.put(`/meetings/${editId}`, payload);
        toast.success("Meeting updated successfully");
      } else {
        await api.post("/meetings", payload);
        toast.success("Meeting created successfully");
      }

      setShowModal(false);
      resetForm();
      await fetchAll();
    } catch (error) {
      console.error("❌ Save error:", error.response?.data || error);

      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((messages) => {
          messages.forEach((message) => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save meeting");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (meeting) => {
    setForm({
      live_class_id: meeting.live_class_id || "",
      employee_id: meeting.liveClass?.employee_id || "",
      title: meeting.liveClass?.title || "",
      description: meeting.liveClass?.description || "",
      meeting_url: meeting.meeting_url || "",
      meeting_id: meeting.meeting_id || "",
      meeting_password: meeting.meeting_password || "",
      started_at: meeting.started_at
        ? new Date(meeting.started_at).toISOString().slice(0, 16)
        : "",
      ended_at: meeting.ended_at
        ? new Date(meeting.ended_at).toISOString().slice(0, 16)
        : "",
      status: meeting.status || "scheduled",
      max_participants: meeting.liveClass?.max_participants || 0,
      provider: meeting.provider || "",
    });
    setEditId(meeting.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const schoolId = getSchoolId();
      await api.delete(`/meetings/${id}`, { params: { school_id: schoolId } });
      toast.success("Meeting deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete meeting");
    }
  };

  const handleStartMeeting = async (id) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/meetings/${id}/start`, { school_id: schoolId });
      toast.success("Meeting started");
      fetchAll();
    } catch (error) {
      console.error("❌ Start meeting error:", error);
      toast.error("Failed to start meeting");
    }
  };

  const handleEndMeeting = async (id) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/meetings/${id}/end`, { school_id: schoolId });
      toast.success("Meeting ended");
      fetchAll();
    } catch (error) {
      console.error("❌ End meeting error:", error);
      toast.error("Failed to end meeting");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { color: "bg-blue-500/20 text-blue-300 border-blue-500", label: "Scheduled" },
      ongoing:   { color: "bg-green-500/20 text-green-300 border-green-500", label: "Ongoing" },
      completed: { color: "bg-gray-500/20 text-gray-300 border-gray-500", label: "Completed" },
      cancelled: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Cancelled" },
    };
    const s = statusMap[status] || statusMap.scheduled;
    return <span className={`px-2 py-1 rounded text-xs border ${s.color}`}>{s.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "Title",      accessor: "title",      width: "200px" },
    { header: "Live Class", accessor: "live_class", width: "180px" },
    { header: "Teacher",    accessor: "teacher",    width: "150px" },
    { header: "Start Time", accessor: "start_time", width: "150px" },
    { header: "Status",     accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () =>
    meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.liveClass?.title || "Meeting",
      live_class: meeting.liveClass?.title || "N/A",
      teacher: meeting.liveClass?.employee?.name || "N/A",
      start_time: formatDate(meeting.started_at),
      status_badge: getStatusBadge(meeting.status),
      original: meeting,
    }));

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => {
          setSelectedMeeting(row.original);
          setShowViewModal(true);
        }}
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
          onClick={() => handleStartMeeting(row.original.id)}
          className="text-green-400 hover:text-green-300 p-1"
          title="Start"
        >
          <Play className="h-4 w-4" />
        </button>
      )}

      {row.original.status === "ongoing" && (
        <button
          onClick={() => handleEndMeeting(row.original.id)}
          className="text-red-400 hover:text-red-300 p-1"
          title="End"
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
          <h2 className="text-2xl font-bold">Meetings</h2>
          <p className="text-gray-400 text-sm">Manage online meetings and sessions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Meeting"}
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Meeting List"
        searchPlaceholder="Search by title, live class or teacher..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(
            (item) =>
              item.title?.toLowerCase().includes(lowerTerm) ||
              item.live_class?.toLowerCase().includes(lowerTerm) ||
              item.teacher?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Modal - Add/Edit Meeting */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Meeting" : "Create New Meeting"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter meeting title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter meeting description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={saveLoading}
                />
              </div>

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
                      <option key={lc.id} value={lc.id}>
                        {lc.title}
                      </option>
                    ))}
                  </select>
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
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
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
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
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
                    value={form.started_at}
                    onChange={(e) => setForm({ ...form, started_at: e.target.value })}
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
                    value={form.ended_at}
                    onChange={(e) => setForm({ ...form, ended_at: e.target.value })}
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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
                  {saveLoading ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedMeeting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Meeting Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedMeeting(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-white">
                  {selectedMeeting.liveClass?.title || "Meeting"}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getStatusBadge(selectedMeeting.status)}
                  <span className="text-sm text-gray-400">
                    Live Class: {selectedMeeting.liveClass?.title || "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {selectedMeeting.liveClass?.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Teacher</p>
                  <p className="text-white">{selectedMeeting.liveClass?.employee?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Meeting Provider</p>
                  <p className="text-white">{selectedMeeting.provider || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="text-white">{formatDate(selectedMeeting.started_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">End Time</p>
                  <p className="text-white">{formatDate(selectedMeeting.ended_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Meeting ID</p>
                  <p className="text-white">{selectedMeeting.meeting_id || "N/A"}</p>
                </div>
              </div>

              {selectedMeeting.meeting_url && (
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Meeting Link</p>
                  <a
                    href={selectedMeeting.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}