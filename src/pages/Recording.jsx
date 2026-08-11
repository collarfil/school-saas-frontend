import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, Play, Link, Lock, Globe, Users, Clock } from "lucide-react";

export default function Recording() {
  const [recordings, setRecordings] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");

  const [form, setForm] = useState({
    meeting_id: "",
    file_name: "",
    file_url: "",
    duration: "",
    size: "",
    provider: "",
    visibility: "private"
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

      const [recordingsRes, meetingsRes] = await Promise.all([
        api.get("/meeting-recordings", { params }),
        api.get("/meetings", { params: { school_id: schoolId } })
      ]);
      
      setRecordings(recordingsRes.data?.data?.data || recordingsRes.data?.data || []);
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
        duration: parseInt(form.duration) || 0,
        size: parseInt(form.size) || 0
      };

      if (editId) {
        await api.put(`/meeting-recordings/${editId}`, payload);
        toast.success("Recording updated successfully");
      } else {
        await api.post("/meeting-recordings", payload);
        toast.success("Recording created successfully");
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
        toast.error("Failed to save recording");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (recording) => {
    setForm({
      meeting_id: recording.meeting_id || "",
      file_name: recording.file_name || "",
      file_url: recording.file_url || "",
      duration: recording.duration || "",
      size: recording.size || "",
      provider: recording.provider || "",
      visibility: recording.visibility || "private"
    });
    setEditId(recording.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/meeting-recordings/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Recording deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete recording");
    }
  };

  const handleUpdateVisibility = async (id, visibility) => {
    try {
      const schoolId = getSchoolId();
      await api.patch(`/meeting-recordings/${id}/visibility`, {
        school_id: schoolId,
        visibility
      });
      toast.success(`Visibility updated to ${visibility}`);
      fetchAll();
    } catch (error) {
      console.error("❌ Update visibility error:", error);
      toast.error("Failed to update visibility");
    }
  };

  const resetForm = () => {
    setForm({
      meeting_id: "",
      file_name: "",
      file_url: "",
      duration: "",
      size: "",
      provider: "",
      visibility: "private"
    });
    setEditId(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getVisibilityBadge = (visibility) => {
    const map = {
      public: { color: "bg-green-500/20 text-green-300 border-green-500", icon: <Globe className="h-3 w-3 inline mr-1" /> },
      private: { color: "bg-red-500/20 text-red-300 border-red-500", icon: <Lock className="h-3 w-3 inline mr-1" /> },
      unlisted: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500", icon: <Link className="h-3 w-3 inline mr-1" /> }
    };
    const s = map[visibility] || map.private;
    return <span className={`px-2 py-1 rounded text-xs border ${s.color}`}>{s.icon} {visibility}</span>;
  };

  // ========== DATATABLE CONFIGURATION ==========
  const tableColumns = [
    { header: "File Name", accessor: "file_name", width: "200px" },
    { header: "Meeting", accessor: "meeting_title", width: "180px" },
    { header: "Duration", accessor: "duration", width: "100px" },
    { header: "Size", accessor: "size", width: "100px" },
    { header: "Visibility", accessor: "visibility_badge", width: "120px" },
  ];

  const getTableData = () => {
    return recordings.map((recording) => ({
      id: recording.id,
      file_name: recording.file_name,
      meeting_title: recording.meeting?.title || "N/A",
      duration: formatDuration(recording.duration),
      size: formatFileSize(recording.size),
      visibility_badge: getVisibilityBadge(recording.visibility),
      original: recording
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <a
        href={row.original.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-400 hover:text-green-300 p-1"
        title="Play"
      >
        <Play className="h-4 w-4" />
      </a>
      <button
        onClick={() => { setSelectedRecording(row.original); setShowViewModal(true); }}
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
          <h2 className="text-2xl font-bold">Recordings</h2>
          <p className="text-gray-400 text-sm">Manage meeting recordings and videos</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center gap-2"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          {loading ? "Loading..." : "Add Recording"}
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
        title="Recording List"
        searchPlaceholder="Search by file name or meeting..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.file_name?.toLowerCase().includes(lowerTerm) ||
            item.meeting_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* View Modal */}
      {showViewModal && selectedRecording && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recording Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedRecording(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">File Name</p>
                <p className="text-white font-medium">{selectedRecording.file_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Meeting</p>
                  <p className="text-white">{selectedRecording.meeting?.title || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Provider</p>
                  <p className="text-white">{selectedRecording.provider || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-white">{formatDuration(selectedRecording.duration)}</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Size</p>
                  <p className="text-white">{formatFileSize(selectedRecording.size)}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">Visibility</p>
                {getVisibilityBadge(selectedRecording.visibility)}
                <div className="mt-2 flex gap-2">
                  {['public', 'private', 'unlisted'].map((v) => (
                    <button
                      key={v}
                      onClick={() => handleUpdateVisibility(selectedRecording.id, v)}
                      className={`px-3 py-1 rounded text-xs ${
                        selectedRecording.visibility === v
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-gray-400">File URL</p>
                <a
                  href={selectedRecording.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {selectedRecording.file_url}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}