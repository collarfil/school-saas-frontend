import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  Calendar, 
  FileText, 
  Users, 
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Bell,
  Clock,
  Shield,
  LogOut
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    // Common stats
    totalCount: 0,
    pendingItems: 0,
    completedToday: 0,
    upcomingTasks: 0
  });

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
      if (isTeachingStaff()) {
        // Teaching staff data
        const [attendanceRes, classesRes, resultsRes] = await Promise.all([
          api.get('/attendances/today'),
          api.get('/employee-grades/my-classes'),
          api.get('/results/pending-grading')
        ]);
        
        setStats({
          totalCount: classesRes.data?.total_students || 0,
          pendingItems: resultsRes.data?.pending_count || 0,
          completedToday: attendanceRes.data?.count || 0,
          upcomingTasks: classesRes.data?.total_classes || 0
        });
      } else if (isAccountStaff()) {
        // Account staff data
        const [feesRes, paymentsRes, transactionsRes] = await Promise.all([
          api.get('/fees/stats'),
          api.get('/fee-payments/today'),
          api.get('/transactions/today')
        ]);
        
        setStats({
          totalCount: feesRes.data?.total_fees || 0,
          pendingItems: feesRes.data?.pending_payments || 0,
          completedToday: paymentsRes.data?.total || 0,
          upcomingTasks: paymentsRes.data?.amount || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const isTeachingStaff = () => {
    return user?.employee_type === 'teaching';
  };

  const isAccountStaff = () => {
    return user?.employee_type === 'non_teaching';
  };

  const getEmployeeType = () => {
    if (isTeachingStaff()) return 'Teaching Staff';
    if (isAccountStaff()) return 'Account Staff';
    return 'Employee';
  };

  const getQuickActions = () => {
    if (isTeachingStaff()) {
      return [
        {
          title: 'Take Attendance',
          description: 'Record today\'s attendance',
          icon: <Calendar className="h-5 w-5 text-blue-400" />,
          path: '/employee/attendances',
          color: 'blue'
        },
        {
          title: 'Enter Results',
          description: 'Update student grades',
          icon: <FileText className="h-5 w-5 text-green-400" />,
          path: '/employee/results',
          color: 'green'
        },
        {
          title: 'View Students',
          description: 'Check student information',
          icon: <Users className="h-5 w-5 text-purple-400" />,
          path: '/employee/students',
          color: 'purple'
        },
        {
          title: 'My Schedule',
          description: 'View class timetable',
          icon: <Clock className="h-5 w-5 text-yellow-400" />,
          path: '/employee/schedule',
          color: 'yellow'
        }
      ];
    } else if (isAccountStaff()) {
      return [
        {
          title: 'Manage Fees',
          description: 'Create and manage school fees',
          icon: <Wallet className="h-5 w-5 text-blue-400" />,
          path: '/account/fees',
          color: 'blue'
        },
        {
          title: 'Fee Payments',
          description: 'Process fee payments',
          icon: <CreditCard className="h-5 w-5 text-green-400" />,
          path: '/account/feepayments',
          color: 'green'
        },
        {
          title: 'Transactions',
          description: 'View all transactions',
          icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
          path: '/account/transactions',
          color: 'purple'
        },
        {
          title: 'Reports',
          description: 'Financial reports',
          icon: <FileText className="h-5 w-5 text-yellow-400" />,
          path: '/account/reports',
          color: 'yellow'
        }
      ];
    }
    return [];
  };

  const getStats = () => {
    if (isTeachingStaff()) {
      return [
        {
          title: 'Total Students',
          value: stats.totalCount,
          icon: <Users className="h-6 w-6 text-blue-400" />,
          color: 'blue',
          description: 'Students in your classes'
        },
        {
          title: 'Classes Today',
          value: stats.upcomingTasks,
          icon: <Calendar className="h-6 w-6 text-green-400" />,
          color: 'green',
          description: 'Classes scheduled'
        },
        {
          title: 'Attendance Taken',
          value: stats.completedToday,
          icon: <Award className="h-6 w-6 text-yellow-400" />,
          color: 'yellow',
          description: 'Today\'s attendance'
        },
        {
          title: 'Pending Grading',
          value: stats.pendingItems,
          icon: <FileText className="h-6 w-6 text-purple-400" />,
          color: 'purple',
          description: 'Assignments to grade'
        }
      ];
    } else if (isAccountStaff()) {
      return [
        {
          title: 'Total Fees',
          value: stats.totalCount,
          icon: <Wallet className="h-6 w-6 text-blue-400" />,
          color: 'blue',
          description: 'Active fee structures'
        },
        {
          title: 'Payments Today',
          value: stats.completedToday,
          icon: <CreditCard className="h-6 w-6 text-green-400" />,
          color: 'green',
          description: 'Successful payments'
        },
        {
          title: 'Pending Payments',
          value: stats.pendingItems,
          icon: <Clock className="h-6 w-6 text-yellow-400" />,
          color: 'yellow',
          description: 'Awaiting payment'
        },
        {
          title: 'Today\'s Revenue',
          value: `₦${(stats.upcomingTasks || 0).toLocaleString()}`,
          icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
          color: 'purple',
          description: 'Total collected today'
        }
      ];
    }
    return [];
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
          // Add to header section of each dashboard
        <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowChat(true)}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          title="Chat"
        >
          <Users className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowWhatsApp(true)}
          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          title="WhatsApp"
        >
          <Phone className="h-5 w-5" />
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/video-classes')}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Video Classes"
          >
            <Video className="h-5 w-5" />
          </button>
        )}
      </div>

      // Add state at top of component
      const [showChat, setShowChat] = useState(false);
      const [showWhatsApp, setShowWhatsApp] = useState(false);
      const [selectedConversation, setSelectedConversation] = useState(null);

      // Add modals at bottom
      {showChat && (
        <MessagingComponent
          conversationId={selectedConversation}
          onClose={() => setShowChat(false)}
        />
      )}
      {showWhatsApp && (
        <WhatsAppMessaging onClose={() => setShowWhatsApp(false)} />
      )}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name || 'Employee'}!
              </h1>
              <p className="text-gray-300">
                {getEmployeeType()} Dashboard - {isTeachingStaff() ? 'Manage academic activities' : 'Handle financial operations'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg border ${
                isTeachingStaff() 
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  : 'bg-green-500/20 border-green-500/30 text-green-300'
              }`}>
                <p className="font-medium">{getEmployeeType()}</p>
              </div>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-300" />
              </button>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStats().map((stat, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500/20 rounded-lg`}>
                  {stat.icon}
                </div>
                <span className="text-sm text-gray-400">{stat.description}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-gray-400">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-left"
                >
                  {action.icon}
                  <p className="font-medium text-white mt-2">{action.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {isTeachingStaff() ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Attendance Marked</p>
                        <p className="text-sm text-gray-400">Grade 5A - 30 students</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded">
                        <FileText className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Results Updated</p>
                        <p className="text-sm text-gray-400">Mathematics Term Test</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Yesterday</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded">
                        <CreditCard className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Payment Received</p>
                        <p className="text-sm text-gray-400">₦25,000 - John Doe</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">1 hour ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Fee Invoice Created</p>
                        <p className="text-sm text-gray-400">Term 2 Fees - Class 4B</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">3 hours ago</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className={`p-6 rounded-2xl border ${
          isTeachingStaff()
            ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-500/30'
            : 'bg-gradient-to-r from-green-900/20 to-emerald-800/10 border-green-500/30'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              isTeachingStaff() ? 'bg-blue-500/20' : 'bg-green-500/20'
            }`}>
              {isTeachingStaff() ? (
                <Briefcase className="h-6 w-6 text-blue-400" />
              ) : (
                <Shield className="h-6 w-6 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isTeachingStaff() ? 'Teaching Staff Portal' : 'Account Staff Portal'}
              </h3>
              <p className="text-gray-300">
                {isTeachingStaff()
                  ? 'Use this dashboard to manage your teaching activities, track attendance, enter results, and monitor student progress.'
                  : 'Manage financial operations, process fee payments, generate invoices, and track school revenue and expenses.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}