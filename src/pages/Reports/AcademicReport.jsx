// src/pages/reports/AcademicReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { GraduationCap, Printer, Download, Search, Eye, FileText, Calendar, Award, Users, BookOpen, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AcademicReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState({
    grade_id: '',
    term_id: '',
    session_id: '',
    search: ''
  });
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Hardcoded terms
  const terms = [
    { id: '1st', name: '1st Term' },
    { id: '2nd', name: '2nd Term' },
    { id: '3rd', name: '3rd Term' }
  ];

  useEffect(() => {
    fetchGrades();
    fetchSessions();
    fetchStudents();
  }, []);

  const fetchGrades = async () => {
    try {
      const schoolId = user?.school?.id;
      const res = await api.get('/grades', { params: { school_id: schoolId } });
      setGrades(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      const params = { school_id: schoolId };
      
      if (filter.grade_id) params.grade_id = filter.grade_id;
      if (filter.search) params.search = filter.search;
      
      const res = await api.get('/students', { params });
      setStudents(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!filter.term_id || !filter.session_id) {
      toast.error('Please select both Term and Session');
      return;
    }

    setLoading(true);
    try {
      // Fetch academic data for students
      const promises = students.map(async (student) => {
        const res = await api.get(`/reports/student/${student.id}`, {
          params: {
            term_id: filter.term_id,
            session_id: filter.session_id
          }
        });
        return {
          student,
          report: res.data?.data || null
        };
      });

      const results = await Promise.all(promises);
      
      // Filter out students with no report
      const dataWithReports = results.filter(r => r.report !== null);
      
      setReportData({
        students: dataWithReports,
        total_students: dataWithReports.length,
        term_name: terms.find(t => t.id === filter.term_id)?.name,
        session_name: sessions.find(s => s.id === parseInt(filter.session_id))?.name
      });
      
      setShowReport(true);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentReport = (studentData) => {
    setSelectedStudent(studentData);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    const element = document.getElementById('academic-report-content');
    if (!element) {
      toast.error('No content to export');
      return;
    }

    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`academic-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'text-green-600',
      'B': 'text-blue-600',
      'C': 'text-yellow-600',
      'D': 'text-orange-600',
      'E': 'text-red-600'
    };
    return colors[grade] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Academic Performance Report</h2>
              <p className="text-gray-400 mt-1">Track and analyze student academic progress</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handlePrint} 
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button 
              onClick={handleExport} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Class/Grade</label>
              <select
                value={filter.grade_id}
                onChange={(e) => setFilter({ ...filter, grade_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Term</label>
              <select
                value={filter.term_id}
                onChange={(e) => setFilter({ ...filter, term_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session</label>
              <select
                value={filter.session_id}
                onChange={(e) => setFilter({ ...filter, session_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button 
              onClick={generateReport} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Generate Report
            </button>
            <button 
              onClick={fetchStudents} 
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Report Content */}
        {showReport && reportData && (
          <div className="bg-white rounded-lg overflow-hidden">
            <div id="academic-report-content" ref={reportRef} className="p-6">
              {/* Report Header */}
              <div className="border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Academic Performance Report</h1>
                <p className="text-sm text-gray-600">
                  {reportData.term_name} | {reportData.session_name}
                </p>
                <p className="text-sm text-gray-500">
                  Total Students: {reportData.total_students}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Total Students</p>
                      <p className="text-2xl font-bold text-blue-800">{reportData.total_students}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Pass Rate</p>
                      <p className="text-2xl font-bold text-green-800">
                        {reportData.total_students > 0 ? 
                          `${Math.round((reportData.students.filter(s => s.report?.overall?.average >= 60).length / reportData.total_students) * 100)}%` : 
                          '0%'
                        }
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 font-medium">Average Score</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {reportData.students.length > 0 ? 
                          Math.round(reportData.students.reduce((sum, s) => sum + (s.report?.overall?.average || 0), 0) / reportData.students.length) : 
                          0
                        }%
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700 font-medium">Subjects</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {reportData.students[0]?.report?.subjects?.length || 0}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="py-2 px-3 text-left">#</th>
                      <th className="py-2 px-3 text-left">Admission No</th>
                      <th className="py-2 px-3 text-left">Student Name</th>
                      <th className="py-2 px-3 text-center">Average</th>
                      <th className="py-2 px-3 text-center">Grade</th>
                      <th className="py-2 px-3 text-center">Subjects</th>
                      <th className="py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.students.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No academic data found for the selected period
                        </td>
                      </tr>
                    ) : (
                      reportData.students.map((item, index) => {
                        const avg = item.report?.overall?.average || 0;
                        const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'E';
                        const subjectCount = item.report?.subjects?.length || 0;
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 border border-gray-200">{index + 1}</td>
                            <td className="py-2 px-3 border border-gray-200 font-mono text-sm">
                              {item.student.admission_number}
                            </td>
                            <td className="py-2 px-3 border border-gray-200 font-medium">
                              {item.student.name}
                            </td>
                            <td className="py-2 px-3 border border-gray-200 text-center font-medium">
                              {avg.toFixed(1)}%
                            </td>
                            <td className={`py-2 px-3 border border-gray-200 text-center font-bold ${getGradeColor(grade)}`}>
                              {grade}
                            </td>
                            <td className="py-2 px-3 border border-gray-200 text-center">
                              {subjectCount}
                            </td>
                            <td className="py-2 px-3 border border-gray-200 text-center">
                              <button
                                onClick={() => handleViewStudentReport(item)}
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Generated on {new Date().toLocaleString()} | School Management System</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedStudent.student.name} - Academic Details
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Admission No</p>
                    <p className="font-medium">{selectedStudent.student.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">{selectedStudent.student.grade?.name || 'N/A'}</p>
                  </div>
                </div>

                {selectedStudent.report?.subjects && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="py-2 px-3 text-left">Subject</th>
                          <th className="py-2 px-3 text-center">CA</th>
                          <th className="py-2 px-3 text-center">Exam</th>
                          <th className="py-2 px-3 text-center">Average</th>
                          <th className="py-2 px-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.report.subjects.map((subject, idx) => {
                          const grade = subject.average >= 90 ? 'A' : 
                                       subject.average >= 80 ? 'B' : 
                                       subject.average >= 70 ? 'C' : 
                                       subject.average >= 60 ? 'D' : 'E';
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-2 px-3 border border-gray-200">{subject.name}</td>
                              <td className="py-2 px-3 border border-gray-200 text-center">{subject.ca_score || '-'}</td>
                              <td className="py-2 px-3 border border-gray-200 text-center">{subject.exam_score || '-'}</td>
                              <td className="py-2 px-3 border border-gray-200 text-center font-medium">{subject.average}%</td>
                              <td className={`py-2 px-3 border border-gray-200 text-center font-bold ${getGradeColor(grade)}`}>
                                {grade}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50 font-bold">
                          <td className="py-2 px-3 border border-gray-200">Overall</td>
                          <td className="py-2 px-3 border border-gray-200 text-center" colSpan="2">-</td>
                          <td className="py-2 px-3 border border-gray-200 text-center">
                            {selectedStudent.report?.overall?.average || 0}%
                          </td>
                          <td className={`py-2 px-3 border border-gray-200 text-center ${getGradeColor(
                            (selectedStudent.report?.overall?.average || 0) >= 90 ? 'A' :
                            (selectedStudent.report?.overall?.average || 0) >= 80 ? 'B' :
                            (selectedStudent.report?.overall?.average || 0) >= 70 ? 'C' :
                            (selectedStudent.report?.overall?.average || 0) >= 60 ? 'D' : 'E'
                          )}`}>
                            {(selectedStudent.report?.overall?.average || 0) >= 90 ? 'A' :
                             (selectedStudent.report?.overall?.average || 0) >= 80 ? 'B' :
                             (selectedStudent.report?.overall?.average || 0) >= 70 ? 'C' :
                             (selectedStudent.report?.overall?.average || 0) >= 60 ? 'D' : 'E'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {selectedStudent.report?.teacher_comment && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Teacher's Comment</p>
                    <p className="text-sm text-gray-600 italic">"{selectedStudent.report.teacher_comment}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}