// src/pages/AdminAdmission.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import { 
  Plus, Edit, Trash2, Eye, CheckCircle, XCircle, 
  RefreshCw, ChevronLeft, ChevronRight, Search,
  Users, Calendar, FileText, Award, UserPlus
} from "lucide-react";

export default function AdminAdmission() {
  const [admissions, setAdmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [admissionLists, setAdmissionLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  // Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  
  // Admission List Form
  const [listForm, setListForm] = useState({
    title: '',
    batch_number: '1st Batch',
    school_session_id: '',
    term: 'First Term',
    grade_id: '',
    is_published: false
  });

  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.school?.id || user?.school_id;
    } catch {
      return null;
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found");
      setLoading(false);
      return;
    }

    try {
      const params = { school_id: schoolId };
      if (search) params.search = search;
      if (selectedGrade) params.grade_id = selectedGrade;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedSession) params.school_session_id = selectedSession;

      const [admissionsRes, gradesRes, sessionsRes, listsRes] = await Promise.all([
        api.get("/admissions", { params }),
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } }),
        api.get("/admission-lists", { params: { school_id: schoolId } })
      ]);
      
      setAdmissions(admissionsRes.data?.data?.data || admissionsRes.data?.data || []);
      setGrades(gradesRes.data?.data || gradesRes.data || []);
      setSessions(sessionsRes.data?.data || sessionsRes.data || []);
      setAdmissionLists(listsRes.data?.data?.data || listsRes.data?.data || []);
      
      if (admissionsRes.data?.data) {
        setPagination({
          current_page: admissionsRes.data.data.current_page || 1,
          last_page: admissionsRes.data.data.last_page || 1,
          total: admissionsRes.data.data.total || 0
        });
      }
      
    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [search, selectedGrade, selectedStatus, selectedSession]);

  const handleStatusChange = async (id, newStatus) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    try {
      const schoolId = getSchoolId();
      await api.patch(`/admissions/${id}/status`, {
        school_id: schoolId,
        status: newStatus
      });
      toast.success(`Status updated to ${newStatus}`);
      fetchAll();
    } catch (error) {
      console.error("❌ Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    
    if (selectedApplicants.length === 0) {
      toast.error("Please select at least one applicant");
      return;
    }

    try {
      const schoolId = getSchoolId();
      const payload = {
        ...listForm,
        school_id: schoolId,
        applicant_ids: selectedApplicants
      };

      await api.post("/admission-lists", payload);
      toast.success("Admission list created successfully!");
      setShowListModal(false);
      setSelectedApplicants([]);
      setListForm({
        title: '',
        batch_number: '1st Batch',
        school_session_id: '',
        term: 'First Term',
        grade_id: '',
        is_published: false
      });
      fetchAll();
    } catch (error) {
      console.error("❌ Create list error:", error);
      toast.error("Failed to create admission list");
    }
  };

  const handleBulkStatusUpdate = async (ids, newStatus) => {
    if (!confirm(`Update ${ids.length} applicants to ${newStatus}?`)) return;
    
    try {
      const schoolId = getSchoolId();
      await Promise.all(ids.map(id => 
        api.patch(`/admissions/${id}/status`, {
          school_id: schoolId,
          status: newStatus
        })
      ));
      toast.success(`Updated ${ids.length} applicants to ${newStatus}`);
      fetchAll();
    } catch (error) {
      console.error("❌ Bulk update error:", error);
      toast.error("Failed to update applicants");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500", label: "Pending" },
      under_review: { color: "bg-blue-500/20 text-blue-300 border-blue-500", label: "Under Review" },
      interview_scheduled: { color: "bg-purple-500/20 text-purple-300 border-purple-500", label: "Interview Scheduled" },
      admitted: { color: "bg-green-500/20 text-green-300 border-green-500", label: "Admitted" },
      rejected: { color: "bg-red-500/20 text-red-300 border-red-500", label: "Rejected" },
      enrolled: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500", label: "Enrolled" }
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded text-xs border ${s.color}`}>{s.label}</span>;
  };

  const tableColumns = [
    { header: "App #", accessor: "application_number", width: "120px" },
    { header: "Applicant", accessor: "full_name", width: "200px" },
    { header: "Target Grade", accessor: "grade_name", width: "120px" },
    { header: "Phone", accessor: "phone", width: "130px" },
    { header: "Status", accessor: "status_badge", width: "140px" },
    { header: "List", accessor: "list_name", width: "150px" },
  ];

  const getTableData = () => {
    return admissions.map((admission) => ({
      id: admission.id,
      application_number: admission.application_number || `ADM-${admission.id}`,
      full_name: `${admission.first_name || ''} ${admission.middle_name || ''} ${admission.last_name || ''}`.trim(),
      grade_name: admission.grade?.name || 'N/A',
      phone: admission.phone || 'N/A',
      status_badge: getStatusBadge(admission.status),
      list_name: admission.admission_list?.title || 'Not Assigned',
      original: admission
    }));
  };

  const renderTableActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => { setSelectedRecord(row.original); setShowDetailModal(true); }}
        className="text-blue-400 hover:text-blue-300 p-1"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </button>
      <select
        onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
        value={row.original.status || 'pending'}
        className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500"
      >
        <option value="pending">Pending</option>
        <option value="under_review">Under Review</option>
        <option value="interview_scheduled">Interview Scheduled</option>
        <option value="admitted">Admitted</option>
        <option value="rejected">Rejected</option>
        <option value="enrolled">Enrolled</option>
      </select>
    </div>
  );

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admission Management</h2>
          <p className="text-gray-400 text-sm">Process and manage student applications</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Select all pending applications
              const pendingIds = admissions
                .filter(a => a.status === 'pending')
                .map(a => a.id);
              if (pendingIds.length > 0) {
                setSelectedApplicants(pendingIds);
                setShowListModal(true);
                setListForm(prev => ({
                  ...prev,
                  school_session_id: sessions[0]?.id || '',
                  grade_id: grades[0]?.id || ''
                }));
              } else {
                toast.info("No pending applications to process");
              }
            }}
            className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Process Pending
          </button>
          <button
            onClick={() => {
              setSelectedApplicants([]);
              setShowListModal(true);
              setListForm(prev => ({
                ...prev,
                school_session_id: sessions[0]?.id || '',
                grade_id: grades[0]?.id || ''
              }));
            }}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create List
          </button>
          <button
            onClick={fetchAll}
            className="bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or application number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="admitted">Admitted</option>
          <option value="rejected">Rejected</option>
          <option value="enrolled">Enrolled</option>
        </select>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.name || s.session_name}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Applications"
        searchPlaceholder="Search applications..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.full_name?.toLowerCase().includes(lowerTerm) ||
            item.application_number?.toLowerCase().includes(lowerTerm)
          );
        }}
        actions={renderTableActions}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">Application Details</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedRecord(null); }} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Application details content */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Application Number</p>
                  <p className="text-sm font-mono text-blue-400">{selectedRecord.application_number}</p>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="text-sm font-medium text-white">
                    {selectedRecord.first_name} {selectedRecord.middle_name || ''} {selectedRecord.last_name}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Target Grade</p>
                  <p className="text-sm text-white">{selectedRecord.grade?.name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-white">{selectedRecord.phone}</p>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-white">{selectedRecord.email || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-gray-400">Guardian Information</p>
                <p className="text-sm text-white mt-1">
                  {selectedRecord.guardian_name || 'N/A'} 
                  {selectedRecord.guardian_relationship && ` (${selectedRecord.guardian_relationship})`}
                </p>
                <p className="text-sm text-white">{selectedRecord.guardian_phone || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm text-white">{selectedRecord.address || 'N/A'}</p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <select
                  onChange={(e) => handleStatusChange(selectedRecord.id, e.target.value)}
                  value={selectedRecord.status}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="admitted">Admitted</option>
                  <option value="rejected">Rejected</option>
                  <option value="enrolled">Enrolled</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedApplicants([selectedRecord.id]);
                    setShowListModal(true);
                    setListForm(prev => ({
                      ...prev,
                      school_session_id: selectedRecord.school_session_id || sessions[0]?.id || '',
                      grade_id: selectedRecord.grade_id || ''
                    }));
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Award className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admission List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">Create Admission List</h3>
              <button onClick={() => { setShowListModal(false); setSelectedApplicants([]); }} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateList} className="p-6 space-y-4">
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <p className="text-sm text-gray-400">Selected Applicants</p>
                <p className="text-white font-medium">{selectedApplicants.length} applicant(s) selected</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">List Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2026/2027 First Batch Merit List"
                  value={listForm.title}
                  onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Session *</label>
                  <select
                    required
                    value={listForm.school_session_id}
                    onChange={(e) => setListForm({ ...listForm, school_session_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || s.session_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 1st Batch"
                    value={listForm.batch_number}
                    onChange={(e) => setListForm({ ...listForm, batch_number: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Term</label>
                  <select
                    value={listForm.term}
                    onChange={(e) => setListForm({ ...listForm, term: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Target Grade</label>
                  <select
                    value={listForm.grade_id}
                    onChange={(e) => setListForm({ ...listForm, grade_id: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Grades</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={listForm.is_published}
                  onChange={(e) => setListForm({ ...listForm, is_published: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm text-gray-300">
                  Publish immediately (applicants will be notified)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => { setShowListModal(false); setSelectedApplicants([]); }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}