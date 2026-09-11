// src/pages/reports/EmployeesReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, Printer, Download, Search, UserPlus, UserCheck, UserX, Mail, Phone, Calendar, Award, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function EmployeesReport() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    teaching: 0,
    non_teaching: 0,
    active: 0
  });
  const [filter, setFilter] = useState({
    search: '',
    employee_type: '',
    status: ''
  });
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      const params = { school_id: schoolId };
      
      if (filter.search) params.search = filter.search;
      if (filter.employee_type) params.employee_type = filter.employee_type;
      if (filter.status) params.status = filter.status;
      
      const res = await api.get('/employees', { params });
      let employeesData = res.data?.data || [];
      
      // Calculate stats
      const total = employeesData.length;
      const teaching = employeesData.filter(e => e.employee_type === 'teaching').length;
      const non_teaching = employeesData.filter(e => e.employee_type === 'non_teaching').length;
      const active = employeesData.filter(e => e.status === 'active').length;
      
      setEmployees(employeesData);
      setStats({ total, teaching, non_teaching, active });
      setShowReport(true);
      toast.success('Employees report loaded successfully');
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    const element = document.getElementById('employees-report-content');
    if (!element) {
      toast.error('No content to export');
      return;
    }

    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`employees-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'inactive': 'bg-red-100 text-red-800 border-red-200',
      'suspended': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'on_leave': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleBadge = (role) => {
    const colors = {
      'teaching': 'bg-blue-100 text-blue-800 border-blue-200',
      'non_teaching': 'bg-purple-100 text-purple-800 border-purple-200',
      'admin': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Employees Report</h2>
              <p className="text-gray-400 mt-1">Manage and track employee records</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handlePrint} 
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button 
              onClick={handleExport} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Employee Type</label>
              <select
                value={filter.employee_type}
                onChange={(e) => setFilter({ ...filter, employee_type: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="teaching">Teaching</option>
                <option value="non_teaching">Non-Teaching</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchEmployees} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors w-full"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-lg border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 font-medium">Teaching Staff</p>
                <p className="text-2xl font-bold text-white">{stats.teaching}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 font-medium">Non-Teaching</p>
                <p className="text-2xl font-bold text-white">{stats.non_teaching}</p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 font-medium">Active Staff</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <Award className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <span className="text-gray-300 font-medium">
              {employees.length} employee(s) found
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-700">
                <tr>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">#</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Name</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Email</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Phone</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Type</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Status</th>
                  <th className="py-3 px-4 text-gray-300 text-sm font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr key={employee.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 text-white">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-white">{employee.name}</td>
                      <td className="py-3 px-4 text-gray-300">{employee.email}</td>
                      <td className="py-3 px-4 text-gray-300">{employee.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(employee.employee_type)}`}>
                          {employee.employee_type || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(employee.status)}`}>
                          {employee.status || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}