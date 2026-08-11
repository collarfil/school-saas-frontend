import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Eye, User, Calendar, Clock, Users, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function MeetingParticipant() {
  const [participants, setParticipants] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

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
      const [participantsRes, meetingsRes, studentsRes] = await Promise.all([
        api.get("/meeting-participants", { params: { school_id: schoolId, meeting_id: filterMeeting } }),
        api.get("/meetings", { params: { school_id: schoolId } }),
        api.get("/students", { params: { school_id: schoolId } })
      ]);
      
      setParticipants(participantsRes.data?.data?.data || participantsRes.data?.data || []);
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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this participant?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/meeting-participants/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Participant removed successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to remove participant");
    }
  };

  const handleLeaveMeeting = async (id) => {
    try {
      const schoolId = getSchoolId();
      await api.post(`/meeting-participants/${id}/leave`, { school_id: schoolId });
      toast.success("Participant left meeting");
      fetchAll();
    } catch (error) {
      console.error("❌ Leave meeting error:", error);
      toast.error("Failed to process leave meeting");
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

  const getRoleBadge = (role) => {
    const roleMap = {
      host: { color: "bg-purple-500/20 text-purple-300 border-purple-500", label: "Host" },
      "co-host": { color: "bg-blue-500/20 text-blue-300 border-blue-500", label: "Co-host" },
      participant: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Participant" },
      viewer: { color: "bg-gray-500/20 text-gray-300 border-gray-500", label: "Viewer" }
    };
    const r = roleMap[role] || roleMap.viewer;
    return <span className={`px-2 py-1 rounded text-xs border ${r.color}`}>{r.label}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="text-green-400"><CheckCircle className="h-4 w-4 inline mr-1" /> Active</span>
    ) : (
      <span className="text-gray-400"><XCircle className="h-4 w-4 inline mr-1" /> Inactive</span>
    );
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "User", accessor: "user_name", width: "180px" },
    { header: "Meeting", accessor: "meeting_title", width: "200px" },
    { header: "Role", accessor: "role_badge", width: "100px" },
    { header: "Joined At", accessor: "joined_at", width: "150px" },
    { header: "Status", accessor: "status", width: "100px" },
  ];

  const getTableData = () => {
    return participants.map((participant) => ({
      id: participant.id,
      user_name: participant.user?.name || "N/A",
      meeting_title: participant.meeting?.title || "N/A",
      role_badge: getRoleBadge(participant.role),
      joined_at: formatDate(participant.joined_at),
      status: getStatusBadge(participant.is_active),
      original: participant
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedParticipant(row.original); setShowViewModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {row.original.is_active && (
        <button
          onClick={() => handleLeaveMeeting(row.original.id)}
          className="text-yellow-400 hover:text-yellow-300 p-1"
          title="Leave Meeting"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => handleDelete(row.original.id)}
        className="text-red-400 hover:text-red-300 p-1"
        title="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Meeting Participants</h2>
          <p className="text-gray-400 text-sm">Track participants in online meetings</p>
        </div>
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
        title="Participants List"
        searchPlaceholder="Search by user or meeting..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.user_name?.toLowerCase().includes(lowerTerm) ||
            item.meeting_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* View Modal */}
      {showViewModal && selectedParticipant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Participant Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedParticipant(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">User</p>
                  <p className="text-white font-medium">{selectedParticipant.user?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Meeting</p>
                  <p className="text-white">{selectedParticipant.meeting?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  {getRoleBadge(selectedParticipant.role)}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  {getStatusBadge(selectedParticipant.is_active)}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Joined At</p>
                  <p className="text-white">{formatDate(selectedParticipant.joined_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Left At</p>
                  <p className="text-white">{formatDate(selectedParticipant.left_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-white">{selectedParticipant.attendance_duration ? `${selectedParticipant.attendance_duration} seconds` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Features</p>
                  <div className="space-y-1 text-xs">
                    <p className={selectedParticipant.camera_enabled ? "text-green-400" : "text-gray-400"}>
                      Camera: {selectedParticipant.camera_enabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className={selectedParticipant.microphone_enabled ? "text-green-400" : "text-gray-400"}>
                      Mic: {selectedParticipant.microphone_enabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className={selectedParticipant.screen_shared ? "text-green-400" : "text-gray-400"}>
                      Screen Share: {selectedParticipant.screen_shared ? "Active" : "Inactive"}
                    </p>
                    <p className={selectedParticipant.hand_raised ? "text-yellow-400" : "text-gray-400"}>
                      Hand: {selectedParticipant.hand_raised ? "Raised" : "Lowered"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}