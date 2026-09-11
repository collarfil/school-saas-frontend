// src/pages/Reports/ExpenseReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Printer, Download, TrendingDown, Calendar, FileText, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExpenseReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState({
    school_id: '',
    from_date: '',
    to_date: '',
    search: ''
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
      let expenseData = data.expense || [];
      
      if (filter.search) {
        expenseData = expenseData.filter(item => 
          item.note?.toLowerCase().includes(filter.search.toLowerCase())
        );
      }

      setReportData({
        expense: expenseData,
        total_expense: expenseData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
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
    const printContent = document.getElementById('expense-report-content');
    if (!printContent) return;
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Expense Report</title>
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
    const element = document.getElementById('expense-report-content');
    if (!element) return;
    
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`expense-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
            <h2 className="text-2xl font-bold text-white">Expense Report</h2>
            <p className="text-gray-400 mt-1">View all expense transactions</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by description..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                <span className="text-sm font-medium text-gray-600">Expense Report</span>
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

            <div id="expense-report-content" ref={reportRef} className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Expense Report</h1>
                <p className="text-sm text-gray-600">{formatDate(filter.from_date)} - {formatDate(filter.to_date)}</p>
                <p className="text-sm text-gray-500">School: {schools.find(s => s.id === filter.school_id)?.name || 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-800 mt-1">{formatCurrency(reportData.total_expense)}</p>
                  </div>
                  <div className="p-4 bg-red-200 rounded-full">
                    <TrendingDown className="h-8 w-8 text-red-700" />
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-2">{reportData.expense.length} expense transactions</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.expense.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.date)}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{item.note || 'Expense'}</td>
                          <td className="px-6 py-4 text-sm text-red-600 font-medium text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      {reportData.expense.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No expense records found</td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.expense.length > 0 && (
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan="3" className="px-6 py-3 text-sm text-gray-700">Total</td>
                          <td className="px-6 py-3 text-sm text-red-700 text-right">{formatCurrency(reportData.total_expense)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
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