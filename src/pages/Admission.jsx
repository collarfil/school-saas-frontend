import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios"; // <-- USE THE CONFIGURED API INSTANCE
import DataTable from "../components/DataTable";
import { 
  Search, Plus, Filter, Edit, Trash2, Eye, 
  X, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Admission() {
  const [admissions, setAdmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    grade_id: '',
    prev_grade: '',
    gender: 'male',
    phone: '',
    address: ''
  });

  // Alert State
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  // Fetch Grades for Dropdowns - USING API INSTANCE
  const fetchGrades = useCallback(async () => {
    try {
      const schoolId = getSchoolId();
      if (!schoolId) return;
      
      const res = await api.get("/grades", { params: { school_id: schoolId } });
      console.log('📊 Grades Response:', res.data);
      
      // Handle the response format
      let gradesData = [];
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        gradesData = res.data.data;
      } else if (Array.isArray(res.data)) {
        gradesData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        gradesData = res.data.data;
      }
      
      setGrades(gradesData);
    } catch (err) {
      console.error('Failed to load grades', err);
      toast.error('Failed to load grades');
    }
  }, []);

  // Fetch Admission Records - USING API INSTANCE
  const fetchAdmissions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error("No school ID found");
        setLoading(false);
        return;
      }

      const params = {
        school_id: schoolId,
        page,
        ...(search && { search }),
        ...(selectedGrade && { grade_id: selectedGrade }),
        ...(selectedGender && { gender: selectedGender })
      };

      const res = await api.get("/admissions", { params });
      console.log('📊 Admissions Response:', res.data);
      
      if (res.data?.status === 'success') {
        // Handle paginated response
        if (res.data.data?.data) {
          setAdmissions(res.data.data.data);
          setPagination({
            current_page: res.data.data.current_page || 1,
            last_page: res.data.data.last_page || 1,
            total: res.data.data.total || 0
          });
        } else if (Array.isArray(res.data.data)) {
          setAdmissions(res.data.data);
        } else {
          setAdmissions([]);
        }
      } else {
        setAdmissions([]);
      }
    } catch (err) {
      console.error('❌ Fetch admissions error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to fetch admissions');
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedGender]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  useEffect(() => {
    fetchAdmissions(1);
  }, [fetchAdmissions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (record = null) => {
    if (record) {
      setFormData({
        id: record.id,
        name: record.name,
        grade_id: record.grade_id,
        prev_grade: record.prev_grade,
        gender: record.gender,
        phone: record.phone,
        address: record.address
      });
    } else {
      setFormData({
        id: null,
        name: '',
        grade_id: grades[0]?.id || '',
        prev_grade: '',
        gender: 'male',
        phone: '',
        address: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found");
      return;
    }

    const payload = { ...formData, school_id: schoolId };

    try {
      if (formData.id) {
        await api.put(`/admissions/${formData.id}`, payload);
        showAlert('success', 'Admission updated successfully');
      } else {
        await api.post("/admissions", payload);
        showAlert('success', 'Admission created successfully');
      }
      setIsFormOpen(false);
      fetchAdmissions(pagination.current_page);
    } catch (err) {
      console.error('❌ Save error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admission record?')) return;

    try {
      const schoolId = getSchoolId();
      await api.delete(`/admissions/${id}`, {
        data: { school_id: schoolId }
      });
      showAlert('success', 'Record deleted successfully');
      fetchAdmissions(pagination.current_page);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="text-white p-6">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between text-sm ${
          alert.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert({ show: false })}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Admission Applications</h2>
          <p className="text-gray-400 text-sm">Manage new student registrations and prospective applications</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search applicant name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Applied Grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={() => fetchAdmissions(1)}
            className="p-2 border border-slate-600 rounded-lg hover:bg-slate-700 text-gray-400 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Target Grade</th>
                <th className="py-3 px-4">Previous Grade</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Loading admissions data...
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No admission records found.
                  </td>
                </tr>
              ) : (
                admissions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{row.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-900/30 text-blue-300 font-medium px-2.5 py-1 rounded-md text-xs border border-blue-700/30">
                        {row.grade?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">{row.prev_grade}</td>
                    <td className="py-3.5 px-4 text-gray-300 capitalize">{row.gender}</td>
                    <td className="py-3.5 px-4 text-gray-300">{row.phone}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedRecord(row); setIsViewOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenForm(row)}
                        className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-lg hover:bg-slate-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between text-xs text-gray-400">
          <span>Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} records)</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => fetchAdmissions(pagination.current_page - 1)}
              className="p-1.5 rounded border border-slate-600 bg-slate-700 disabled:opacity-50 hover:bg-slate-600 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => fetchAdmissions(pagination.current_page + 1)}
              className="p-1.5 rounded border border-slate-600 bg-slate-700 disabled:opacity-50 hover:bg-slate-600 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {formData.id ? 'Edit Admission Application' : 'New Admission Application'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Target Grade</label>
                  <select
                    name="grade_id"
                    required
                    value={formData.grade_id}
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Previous Grade</label>
                  <input
                    type="text"
                    name="prev_grade"
                    required
                    value={formData.prev_grade}
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Residential Address</label>
                <textarea
                  name="address"
                  rows="3"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {formData.id ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {isViewOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Application Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-300">
              <div>
                <span className="text-xs text-gray-400 block uppercase font-medium">Applicant Name</span>
                <span className="font-medium text-white text-base">{selectedRecord.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Target Grade</span>
                  <span>{selectedRecord.grade?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Previous Grade</span>
                  <span>{selectedRecord.prev_grade}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Gender</span>
                  <span className="capitalize">{selectedRecord.gender}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Phone</span>
                  <span>{selectedRecord.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 block uppercase font-medium">Address</span>
                <span>{selectedRecord.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}