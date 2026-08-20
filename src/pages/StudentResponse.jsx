import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Eye, Clock, Award } from "lucide-react";

export default function StudentResponse() {
  const { exam_id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = async () => {
    if (!exam_id) return;
    setLoading(true);
    try {
      const response = await api.get(`/CBT/exams/${exam_id}/submissions`);
      setSubmissions(response.data?.data || response.data || []);
    } catch (err) {
      console.error("❌ Extraction of response matrix rows crashed:", err);
      toast.error("Failed to compile candidate attempt tracking ledgers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [exam_id]);

  const tableColumns = [
    { header: "#", accessor: "index", width: "50px" },
    { header: "Candidate Name", accessor: "student_name", width: "220px" },
    { header: "Submission Timestamp", accessor: "submitted_at", width: "180px" },
    { header: "Absolute Score Matrix", accessor: "raw_score", width: "130px" },
    { header: "Efficiency %", accessor: "percentage", width: "100px" },
    { header: "Processing State", accessor: "status_badge", width: "130px" }
  ];

  const getTableData = () => {
    return submissions.map((sub, index) => {
      const pct = parseFloat(sub.score_percentage || 0);
      let pctColor = "text-red-400 font-mono";
      if (pct >= 70) pctColor = "text-emerald-400 font-mono font-bold";
      else if (pct >= 50) pctColor = "text-yellow-400 font-mono";

      return {
        id: sub.id,
        index: index + 1,
        student_name: sub.student ? `${sub.student.first_name} ${sub.student.last_name}` : `Candidate Profile Ref #${sub.student_id}`,
        submitted_at: sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "Active Session Process Running",
        raw_score: `${sub.total_score} Pts`,
        percentage: <span className={pctColor}>{pct.toFixed(2)}%</span>,
        status_badge: sub.status === "completed" ? (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800">COMPLETED</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800 animate-pulse">ONGOING</span>
        ),
        original: sub
      };
    });
  };

  return (
    <div className="text-white p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Candidate Result Ledger</h2>
        <p className="text-sm text-gray-400 mt-1 font-mono">Real-time Performance Metrics Capture • Target Exam Scope Reference Matrix: #{exam_id}</p>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Candidate Attempts Logging Array"
        searchPlaceholder="Search performance lines via student designation indices..."
        onSearch={(d, t) => d.filter(i => i.student_name.toLowerCase().includes(t.toLowerCase()))}
        actions={(row) => (
          <div className="flex items-center justify-end">
            <button 
              onClick={() => setSelectedSubmission(row.original)}
              className="text-blue-400 hover:text-blue-300 p-1 flex items-center gap-1 text-xs font-semibold tracking-wide bg-blue-950/40 rounded border border-blue-900 px-2.5 py-1"
              title="Inspect Audit Trailing Array Details"
            >
              <Eye className="h-3.5 w-3.5" /> Inspect Log
            </button>
          </div>
        )}
      />

      {selectedSubmission && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-lg border border-slate-700">
            <div className="flex justify-between items-start border-b border-slate-700 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-400">Structural Audit Log Traceback</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Attempt Row Identifier Instance: #{selectedSubmission.id}</p>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white font-bold px-2 py-0.5 rounded bg-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 bg-slate-900/40 p-2 rounded border border-slate-700/60">
                <span className="text-gray-400">Processing Node</span>
                <span className="col-span-2 font-medium font-mono text-xs text-slate-300">{selectedSubmission.ip_address || "Unavailable/Direct Local Host Override"}</span>
              </div>
              
              <div className="grid grid-cols-3 bg-slate-900/40 p-2 rounded border border-slate-700/60">
                <span className="text-gray-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-400" /> Start Epoch</span>
                <span className="col-span-2 font-mono text-xs">{selectedSubmission.started_at ? new Date(selectedSubmission.started_at).toLocaleString() : "Missing Initialization Marker"}</span>
              </div>

              <div className="grid grid-cols-3 bg-slate-900/40 p-2 rounded border border-slate-700/60">
                <span className="text-gray-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-red-400" /> End Epoch</span>
                <span className="col-span-2 font-mono text-xs">{selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : "Runtime Active Session Context"}</span>
              </div>

              <div className="grid grid-cols-3 bg-slate-900/40 p-2 rounded border border-slate-700/60 items-center">
                <span className="text-gray-400 flex items-center gap-1"><Award className="h-3.5 w-3.5 text-yellow-400" /> Evaluated Score</span>
                <span className="col-span-2 font-mono text-base font-bold text-yellow-400">
                  {selectedSubmission.total_score} / Max Blueprint Value
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded border border-slate-700 mt-4 text-xs text-gray-400 leading-relaxed font-mono">
                System verification confirmation status maps successfully tracked. Browser agent logs match institutional exam requirements criteria parameters.
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-700">
              <button 
                type="button" 
                onClick={() => setSelectedSubmission(null)} 
                className="px-4 py-2 bg-gray-600 rounded font-medium hover:bg-gray-500 transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}