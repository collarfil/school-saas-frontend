// src/pages/Reports/SummaryReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Printer, Download, TrendingUp, TrendingDown, Wallet, Calendar, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function SummaryReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState({
    school_id: '',
    from_date: '',
    to_date: ''
  });
  const [schools, setSchools] = useState([]);
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSchools();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFilter(prev => ({
      ...prev,
      school_id: user?.school?.id || '',
      from_date: firstDay.toISOString().split('T')[0],
      to_date: lastDay.toISOString().split('T')[0]
    }));
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/schools');
      let schoolsData = [];
      if (response.data?.data) {
        schoolsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        schoolsData = response.data;
      }
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const generateReport = async () => {
    if (!filter.school_id || !filter.from_date || !filter.to_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/finance/report', {
        params: {
          school_id: filter.school_id,
          from: filter.from_date,
          to: filter.to_date
        }
      });

      let data = response.data?.data || response.data;
      setReportData({
        ...data,
        income: data.income || [],
        expense: data.expense || [],
        total_income: data.total_income || 0,
        total_expense: data.total_expense || 0,
        balance: data.balance || 0
      });
      setShowReport(true);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('summary-report-content');
    if (!printContent) return;
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Summary Report</title>
          <style>
            body { margin: 0; padding: 20px; background: white; font-family: Arial, sans-serif; }
            @media print { .no-print { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>${printContent.innerHTML}<script>window.onload = function() { window.print(); window.close(); }<\/script></body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('summary-report-content');
    if (!element) return;
    
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`summary-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Summary Report</h2>
            <p className="text-gray-400 mt-1">View overall financial summary</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">School</label>
              <select
                value={filter.school_id}
                onChange={(e) => setFilter({ ...filter, school_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
              <input
                type="date"
                value={filter.from_date}
                onChange={(e) => setFilter({ ...filter, from_date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
              <input
                type="date"
                value={filter.to_date}
                onChange={(e) => setFilter({ ...filter, to_date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {showReport && reportData && (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2 no-print">
              <div>
                <span className="text-sm font-medium text-gray-600">Summary Report</span>
                <span className="text-sm text-gray-500 ml-3">
                  {formatDate(filter.from_date)} - {formatDate(filter.to_date)}
                </span>
              </div>
              <div className="flex space-x-2">
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
                  <Printer className="h-4 w-4" /><span>Print</span>
                </button>
                <button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
                  <Download className="h-4 w-4" /><span>PDF</span>
                </button>
              </div>
            </div>

            <div id="summary-report-content" ref={reportRef} className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Financial Summary Report</h1>
                <p className="text-sm text-gray-600">{formatDate(filter.from_date)} - {formatDate(filter.to_date)}</p>
                <p className="text-sm text-gray-500">School: {schools.find(s => s.id === filter.school_id)?.name || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Total Income</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(reportData.total_income)}</p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">{reportData.income.length} transactions</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-800 mt-1">{formatCurrency(reportData.total_expense)}</p>
                    </div>
                    <div className="p-3 bg-red-200 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                  <p className="text-xs text-red-600 mt-2">{reportData.expense.length} transactions</p>
                </div>

                <div className={`bg-gradient-to-br p-6 rounded-xl border ${reportData.balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${reportData.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Balance</p>
                      <p className={`text-2xl font-bold mt-1 ${reportData.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                        {formatCurrency(reportData.balance)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${reportData.balance >= 0 ? 'bg-blue-200' : 'bg-orange-200'}`}>
                      <Wallet className={`h-6 w-6 ${reportData.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`} />
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${reportData.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {reportData.balance >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[...reportData.income, ...reportData.expense].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map((item, index) => (
                    <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${item.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          {item.amount > 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.note || 'Transaction'}</p>
                          <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${item.amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.amount > 0 ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Generated on {new Date().toLocaleString()} | School Management System</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}