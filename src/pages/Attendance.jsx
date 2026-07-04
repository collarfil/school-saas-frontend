import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import { Trash2, RefreshCw } from "lucide-react";

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  const getSchoolId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.school?.id || user?.school_id;
      }
    } catch (error) { 
      console.error("Error getting school ID:", error);
    }
    return null;
  };

  const extractArrayData = (response) => {
    if (!response || !response.data) return [];
    const data = response.data;
    if (data?.status === 'success') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
      return [];
    }
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  // Load available grades for this user (filtered by employee_grade assignments)
  const loadAvailableGrades = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    try {
      const res = await api.get("/attendances/available-grades", { 
        params: { school_id: schoolId } 
      });
      const gradesData = res.data?.data || [];
      setGrades(gradesData);
      
      // Auto-select first grade if available and none selected
      if (gradesData.length > 0 && !selectedGrade) {
        setSelectedGrade(gradesData[0].id?.toString() || "");
      }
    } catch (err) {
      console.error("Error loading grades:", err);
      toast.error("Failed to load grades");
    }
  };

  // Load students for selected grade (with access control)
  const loadStudentsByGrade = async (gradeId) => {
    const schoolId = getSchoolId();
    if (!schoolId || !gradeId) return [];

    try {
      const res = await api.get("/attendances/students-by-grade", {
        params: { grade_id: gradeId, school_id: schoolId }
      });
      const studentsData = res.data?.data || [];
      setStudents(studentsData);
      return studentsData;
    } catch (err) {
      console.error("Error loading students:", err);
      if (err.response?.status === 403) {
        toast.error("You don't have access to this grade");
        setSelectedGrade("");
      } else {
        toast.error("Failed to load students");
      }
      return [];
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const [attendancesRes, sessionsRes] = await Promise.all([
        api.get("/attendances", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } })
      ]);

      const attendancesData = extractArrayData(attendancesRes);
      const sessionsData = extractArrayData(sessionsRes);
      
      setAttendances(attendancesData);
      setSessions(sessionsData);
      
      if (sessionsData.length > 0 && !selectedSession) {
        setSelectedSession(sessionsData[0]?.id?.toString() || "");
      }
    } catch (err) {
      console.error("❌ Load data error:", err);
      toast.error("Failed to load data");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    loadAvailableGrades();
    loadAllData();
  }, []);

  // When grade is selected, load students
  useEffect(() => {
    if (selectedGrade) {
      loadStudentsByGrade(selectedGrade).then(studentsData => {
        initializeAttendanceRecords(studentsData);
      });
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedGrade, attendanceDate, selectedSession]);

  const initializeAttendanceRecords = (studentsList) => {
    const records = studentsList.map(student => {
      const existingAttendance = attendances.find(att => 
        att.student_id === student.id && 
        att.attendance_date?.split('T')[0] === attendanceDate
      );
      return {
        student_id: student.id,
        student_name: student.name || 'N/A',
        grade_id: parseInt(selectedGrade),
        school_session_id: selectedSession ? parseInt(selectedSession) : null,
        attendance_date: attendanceDate,
        is_present: existingAttendance ? existingAttendance.is_present : true,
        existing_id: existingAttendance?.id
      };
    });
    setAttendanceRecords(records);
  };

  const toggleAttendance = (studentId) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.student_id === studentId ? { ...record, is_present: !record.is_present } : record
    ));
  };

  const markAllPresent = () => setAttendanceRecords(prev => prev.map(record => ({ ...record, is_present: true })));
  const markAllAbsent = () => setAttendanceRecords(prev => prev.map(record => ({ ...record, is_present: false })));

  const saveSingleAttendance = async (record) => {
    setSaving(true);
    const schoolId = getSchoolId();
    if (!schoolId) { toast.error("No school ID found"); setSaving(false); return; }
    
    try {
      const payload = {
        student_id: record.student_id,
        grade_id: record.grade_id,
        school_session_id: record.school_session_id,
        attendance_date: record.attendance_date,
        is_present: record.is_present,
        school_id: schoolId
      };

      if (record.existing_id) {
        await api.put(`/attendances/${record.existing_id}`, payload);
        toast.success("Attendance updated successfully");
      } else {
        await api.post("/attendances", payload);
        toast.success("Attendance recorded successfully");
      }
      await loadAllData();
    } catch (err) { 
      console.error("❌ Save attendance error:", err); 
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally { 
      setSaving(false); 
    }
  };

  const saveAllAttendance = async () => {
    if (attendanceRecords.length === 0) { toast.error("No attendance records to save"); return; }
    if (!selectedGrade) { toast.error("Please select a grade first"); return; }
    
    setBulkSaving(true);
    const schoolId = getSchoolId();
    if (!schoolId) { toast.error("No school ID found"); setBulkSaving(false); return; }
    
    try {
      const records = attendanceRecords.map(record => ({
        student_id: record.student_id,
        grade_id: record.grade_id,
        school_session_id: record.school_session_id,
        attendance_date: record.attendance_date,
        is_present: record.is_present
      }));

      await api.post("/attendances/bulk", { records, school_id: schoolId });
      toast.success(`${attendanceRecords.length} attendance records saved successfully`);
      await loadAllData();
    } catch (err) { 
      console.error("❌ Bulk save error:", err); 
      toast.error(err.response?.data?.message || "Failed to save attendance records");
    } finally { 
      setBulkSaving(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/attendances/${id}`, { params: { school_id: schoolId } });
      toast.success("Attendance deleted successfully");
      loadAllData();
    } catch (err) { 
      console.error("❌ Delete attendance error:", err); 
      toast.error("Failed to delete attendance");
    }
  };

  const getGradeName = (grade) => grade?.name || grade?.grade_name || 'N/A';
  const getSessionName = (session) => session?.name || session?.session_name || 'N/A';

  // Check if user is admin (can see all grades)
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const safeGrades = Array.isArray(grades) ? grades : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const attendancesArray = Array.isArray(attendances) ? attendances : [];

  // ========== DATATABLE FOR RECENT ATTENDANCE RECORDS ==========
  const tableColumns = [
    { header: "Student", accessor: "student_name", width: "200px" },
    { header: "Grade", accessor: "grade_name", width: "150px" },
    { header: "Date", accessor: "date_formatted", width: "120px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    // Filter recent attendance by selected grade if employee
    let filtered = attendancesArray;
    if (!isAdmin && selectedGrade) {
      filtered = attendancesArray.filter(a => a.grade_id?.toString() === selectedGrade);
    }
    
    return filtered.slice(0, 10).map((attendance, index) => ({
      id: attendance.id,
      student_name: attendance.student?.name || 'N/A',
      grade_name: getGradeName(attendance.grade),
      date_formatted: attendance.attendance_date ? new Date(attendance.attendance_date).toLocaleDateString() : 'N/A',
      status_badge: (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${attendance.is_present ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {attendance.is_present ? 'Present' : 'Absent'}
        </span>
      ),
      original: attendance
    }));
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => handleDelete(row.original.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const handleTableSearch = (data, term) => {
    const lowerTerm = term.toLowerCase();
    return data.filter(item => item.student_name?.toLowerCase().includes(lowerTerm));
  };

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-sm text-gray-400">
            {isAdmin ? "View all grades" : `You have access to ${safeGrades.length} grade(s)`}
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {attendancesArray.length} Records
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Take Attendance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grade Selection - Only shows assigned grades for teachers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Grade <span className="text-red-400">*</span>
            </label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)} 
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select Grade</option>
              {safeGrades.map(grade => (
                <option key={grade.id} value={grade.id}>{getGradeName(grade)}</option>
              ))}
            </select>
            {safeGrades.length === 0 && !isAdmin && (
              <p className="text-yellow-400 text-sm mt-2">
                No grades assigned to you. Contact admin for grade assignments.
              </p>
            )}
          </div>

          {/* Session Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Session
            </label>
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)} 
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="">Select Session</option>
              {safeSessions.map(session => (
                <option key={session.id} value={session.id}>{getSessionName(session)}</option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Attendance Date <span className="text-red-400">*</span>
            </label>
            <input 
              type="date" 
              value={attendanceDate} 
              onChange={(e) => setAttendanceDate(e.target.value)} 
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" 
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex items-end">
            {selectedGrade && attendanceRecords.length > 0 && (
              <div className="flex space-x-2 w-full">
                <button 
                  onClick={markAllPresent} 
                  className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded font-medium text-sm"
                >
                  All Present
                </button>
                <button 
                  onClick={markAllAbsent} 
                  className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-medium text-sm"
                >
                  All Absent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading data...
          </div>
        ) : !selectedGrade ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Select a Grade</h3>
            <p className="text-gray-400">Please select a grade to view and manage attendance</p>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Students Found</h3>
            <p className="text-gray-400">There are no students enrolled in the selected grade</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {safeGrades.find(g => g.id?.toString() === selectedGrade)?.name || 'Selected Grade'}
                </h3>
                <p className="text-sm text-gray-400">
                  {attendanceRecords.length} students • Date: {new Date(attendanceDate).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={saveAllAttendance} 
                disabled={bulkSaving} 
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {bulkSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                {bulkSaving ? "Saving..." : `Save All (${attendanceRecords.length})`}
              </button>
            </div>

            <table className="w-full text-left">
              <thead className="text-gray-300 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={record.student_id} className="border-b border-gray-700 hover:bg-slate-700/40">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{record.student_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={() => toggleAttendance(record.student_id)} 
                          className={`relative inline-flex items-center cursor-pointer transition-colors duration-200 ease-in-out ${record.is_present ? 'bg-green-600' : 'bg-red-600'} h-6 w-11 rounded-full`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${record.is_present ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                          <span className={`absolute right-1 text-xs font-semibold ${record.is_present ? 'text-white' : 'text-slate-900'}`}>
                            {record.is_present ? 'P' : 'A'}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.is_present ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {record.is_present ? 'Present' : 'Absent'}
                        </span>
                        {record.existing_id && (
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Saved</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => saveSingleAttendance(record)} 
                        disabled={saving} 
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Recent Attendance Records Table - Only shows relevant records */}
      {attendancesArray.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Attendance Records</h3>
            <div className="text-sm text-gray-400">
              {isAdmin ? "All records" : `Records for your assigned grades`}
            </div>
          </div>
          <DataTable
            columns={tableColumns}
            data={getTableData()}
            loading={loading}
            title=""
            searchPlaceholder="Search by student name..."
            onSearch={handleTableSearch}
            actions={renderActions}
          />
        </div>
      )}
    </div>
  );
}