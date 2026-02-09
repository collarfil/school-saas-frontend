import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Book, 
  Calendar, 
  Award, 
  Wallet,
  FileText,
  Users,
  Bell,
  TrendingUp,
  Clock
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    attendancePercentage: 0,
    averageGrade: 0,
    feeBalance: 0
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get student-specific dashboard data
      const [attendanceRes, gradesRes, subjectsRes, feesRes] = await Promise.all([
        api.get('/attendances/my-attendance'),
        api.get('/results/my-grades'),
        api.get('/subjects/my-subjects'),
        api.get('/fee-payments/my-balance')
      ]);
      
      setStats({
        totalSubjects: subjectsRes.data?.count || 0,
        attendancePercentage: attendanceRes.data?.percentage || 0,
        averageGrade: gradesRes.data?.average || 0,
        feeBalance: feesRes.data?.balance || 0
      });
    } catch (error) {
      console.error('Error loading student dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => [
    {
      title: 'My Report Card',
      description: 'View academic performance',
      icon: <FileText className="h-5 w-5 text-blue-400" />,
      path: '/student/report-card'
    },
    {
      title: 'Fee Statement',
      description: 'View payment history',
      icon: <Wallet className="h-5 w-5 text-green-400" />,
      path: '/student/fees'
    },
    {
      title: 'Class Schedule',
      description: 'View timetable',
      icon: <Calendar className="h-5 w-5 text-yellow-400" />,
      path: '/student/schedule'
    },
    {
      title: 'Attendance',
      description: 'Check attendance record',
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      path: '/student/attendance'
    }
  ];

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
                Welcome, {user?.name || 'Student'}!
              </h1>
              <p className="text-gray-300">
                Student Portal - Track your academic progress and fee information
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-lg">
                <p className="text-blue-300 font-medium">Student</p>
              </div>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Book className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Enrolled</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalSubjects}</h3>
            <p className="text-gray-400">Subjects</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.attendancePercentage}%</h3>
            <p className="text-gray-400">Attendance</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Award className="h-6 w-6 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-400">Average</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.averageGrade}</h3>
            <p className="text-gray-400">Grade</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Balance</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">₦{stats.feeBalance.toLocaleString()}</h3>
            <p className="text-gray-400">Fee Balance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Today's Classes</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Book className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Mathematics</p>
                      <p className="text-sm text-gray-400">Mr. Johnson - Room 204</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">08:00 - 09:00</p>
                    <p className="text-sm text-gray-400">Ongoing</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Quick Links</h3>
            <div className="space-y-3">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left flex items-center space-x-3"
                  onClick={() => window.location.href = action.path}
                >
                  {action.icon}
                  <div>
                    <span className="text-white">{action.title}</span>
                    <p className="text-xs text-gray-400">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 p-6 rounded-2xl border border-blue-500/30">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <GraduationCap className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Student Portal</h3>
              <p className="text-gray-300">
                Track your academic progress, view your report card, check fee statements, 
                and stay updated with your class schedule and attendance records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}