// src/pages/Reports/FeeInvoiceReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Printer, Download, Receipt, Calendar, FileText, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function FeeInvoiceReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [students, setStudents] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [filter, setFilter] = useState({
    school_id: '',
    student_id: '',
    from_date: '',
    to_date: ''
  });
  const [schools, setSchools] = useState([]);
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSchools();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const schoolId = user?.school?.id;
      const response = await api.get('/students', { params: { school_id: schoolId } });
      let studentsData = [];
      if (response.data?.data) {
        studentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      }
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const generateReport = async () => {
    if (!filter.school_id || !filter.from_date || !filter.to_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Fetch fee payments for the period
      const params = {
        school_id: filter.school_id,
        from_date: filter.from_date,
        to_date: filter.to_date
      };
      
      if (filter.student_id) {
        params.student_id = filter.student_id;
      }

      const response = await api.get('/fee-payments', { params });
      let data = response.data?.data || response.data;
      
      // Fetch student details if student is selected
      let studentName = 'All Students';
      if (filter.student_id) {
        const student = students.find(s => s.id === parseInt(filter.student_id));
        studentName = student?.name || 'Student';
      }

      // Group payments by reference for invoice display
      const groupedPayments = {};
      const payments = data.data || data;
      
      payments.forEach(payment => {
        const ref = payment.payment_reference || 'N/A';
        if (!groupedPayments[ref]) {
          groupedPayments[ref] = {
            reference: ref,
            student: payment.student,
            payments: [],
            total: 0,
            date: payment.payment_date,
            status: payment.status
          };
        }
        groupedPayments[ref].payments.push(payment);
        groupedPayments[ref].total += parseFloat(payment.amount_paid || 0);
      });

      const school = schools.find(s => s.id === parseInt(filter.school_id));

      setReportData({
        payments: Object.values(groupedPayments),
        total_amount: Object.values(groupedPayments).reduce((sum, item) => sum + item.total, 0),
        student_name: studentName,
        school: school,
        payment_count: payments.length,
        invoice_count: Object.keys(groupedPayments).length
      });
      setShowReport(true);
      toast.success('Invoice generated successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-report-content');
    if (!printContent) return;
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Fee Invoice Report</title>
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
    const element = document.getElementById('invoice-report-content');
    if (!element) return;
    
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`fee-invoice-${new Date().toISOString().split('T')[0]}.pdf`);
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
            <h2 className="text-2xl font-bold text-white">Fee Invoice Report</h2>
            <p className="text-gray-400 mt-1">Generate fee invoices for students</p>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Student</label>
              <select
                value={filter.student_id}
                onChange={(e) => setFilter({ ...filter, student_id: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
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
                <span className="text-sm font-medium text-gray-600">Fee Invoice</span>
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

            <div id="invoice-report-content" ref={reportRef} className="p-6">
              <div className="border-b-2 border-gray-300 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {reportData.school?.name || 'School Name'}
                    </h1>
                    <p className="text-sm text-gray-600">{reportData.school?.address || 'School Address'}</p>
                    <p className="text-sm text-gray-600">Phone: {reportData.school?.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Email: {reportData.school?.email || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-blue-600">INVOICE</h2>
                    <p className="text-sm text-gray-600 mt-2">
                      Period: {formatDate(filter.from_date)} - {formatDate(filter.to_date)}
                    </p>
                    <p className="text-sm text-gray-600">Generated: {new Date().toLocaleString()}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      Student: {reportData.student_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800">{reportData.invoice_count}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-800">{reportData.payment_count}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.total_amount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold text-green-600">Paid</p>
                </div>
              </div>

              {reportData.payments.map((payment, index) => (
                <div key={index} className="mb-6 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-700">Invoice #{payment.reference}</span>
                      <span className="text-sm text-gray-500 ml-3">{formatDate(payment.date)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Total: {formatCurrency(payment.total)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payment.payments.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-3 text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-3 text-sm text-gray-800">
                              {item.fee?.description || 'School Fee'}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700 text-right">
                              {formatCurrency(item.amount_paid)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan="2" className="px-6 py-3 text-sm text-gray-700">Total</td>
                          <td className="px-6 py-3 text-sm text-blue-700 text-right">{formatCurrency(payment.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

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