import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  
  // State for filters/selections
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for attendance records being edited
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Get school_id from user data
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

  // Helper function to extract array data from API responses
  const extractArrayData = (response) => {
    if (!response || !response.data) {
      console.warn("No response data found");
      return [];
    }

    const data = response.data;
    
    if (data?.status === 'success') {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
      if (data.data && Array.isArray(data.data.items)) return data.data.items;
      return [];
    }
    
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.results && Array.isArray(data.results)) return data.results;
    
    console.warn("Could not extract array data from response:", data);
    return [];
  };

  const loadAllData = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const [attendancesRes, gradesRes, studentsRes, sessionsRes] = await Promise.all([
        api.get("/attendances", { params: { school_id: schoolId } }),
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/students", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } })
      ]);

      const attendancesData = extractArrayData(attendancesRes);
      const gradesData = extractArrayData(gradesRes);
      const studentsData = extractArrayData(studentsRes);
      const sessionsData = extractArrayData(sessionsRes);

      setAttendances(Array.isArray(attendancesData) ? attendancesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);

      // Set default session if available
      if (sessionsData.length > 0 && !selectedSession) {
        setSelectedSession(sessionsData[0].id?.toString() || "");
      }

    } catch (err) {
      console.error("❌ Load data error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // When grade is selected, populate the attendance table
  useEffect(() => {
    if (selectedGrade && students.length > 0) {
      const gradeStudents = students.filter(student => 
        student.grade_id?.toString() === selectedGrade || 
        student.grade?.id?.toString() === selectedGrade
      );

      // Initialize attendance records for each student
      const initialRecords = gradeStudents.map(student => {
        // Check if there's existing attendance for today
        const existingAttendance = attendances.find(att => 
          att.student_id === student.id &&
          att.attendance_date?.split('T')[0] === attendanceDate
        );

        return {
          student_id: student.id,
          student_name: getStudentName(student),
          grade_id: parseInt(selectedGrade),
          school_session_id: selectedSession ? parseInt(selectedSession) : null,
          attendance_date: attendanceDate,
          is_present: existingAttendance ? existingAttendance.is_present : true,
          existing_id: existingAttendance?.id // Track if updating existing record
        };
      });

      setAttendanceRecords(initialRecords);
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedGrade, students, attendanceDate, selectedSession, attendances]);

  const getStudentName = (student) => {
    return student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'N/A';
  };

  const getGradeName = (grade) => {
    return grade?.name || grade?.grade_name || 'N/A';
  };
  
  const getSessionName = (session) => {
    return session?.name || session?.session_name || 'N/A';
  };

  // Toggle attendance status for a student
  const toggleAttendance = (studentId) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.student_id === studentId 
          ? { ...record, is_present: !record.is_present }
          : record
      )
    );
  };

  // Mark all as present
  const markAllPresent = () => {
    setAttendanceRecords(prev => 
      prev.map(record => ({ ...record, is_present: true }))
    );
  };

  // Mark all as absent
  const markAllAbsent = () => {
    setAttendanceRecords(prev => 
      prev.map(record => ({ ...record, is_present: false }))
    );
  };

  // Save attendance for a single student
  const saveSingleAttendance = async (record) => {
    setSaving(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setSaving(false);
      return;
    }

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

      // Refresh data
      await loadAllData();
    } catch (err) {
      console.error("❌ Save attendance error:", err.response?.data || err);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Save all attendance records in bulk
  const saveAllAttendance = async () => {
    if (attendanceRecords.length === 0) {
      toast.error("No attendance records to save");
      return;
    }

    if (!selectedGrade) {
      toast.error("Please select a grade first");
      return;
    }

    if (!selectedSession) {
      toast.error("Please select a session");
      return;
    }

    setBulkSaving(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setBulkSaving(false);
      return;
    }

    try {
      const promises = attendanceRecords.map(record => {
        const payload = {
          student_id: record.student_id,
          grade_id: record.grade_id,
          school_session_id: record.school_session_id,
          attendance_date: record.attendance_date,
          is_present: record.is_present,
          school_id: schoolId
        };

        if (record.existing_id) {
          return api.put(`/attendances/${record.existing_id}`, payload);
        } else {
          return api.post("/attendances", payload);
        }
      });

      await Promise.all(promises);
      toast.success(`${attendanceRecords.length} attendance records saved successfully`);
      
      // Refresh data
      await loadAllData();
    } catch (err) {
      console.error("❌ Bulk save attendance error:", err.response?.data || err);
      toast.error("Failed to save attendance records");
    } finally {
      setBulkSaving(false);
    }
  };

  // Delete attendance record
  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        const schoolId = getSchoolId();
        await api.delete(`/attendances/${id}`, {
          params: { school_id: schoolId }
        });
        toast.success("Attendance deleted successfully");
        loadAllData();
      } catch (err) {
        console.error("❌ Delete attendance error:", err);
        toast.error("Failed to delete attendance");
      }
    }
  };

  // Get students for selected grade
  const getStudentsForSelectedGrade = () => {
    if (!selectedGrade) return [];
    return students.filter(student => 
      student.grade_id?.toString() === selectedGrade || 
      student.grade?.id?.toString() === selectedGrade
    );
  };

  // Safe array variables
  const attendancesArray = Array.isArray(attendances) ? attendances : [];
  const gradesArray = Array.isArray(grades) ? grades : [];
  const studentsArray = Array.isArray(students) ? students : [];
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const gradeStudents = getStudentsForSelectedGrade();

  return (
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Management</h2>
        <div className="text-sm text-gray-400">
          {attendancesArray.length} Records • {studentsArray.length} Students
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Take Attendance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grade Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Grade <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Grade</option>
              {gradesArray.map(grade => (
                <option key={grade.id} value={grade.id}>
                  {getGradeName(grade)}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Session <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Session</option>
              {sessionsArray.map(session => (
                <option key={session.id} value={session.id}>
                  {getSessionName(session)}
                </option>
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
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Bulk Actions */}
          <div className="flex items-end">
            {selectedGrade && (
              <div className="flex space-x-2 w-full">
                <button
                  onClick={markAllPresent}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors font-medium text-sm"
                >
                  Mark All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors font-medium text-sm"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading data...
          </div>
        ) : !selectedGrade ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.137a10 10 0 01-.67 3.137" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Select a Grade</h3>
            <p className="text-gray-400 mb-4">Please select a grade to view and manage attendance</p>
          </div>
        ) : gradeStudents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.137a10 10 0 01-.67 3.137" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Students Found</h3>
            <p className="text-gray-400 mb-4">There are no students enrolled in the selected grade</p>
          </div>
        ) : (
          <>
            {/* Attendance Table Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Students in {gradesArray.find(g => g.id?.toString() === selectedGrade) ? getGradeName(gradesArray.find(g => g.id?.toString() === selectedGrade)) : 'Selected Grade'}
                </h3>
                <p className="text-sm text-gray-400">
                  {gradeStudents.length} students • Date: {new Date(attendanceDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={saveAllAttendance}
                disabled={bulkSaving || !selectedSession}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkSaving ? "Saving..." : `Save All (${attendanceRecords.length})`}
              </button>
            </div>

            {/* Attendance Table */}
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
                  <tr key={record.student_id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{record.student_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={() => toggleAttendance(record.student_id)}
                          className={`relative inline-flex items-center cursor-pointer transition-colors duration-200 ease-in-out ${
                            record.is_present ? 'bg-green-600' : 'bg-red-600'
                          } h-6 w-11 rounded-full`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              record.is_present ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          ></span>
                          <span className={`absolute right-1 text-xs font-semibold ${
                            record.is_present ? 'text-white' : 'text-slate-900'
                          }`}>{record.is_present ? 'P' : 'A'}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.is_present 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {record.is_present ? 'Present' : 'Absent'}
                        </span>
                        {record.existing_id && (
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            Saved
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => saveSingleAttendance(record)}
                        disabled={saving || !selectedSession}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Existing Attendance Records */}
      {attendancesArray.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Attendance Records</h3>
            <div className="text-sm text-gray-400">
              Last {Math.min(attendancesArray.length, 10)} of {attendancesArray.length} records
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-300 border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendancesArray.slice(0, 10).map((attendance, index) => (
                  <tr key={attendance.id || index} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">
                      {getStudentName(attendance.student)}
                    </td>
                    <td className="py-3 px-4">
                      {getGradeName(attendance.grade)}
                    </td>
                    <td className="py-3 px-4">
                      {attendance.attendance_date ? new Date(attendance.attendance_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        attendance.is_present 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {attendance.is_present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(attendance.id)}
                        className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Debug Info (Optional - can be removed) */}
      <div className="mt-4 p-3 bg-slate-800 rounded text-sm">
        <div className="text-gray-300">
          <strong>School ID:</strong> {getSchoolId() || "Not found"}
          <br />
          <strong>Selected Grade:</strong> {selectedGrade || "Not selected"}
          <br />
          <strong>Students in Grade:</strong> {gradeStudents.length}
          <br />
          <strong>Attendance Records:</strong> {attendanceRecords.length}
        </div>
      </div>
    </div>
  );
}