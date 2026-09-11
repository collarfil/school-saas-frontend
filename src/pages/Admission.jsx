import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { 
  Search, Plus, Edit, Trash2, Eye, 
  X, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
  User, BookOpen, Shield, Phone, Mail, MapPin, Calendar, GraduationCap
} from 'lucide-react';

export default function Admission() {
  const [admissions, setAdmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Multi-Step State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user
  const [currentUser, setCurrentUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
    grade_id: '',
    school_session_id: '',
    term: '',
    prev_grade: '',
    prev_school: '',
    guardian_name: '',
    guardian_relationship: 'Father',
    guardian_phone: '',
    guardian_email: '',
    status: 'pending'
  });

  // Alert State
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.school?.id || user?.school_id;
    } catch {
      return null;
    }
  };

  // Load current user
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  // Check if user is admin
  const isAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  };

  // Fetch Academic Grades
  const fetchGrades = useCallback(async () => {
    try {
      const schoolId = getSchoolId();
      if (!schoolId) return;
      
      const res = await api.get("/grades", { params: { school_id: schoolId } });
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
    }
  }, []);

  // Fetch School Sessions
  const fetchSessions = useCallback(async () => {
    try {
      const schoolId = getSchoolId();
      if (!schoolId) return;
      const res = await api.get("/school-sessions", { params: { school_id: schoolId } });
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setSessions(res.data.data);
      } else if (Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  }, []);

  // Fetch Admission Records
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
        ...(selectedGender && { gender: selectedGender }),
        ...(selectedStatus && { status: selectedStatus })
      };

      const res = await api.get("/admissions", { params });
      
      if (res.data?.status === 'success') {
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
      if (err.response?.status === 401) {
        showAlert('error', 'Session expired. Please re-authenticate.');
      } else {
        showAlert('error', err.response?.data?.message || 'Failed to fetch admissions');
      }
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedGender, selectedStatus]);

  useEffect(() => {
    fetchGrades();
    fetchSessions();
  }, [fetchGrades, fetchSessions]);

  useEffect(() => {
    fetchAdmissions(1);
  }, [fetchAdmissions]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleOpenForm = (record = null) => {
    setCurrentStep(1);
    setIsSubmitting(false);
    if (record) {
      setFormData({
        id: record.id,
        first_name: record.first_name || '',
        middle_name: record.middle_name || '',
        last_name: record.last_name || '',
        gender: record.gender || 'male',
        date_of_birth: record.date_of_birth ? record.date_of_birth.substring(0, 10) : '',
        phone: record.phone || '',
        email: record.email || '',
        address: record.address || '',
        grade_id: record.grade_id || '',
        school_session_id: record.school_session_id || '',
        term: record.term || '',
        prev_grade: record.prev_grade || '',
        prev_school: record.prev_school || '',
        guardian_name: record.guardian_name || '',
        guardian_relationship: record.guardian_relationship || 'Father',
        guardian_phone: record.guardian_phone || '',
        guardian_email: record.guardian_email || '',
        status: record.status || 'pending'
      });
    } else {
      setFormData({
        id: null,
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'male',
        date_of_birth: '',
        phone: '',
        email: '',
        address: '',
        grade_id: grades[0]?.id || '',
        school_session_id: sessions[0]?.id || '',
        term: 'First Term',
        prev_grade: '',
        prev_school: '',
        guardian_name: '',
        guardian_relationship: 'Father',
        guardian_phone: '',
        guardian_email: '',
        status: 'pending'
      });
    }
    setIsFormOpen(true);
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.phone) {
        toast.error("Please fill in First Name, Last Name, and Phone Number.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.grade_id) {
        toast.error("Please select a Target Grade.");
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    console.log('🔄 Attempting to go to next step from:', currentStep);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => {
        const next = Math.min(prev + 1, 3);
        console.log('✅ Moving to step:', next);
        return next;
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📤 Form submitted - Current step:', currentStep);
    
    // CRITICAL: If we're not on step 3, prevent submission
    if (currentStep !== 3) {
      console.warn('⚠️ Attempted to submit from step', currentStep, '- ignoring');
      return;
    }

    // Final validation before submission
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      toast.error("Please fill in all required fields (First Name, Last Name, Phone).");
      return;
    }

    if (!formData.grade_id) {
      toast.error("Please select a Target Grade.");
      return;
    }

    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the complete payload
      const payload = {
        school_id: schoolId,
        // Personal Information - Step 1
        first_name: formData.first_name?.trim() || '',
        middle_name: formData.middle_name?.trim() || '',
        last_name: formData.last_name?.trim() || '',
        gender: formData.gender || 'male',
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        // Academic Information - Step 2
        grade_id: formData.grade_id,
        school_session_id: formData.school_session_id || null,
        term: formData.term || null,
        prev_grade: formData.prev_grade?.trim() || '',
        prev_school: formData.prev_school?.trim() || '',
        // Guardian Information - Step 3
        guardian_name: formData.guardian_name?.trim() || '',
        guardian_relationship: formData.guardian_relationship || 'Father',
        guardian_phone: formData.guardian_phone?.trim() || '',
        guardian_email: formData.guardian_email?.trim() || '',
      };

      console.log('📤 Submitting payload:', payload);

      let response;
      if (formData.id) {
        // For updates, include status if admin, otherwise preserve existing
        const updatePayload = {
          ...payload,
          id: formData.id
        };
        
        // Only include status in update if user is admin
        if (isAdmin()) {
          updatePayload.status = formData.status;
        }
        
        response = await api.put(`/admissions/${formData.id}`, updatePayload);
        showAlert('success', 'Admission updated successfully');
      } else {
        // Create new record - status will use database default
        response = await api.post("/admissions", payload);
        showAlert('success', 'Admission application submitted successfully!');
        
        // Show the application number if returned
        if (response.data?.data?.application_number) {
          toast.success(`Application #: ${response.data.data.application_number}`);
        }
      }
      
      console.log('✅ Response:', response.data);
      
      setIsFormOpen(false);
      setCurrentStep(1);
      fetchAdmissions(pagination.current_page);
      
    } catch (err) {
      console.error('❌ Save error:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 401) {
        showAlert('error', 'Unauthorized. Please login again.');
      } else if (err.response?.status === 422) {
        // Validation errors from backend
        const errors = err.response.data.errors;
        if (errors) {
          Object.keys(errors).forEach(key => {
            toast.error(`${key}: ${errors[key][0]}`);
          });
        } else {
          showAlert('error', err.response?.data?.message || 'Validation failed. Please check your inputs.');
        }
      } else {
        showAlert('error', err.response?.data?.message || 'Failed to save admission record');
      }
    } finally {
      setIsSubmitting(false);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'admitted':
        return <span className="bg-emerald-900/40 text-emerald-300 font-medium px-2.5 py-1 rounded-md text-xs border border-emerald-700/40">Admitted</span>;
      case 'interview_scheduled':
        return <span className="bg-purple-900/40 text-purple-300 font-medium px-2.5 py-1 rounded-md text-xs border border-purple-700/40">Interview Scheduled</span>;
      case 'under_review':
        return <span className="bg-amber-900/40 text-amber-300 font-medium px-2.5 py-1 rounded-md text-xs border border-amber-700/40">Under Review</span>;
      case 'rejected':
        return <span className="bg-rose-900/40 text-rose-300 font-medium px-2.5 py-1 rounded-md text-xs border border-rose-700/40">Rejected</span>;
      case 'enrolled':
        return <span className="bg-blue-900/40 text-blue-300 font-medium px-2.5 py-1 rounded-md text-xs border border-blue-700/40">Enrolled</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 font-medium px-2.5 py-1 rounded-md text-xs border border-slate-600">Pending</span>;
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
          <p className="text-gray-400 text-sm">Manage student registration pipeline and prospective admissions</p>
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
            placeholder="Search name, phone or application code..."
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <th className="py-3 px-4">App Code</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Target Grade</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                    Loading admissions pipeline...
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
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-400">
                      {row.application_number || `ADM-${row.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {row.first_name || row.name ? `${row.first_name || ''} ${row.middle_name || ''} ${row.last_name || row.name || ''}`.trim() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-900/30 text-blue-300 font-medium px-2.5 py-1 rounded-md text-xs border border-blue-700/30">
                        {row.grade?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 text-xs">
                      <div>{row.guardian_name || 'N/A'}</div>
                      <div className="text-gray-400">{row.guardian_phone || row.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedRecord(row); setIsViewOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenForm(row)}
                        className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-lg hover:bg-slate-700"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-slate-700"
                        title="Delete Record"
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

      {/* Multi-Step Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {formData.id ? 'Edit Admission Application' : 'New Admission Application'}
                </h3>
                <p className="text-xs text-gray-400">Step {currentStep} of 3</p>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setCurrentStep(1);
                }} 
                className="text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="bg-slate-900/50 px-6 py-3 border-b border-slate-700/50 grid grid-cols-3 gap-2 text-xs">
              <div 
                className={`flex items-center gap-2 pb-1 border-b-2 cursor-pointer ${currentStep >= 1 ? 'border-blue-500 text-blue-400 font-medium' : 'border-slate-700 text-gray-500'}`}
                onClick={() => currentStep > 1 && setCurrentStep(1)}
              >
                <User className="w-4 h-4" />
                <span>1. Personal Details</span>
              </div>
              <div 
                className={`flex items-center gap-2 pb-1 border-b-2 cursor-pointer ${currentStep >= 2 ? 'border-blue-500 text-blue-400 font-medium' : 'border-slate-700 text-gray-500'}`}
                onClick={() => currentStep > 2 && setCurrentStep(2)}
              >
                <BookOpen className="w-4 h-4" />
                <span>2. Academic Placement</span>
              </div>
              <div className={`flex items-center gap-2 pb-1 border-b-2 ${currentStep >= 3 ? 'border-blue-500 text-blue-400 font-medium' : 'border-slate-700 text-gray-500'}`}>
                <Shield className="w-4 h-4" />
                <span>3. Guardian & Review</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* STEP 1: PERSONAL DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Middle Name</label>
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
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
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Applicant Phone *</label>
                      <input
                        type="text"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Applicant Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Residential Address</label>
                    <textarea
                      name="address"
                      rows="2"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                </div>
              )}

              {/* STEP 2: ACADEMIC PLACEMENT */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Target Grade / Class *</label>
                      <select
                        name="grade_id"
                        required
                        value={formData.grade_id}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Grade</option>
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Academic Session</label>
                      <select
                        name="school_session_id"
                        value={formData.school_session_id}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">Select Academic Session</option>
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.session_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Term</label>
                      <select
                        name="term"
                        value={formData.term}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Previous Grade</label>
                      <input
                        type="text"
                        name="prev_grade"
                        value={formData.prev_grade}
                        onChange={handleInputChange}
                        placeholder="e.g. Primary 5"
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Previous School</label>
                    <input
                      type="text"
                      name="prev_school"
                      value={formData.prev_school}
                      onChange={handleInputChange}
                      placeholder="Former school name"
                      className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: GUARDIAN & STATUS */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Guardian Name
                        <span className="text-gray-500 ml-1">(Recommended)</span>
                      </label>
                      <input
                        type="text"
                        name="guardian_name"
                        value={formData.guardian_name}
                        onChange={handleInputChange}
                        placeholder="Full name of guardian"
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Relationship</label>
                      <select
                        name="guardian_relationship"
                        value={formData.guardian_relationship}
                        onChange={handleInputChange}
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Guardian Phone
                        <span className="text-gray-500 ml-1">(Recommended)</span>
                      </label>
                      <input
                        type="text"
                        name="guardian_phone"
                        value={formData.guardian_phone}
                        onChange={handleInputChange}
                        placeholder="Guardian phone number"
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Guardian Email</label>
                      <input
                        type="email"
                        name="guardian_email"
                        value={formData.guardian_email}
                        onChange={handleInputChange}
                        placeholder="Guardian email address"
                        className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* STATUS SECTION - ONLY VISIBLE TO ADMIN */}
                  {isAdmin() && formData.id && (
                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Admission Status <span className="text-yellow-400">(Admin Only)</span>
                          </label>
                          <p className="text-xs text-gray-400">Update the status of this application</p>
                        </div>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-48 text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="interview_scheduled">Interview Scheduled</option>
                          <option value="admitted">Admitted</option>
                          <option value="rejected">Rejected</option>
                          <option value="enrolled">Enrolled</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Show status badge for non-admin users */}
                  {!isAdmin() && formData.id && (
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Application Status
                          </label>
                          <div className="mt-1">
                            {getStatusBadge(formData.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* For new applications - show pending status */}
                  {!formData.id && (
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Application Status
                          </label>
                          <p className="text-sm text-gray-400">
                            Your application will be submitted as <span className="text-yellow-400 font-medium">Pending</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            The school admin will review your application and update the status
                          </p>
                        </div>
                        <div className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-xs border border-yellow-700/30">
                          Pending
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-700">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                ) : <div />}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>{formData.id ? 'Update Admission' : 'Submit Application'}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">Application Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-300">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-gray-400">Application Number:</span>
                <span className="font-mono text-blue-400">{selectedRecord.application_number || `ADM-${selectedRecord.id}`}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-gray-400">Full Name:</span>
                <span className="font-medium text-white">{`${selectedRecord.first_name || ''} ${selectedRecord.middle_name || ''} ${selectedRecord.last_name || ''}`.trim()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-gray-400">Target Grade:</span>
                <span>{selectedRecord.grade?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-gray-400">Applicant Contact:</span>
                <span>{selectedRecord.phone} {selectedRecord.email ? `(${selectedRecord.email})` : ''}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-gray-400">Guardian Info:</span>
                <span>{selectedRecord.guardian_name || 'N/A'} - {selectedRecord.guardian_phone} ({selectedRecord.guardian_relationship})</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-400">Status:</span>
                <div>{getStatusBadge(selectedRecord.status)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}