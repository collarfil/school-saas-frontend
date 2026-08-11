import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios'; // <-- USE THE CONFIGURED API INSTANCE
import { 
  Plus, Edit, Trash2, Eye, X, CheckCircle, 
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Calendar, Clock,
  Search, ChevronDown
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- Custom Reusable Searchable Dropdown / Combobox ---
function SearchableSelect({ label, options = [], value, onChange, placeholder = 'Select item...', required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options dynamically
  const filteredOptions = options.filter((item) => {
    const labelText = item.name || item.session_name || item.title || item.subject_name || '';
    return labelText.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedOption = options.find((item) => String(item.id) === String(value));
  const selectedLabel = selectedOption 
    ? (selectedOption.name || selectedOption.session_name || selectedOption.title || selectedOption.subject_name)
    : '';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-xs font-medium text-gray-300 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>}
      
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white flex items-center justify-between cursor-pointer hover:border-slate-500 transition-colors"
      >
        <span className={selectedLabel ? 'text-white' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          {value && (
            <X 
              className="w-4 h-4 hover:text-white" 
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }} 
            />
          )}
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-700 flex items-center gap-2 bg-slate-900/50">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-gray-400 outline-none"
            />
            {searchTerm && (
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-white cursor-pointer" onClick={() => setSearchTerm('')} />
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48 divide-y divide-slate-700/50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">No options found</div>
            ) : (
              filteredOptions.map((item) => {
                const itemLabel = item.name || item.session_name || item.title || item.subject_name;
                const isSelected = String(item.id) === String(value);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-blue-600/30 hover:text-white transition-colors ${
                      isSelected ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{itemLabel}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export default function TimeTable() {
  const [timetables, setTimetables] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    school_session_id: '',
    grade_id: '',
    subject_id: '',
    day: 'Monday',
    period: ''
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

  // Fetch Dropdown Dependencies - USING API INSTANCE
  const fetchDropdownData = useCallback(async () => {
    console.log('🔄 Fetching dropdown data...');
    try {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error("No school ID found");
        return;
      }

      const [gradeRes, subjectRes, sessionRes] = await Promise.all([
        api.get("/grades", { params: { school_id: schoolId } }),
        api.get("/subjects", { params: { school_id: schoolId } }),
        api.get("/school-sessions", { params: { school_id: schoolId } })
      ]);

      console.log('📊 Grade Response:', gradeRes.data);
      console.log('📊 Subject Response:', subjectRes.data);
      console.log('📊 Session Response:', sessionRes.data);

      // Extract data from response
      const extractData = (response) => {
        if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return [];
      };

      const gradesData = extractData(gradeRes);
      const subjectsData = extractData(subjectRes);
      const sessionsData = extractData(sessionRes);

      console.log('✅ Extracted Grades:', gradesData);
      console.log('✅ Extracted Subjects:', subjectsData);
      console.log('✅ Extracted Sessions:', sessionsData);

      setGrades(gradesData);
      setSubjects(subjectsData);
      setSessions(sessionsData);
      
    } catch (err) {
      console.error('❌ Failed to load form dependencies', err);
      toast.error('Failed to load dropdown data');
    }
  }, []);

  // Fetch Timetables - USING API INSTANCE
  const fetchTimetables = useCallback(async (page = 1) => {
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
        ...(selectedGrade && { grade_id: selectedGrade }),
        ...(selectedSession && { school_session_id: selectedSession }),
        ...(selectedDay && { day: selectedDay })
      };

      const res = await api.get("/timetables", { params });
      console.log('📊 Timetable Response:', res.data);
      
      // Extract timetables data
      let records = [];
      if (res.data?.status === 'success') {
        if (res.data.data?.data) {
          records = res.data.data.data;
          setPagination({
            current_page: res.data.data.current_page || 1,
            last_page: res.data.data.last_page || 1,
            total: res.data.data.total || 0
          });
        } else if (Array.isArray(res.data.data)) {
          records = res.data.data;
        }
      }
      
      console.log('✅ Extracted Timetables:', records);
      setTimetables(records);
      
    } catch (err) {
      console.error('❌ Failed to fetch timetable data:', err);
      showAlert('error', err.response?.data?.message || 'Failed to fetch timetable data');
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedSession, selectedDay]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    fetchTimetables(1);
  }, [fetchTimetables]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (record = null) => {
    if (record) {
      setFormData({
        id: record.id,
        school_session_id: record.school_session_id || '',
        grade_id: record.grade_id || '',
        subject_id: record.subject_id || '',
        day: record.day || 'Monday',
        period: record.period || ''
      });
    } else {
      setFormData({
        id: null,
        school_session_id: sessions[0]?.id || '',
        grade_id: grades[0]?.id || '',
        subject_id: subjects[0]?.id || '',
        day: 'Monday',
        period: ''
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
        await api.put(`/timetables/${formData.id}`, payload);
        showAlert('success', 'Timetable slot updated successfully');
      } else {
        await api.post("/timetables", payload);
        showAlert('success', 'Timetable slot created successfully');
      }
      setIsFormOpen(false);
      fetchTimetables(pagination.current_page);
    } catch (err) {
      console.error('❌ Save error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save timetable slot');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable slot?')) return;

    try {
      const schoolId = getSchoolId();
      await api.delete(`/timetables/${id}`, {
        data: { school_id: schoolId }
      });
      showAlert('success', 'Timetable slot deleted successfully');
      fetchTimetables(pagination.current_page);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete slot');
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
          <h2 className="text-2xl font-bold text-white">Class Timetable</h2>
          <p className="text-gray-400 text-sm">Organize and schedule subjects, days, and period slots</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Schedule Slot
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <SearchableSelect
            placeholder="All Academic Sessions"
            options={sessions}
            value={selectedSession}
            onChange={(val) => setSelectedSession(val)}
          />
        </div>

        <div>
          <SearchableSelect
            placeholder="All Grades/Classes"
            options={grades}
            value={selectedGrade}
            onChange={(val) => setSelectedGrade(val)}
          />
        </div>

        <div>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Days</option>
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => fetchTimetables(1)}
            className="p-2 w-full sm:w-auto border border-slate-600 rounded-lg hover:bg-slate-700 text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Period / Time</th>
                <th className="py-3 px-4">Class/Grade</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Loading timetable slots...
                  </td>
                </tr>
              ) : timetables.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No schedule slots found.
                  </td>
                </tr>
              ) : (
                timetables.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {row.day}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      <span className="bg-slate-700 text-gray-300 font-medium px-2.5 py-1 rounded-md text-xs inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {row.period}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-900/30 text-blue-300 font-medium px-2.5 py-1 rounded-md text-xs border border-blue-700/30">
                        {row.grade?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{row.subject?.name || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-gray-400 text-xs">{row.school_session?.name || row.school_session?.session_name || 'N/A'}</td>
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
          <span>Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} slots)</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => fetchTimetables(pagination.current_page - 1)}
              className="p-1.5 rounded border border-slate-600 bg-slate-700 disabled:opacity-50 hover:bg-slate-600 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => fetchTimetables(pagination.current_page + 1)}
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
                {formData.id ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  label="Academic Session"
                  required
                  placeholder="Select Session"
                  options={sessions}
                  value={formData.school_session_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, school_session_id: val }))}
                />

                <SearchableSelect
                  label="Class / Grade"
                  required
                  placeholder="Select Grade"
                  options={grades}
                  value={formData.grade_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, grade_id: val }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SearchableSelect
                  label="Subject"
                  required
                  placeholder="Select Subject"
                  options={subjects}
                  value={formData.subject_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, subject_id: val }))}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Day *</label>
                  <select
                    name="day"
                    required
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Period / Time Slot *</label>
                <input
                  type="text"
                  name="period"
                  placeholder="e.g. 1st Period (08:00 AM - 08:40 AM)"
                  required
                  value={formData.period}
                  onChange={handleInputChange}
                  className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  {formData.id ? 'Update Slot' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Timetable Slot Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Day</span>
                  <span className="font-semibold text-white">{selectedRecord.day}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Period</span>
                  <span>{selectedRecord.period}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Grade</span>
                  <span>{selectedRecord.grade?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-medium">Subject</span>
                  <span className="font-medium text-white">{selectedRecord.subject?.name || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 block uppercase font-medium">Session</span>
                <span>{selectedRecord.school_session?.name || selectedRecord.school_session?.session_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}