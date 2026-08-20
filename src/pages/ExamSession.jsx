import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Calendar, Play, Square, Loader2 } from "lucide-react";

export default function ExamSession() {
  const { exam_id } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSessions = async () => {
    if (!exam_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/CBT/exams/${exam_id}/sessions`);
      setSessions(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Session fetch error:", err);
      toast.error("Failed to load exam operational sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [exam_id]);

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    setActionLoading(sessionId);
    try {
      await api.post(`/CBT/sessions/${sessionId}/toggle-status`, { status: nextStatus });
      toast.success(`Session status altered to ${nextStatus}.`);
      fetchSessions();
    } catch (err) {
      toast.error("Failed to update session execution state.");
    } finally {
      setActionLoading(null);
    }
  };

  const tableColumns = [
    { header: "#", accessor: "index", width: "70px" },
    { header: "Session Name / Reference", accessor: "name", width: "250px" },
    { header: "Academic Year/Term", accessor: "term_scope", width: "200px" },
    { header: "Status Tracker", accessor: "status_badge", width: "150px" }
  ];

  const getTableData = () => {
    return sessions.map((session, index) => ({
      id: session.id,
      index: index + 1,
      name: session.name || `Session Reference #${session.id}`,
      term_scope: session.academic_term?.name || "Active Default Term",
      status_badge: (
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
          session.status === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {session.status}
        </span>
      ),
      original: session
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Exam Sessions Engine</h2>
        <p className="text-sm text-gray-400 mt-1 font-mono">Bound Exam Blueprint Registry: #{exam_id}</p>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Live Execution Instances"
        searchPlaceholder="Filter execution sessions..."
        onSearch={(d, t) => d.filter(i => i.name.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end">
            <button
              onClick={() => toggleSessionStatus(row.id, row.original.status)}
              disabled={actionLoading === row.id}
              className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold uppercase tracking-wide font-mono ${
                row.original.status === "active" 
                  ? "text-amber-400 hover:text-amber-300" 
                  : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              {actionLoading === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : row.original.status === "active" ? (
                <><Square className="h-3.5 w-3.5 fill-current" /> Terminate</>
              ) : (
                <><Play className="h-3.5 w-3.5 fill-current" /> Initialize</>
              )}
            </button>
          </div>
        )}
      />
    </div>
  );
}