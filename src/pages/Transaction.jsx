import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { DollarSign, CreditCard, Wallet, Banknote, RefreshCw, Users, Calendar, ChevronDown, Layers, Filter } from "lucide-react";

export default function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0
  });

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

  const fetchTransactions = async () => {
    setLoading(true);
    
    const schoolId = getSchoolId();
    if (!schoolId) {
      toast.error("No school ID found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      // First try the regular transactions endpoint
      console.log("🔍 Fetching transactions for school:", schoolId);
      const response = await api.get("/transactions", { 
        params: { 
          school_id: schoolId
        } 
      });

      console.log("📊 Full Transactions API Response:", response);
      console.log("📊 Response data:", response.data);

      let transactionsData = [];
      
      // Try multiple ways to extract data
      if (response.data) {
        // Method 1: Check for nested paginated data
        if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          transactionsData = response.data.data.data;
          console.log("✅ Found data in response.data.data.data");
        }
        // Method 2: Check for direct data array
        else if (Array.isArray(response.data.data)) {
          transactionsData = response.data.data;
          console.log("✅ Found data in response.data.data");
        }
        // Method 3: Check if response.data itself is an array
        else if (Array.isArray(response.data)) {
          transactionsData = response.data;
          console.log("✅ Found data in response.data");
        }
        // Method 4: Check for success response format
        else if (response.data.status === 'success' && response.data.data) {
          if (Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
            console.log("✅ Found data in success response");
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            transactionsData = response.data.data.data;
            console.log("✅ Found data in success response (nested)");
          }
        }
      }

      console.log("✅ Extracted transactionsData:", transactionsData);
      console.log("✅ Number of transactions:", transactionsData.length);

      if (transactionsData.length === 0) {
        // Try alternative endpoint
        await tryAlternativeEndpoints(schoolId);
        return;
      }

      // Filter for fee payment transactions
      const feePaymentTransactions = transactionsData.filter(t => {
        // Check various indicators of fee payment transactions
        const isFeePayment = 
          t.fee_payments || 
          t.feePayment || 
          t.type === 'fee_payment' ||
          (t.reference && (t.reference.startsWith('PAY-') || t.reference.startsWith('LEGACY-'))) ||
          (t.description && t.description.toLowerCase().includes('fee')) ||
          (t.fee_payment && typeof t.fee_payment === 'object');
        
        console.log(`Transaction ${t.id || t.reference}:`, {
          has_fee_payments: !!t.fee_payments,
          has_feePayment: !!t.feePayment,
          type: t.type,
          reference: t.reference,
          description: t.description,
          isFeePayment
        });
        
        return isFeePayment;
      });

      console.log("✅ Filtered fee payment transactions:", feePaymentTransactions);
      
      setTransactions(feePaymentTransactions || []);

      // Calculate stats
      const total = feePaymentTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const successful = feePaymentTransactions.filter(t => 
        t.status?.toLowerCase() === 'successful' || 
        t.status?.toLowerCase() === 'success' || 
        t.status === 'paid'
      ).length;
      const pending = feePaymentTransactions.filter(t => 
        t.status?.toLowerCase() === 'pending'
      ).length;
      const failed = feePaymentTransactions.filter(t => 
        t.status?.toLowerCase() === 'failed'
      ).length;

      setStats({ total, successful, pending, failed });

    } catch (err) {
      console.error("❌ Load transactions error:", err);
      console.error("Error details:", err.response?.data);
      
      // Try alternative endpoints
      const schoolId = getSchoolId();
      if (schoolId) {
        await tryAlternativeEndpoints(schoolId);
      } else {
        toast.error("Failed to load transactions");
      }
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeEndpoints = async (schoolId) => {
    console.log("🔄 Trying alternative endpoints...");
    
    // Try fee payments endpoint to get transactions
    try {
      console.log("🔍 Trying /fee-payments endpoint");
      const feePaymentsResponse = await api.get("/fee-payments", {
        params: {
          school_id: schoolId,
          group_by_reference: "1"
        }
      });

      console.log("📊 Fee Payments Response:", feePaymentsResponse.data);

      let feePaymentsData = [];
      if (feePaymentsResponse.data?.status === 'success') {
        if (Array.isArray(feePaymentsResponse.data.data)) {
          feePaymentsData = feePaymentsResponse.data.data;
        } else if (feePaymentsResponse.data.data?.data && Array.isArray(feePaymentsResponse.data.data.data)) {
          feePaymentsData = feePaymentsResponse.data.data.data;
        }
      }

      console.log("✅ Extracted fee payments data:", feePaymentsData);

      // Transform fee payments into transaction format
      const transformedTransactions = feePaymentsData.map(payment => {
        const reference = payment.payment_reference || `FEE-${payment.id}`;
        const amount = payment.total_amount || payment.amount_paid || 0;
        const status = payment.status === 'paid' ? 'successful' : 
                      payment.status === 'pending' ? 'pending' : 'failed';
        
        return {
          id: `fee_${payment.id}`,
          reference: reference,
          amount: amount,
          method: payment.payment_method || 'manual',
          status: status,
          payment_date: payment.payment_date,
          created_at: payment.payment_date || payment.created_at,
          student: payment.student,
          fee_payments: payment.fee_details ? payment.fee_details.map(fee => ({
            fee: fee,
            amount_paid: fee.amount
          })) : [],
          fee_breakdown: payment.fee_details ? payment.fee_details.map(fee => ({
            fee_description: fee.description || 'Fee',
            amount: fee.amount,
            grade: fee.grade?.name
          })) : []
        };
      });

      console.log("✅ Transformed transactions:", transformedTransactions);
      
      setTransactions(transformedTransactions);

      // Calculate stats from transformed transactions
      const total = transformedTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const successful = transformedTransactions.filter(t => 
        t.status === 'successful' || t.status === 'paid'
      ).length;
      const pending = transformedTransactions.filter(t => t.status === 'pending').length;
      const failed = transformedTransactions.filter(t => t.status === 'failed').length;

      setStats({ total, successful, pending, failed });

      if (transformedTransactions.length > 0) {
        toast.success(`Loaded ${transformedTransactions.length} fee payment transactions`);
      }

    } catch (err) {
      console.error("❌ Alternative endpoint error:", err);
      toast.error("No transactions found. Record fee payments first.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const toggleTransactionDetails = (transactionId) => {
    setShowDetails(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'successful':
      case 'success':
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getMethodIcon = (method) => {
    if (!method) return DollarSign;
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('cash')) return Wallet;
    if (methodLower.includes('bank')) return Banknote;
    if (methodLower.includes('paystack') || methodLower.includes('card')) return CreditCard;
    if (methodLower.includes('manual')) return Users;
    return DollarSign;
  };

  const getMethodDisplay = (method) => {
    if (!method) return 'N/A';
    
    const methodLower = method.toLowerCase();
    const methodMap = {
      'paystack': 'Paystack',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'card': 'Card Payment',
      'manual': 'Manual Entry',
      'other': 'Other',
      'legacy': 'Legacy'
    };
    
    return methodMap[methodLower] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '₦0';
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return `₦${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStudentName = (transaction) => {
    // Try different ways to get student name
    if (transaction.fee_payments?.[0]?.student) {
      return transaction.fee_payments[0].student.name || 
             transaction.fee_payments[0].student.full_name;
    }
    if (transaction.feePayment?.student) {
      return transaction.feePayment.student.name || 
             transaction.feePayment.student.full_name;
    }
    if (transaction.student) {
      return transaction.student.name || transaction.student.full_name;
    }
    return 'Student';
  };

  const getFeeBreakdown = (transaction) => {
    // Try different ways to get fee breakdown
    if (transaction.fee_breakdown && transaction.fee_breakdown.length > 0) {
      return transaction.fee_breakdown;
    }
    if (transaction.fee_payments && transaction.fee_payments.length > 0) {
      return transaction.fee_payments.map(fp => ({
        fee_description: fp.fee?.description || fp.fee?.name || 'Fee',
        amount: fp.amount_paid || fp.amount,
        grade: fp.fee?.grade?.name
      }));
    }
    if (transaction.feePayment) {
      return [{
        fee_description: transaction.feePayment.fee?.description || 'Fee',
        amount: transaction.feePayment.amount_paid,
        grade: transaction.feePayment.fee?.grade?.name
      }];
    }
    return [];
  };

  const hasMultipleFees = (transaction) => {
    const breakdown = getFeeBreakdown(transaction);
    return breakdown.length > 1;
  };

  const getTotalFeesCount = (transaction) => {
    const breakdown = getFeeBreakdown(transaction);
    return breakdown.length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400">View and manage all fee payment transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log("Current transactions:", transactions);
              console.log("Current stats:", stats);
              toast.info("Check console for debug info");
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Debug
          </button>
          <button
            onClick={fetchTransactions}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors font-medium flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatAmount(stats.total)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <div className="h-6 w-6 flex items-center justify-center">
                <span className="text-green-400 font-bold">✓</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Successful</p>
              <p className="text-2xl font-bold text-white">{stats.successful}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <div className="h-6 w-6 flex items-center justify-center">
                <span className="text-yellow-400 font-bold">⏱</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <div className="h-6 w-6 flex items-center justify-center">
                <span className="text-red-400 font-bold">✗</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-2xl font-bold text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">
              Showing <span className="font-bold text-white">{transactions.length}</span> transactions
              {transactions.length > 0 && ` • Total: ${formatAmount(stats.total)}`}
            </p>
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Fee Payment Transactions</h2>
              <p className="text-gray-400 text-sm mt-1">
                {transactions.length === 0 ? "No transactions found" : `${transactions.length} transactions found`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-600">
                <DollarSign className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Transactions Found</h3>
              <p className="text-gray-400 mb-4">
                Record fee payments to see transactions here
              </p>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <button
                  onClick={fetchTransactions}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => {
                    console.log("Debug info - Check browser console");
                    console.log("School ID:", getSchoolId());
                    console.log("API Base URL:", api.defaults.baseURL);
                    toast.info("Check browser console for debug info");
                  }}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-md transition-colors"
                >
                  Show Debug Info
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {transactions.map((transaction, index) => {
                const MethodIcon = getMethodIcon(transaction.method);
                const studentName = getStudentName(transaction);
                const feeBreakdown = getFeeBreakdown(transaction);
                const multipleFees = hasMultipleFees(transaction);
                const totalFees = getTotalFeesCount(transaction);
                
                return (
                  <div key={transaction.id || transaction.reference || `txn-${index}`} className="hover:bg-slate-700/30 transition-colors">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded">
                              {transaction.reference || `TXN-${index + 1}`}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
                            </span>
                            {multipleFees && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                <Layers className="h-3 w-3" />
                                {totalFees} fees
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-slate-700 rounded">
                                <MethodIcon className="h-4 w-4 text-gray-300" />
                              </div>
                              <span className="text-gray-300">
                                {getMethodDisplay(transaction.method)}
                              </span>
                            </div>
                            <div className="text-xl font-bold text-white">
                              {formatAmount(transaction.amount)}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(transaction.created_at || transaction.payment_date || transaction.date)}
                              <span className="ml-1">{formatTime(transaction.created_at || transaction.payment_date || transaction.date)}</span>
                            </span>
                            
                            {/* Student Info */}
                            {studentName && studentName !== 'Student' && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {studentName}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {feeBreakdown.length > 0 && (
                          <button
                            onClick={() => toggleTransactionDetails(transaction.id || transaction.reference || `txn-${index}`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <ChevronDown className={`h-5 w-5 transition-transform ${showDetails[transaction.id || transaction.reference || `txn-${index}`] ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Fee Breakdown */}
                      {showDetails[transaction.id || transaction.reference || `txn-${index}`] && feeBreakdown.length > 0 && (
                        <div className="mt-4 pl-6 border-l-2 border-blue-500/30">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Fee Breakdown:</h4>
                          <div className="space-y-2">
                            {feeBreakdown.map((fee, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <div>
                                  <span className="text-gray-300">
                                    {fee.fee_description || `Fee ${idx + 1}`}
                                  </span>
                                  {fee.grade && (
                                    <span className="text-gray-400 ml-2">({fee.grade})</span>
                                  )}
                                </div>
                                <span className="font-mono text-white">
                                  {formatAmount(fee.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-slate-600 flex justify-between items-center font-semibold">
                              <span className="text-white">Total:</span>
                              <span className="text-lg text-white">{formatAmount(transaction.amount)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}