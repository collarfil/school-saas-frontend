import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  FileText,
  Wallet,
  Bell,
  TrendingUp,
  Award,
  Shield,
  Phone,
  LogOut,
  Video
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ⚠️ Temporarily using placeholder modals until these component files
// are actually built in src/components/. Swap these back in once ready:
// import MessagingComponent from '../components/MessagingComponent';
// import WhatsAppMessaging from '../components/WhatsAppMessaging';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    attendanceAverage: 0,
    feeStatus: 'Paid',
    outstandingBalance: 0
  });

  // State for modals and chat
  const [showChat, setShowChat] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get parent-specific dashboard data
      const [childrenRes, attendanceRes, feesRes] = await Promise.all([
        api.get('/students/my-children'),
        api.get('/attendances/children-attendance'),
        api.get('/fee-payments/children-balance')
      ]);

      setChildren(childrenRes.data?.children || []);
      setStats({
        totalChildren: childrenRes.data?.count || 0,
        attendanceAverage: attendanceRes.data?.average || 0,
        feeStatus: feesRes.data?.status || 'Unknown',
        outstandingBalance: feesRes.data?.balance || 0
      });
    } catch (error) {
      console.error('Error loading parent dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => [
    {
      title: 'Children\'s Report',
      description: 'View academic reports',
      icon: <FileText className="h-5 w-5 text-blue-400" />,
      path: '/parent/report-card'
    },
    {
      title: 'Fee Statements',
      description: 'View payment history',
      icon: <Wallet className="h-5 w-5 text-green-400" />,
      path: '/parent/fees'
    },
    {
      title: 'PTA Information',
      description: 'Parent-Teacher Association',
      icon: <Shield className="h-5 w-5 text-yellow-400" />,
      path: '/parent/pta'
    },
    {
      title: 'Notifications',
      description: 'School announcements',
      icon: <Bell className="h-5 w-5 text-purple-400" />,
      // No /parent/notifications route exists yet — surface a
      // friendly heads-up instead of navigating to a 404.
      path: null
    }
  ];

  const handleQuickAction = (action) => {
    if (!action.path) {
      toast('Notifications page is coming soon', { icon: 'ℹ️' });
      return;
    }
    navigate(action.path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user?.name || 'Parent'}!
              </h1>
              <p className="text-gray-300">
                Parent Portal - Monitor your children's academic progress and fee information
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChat(true)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                  title="Chat"
                >
                  <Users className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowWhatsApp(true)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
                  title="WhatsApp"
                >
                  <Phone className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-lg">
                <p className="text-purple-300 font-medium">Parent</p>
              </div>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-300" />
              </button>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalChildren}</h3>
            <p className="text-gray-400">Children</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Award className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Average</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.attendanceAverage}%</h3>
            <p className="text-gray-400">Attendance</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-400">Status</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {stats.feeStatus === 'Paid' ? '✓' : '⚠'}
            </h3>
            <p className="text-gray-400">Fee Status</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Balance</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              ₦{stats.outstandingBalance.toLocaleString()}
            </h3>
            <p className="text-gray-400">Outstanding</p>
          </div>
        </div>

        {/* Children List */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">My Children</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.length > 0 ? (
              children.map((child, index) => (
                <div key={index} className="p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{child.name}</p>
                      <p className="text-sm text-gray-400">{child.grade} - {child.section}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Attendance:</span>
                      <span className="text-white">{child.attendance || 85}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Grade:</span>
                      <span className="text-white">{child.average_grade || 'B+'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fee Status:</span>
                      <span className={`font-medium ${
                        child.fee_status === 'Paid' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {child.fee_status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No children registered yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getQuickActions().map((action, index) => (
            <div key={index} className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                {action.icon}
                <h4 className="font-bold text-white">{action.title}</h4>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                {action.description}
              </p>
              <button
                onClick={() => handleQuickAction(action)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Access →
              </button>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/10 p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Parent Portal</h3>
              <p className="text-gray-300">
                Monitor your children's academic progress, attendance records, fee payments,
                and stay informed about school activities and PTA meetings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Modal Placeholders */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md w-full text-white">
            <h3 className="text-lg font-bold mb-2">Chat Feature</h3>
            <p className="text-gray-300 text-sm mb-4">MessagingComponent is under construction or not found.</p>
            <button
              onClick={() => setShowChat(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showWhatsApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md w-full text-white">
            <h3 className="text-lg font-bold mb-2">WhatsApp Feature</h3>
            <p className="text-gray-300 text-sm mb-4">WhatsAppMessaging component is under construction or not found.</p>
            <button
              onClick={() => setShowWhatsApp(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
