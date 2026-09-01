import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import { Search, User, DollarSign, Calendar, ChevronDown, X, FileText, CreditCard, Hash, Loader, ExternalLink } from "lucide-react";

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
  const [feeSearch, setFeeSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const [form, setForm] = useState({
    student_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    status: "paid",
    payment_method: "cash",
    payment_reference: ""
  });

  const studentRef = useRef(null);
  const feeRef = useRef(null);

  const statusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" }
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash (Offline)", icon: DollarSign },
    { value: "bank_transfer", label: "Bank Transfer (Offline)", icon: FileText },
    { value: "paystack", label: "Paystack (Online Gateway)", icon: CreditCard },
    { value: "stripe", label: "Stripe (Online Gateway)", icon: CreditCard },
    { value: "flutterwave", label: "Flutterwave (Online Gateway)", icon: CreditCard },
    { value: "manual", label: "Manual Entry", icon: User }
  ];

  const getSchoolId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.school?.id || user?.school_id || null;
    } catch {
      return null;
    }
  };

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

      const response = await api.get("/fee-payments", { params });

      let paymentsData = [];
      if (response.data?.status === 'success') {
        if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          paymentsData = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          paymentsData = response.data.data;
        } else {
          paymentsData = response.data.data || [];
        }
      } else {
        paymentsData = response.data || [];
      }

      setPayments(paymentsData || []);

    } catch (err) {
      console.error("❌ Load payments error:", err);
      toast.error(err.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndFees = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    setLoadingStudents(true);
    setLoadingFees(true);

    try {
      const [studentsRes, feesRes] = await Promise.all([
        api.get("/students", { params: { school_id: schoolId } }),
        api.get("/fees", { params: { school_id: schoolId } })
      ]);

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
    } finally {
      setLoadingStudents(false);
      setLoadingFees(false);
    }
  };

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

  const filteredStudents = students.filter((s) => {
    const name = s.name || s.full_name || "";
    const admissionNo = s.admission_no || s.admission_number || "";
    const searchLower = studentSearch.toLowerCase();
    return name.toLowerCase().includes(searchLower) || admissionNo.toLowerCase().includes(searchLower);
  }).slice(0, 10);

  const filteredFees = availableFees.filter((fee) => {
    const description = fee.description || "";
    const term = fee.term || "";
    const searchLower = feeSearch.toLowerCase();
    return description.toLowerCase().includes(searchLower) || term.toLowerCase().includes(searchLower);
  });

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

  const toggleFee = (feeId) => {
    setSelectedFees(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const toggleAllFees = () => {
    if (selectedFees.length === filteredFees.length && filteredFees.length > 0) {
      setSelectedFees([]);
    } else {
      setSelectedFees(filteredFees.map(fee => fee.id));
    }
  };

  const calculateTotalAmount = () => {
    return selectedFees.reduce((sum, feeId) => {
      const fee = availableFees.find(f => f.id === feeId);
      return sum + (parseFloat(fee?.amount) || 0);
    }, 0);
  };

  const isOnlineMethod = (method) => ['paystack', 'stripe', 'flutterwave'].includes(method);

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

    try {
      // ONLINE GATEWAY PATH
      if (isOnlineMethod(form.payment_method)) {
        toast.loading("Initializing online checkout...", { id: "online-pay" });
        const response = await api.post("/transactions/online-initialize", {
          school_id: schoolId,
          student_id: form.student_id,
          fee_ids: selectedFees,
          payment_method: form.payment_method,
          currency: "NGN"
        });

        if (response.data.status === 'success' && response.data.data?.checkout_url) {
          toast.success("Redirecting to payment gateway...", { id: "online-pay" });
          window.location.href = response.data.data.checkout_url;
          return;
        } else {
          throw new Error("Checkout URL was not returned by gateway.");
        }
      }

      // OFFLINE / MANUAL PATH
      const paymentReference = form.payment_reference || generatePaymentReference();
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

      if (response.data.status === 'success') {
        const { payment_reference, total_amount, payment_count } = response.data.data;
        toast.success(`Payment recorded successfully! Ref: ${payment_reference}. Total: ₦${total_amount.toLocaleString()} (${payment_count} fees)`);
        closeModal();
        loadPayments();
      } else {
        throw new Error(response.data.message || "Failed to save payment");
      }
      
    } catch (err) {
      console.error("❌ Save payment error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to process payment", { id: "online-pay" });
    } finally {
      setSaveLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFees([]);
    setSelectedStudent(null);
    setStudentSearch("");
    setFeeSearch("");
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

  const formatCurrency = (amount) => `₦${parseFloat(amount || 0).toLocaleString()}`;

  const tableColumns = groupByReference ? [
    { header: "Reference", accessor: "payment_reference", width: "200px" },
    { header: "Student", accessor: "student_name", width: "250px" },
    { header: "Amount", accessor: "total_amount", width: "150px" },
    { header: "Date", accessor: "payment_date", width: "120px" },
    { header: "Status", accessor: "status", width: "100px" },
    { header: "Method", accessor: "payment_method", width: "120px" },
  ] : [
    { header: "Reference", accessor: "payment_reference", width: "200px" },
    { header: "Student", accessor: "student_name", width: "200px" },
    { header: "Fee", accessor: "fee_description", width: "250px" },
    { header: "Amount", accessor: "amount_paid", width: "120px" },
    { header: "Date", accessor: "payment_date", width: "100px" },
    { header: "Status", accessor: "status", width: "100px" },
  ];

  const getTableData = () => {
    if (groupByReference) {
      return payments.map(payment => ({
        id: payment.payment_reference,
        payment_reference: payment.payment_reference || 'N/A',
        student_name: getStudentDisplay(payment.student),
        total_amount: formatCurrency(payment.total_amount || payment.amount_paid),
        payment_date: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A',
        status: payment.status,
        payment_method: payment.payment_method?.toUpperCase() || 'N/A'
      }));
    } else {
      return payments.map(payment => ({
        id: payment.id,
        payment_reference: payment.payment_reference || 'N/A',
        student_name: getStudentDisplay(payment.student),
        fee_description: getFeeDisplay(payment.fee),
        amount_paid: formatCurrency(payment.amount_paid),
        payment_date: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A',
        status: payment.status
      }));
    }
  };

  return (
    <div className="p-6">
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
          >
            <DollarSign className="h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Payment Records"
        searchPlaceholder="Search by student name or reference..."
        onSearch={(data, term) => {
          const lowerTerm = term.toLowerCase();
          return data.filter(item => 
            item.student_name?.toLowerCase().includes(lowerTerm) ||
            item.payment_reference?.toLowerCase().includes(lowerTerm)
          );
        }}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-700 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">Record Fee Payment</h2>
                  <p className="text-gray-400 text-sm mt-1">Create lump sum payment or initialize online gateway checkout</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Reference
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      disabled={isOnlineMethod(form.payment_method)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

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
                          className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                        className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600"
                      >
                        <ChevronDown className="h-5 w-5 text-gray-300" />
                      </button>
                    </div>

                    {showStudentDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingStudents ? (
                          <div className="p-4 text-center"><Loader className="h-5 w-5 animate-spin mx-auto" /></div>
                        ) : filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => selectStudent(student)}
                              className="p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                            >
                              <div className="font-medium text-white">{getStudentDisplay(student)}</div>
                              <div className="text-sm text-gray-400">
                                {student.grade?.name && `Class: ${student.grade.name}`}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-400">No students found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedStudent && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex justify-between items-center">
                      <span className="text-white">{getStudentDisplay(selectedStudent)}</span>
                      <button type="button" onClick={clearStudent} className="text-gray-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div ref={feeRef}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Fees <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600"
                    >
                      <span className="text-gray-300">
                        {selectedFees.length > 0 ? `${selectedFees.length} fee(s) selected` : "Select fees from dropdown"}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-300" />
                    </button>

                    {showFeeDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-slate-600">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={feeSearch}
                              onChange={(e) => setFeeSearch(e.target.value)}
                              placeholder="Search fees..."
                              className="w-full pl-9 pr-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="p-3 border-b border-slate-600">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedFees.length === filteredFees.length && filteredFees.length > 0}
                              onChange={toggleAllFees}
                              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                            />
                            <span className="font-medium text-white">Select All Fees</span>
                            <span className="ml-auto text-gray-400">
                              {filteredFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0).toLocaleString()} ₦
                            </span>
                          </label>
                        </div>
                        
                        {loadingFees ? (
                          <div className="p-4 text-center"><Loader className="h-5 w-5 animate-spin mx-auto" /></div>
                        ) : filteredFees.map((fee) => (
                          <label key={fee.id} className="flex items-center gap-3 p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={selectedFees.includes(fee.id)}
                              onChange={() => toggleFee(fee.id)}
                              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-white">{getFeeDisplay(fee)}</div>
                              <div className="text-sm text-gray-400">{fee.grade?.name && `Class: ${fee.grade.name}`}</div>
                            </div>
                            <div className="font-mono text-white">{formatCurrency(fee.amount)}</div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedFees.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-700/50 rounded-lg flex justify-between items-center font-semibold">
                      <span className="text-white">Total:</span>
                      <span className="text-lg text-white">{formatCurrency(calculateTotalAmount())}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Payment Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={form.payment_date}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                        disabled={isOnlineMethod(form.payment_method)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none"
                    >
                      {paymentMethodOptions.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      disabled={isOnlineMethod(form.payment_method)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 outline-none disabled:opacity-50"
                    >
                      {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading || !selectedStudent || selectedFees.length === 0}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saveLoading ? (
                      <><Loader className="h-5 w-5 animate-spin" /> Processing...</>
                    ) : isOnlineMethod(form.payment_method) ? (
                      <><ExternalLink className="h-5 w-5" /> Pay Online via Gateway</>
                    ) : (
                      <><DollarSign className="h-5 w-5" /> Record Payment</>
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