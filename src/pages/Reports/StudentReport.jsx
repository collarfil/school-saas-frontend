// src/pages/Report/StudentReport.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';  // Correct path from pages/Report/
import toast from 'react-hot-toast';
import { Printer, Download, Search, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState({ grade_id: '', search: '' });
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    fetchGrades();
    fetchStudents();
  }, []);

  const fetchGrades = async () => {
    try {
      const schoolId = JSON.parse(localStorage.getItem('user'))?.school?.id;
      const res = await api.get('/grades', { params: { school_id: schoolId } });
      setGrades(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const schoolId = JSON.parse(localStorage.getItem('user'))?.school?.id;
      const res = await api.get('/students', { params: { school_id: schoolId, ...filter } });
      setStudents(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  // In StudentReport.jsx
const handleGenerateReportCard = (student) => {
  navigate('/report/generate', { 
    state: { 
      studentId: student.id,
      gradeId: student.grade_id || filter.grade_id 
    } 
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Student Results Report</h2>
            <p className="text-gray-400 mt-1">View and manage student academic performance</p>
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

        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Grade</label>
              <select
                value={filter.grade_id}
                onChange={(e) => setFilter({ ...filter, grade_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
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
            <div className="flex items-end">
              <button 
                onClick={fetchStudents} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">#</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Admission No</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Student Name</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Grade</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Average Score</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Position</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
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
                      <td className="py-3 px-4 text-gray-300">-</td>
                      <td className="py-3 px-4 text-gray-300">-</td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleGenerateReportCard(student)}
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-2 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Generate Report</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}