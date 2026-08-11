import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, CheckCircle, XCircle, User, Calendar, Clock, Users } from "lucide-react";

export default function ClassAttendance() {
  const [attendances, setAttendances] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");

  const [form, setForm] = useState({
    meeting_id: "",
    student_id: "",
    attendance_status: "present",
    joined_at: "",
    left_at: "",
    duration: 0
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

      const [attendancesRes, meetingsRes, studentsRes] = await Promise.all([
        api.get("/class-attendance", { params }),
        api.get("/meetings", { params: { school_id: schoolId } }),
        api.get("/students", { params: { school_id: schoolId } })
      ]);
      
      setAttendances(attendancesRes.data?.data || attendancesRes.data || []);
      setMeetings(meetingsRes.data?.data?.data || meetingsRes.data?.data || []);
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
  }, [filterMeeting]);

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
        duration: parseInt(form.duration) || 0
      };

      if (editId) {
        await api.put(`/class-attendance/${editId}`, payload);
        toast.success("Attendance record updated successfully");
      } else {
        await api.post("/class-attendance", payload);
        toast.success("Attendance recorded successfully");
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
        toast.error("Failed to save attendance record");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (attendance) => {
    setForm({
      meeting_id: attendance.meeting_id || "",
      student_id: attendance.student_id || "",
      attendance_status: attendance.attendance_status || "present",
      joined_at: attendance.joined_at ? new Date(attendance.joined_at).toISOString().slice(0, 16) : "",
      left_at: attendance.left_at ? new Date(attendance.left_at).toISOString().slice(0, 16) : "",
      duration: attendance.duration || 0
    });
    setEditId(attendance.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/class-attendance/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Attendance record deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete attendance record");
    }
  };

  const handleMarkPresent = async (meetingId, studentId) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/meetings/${meetingId}/students/${studentId}/present`, { school_id: schoolId });
      toast.success("Student marked as present");
      fetchAll();
    } catch (error) {
      console.error("❌ Mark present error:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const handleMarkAbsent = async (meetingId, studentId) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/meetings/${meetingId}/students/${studentId}/absent`, { school_id: schoolId });
      toast.success("Student marked as absent");
      fetchAll();
    } catch (error) {
      console.error("❌ Mark absent error:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const resetForm = () => {
    setForm({
      meeting_id: "",
      student_id: "",
      attendance_status: "present",
      joined_at: "",
      left_at: "",
      duration: 0
    });
    setEditId(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      present: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Present" },
      absent: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Absent" },
      late: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500", label: "Late" },
      excused: { color: "bg-blue-500/20 text-blue-300 border-blue-500", label: "Excused" }
    };
    const s = statusMap[status] || statusMap.absent;
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
    { header: "Meeting", accessor: "meeting_title", width: "200px" },
    { header: "Joined At", accessor: "joined_at", width: "150px" },
    { header: "Duration", accessor: "duration", width: "100px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    return attendances.map((attendance) => ({
      id: attendance.id,
      student_name: attendance.student?.name || "N/A",
      meeting_title: attendance.meeting?.title || "N/A",
      joined_at: formatDate(attendance.joined_at),
      duration: attendance.duration ? `${attendance.duration} min` : "N/A",
      status_badge: getStatusBadge(attendance.attendance_status),
      original: attendance
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedAttendance(row.original); setShowViewModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View"
      >
        <Eye className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold">Class Attendance</h2>
          <p className="text-gray-400 text-sm">Manage student attendance for online classes</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Attendance"}
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
        title="Attendance Records"
        searchPlaceholder="Search by student or meeting..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.student_name?.toLowerCase().includes(lowerTerm) ||
            item.meeting_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* View Modal */}
      {showViewModal && selectedAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Attendance Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedAttendance(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Student</p>
                  <p className="text-white font-medium">{selectedAttendance.student?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  {getStatusBadge(selectedAttendance.attendance_status)}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Meeting</p>
                  <p className="text-white">{selectedAttendance.meeting?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-white">{selectedAttendance.duration ? `${selectedAttendance.duration} min` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Joined At</p>
                  <p className="text-white">{formatDate(selectedAttendance.joined_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Left At</p>
                  <p className="text-white">{formatDate(selectedAttendance.left_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}