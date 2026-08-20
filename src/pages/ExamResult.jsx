import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { Download, BarChart2, Eye } from "lucide-react";

export default function ExamResult() {
  const { exam_id } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!exam_id) return;
      setLoading(true);
      try {
        const response = await api.get(`/CBT/exams/${exam_id}/results`);
        setResults(response.data?.data || response.data || []);
      } catch (err) {
        console.error("❌ Results ledger fetch crash:", err);
        toast.error("Failed to compile candidate results matrix.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [exam_id]);

  const handleExportCSV = () => {
    if (results.length === 0) return toast.error("No dataset available to parse.");
    
    const headers = ["Rank", "Admission Number", "Student Name", "Class Arm", "Raw Score", "Percentage Grade"];
    const rows = results.map((r, idx) => [
      idx + 1,
      r.student?.admission_no || "N/A",
      `${r.student?.first_name || ""} ${r.student?.last_name || ""}`.trim(),
      r.class_room?.name || "N/A",
      r.total_score,
      `${parseFloat(r.score_percentage || 0).toFixed(2)}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CBT_Exam_Results_Sheet_${exam_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableColumns = [
    { header: "Pos", accessor: "index", width: "70px" },
    { header: "Admission No", accessor: "admission_no", width: "150px" },
    { header: "Candidate Identity", accessor: "student_name", width: "320px" },
    { header: "Raw Accumulation", accessor: "score_raw", width: "160px" },
    { header: "Computed Grade", accessor: "percentage", width: "150px" }
  ];

  const getTableData = () => {
    return results.map((item, index) => ({
      id: item.id,
      index: index + 1,
      admission_no: item.student?.admission_no || "---",
      student_name: item.student ? `${item.student.first_name} ${item.student.last_name}` : "Unknown System Node",
      score_raw: `${item.total_score} Pts`,
      percentage: `${parseFloat(item.score_percentage || 0).toFixed(2)}%`,
      original: item
    }));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">Performance Ledger Desk</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Exam Ledger Link Pointer: #{exam_id}</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Download className="h-4 w-4" /> Export Results Ledger
        </button>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Evaluated Candidate Scripts"
        searchPlaceholder="Find candidate entries..."
        onSearch={(d, t) => d.filter(i => i.student_name.toLowerCase().includes(t.toLowerCase()) || i.admission_no.toLowerCase().includes(t.toLowerCase()))}
      />
    </div>
  );
}