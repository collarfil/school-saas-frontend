// src/pages/Reports/PTA.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';  // Fixed: changed from '../api/axios' to '../../api/axios'
import toast from 'react-hot-toast';
import {
  Users, Calendar, MessageSquare, Phone, Mail, 
  Users2, UserPlus, UserCheck, UserX, 
  Printer, Download, Search, Eye, 
  FileText, Clock, MapPin, Award,
  Plus, Edit, Trash2, X, Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PTA() {
  const [loading, setLoading] = useState(false);
  const [ptaMembers, setPtaMembers] = useState([]);
  const [ptaMeetings, setPtaMeetings] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    role: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    occupation: '',
    address: '',
    child_name: '',
    child_class: ''
  });
  const [meetingData, setMeetingData] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    agenda: '',
    status: 'scheduled'
  });
  const reportRef = useRef();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Hardcoded roles and statuses
  const roles = [
    { id: 'chairperson', name: 'Chairperson' },
    { id: 'vice_chairperson', name: 'Vice Chairperson' },
    { id: 'secretary', name: 'Secretary' },
    { id: 'treasurer', name: 'Treasurer' },
    { id: 'member', name: 'Member' },
    { id: 'observer', name: 'Observer' }
  ];

  const statuses = [
    { id: 'active', name: 'Active', color: 'green' },
    { id: 'inactive', name: 'Inactive', color: 'red' },
    { id: 'pending', name: 'Pending', color: 'yellow' }
  ];

  const meetingStatuses = [
    { id: 'scheduled', name: 'Scheduled', color: 'blue' },
    { id: 'ongoing', name: 'Ongoing', color: 'yellow' },
    { id: 'completed', name: 'Completed', color: 'green' },
    { id: 'cancelled', name: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    fetchPTAData();
  }, []);

  const fetchPTAData = async () => {
    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      
      // Fetch PTA members
      const membersRes = await api.get('/pta/members', { 
        params: { school_id: schoolId } 
      });
      
      // Fetch PTA meetings
      const meetingsRes = await api.get('/pta/meetings', { 
        params: { school_id: schoolId } 
      });

      let members = membersRes.data?.data || [];
      let meetings = meetingsRes.data?.data || [];

      // Apply filters
      if (filter.search) {
        members = members.filter(m => 
          m.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
          m.email?.toLowerCase().includes(filter.search.toLowerCase())
        );
      }
      if (filter.status) {
        members = members.filter(m => m.status === filter.status);
      }
      if (filter.role) {
        members = members.filter(m => m.role === filter.role);
      }

      // Calculate stats
      const total = members.length;
      const active = members.filter(m => m.status === 'active').length;
      const inactive = members.filter(m => m.status === 'inactive').length;
      const pending = members.filter(m => m.status === 'pending').length;

      setPtaMembers(members);
      setPtaMeetings(meetings);
      setStats({ total, active, inactive, pending });
      setShowReport(true);
    } catch (error) {
      console.error('Error fetching PTA data:', error);
      toast.error('Failed to load PTA data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      const response = await api.post('/pta/members', {
        ...formData,
        school_id: schoolId
      });

      toast.success('PTA member added successfully');
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        occupation: '',
        address: '',
        child_name: '',
        child_class: ''
      });
      fetchPTAData();
    } catch (error) {
      console.error('Error adding PTA member:', error);
      toast.error('Failed to add PTA member');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingData.title || !meetingData.date) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const schoolId = user?.school?.id;
      const response = await api.post('/pta/meetings', {
        ...meetingData,
        school_id: schoolId
      });

      toast.success('PTA meeting scheduled successfully');
      setShowMeetingModal(false);
      setMeetingData({
        title: '',
        date: '',
        time: '',
        venue: '',
        agenda: '',
        status: 'scheduled'
      });
      fetchPTAData();
    } catch (error) {
      console.error('Error scheduling PTA meeting:', error);
      toast.error('Failed to schedule PTA meeting');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('pta-report-content');
    if (!printContent) return;
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>PTA Report</title>
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

  const handleExport = async () => {
    const element = document.getElementById('pta-report-content');
    if (!element) return;
    
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
      pdf.save(`pta-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
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
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'ongoing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleBadge = (role) => {
    const colors = {
      'chairperson': 'bg-purple-100 text-purple-800 border-purple-200',
      'vice_chairperson': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'secretary': 'bg-blue-100 text-blue-800 border-blue-200',
      'treasurer': 'bg-green-100 text-green-800 border-green-200',
      'member': 'bg-gray-100 text-gray-800 border-gray-200',
      'observer': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">PTA Management</h2>
              <p className="text-gray-400 mt-1">Manage Parent-Teacher Association members and meetings</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
            <button 
              onClick={() => setShowMeetingModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </button>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select
                value={filter.role}
                onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchPTAData} 
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
                <p className="text-sm text-blue-300 font-medium">Total Members</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 font-medium">Active Members</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-4 rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 font-medium">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 font-medium">Meetings</p>
                <p className="text-2xl font-bold text-white">{ptaMeetings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* PTA Report Content */}
        {showReport && (
          <div className="bg-white rounded-lg overflow-hidden">
            <div id="pta-report-content" ref={reportRef} className="p-6">
              {/* Report Header */}
              <div className="border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Parent-Teacher Association Report</h1>
                <p className="text-sm text-gray-600">
                  {user?.school?.name || 'School Name'}
                </p>
                <p className="text-sm text-gray-500">
                  Total Members: {stats.total} | Active: {stats.active} | Pending: {stats.pending}
                </p>
              </div>

              {/* Members Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Users2 className="h-5 w-5 mr-2" />
                  PTA Members
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="py-2 px-3 text-left">#</th>
                        <th className="py-2 px-3 text-left">Name</th>
                        <th className="py-2 px-3 text-left">Email</th>
                        <th className="py-2 px-3 text-left">Phone</th>
                        <th className="py-2 px-3 text-left">Role</th>
                        <th className="py-2 px-3 text-left">Status</th>
                        <th className="py-2 px-3 text-left">Child</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          </td>
                        </tr>
                      ) : ptaMembers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">
                            No PTA members found
                          </td>
                        </tr>
                      ) : (
                        ptaMembers.map((member, index) => (
                          <tr key={member.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 border border-gray-200">{index + 1}</td>
                            <td className="py-2 px-3 border border-gray-200 font-medium">{member.name}</td>
                            <td className="py-2 px-3 border border-gray-200">{member.email}</td>
                            <td className="py-2 px-3 border border-gray-200">{member.phone || 'N/A'}</td>
                            <td className="py-2 px-3 border border-gray-200">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(member.role)}`}>
                                {member.role || 'Member'}
                              </span>
                            </td>
                            <td className="py-2 px-3 border border-gray-200">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(member.status)}`}>
                                {member.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-2 px-3 border border-gray-200">
                              {member.child_name || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Meetings Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Meetings
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-purple-600 text-white">
                        <th className="py-2 px-3 text-left">#</th>
                        <th className="py-2 px-3 text-left">Title</th>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Time</th>
                        <th className="py-2 px-3 text-left">Venue</th>
                        <th className="py-2 px-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptaMeetings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            No meetings scheduled
                          </td>
                        </tr>
                      ) : (
                        ptaMeetings.map((meeting, index) => (
                          <tr key={meeting.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-3 border border-gray-200">{index + 1}</td>
                            <td className="py-2 px-3 border border-gray-200 font-medium">{meeting.title}</td>
                            <td className="py-2 px-3 border border-gray-200">
                              {new Date(meeting.date).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 border border-gray-200">{meeting.time || 'N/A'}</td>
                            <td className="py-2 px-3 border border-gray-200">{meeting.venue || 'N/A'}</td>
                            <td className="py-2 px-3 border border-gray-200">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(meeting.status)}`}>
                                {meeting.status || 'Scheduled'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Generated on {new Date().toLocaleString()} | School Management System</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 z-10 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Add PTA Member</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Child's Name</label>
                    <input
                      type="text"
                      value={formData.child_name}
                      onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Child's Class</label>
                    <input
                      type="text"
                      value={formData.child_class}
                      onChange={(e) => setFormData({ ...formData, child_class: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter child's class"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address"
                      rows="2"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMember}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Add Member</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Meeting Modal */}
        {showMeetingModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 z-10 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Schedule PTA Meeting</h3>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meeting Title *</label>
                    <input
                      type="text"
                      value={meetingData.title}
                      onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meeting title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                    <input
                      type="date"
                      value={meetingData.date}
                      onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={meetingData.time}
                      onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Venue</label>
                    <input
                      type="text"
                      value={meetingData.venue}
                      onChange={(e) => setMeetingData({ ...meetingData, venue: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter venue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agenda</label>
                    <textarea
                      value={meetingData.agenda}
                      onChange={(e) => setMeetingData({ ...meetingData, agenda: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meeting agenda"
                      rows="3"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={meetingData.status}
                      onChange={(e) => setMeetingData({ ...meetingData, status: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {meetingStatuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMeetingModal(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleMeeting}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <span>Schedule Meeting</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}