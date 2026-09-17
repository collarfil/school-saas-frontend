import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Edit, Trash2, Plus, Eye, XCircle } from "lucide-react";

export default function Whiteboard() {
  const [whiteboards, setWhiteboards] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWhiteboard, setSelectedWhiteboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");

  const [form, setForm] = useState({
    meeting_id: "",
    page_number: "",
    board_data: ""
  });
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
      const params = { school_id: schoolId };
      if (filterMeeting) params.meeting_id = filterMeeting;

      const [whiteboardsRes, meetingsRes] = await Promise.all([
        api.get("/whiteboards", { params }),
        api.get("/meetings", { params: { school_id: schoolId } })
      ]);

      setWhiteboards(whiteboardsRes.data?.data || whiteboardsRes.data || []);
      setMeetings(meetingsRes.data?.data?.data || meetingsRes.data?.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      // No toast — prevents spam on every retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMeeting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saveLoading) return;
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
        page_number: parseInt(form.page_number) || undefined
      };

      if (editId) {
        await api.put(`/whiteboards/${editId}`, payload);
        toast.success("Whiteboard updated successfully");
      } else {
        await api.post("/whiteboards", payload);
        toast.success("Whiteboard created successfully");
      }

      setShowModal(false);
      resetForm();
      await fetchAll();
    } catch (error) {
      console.error("❌ Save error:", error);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((messages) => {
          messages.forEach((message) => toast.error(message));
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save whiteboard");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (whiteboard) => {
    setForm({
      meeting_id: whiteboard.meeting_id || "",
      page_number: whiteboard.page_number || "",
      board_data: whiteboard.board_data || ""
    });
    setEditId(whiteboard.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this whiteboard?")) return;

    try {
      const schoolId = getSchoolId();
      await api.delete(`/whiteboards/${id}`, {
        params: { school_id: schoolId }
      });
      toast.success("Whiteboard deleted successfully");
      fetchAll();
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete whiteboard");
    }
  };

  const resetForm = () => {
    setForm({
      meeting_id: "",
      page_number: "",
      board_data: ""
    });
    setEditId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const tableColumns = [
    { header: "Meeting", accessor: "meeting_title", width: "200px" },
    { header: "Page", accessor: "page_number", width: "80px" },
    { header: "Created By", accessor: "created_by", width: "150px" },
    { header: "Created At", accessor: "created_at", width: "150px" },
  ];

  const getTableData = () => {
    return whiteboards.map((whiteboard) => ({
      id: whiteboard.id,
      meeting_title: whiteboard.meeting?.title || "N/A",
      page_number: whiteboard.page_number || "N/A",
      created_by: whiteboard.created_by_user?.name || "N/A",
      created_at: formatDate(whiteboard.created_at),
      original: whiteboard
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedWhiteboard(row.original); setShowViewModal(true); }}
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
          <h2 className="text-2xl font-bold">Whiteboards</h2>
          <p className="text-gray-400 text-sm">Manage whiteboard sessions for meetings</p>
        </div>

        {/* ✅ Button is always clickable now */}
        <button
          type="button"
          onClick={() => {
            console.log("🟢 Create Whiteboard button clicked");
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Whiteboard
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Filter by Meeting
          </label>
          <select
            value={filterMeeting}
            onChange={(e) => setFilterMeeting(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Meetings</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.title || `Meeting #${meeting.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Whiteboard List"
        searchPlaceholder="Search by meeting..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter((item) =>
            item.meeting_title?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editId ? "Edit Whiteboard" : "Create Whiteboard"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Meeting <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.meeting_id}
                  onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                  required
                  disabled={saveLoading || !!editId}
                >
                  <option value="">Select Meeting</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || `Meeting #${m.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Page Number
                </label>
                <input
                  type="number"
                  value={form.page_number}
                  onChange={(e) => setForm({ ...form, page_number: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                  disabled={saveLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Board Data <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.board_data}
                  onChange={(e) => setForm({ ...form, board_data: e.target.value })}
                  rows="6"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white outline-none"
                  required
                  disabled={saveLoading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors font-medium"
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
      {showViewModal && selectedWhiteboard && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Whiteboard Details</h3>
              <button
                onClick={() => { setShowViewModal(false); setSelectedWhiteboard(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Meeting</p>
                  <p className="text-white font-medium">
                    {selectedWhiteboard.meeting?.title || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Page Number</p>
                  <p className="text-white font-medium">
                    {selectedWhiteboard.page_number || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Created By</p>
                  <p className="text-white">
                    {selectedWhiteboard.created_by_user?.name || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Created At</p>
                  <p className="text-white">
                    {formatDate(selectedWhiteboard.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Board Data</p>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
                    {selectedWhiteboard.board_data || "No data"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}