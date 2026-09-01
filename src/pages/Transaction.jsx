import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { DollarSign, CreditCard, Wallet, Banknote, RefreshCw, Users, ChevronDown, Filter } from "lucide-react";
import DataTable from "../components/DataTable";

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
      const response = await api.get("/transactions", { 
        params: { school_id: schoolId } 
      });

      let transactionsData = [];
      
      if (response.data) {
        if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          transactionsData = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          transactionsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          transactionsData = response.data;
        }
      }

      if (transactionsData.length === 0) {
        await tryAlternativeEndpoints(schoolId);
        return;
      }

      setTransactions(transactionsData || []);

      const total = transactionsData.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const successful = transactionsData.filter(t => 
        ['successful', 'success', 'paid'].includes(t.status?.toLowerCase())
      ).length;
      const pending = transactionsData.filter(t => 
        t.status?.toLowerCase() === 'pending'
      ).length;
      const failed = transactionsData.filter(t => 
        t.status?.toLowerCase() === 'failed'
      ).length;

      setStats({ total, successful, pending, failed });

    } catch (err) {
      console.error("❌ Load transactions error:", err);
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
    try {
      const feePaymentsResponse = await api.get("/fee-payments", {
        params: { school_id: schoolId, group_by_reference: "1" }
      });

      let feePaymentsData = [];
      if (feePaymentsResponse.data?.status === 'success') {
        if (Array.isArray(feePaymentsResponse.data.data)) {
          feePaymentsData = feePaymentsResponse.data.data;
        } else if (feePaymentsResponse.data.data?.data && Array.isArray(feePaymentsResponse.data.data.data)) {
          feePaymentsData = feePaymentsResponse.data.data.data;
        }
      }

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
          fee_breakdown: payment.fee_details ? payment.fee_details.map(fee => ({
            fee_description: fee.description || 'Fee',
            amount: fee.amount,
            grade: fee.grade?.name
          })) : []
        };
      });

      setTransactions(transformedTransactions);

      const total = transformedTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const successful = transformedTransactions.filter(t => t.status === 'successful').length;
      const pending = transformedTransactions.filter(t => t.status === 'pending').length;
      const failed = transformedTransactions.filter(t => t.status === 'failed').length;

      setStats({ total, successful, pending, failed });

    } catch (err) {
      console.error("❌ Alternative endpoint error:", err);
      toast.error("No transactions found.");
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

  const getMethodDisplay = (method) => {
    if (!method) return 'N/A';
    const methodLower = method.toLowerCase();
    const methodMap = {
      'paystack': 'Paystack',
      'stripe': 'Stripe',
      'flutterwave': 'Flutterwave',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'card': 'Card Payment',
      'manual': 'Manual Entry'
    };
    return methodMap[methodLower] || method.toUpperCase();
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

  const getStudentName = (transaction) => {
    if (transaction.fee_payments?.[0]?.student) {
      return transaction.fee_payments[0].student.name || transaction.fee_payments[0].student.full_name;
    }
    if (transaction.fee_payment?.student) {
      return transaction.fee_payment.student.name || transaction.fee_payment.student.full_name;
    }
    if (transaction.student) {
      return transaction.student.name || transaction.student.full_name;
    }
    return 'Student';
  };

  const tableColumns = [
    { header: "Reference", accessor: "reference", width: "200px" },
    { header: "Student", accessor: "student_name", width: "200px" },
    { header: "Amount", accessor: "amount_formatted", width: "120px" },
    { header: "Method", accessor: "method_display", width: "130px" },
    { header: "Date", accessor: "date_formatted", width: "120px" },
    { header: "Status", accessor: "status_badge", width: "100px" },
  ];

  const getTableData = () => {
    return transactions.map((transaction, index) => ({
      id: transaction.id || transaction.reference || `txn-${index}`,
      reference: transaction.reference || `TXN-${index + 1}`,
      student_name: getStudentName(transaction),
      amount_formatted: formatAmount(transaction.amount),
      method_display: getMethodDisplay(transaction.method),
      date_formatted: formatDate(transaction.created_at || transaction.payment_date),
      status_badge: (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
        </span>
      ),
      original: transaction,
      index: index
    }));
  };

  const renderActions = (row) => {
    const feeBreakdown = row.original.fee_breakdown || [];
    if (feeBreakdown.length === 0) return null;
    
    return (
      <button
        onClick={() => toggleTransactionDetails(row.original.id || row.original.reference || `txn-${row.index}`)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <ChevronDown className={`h-5 w-5 transition-transform ${showDetails[row.original.id || row.original.reference || `txn-${row.index}`] ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  const handleTableSearch = (data, term) => {
    const lowerTerm = term.toLowerCase();
    return data.filter(item => 
      item.reference?.toLowerCase().includes(lowerTerm) ||
      item.student_name?.toLowerCase().includes(lowerTerm)
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400">View and manage all fee payment transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 text-white"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

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
              <span className="text-green-400 font-bold text-xl">✓</span>
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
              <span className="text-yellow-400 font-bold text-xl">⏱</span>
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
              <span className="text-red-400 font-bold text-xl">✗</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-2xl font-bold text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        data={getTableData()}
        loading={loading}
        title="Fee Payment Transactions"
        searchPlaceholder="Search by reference or student name..."
        onSearch={handleTableSearch}
        actions={renderActions}
      />

      {Object.keys(showDetails).some(key => showDetails[key]) && (
        <div className="mt-4 space-y-4">
          {transactions.map((transaction, idx) => {
            const txnId = transaction.id || transaction.reference || `txn-${idx}`;
            if (!showDetails[txnId]) return null;
            
            const feeBreakdown = transaction.fee_breakdown || [];
            if (feeBreakdown.length === 0) return null;
            
            return (
              <div key={txnId} className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/30 ml-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Fee Breakdown:</h4>
                <div className="space-y-2">
                  {feeBreakdown.map((fee, feeIdx) => (
                    <div key={feeIdx} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-gray-300">
                          {fee.fee_description || `Fee ${feeIdx + 1}`}
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
            );
          })}
        </div>
      )}
    </div>
  );
}