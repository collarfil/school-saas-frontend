import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Search, User, DollarSign, Calendar, Check, ChevronDown, X, Layers, FileText, CreditCard, Hash } from "lucide-react";

export default function FeePayment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [groupByReference, setGroupByReference] = useState(true);

  // For creating new payment
  const [selectedFees, setSelectedFees] = useState([]);
  const [availableFees, setAvailableFees] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  const [form, setForm] = useState({
    student_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    status: "paid",
    payment_method: "cash",
    payment_reference: ""
  });

  const studentRef = useRef(null);
  const feeRef = useRef(null);
  const modalFormRef = useRef(null);

  const statusOptions = [
    { value: "paid", label: "Paid", color: "text-green-400 bg-green-500/10" },
    { value: "pending", label: "Pending", color: "text-yellow-400 bg-yellow-500/10" },
    { value: "failed", label: "Failed", color: "text-red-400 bg-red-500/10" }
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash", icon: DollarSign },
    { value: "bank_transfer", label: "Bank Transfer", icon: FileText },
    { value: "card", label: "Card", icon: CreditCard },
    { value: "paystack", label: "Paystack", icon: CreditCard },
    { value: "manual", label: "Manual", icon: User },
    { value: "other", label: "Other", icon: DollarSign }
  ];

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.school?.id || user?.school_id || null;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentRef.current && !studentRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
      if (feeRef.current && !feeRef.current.contains(event.target)) {
        setShowFeeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =======================
     Load payments data
  ======================= */
  const loadPayments = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const params = { 
        school_id: schoolId,
        group_by_reference: groupByReference ? "1" : "0"
      };

      console.log("📤 Loading payments with params:", params);

      const response = await api.get("/fee-payments", { params });

      console.log("📥 Payments API Response:", response.data);

      // Extract data from response
      let paymentsData = [];
      if (response.data?.status === 'success') {
        // Handle paginated response
        if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          paymentsData = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          paymentsData = response.data.data;
        } else {
          paymentsData = response.data.data || [];
        }
      } else {
        console.error("API returned error:", response.data);
        toast.error(response.data?.message || "Failed to load payments");
      }

      console.log("✅ Extracted payments data:", paymentsData);
      setPayments(paymentsData || []);

    } catch (err) {
      console.error("❌ Load payments error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to load payments. Check API routes.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Load students and fees for modal
  ======================= */
  const loadStudentsAndFees = async () => {
    const schoolId = getSchoolId();
    
    if (!schoolId) return;

    try {
      const [studentsRes, feesRes] = await Promise.all([
        api.get("/students", { params: { school_id: schoolId } }),
        api.get("/fees", { params: { school_id: schoolId } })
      ]);

      // Extract arrays
      const extractArray = (responseData) => {
        if (!responseData) return [];
        if (Array.isArray(responseData)) return responseData;
        if (responseData?.status === 'success' && responseData?.data) {
          if (Array.isArray(responseData.data)) return responseData.data;
          if (responseData.data?.data && Array.isArray(responseData.data.data)) return responseData.data.data;
        }
        return [];
      };

      setStudents(extractArray(studentsRes.data));
      setAvailableFees(extractArray(feesRes.data));

    } catch (err) {
      console.error("❌ Load students/fees error:", err);
      toast.error("Failed to load students or fees");
    }
  };

  // Generate payment reference
  const generatePaymentReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `PAY-${year}${month}${day}-${random}`;
  };

  useEffect(() => {
    loadPayments();
  }, [groupByReference]);

  /* =======================
     Student autocomplete
  ======================= */
  useEffect(() => {
    if (!studentSearch) {
      setSuggestions([]);
      return;
    }
    
    const filtered = students
      .filter((s) => {
        const name = s.name || s.full_name || "";
        const admissionNo = s.admission_no || s.admission_number || "";
        return (
          name.toLowerCase().includes(studentSearch.toLowerCase()) ||
          admissionNo.toLowerCase().includes(studentSearch.toLowerCase())
        );
      })
      .slice(0, 5);
    
    setSuggestions(filtered);
  }, [studentSearch, students]);

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch(student.name || student.full_name || "");
    setForm(prev => ({ ...prev, student_id: student.id }));
    setShowStudentDropdown(false);
    setSelectedFees([]);
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setForm(prev => ({ ...prev, student_id: "" }));
    setSelectedFees([]);
  };

  /* =======================
     Fee selection logic
  ======================= */
  const toggleFee = (feeId) => {
    setSelectedFees(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const toggleAllFees = () => {
    if (selectedFees.length === availableFees.length) {
      setSelectedFees([]);
    } else {
      setSelectedFees(availableFees.map(fee => fee.id));
    }
  };

  const calculateTotalAmount = () => {
    return selectedFees.reduce((sum, feeId) => {
      const fee = availableFees.find(f => f.id === feeId);
      return sum + (parseFloat(fee?.amount) || 0);
    }, 0);
  };

  /* =======================
     Submit payment (Lump sum)
  ======================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }
    
    if (selectedFees.length === 0) {
      toast.error("Please select at least one fee");
      return;
    }
    
    setSaveLoading(true);
    const schoolId = getSchoolId();

    // Generate reference if not provided
    const paymentReference = form.payment_reference || generatePaymentReference();

    try {
      const response = await api.post("/fee-payments", {
        student_id: form.student_id,
        fee_ids: selectedFees,
        amount_paid: calculateTotalAmount(),
        payment_date: form.payment_date,
        status: form.status,
        school_id: schoolId,
        payment_method: form.payment_method,
        payment_reference: paymentReference
      });

      console.log("✅ Payment response:", response.data);

      if (response.data.status === 'success') {
        const { payment_reference, total_amount, payment_count } = response.data.data;
        toast.success(`Payment recorded successfully! Reference: ${payment_reference}. Total: ₦${total_amount.toLocaleString()} (${payment_count} fees)`);
        closeModal();
        loadPayments();
      } else {
        throw new Error(response.data.message || "Failed to save payment");
      }
      
    } catch (err) {
      console.error("❌ Save payment error:", err);
      console.error("Error details:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to save payment");
    } finally {
      setSaveLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFees([]);
    setSelectedStudent(null);
    setStudentSearch("");
    setShowStudentDropdown(false);
    setShowFeeDropdown(false);
    setForm({
      student_id: "",
      payment_date: new Date().toISOString().split("T")[0],
      status: "paid",
      payment_method: "cash",
      payment_reference: ""
    });
  };

  const openModal = () => {
    loadStudentsAndFees();
    setForm(prev => ({
      ...prev,
      payment_reference: generatePaymentReference()
    }));
    setShowModal(true);
  };

  /* =======================
     UI Helper Functions
  ======================= */
  const getStudentDisplay = (student) => {
    if (!student) return "";
    const name = student.name || student.full_name || "";
    const admissionNo = student.admission_no || student.admission_number;
    return admissionNo ? `${name} (${admissionNo})` : name;
  };

  const getFeeDisplay = (fee) => {
    if (!fee) return "";
    let display = fee.description || "Fee";
    if (fee.term) display += ` (${fee.term})`;
    if (fee.grade?.name) display += ` - ${fee.grade.name}`;
    return display;
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
  };

  const togglePaymentDetails = (reference) => {
    setShowDetails(prev => ({
      ...prev,
      [reference]: !prev[reference]
    }));
  };

  const getPaymentMethodLabel = (method) => {
    const option = paymentMethodOptions.find(opt => opt.value === method);
    return option ? option.label : method;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fee Payments</h1>
          <p className="text-gray-400">Record and manage student fee payments</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupByReference}
              onChange={(e) => setGroupByReference(e.target.checked)}
              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
            />
            <span className="text-gray-300">Group by Reference</span>
          </label>
          <button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
            disabled={loading}
          >
            <DollarSign className="h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">
                {groupByReference ? "Payment Groups" : "Total Payments"}
              </p>
              <p className="text-2xl font-bold text-white">{payments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <User className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-white">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Layers className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Fee Types</p>
              <p className="text-2xl font-bold text-white">{availableFees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {groupByReference ? "Payment Groups" : "Individual Payments"}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 mb-4">No payments recorded yet</p>
              <button
                onClick={openModal}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                Record Your First Payment
              </button>
            </div>
          ) : groupByReference ? (
            // Grouped Payments View
            <div className="divide-y divide-slate-700">
              {payments.map((payment) => (
                <div key={payment.payment_reference || payment.id} className="hover:bg-slate-700/30 transition-colors">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded">
                            {payment.payment_reference || 'No Reference'}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'paid' 
                              ? 'bg-green-500/20 text-green-400' 
                              : payment.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                          </span>
                          <span className="text-gray-400 text-sm flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            {payment.payment_count || 1} fee(s)
                          </span>
                        </div>
                        <div className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {getStudentDisplay(payment.student)}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(payment.total_amount || payment.amount_paid)}
                            </span>
                            <span className="text-gray-400">
                              Method: {getPaymentMethodLabel(payment.payment_method)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {payment.fee_details && payment.fee_details.length > 0 && (
                        <button
                          onClick={() => togglePaymentDetails(payment.payment_reference)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronDown className={`h-5 w-5 transition-transform ${showDetails[payment.payment_reference] ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Fee Breakdown */}
                    {showDetails[payment.payment_reference] && payment.fee_details && payment.fee_details.length > 0 && (
                      <div className="mt-4 pl-6 border-l-2 border-blue-500/30">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Fee Breakdown:</h4>
                        <div className="space-y-2">
                          {payment.fee_details.map((fee, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">{getFeeDisplay(fee)}</span>
                              <span className="font-mono text-white">{formatCurrency(fee?.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Individual Payments View
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Reference</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Student</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Fee</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Amount</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm text-blue-400">
                        {payment.payment_reference || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">
                        {getStudentDisplay(payment.student)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {getFeeDisplay(payment.fee)}
                    </td>
                    <td className="py-4 px-6 font-mono text-white">
                      {formatCurrency(payment.amount_paid)}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400' 
                          : payment.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-700 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">Record Fee Payment</h2>
                  <p className="text-gray-400 text-sm mt-1">Create lump sum payment for multiple fees</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div 
              ref={modalFormRef}
              className="flex-1 overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 140px)' }}
            >
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Payment Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Reference <span className="text-gray-400">(Auto-generated)</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      placeholder="Payment reference will be auto-generated"
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      disabled={saveLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    You can edit this reference or leave it as-is
                  </p>
                </div>

                {/* Student Selection */}
                <div ref={studentRef}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Student <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => {
                            setStudentSearch(e.target.value);
                            setShowStudentDropdown(true);
                          }}
                          onFocus={() => setShowStudentDropdown(true)}
                          placeholder="Search student by name or admission number..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          disabled={saveLoading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                        className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <ChevronDown className="h-5 w-5 text-gray-300" />
                      </button>
                    </div>

                    {showStudentDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.length > 0 ? (
                          suggestions.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => selectStudent(student)}
                              className="p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                            >
                              <div className="font-medium text-white">{getStudentDisplay(student)}</div>
                              <div className="text-sm text-gray-400 mt-1">
                                {student.grade?.name && `Class: ${student.grade.name}`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-400">
                            {studentSearch ? "No students found" : "Start typing to search students"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedStudent && (
                    <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500/20 p-2 rounded">
                            <User className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{getStudentDisplay(selectedStudent)}</div>
                            <div className="text-sm text-gray-300">
                              {selectedStudent.grade?.name && `Class: ${selectedStudent.grade.name}`}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearStudent}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fee Selection */}
                <div ref={feeRef}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Fees <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                      disabled={saveLoading}
                    >
                      <span className="text-gray-300">
                        {selectedFees.length > 0 
                          ? `${selectedFees.length} fee(s) selected` 
                          : "Select fees from dropdown"}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-300" />
                    </button>

                    {showFeeDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-slate-600">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFees.length === availableFees.length && availableFees.length > 0}
                              onChange={toggleAllFees}
                              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                            />
                            <span className="font-medium text-white">Select All Fees</span>
                            <span className="ml-auto text-gray-400">
                              {availableFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0).toLocaleString()} ₦
                            </span>
                          </label>
                        </div>
                        
                        {availableFees.map((fee) => (
                          <label
                            key={fee.id}
                            className="flex items-center gap-3 p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFees.includes(fee.id)}
                              onChange={() => toggleFee(fee.id)}
                              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-white">{getFeeDisplay(fee)}</div>
                              <div className="text-sm text-gray-400 mt-1">
                                {fee.grade?.name && `Class: ${fee.grade.name}`}
                                {fee.schoolsession?.name && ` • Session: ${fee.schoolsession.name}`}
                              </div>
                            </div>
                            <div className="font-mono text-white">
                              {formatCurrency(fee.amount)}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedFees.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm text-gray-300">
                        Selected {selectedFees.length} fee(s)
                      </div>
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h4 className="font-medium text-white mb-2">Fee Breakdown:</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {availableFees
                            .filter(fee => selectedFees.includes(fee.id))
                            .map(fee => (
                              <div key={fee.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{getFeeDisplay(fee)}</span>
                                <span className="font-mono text-white">{formatCurrency(fee.amount)}</span>
                              </div>
                            ))}
                          <div className="pt-2 border-t border-slate-600 flex justify-between items-center font-semibold">
                            <span className="text-white">Total:</span>
                            <span className="text-lg text-white">{formatCurrency(calculateTotalAmount())}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={form.payment_date}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        disabled={saveLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Status
                    </label>
                    <div className="flex gap-2">
                      {statusOptions.map((status) => (
                        <label
                          key={status.value}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.status === status.value
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="radio"
                            value={status.value}
                            checked={form.status === status.value}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="h-4 w-4 text-blue-500 focus:ring-blue-500/20"
                            disabled={saveLoading}
                          />
                          <span className={`font-medium ${form.status === status.value ? 'text-white' : 'text-gray-300'}`}>
                            {status.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      disabled={saveLoading}
                    >
                      {paymentMethodOptions.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-sm">Total Amount</p>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(calculateTotalAmount())}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Number of Fees</p>
                      <p className="text-2xl font-bold text-white">{selectedFees.length}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    <p>This will create a single transaction with {selectedFees.length} fee payment(s)</p>
                    <p className="mt-1">Payment Reference: <span className="font-mono text-blue-400">{form.payment_reference}</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                    disabled={saveLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading || !selectedStudent || selectedFees.length === 0}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5" />
                        Record Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}