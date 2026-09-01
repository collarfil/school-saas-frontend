// pages/OnlineFeePayment.jsx
import React, { useState, useEffect, useRef } from 'react';
import PaystackPop from '@paystack/inline-js';
import { 
  CreditCard, 
  Loader2,
  XCircle,
  Wallet,
  GraduationCap,
  Calendar,
  BookOpen,
  DollarSign,
  User,
  Send,
  Search,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OnlineFeePayment() {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [currentPaymentRef, setCurrentPaymentRef] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    grade_id: '',
    session_id: '',
    term: '',
    fee_id: '',
    amount: '',
    student_id: '',
    student_name: '',
    email: '',
    phone: '',
    parent_id: ''
  });

  // Dropdown data
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [terms, setTerms] = useState(['First Term', 'Second Term', 'Third Term']);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  
  const studentDropdownRef = useRef(null);
  const sessionDropdownRef = useRef(null);

  // Selected student for display
  const selectedStudent = students.find(s => s.id === formData.student_id);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    
    const schoolId = storedUser?.school?.id || storedUser?.school_id || localStorage.getItem('school_id') || 1;
    
    setFormData(prev => ({
      ...prev,
      parent_id: storedUser.id,
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      student_name: storedUser.name || ''
    }));
    
    loadDropdowns(storedUser, schoolId);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(event.target)) {
        setShowSessionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDropdowns = async (userData, schoolId) => {
    setLoading(true);
    try {
      // Load ALL students for the school (like Student.jsx)
      const studentsRes = await api.get('/students', { 
        params: { school_id: schoolId } 
      });
      const studentsData = studentsRes.data?.data || studentsRes.data || [];
      setStudents(studentsData);

      // Load grades and sessions
      const [gradesRes, sessionsRes] = await Promise.all([
        api.get('/grades', { params: { school_id: schoolId } }),
        api.get('/school-sessions', { params: { school_id: schoolId } })
      ]);

      setGrades(gradesRes.data?.data || gradesRes.data || []);
      setSessions(sessionsRes.data?.data || sessionsRes.data || []);
      
      // Auto-select the current session
      if (sessionsRes.data?.data?.length > 0 || sessionsRes.data?.length > 0) {
        const sessionsList = sessionsRes.data?.data || sessionsRes.data || [];
        // Find active session or use the first one
        const activeSession = sessionsList.find(s => s.is_active === 1 || s.is_active === true);
        const defaultSession = activeSession || sessionsList[0];
        if (defaultSession) {
          setCurrentSessionId(defaultSession.id);
          setFormData(prev => ({ ...prev, session_id: defaultSession.id }));
          setSessionSearch(defaultSession.name);
        }
      }
      
    } catch (error) {
      console.error('Error loading dropdowns:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = async (gradeId) => {
    setFormData(prev => ({ ...prev, grade_id: gradeId, fee_id: '', amount: '' }));
    setFees([]);
    
    if (gradeId) {
      try {
        const schoolId = user?.school?.id || user?.school_id || localStorage.getItem('school_id') || 1;
        
        // Use the session_id from formData or the current session
        let sessionId = formData.session_id || currentSessionId;
        
        console.log('🔍 Fetching fees for grade:', gradeId, 'session:', sessionId);
        
        const response = await api.get('/parent/fees-by-grade', {
          params: { 
            school_id: schoolId, 
            grade_id: gradeId,
            session_id: sessionId
          }
        });
        
        const feesData = response.data?.data || response.data || [];
        setFees(feesData);
        
        if (feesData.length === 0) {
          toast.info('No fees set for this grade');
        }
      } catch (error) {
        console.error('Error loading fees:', error);
        if (error.response?.status === 500) {
          toast.error('Server error: Please check if fees are set for this grade');
        } else {
          toast.error('Failed to load fees for this grade');
        }
      }
    }
  };

  const handleFeeSelect = (feeId) => {
    const selectedFee = fees.find(f => f.id === parseInt(feeId));
    if (selectedFee) {
      setFormData(prev => ({
        ...prev,
        fee_id: feeId,
        amount: selectedFee.amount,
        term: selectedFee.term || prev.term
      }));
    }
  };

  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      student_id: student.id,
      student_name: student.name,
      grade_id: student.grade_id
    }));
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
    // Load fees for this student's grade
    if (student.grade_id) {
      handleGradeChange(student.grade_id);
    }
  };

  const handleSessionSelect = (session) => {
    setFormData(prev => ({ ...prev, session_id: session.id }));
    setSessionSearch(session.name);
    setShowSessionDropdown(false);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    if (!paymentInProgress) {
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      grade_id: '',
      session_id: currentSessionId || '',
      term: '',
      fee_id: '',
      amount: '',
      student_id: '',
      student_name: '',
      email: user?.email || '',
      phone: user?.phone || '',
      parent_id: user?.id || ''
    });
    setFees([]);
    setStudentSearch('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.grade_id) {
      toast.error('Please select a grade');
      return;
    }
    if (!formData.fee_id) {
      toast.error('Please select a fee');
      return;
    }
    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }

    setProcessing(true);
    setPaymentInProgress(true);

    try {
      const schoolId = user?.school?.id || user?.school_id || localStorage.getItem('school_id') || 1;

      const payload = {
        school_id: Number(schoolId),
        parent_id: Number(formData.parent_id),
        student_id: Number(formData.student_id),
        fee_id: Number(formData.fee_id),
        payment_method: 'paystack',
        email: formData.email,
        name: formData.student_name || user?.name,
        phone: formData.phone
      };

      const response = await api.post('/parent/initialize-payment', payload);

      if (response.data.status === 'success') {
        const { reference, amount, public_key } = response.data.data;

        setCurrentPaymentRef(reference);
        setShowModal(false);

        // Initialize Paystack
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: public_key,
          email: formData.email,
          amount: Math.round(amount * 100),
          currency: 'NGN',
          ref: reference,
          metadata: {
            custom_fields: [
              {
                display_name: "Student Name",
                variable_name: "student_name",
                value: formData.student_name
              },
              {
                display_name: "Phone",
                variable_name: "phone",
                value: formData.phone
              }
            ]
          },
          onSuccess: (transaction) => {
            toast.success(`✅ Payment successful! Reference: ${transaction.reference}`);
            setPaymentInProgress(false);
            setProcessing(false);
            resetForm();
            setCurrentPaymentRef(null);
            window.location.reload();
          },
          onCancel: () => {
            toast.error('Payment was cancelled');
            setPaymentInProgress(false);
            setProcessing(false);
            setCurrentPaymentRef(null);
          },
          onError: (error) => {
            toast.error('Payment failed: ' + error.message);
            setPaymentInProgress(false);
            setProcessing(false);
            setCurrentPaymentRef(null);
          }
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment initialization failed');
      setPaymentInProgress(false);
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.admission_number?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Filter sessions based on search
  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Online Fee Payment</h1>
            <p className="text-gray-400 mt-1">Pay your school fees securely online</p>
          </div>
          <button
            onClick={openModal}
            disabled={paymentInProgress}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
          >
            {paymentInProgress ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Make Payment
              </>
            )}
          </button>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <GraduationCap className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Grades</p>
                <p className="text-xl font-bold text-white">{grades.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Sessions</p>
                <p className="text-xl font-bold text-white">{sessions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <User className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Students</p>
                <p className="text-xl font-bold text-white">{students.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">How to Pay</h3>
          <div className="space-y-2 text-gray-400">
            <p>1. Click the <span className="text-blue-400 font-medium">"Make Payment"</span> button above</p>
            <p>2. Search and select your child's name</p>
            <p>3. Select the fee you want to pay</p>
            <p>4. Click <span className="text-blue-400 font-medium">"Pay Now"</span> to proceed to the payment gateway</p>
            <p>5. Complete payment using your card, bank transfer, or USSD</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Make Payment</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-300"
                disabled={paymentInProgress}
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Student Searchable Dropdown */}
              <div ref={studentDropdownRef}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Search Student <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setShowStudentDropdown(true);
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      placeholder="Type student name to search..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || paymentInProgress}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredStudents.map(student => (
                        <div
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="p-2.5 hover:bg-slate-600 cursor-pointer text-sm border-b border-slate-600/50 last:border-none flex items-center justify-between"
                        >
                          <span className="text-white">{student.name}</span>
                          <span className="text-xs text-gray-400">{student.admission_number || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showStudentDropdown && filteredStudents.length === 0 && studentSearch && (
                    <div className="absolute z-20 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl p-3 text-center">
                      <p className="text-gray-400 text-sm">No students found</p>
                    </div>
                  )}
                </div>
                {students.length === 0 && !loading && (
                  <p className="text-yellow-400 text-sm mt-1">No students found. Please add students first.</p>
                )}
              </div>

              {/* Grade Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Grade <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.grade_id}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || paymentInProgress}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Dropdown - Searchable */}
              <div ref={sessionDropdownRef}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Session <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => {
                        setSessionSearch(e.target.value);
                        setShowSessionDropdown(true);
                      }}
                      onFocus={() => setShowSessionDropdown(true)}
                      placeholder="Search for a session..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || paymentInProgress}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {showSessionDropdown && filteredSessions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredSessions.map(session => (
                        <div
                          key={session.id}
                          onClick={() => handleSessionSelect(session)}
                          className="p-2.5 hover:bg-slate-600 cursor-pointer text-sm border-b border-slate-600/50 last:border-none"
                        >
                          <span className="text-white">{session.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fee Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.fee_id}
                  onChange={(e) => handleFeeSelect(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || paymentInProgress || !formData.grade_id}
                >
                  <option value="">Select Fee</option>
                  {fees.map(fee => (
                    <option key={fee.id} value={fee.id}>
                      {fee.description || 'Fee'} - {fee.term || 'N/A'} - {formatCurrency(fee.amount)}
                    </option>
                  ))}
                </select>
                {formData.grade_id && fees.length === 0 && !loading && (
                  <p className="text-yellow-400 text-sm mt-1">No fees set for this grade</p>
                )}
              </div>

              {/* Amount - Auto Populated */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                  <input
                    type="text"
                    value={formData.amount ? formatCurrency(formData.amount) : ''}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-4 py-2.5 text-white font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount will auto-populate"
                  />
                </div>
                {formData.amount && (
                  <p className="text-xs text-gray-400 mt-1">Amount is automatically populated based on selected fee</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={paymentInProgress}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={paymentInProgress}
                />
              </div>

              {/* Summary Box */}
              {formData.amount && formData.fee_id && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Payable:</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {formatCurrency(formData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-400">Payment Gateway:</span>
                    <span className="text-sm text-gray-300">Paystack</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-400">Student:</span>
                    <span className="text-sm text-gray-300">{formData.student_name || 'Not selected'}</span>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handleSubmit}
                disabled={
                  processing || 
                  paymentInProgress || 
                  !formData.fee_id || 
                  !formData.student_id || 
                  !formData.email ||
                  !formData.grade_id
                }
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Pay {formData.amount ? formatCurrency(formData.amount) : 'Now'}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Secured by Paystack. Your payment information is encrypted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}