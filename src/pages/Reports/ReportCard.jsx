// src/pages/Reports/ReportCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Printer, Download, Search, Eye, X, FileText, ChevronDown, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReportCardTemplate from './ReportCardTemplate';
import { useLocation } from 'react-router-dom';

export default function ReportCard() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filter, setFilter] = useState({ 
    grade_id: '', 
    term_id: '', 
    session_id: '',
    search: '' 
  });
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Dropdown states
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [gradeSearch, setGradeSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');

  // Hardcoded terms
 // src/pages/Reports/ReportCard.jsx
const terms = [
  { id: '1', name: '1st Term' },
  { id: '2', name: '2nd Term' },
  { id: '3', name: '3rd Term' }
];

  // Get studentId from location state if coming from StudentReport
  const studentIdFromState = location.state?.studentId;

  useEffect(() => {
    loadInitialData();
  }, []);

  // If studentId is passed from StudentReport, auto-select and preview
  useEffect(() => {
    if (studentIdFromState && students.length > 0) {
      const student = students.find(s => s.id === studentIdFromState);
      if (student) {
        // Wait for sessions to load if needed
        if (sessions.length === 0) {
          fetchSessions();
        }
        handlePreview(student);
      }
    }
  }, [studentIdFromState, students]);

  const loadInitialData = async () => {
    await Promise.all([
      fetchSessions(),
      fetchGrades(),
      fetchStudents()
    ]);
  };

  const fetchSessions = async () => {
  setLoadingSessions(true);
  try {
    const schoolId = user?.school?.id;
    // Updated route path to match backend: /school-sessions
    const response = await api.get('/school-sessions', { 
      params: { school_id: schoolId } 
    });
    
    console.log('Sessions API Response:', response.data);
    
    let sessionsData = [];
    if (response.data?.data) {
      sessionsData = response.data.data;
    } else if (Array.isArray(response.data)) {
      sessionsData = response.data;
    }
    
    setSessions(sessionsData);
    
    // Auto-select first session to enable the preview feature
    if (sessionsData.length > 0 && !filter.session_id) {
      setFilter(prev => ({ ...prev, session_id: String(sessionsData[0].id) }));
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
    toast.error('Failed to load sessions');
  } finally {
    setLoadingSessions(false);
  }
};

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const schoolId = user?.school?.id;
      const response = await api.get('/grades', { params: { school_id: schoolId } });
      console.log('Grades API Response:', response.data);
      
      let gradesData = [];
      if (response.data?.data) {
        gradesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        gradesData = response.data;
      }
      
      setGrades(gradesData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      const params = { school_id: schoolId };
      
      if (filter.grade_id) params.grade_id = filter.grade_id;
      if (filter.search) params.search = filter.search;
      
      const response = await api.get('/students', { params });
      console.log('Students API Response:', response.data);
      
      let studentsData = [];
      if (response.data?.data) {
        studentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

const fetchReportData = async (studentId) => {
  if (!filter.term_id || !filter.session_id) {
    toast.error('Please select both Term and Session');
    return;
  }
  
  setIsGenerating(true);
  try {
    const schoolId = user?.school?.id;

    const params = {
      student_id: studentId,
      school_id: schoolId,
      term: filter.term_id,                  // Changed from term_id to term
      school_session_id: filter.session_id
    };
    
    const response = await api.get('/results/reports/student', { params });
    const reportData = response.data?.data || null;
    
    setReportData(reportData);
    setSelectedStudent(students.find(s => s.id === studentId));
    setShowPreview(true);
  } catch (error) {
    console.error('Error fetching report data:', error);
    if (error.response?.status === 422 && error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      const firstKey = Object.keys(validationErrors)[0];
      toast.error(validationErrors[firstKey][0]);
    } else {
      toast.error(error.response?.data?.message || 'Failed to load report data');
    }
  } finally {
    setIsGenerating(false);
  }
};

  const handlePreview = (student) => {
    if (!filter.term_id || !filter.session_id) {
      toast.error('Please select both Term and Session');
      return;
    }
    fetchReportData(student.id);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-card-content');
    if (!printContent) {
      toast.error('No content to print');
      return;
    }
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Report Card - ${selectedStudent?.name}</title>
          <style>
            body { margin: 0; padding: 20px; background: white; font-family: Arial, sans-serif; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-card-content');
    if (!element) {
      toast.error('No content to download');
      return;
    }
    
    toast.loading('Generating PDF...');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`report-card-${selectedStudent?.admission_number || 'student'}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedStudent(null);
    setReportData(null);
  };

  const handleApplyFilters = () => {
    fetchStudents();
  };

  const handleResetFilters = () => {
    setFilter({ grade_id: '', term_id: '', session_id: '', search: '' });
    setGradeSearch('');
    setSessionSearch('');
    setIsGradeDropdownOpen(false);
    setIsSessionDropdownOpen(false);
    // Auto-select first session if available
    if (sessions.length > 0) {
      setFilter(prev => ({ ...prev, session_id: sessions[0].id }));
    }
    setTimeout(fetchStudents, 100);
  };

  const handleRefreshSessions = () => {
    fetchSessions();
    toast.success('Refreshed sessions');
  };

  const getGradeFromScore = (score) => {
    if (score === null || score === undefined || isNaN(score)) {
      return { grade: '-', color: 'text-gray-500' };
    }
    if (score >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'E', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getPosition = (index) => {
    const positions = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return positions[index] || `${index + 1}th`;
  };

  // Custom Dropdown component
  const SearchableDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    searchValue, 
    setSearchValue,
    isOpen,
    setIsOpen,
    label,
    displayKey = 'name',
    loading = false,
    onRefresh
  }) => {
    const selectedOption = options.find(opt => opt.id === value);
    const dropdownRef = useRef();

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsOpen]);

    const filteredOptions = options.filter(opt => 
      opt[displayKey]?.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-2 inline-flex items-center text-blue-400 hover:text-blue-300"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </label>
        <div
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white cursor-pointer flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
            {selectedOption ? selectedOption[displayKey] : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-gray-400 text-sm">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-400 text-sm">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`px-3 py-2 cursor-pointer hover:bg-slate-600 transition-colors ${
                      option.id === value ? 'bg-slate-600' : ''
                    }`}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      setSearchValue('');
                    }}
                  >
                    {option[displayKey]}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Report Card Generator</h2>
            <p className="text-gray-400 mt-1">Generate and manage student report cards</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleResetFilters}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Grade Dropdown - Searchable from database */}
            <SearchableDropdown
              options={grades}
              value={filter.grade_id}
              onChange={(value) => setFilter({ ...filter, grade_id: value })}
              placeholder="All Classes"
              searchValue={gradeSearch}
              setSearchValue={setGradeSearch}
              isOpen={isGradeDropdownOpen}
              setIsOpen={setIsGradeDropdownOpen}
              label="Class/Grade"
              loading={loadingGrades}
            />

            {/* Term Dropdown - Hardcoded */}
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

            {/* Session Dropdown - Searchable from database */}
            <SearchableDropdown
              options={sessions}
              value={filter.session_id}
              onChange={(value) => setFilter({ ...filter, session_id: value })}
              placeholder={loadingSessions ? "Loading sessions..." : "Select Session"}
              searchValue={sessionSearch}
              setSearchValue={setSessionSearch}
              isOpen={isSessionDropdownOpen}
              setIsOpen={setIsSessionDropdownOpen}
              label="Session"
              loading={loadingSessions}
              onRefresh={handleRefreshSessions}
            />

            {/* Search */}
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
          <div className="mt-4 flex gap-3 items-center">
            <button 
              onClick={handleApplyFilters} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
            {filter.term_id && filter.session_id ? (
              <span className="text-sm text-green-400 flex items-center">
                ✓ Term & Session selected
              </span>
            ) : (
              <span className="text-sm text-yellow-400 flex items-center">
                ⚠ Please select both Term and Session
              </span>
            )}
            {sessions.length > 0 && (
              <span className="text-sm text-gray-400">
                {sessions.length} session(s) loaded
              </span>
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">#</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Admission No</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Student Name</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Class</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={student.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 text-white">{index + 1}</td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-300">{student.admission_number}</td>
                      <td className="py-3 px-4 font-medium text-white">{student.name}</td>
                      <td className="py-3 px-4 text-gray-300">{student.grade?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handlePreview(student)}
                          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm transition-colors ${
                            !filter.term_id || !filter.session_id
                              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          disabled={!filter.term_id || !filter.session_id}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Card Preview Modal */}
        {showPreview && reportData && selectedStudent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Report Card Preview</h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrint}
                    className="no-print bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="no-print bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleClosePreview}
                    className="no-print bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isGenerating && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating report card...</p>
                  </div>
                </div>
              )}

              {/* Report Card Content */}
              {!isGenerating && (
                <div id="report-card-content" ref={reportRef} className="p-8">
                  <ReportCardTemplate 
                    student={selectedStudent} 
                    reportData={reportData}
                    school={user?.school}
                    getGradeFromScore={getGradeFromScore}
                    getPosition={getPosition}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}