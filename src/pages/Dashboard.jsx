import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, Users, BookOpen, CreditCard, AlertTriangle, 
  GraduationCap, Briefcase, DollarSign, TrendingUp, 
  TrendingDown, Calendar, FileText, PieChart, Crown 
} from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [canAccessFullFeatures, setCanAccessFullFeatures] = useState(false);

  useEffect(() => {
    console.log('🎯 Dashboard Component Mounted');
    
    const loadDashboard = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('📊 Dashboard Data Check:');
        console.log('   User Data:', userData);
        console.log('   Token:', token ? 'Exists' : 'Missing');

        if (!userData || !token) {
          console.log('🚫 No user data or token, redirecting to login');
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        console.log('   Parsed User:', parsedUser);
        
        // Check if user needs to change password
        if (parsedUser.must_change_password) {
          console.log('🔐 Password change required, redirecting...');
          navigate('/change-password');
          return;
        }

        // Check subscription status first
        await checkSubscriptionStatus(parsedUser);

        // Load dashboard data
        await loadDashboardData(parsedUser);

        setUser(parsedUser);
        setLoading(false);
        
      } catch (error) {
        console.error('🔴 Dashboard Error:', error);
        navigate('/login');
      }
    };

    const checkSubscriptionStatus = async (userData) => {
      try {
        // Don't check for super admin
        if (userData.role === 'super_admin') {
          setHasActiveSubscription(true);
          setCanAccessFullFeatures(true);
          return;
        }

        const response = await api.get('/subscriptions/status/check');
        console.log('📊 Subscription status for dashboard:', response.data);
        
        const hasActiveSub = response.data.has_active_subscription || false;
        const schoolUnlocked = response.data.school_unlocked || userData.school?.is_unlocked || false;
        
        setHasActiveSubscription(hasActiveSub);
        setCanAccessFullFeatures(schoolUnlocked);
        
        // If school admin doesn't have active subscription, redirect to subscription page
        if ((userData.role === 'admin' || userData.role === 'principal' || userData.role === 'head_teacher') 
            && !schoolUnlocked) {
          console.log('🔒 School locked, redirecting to subscription');
          navigate('/admin/subscriptions');
          return;
        }
        
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        
        // Default to false on error
        setHasActiveSubscription(false);
        setCanAccessFullFeatures(false);
        
        // Redirect school admins without subscription
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if ((userData.role === 'admin' || userData.role === 'principal' || userData.role === 'head_teacher') 
            && !userData.school?.is_unlocked) {
          navigate('/admin/subscriptions');
        }
      }
    };

    const loadDashboardData = async (userData) => {
      try {
        let endpoint = '';
        const role = userData.role?.toLowerCase();
        
        // Determine endpoint based on role
        if (role === 'super_admin') {
           endpoint = '/admin/dashboard';
        } else if (role === 'admin' || role === 'principal' || role === 'head_teacher') {
          endpoint = '/school/dashboard';
        } else if (role === 'employee') {
          const employeeType = userData.employee_type;
          if (employeeType === 'teaching') {
            endpoint = '/employee/dashboard';
          } else if (employeeType === 'non_teaching') {
            endpoint = '/account/dashboard';
          }
        } else if (role === 'student') {
          endpoint = '/student/dashboard';
        } else if (role === 'parent') {
          endpoint = '/parent/dashboard';
        }
        
        console.log(`🌐 Fetching ${role} dashboard from:`, endpoint);
        
        if (!endpoint) {
          console.log('⚠️ No endpoint found for role:', role);
          throw new Error(`No dashboard endpoint configured for role: ${role}`);
        }
        
        const response = await api.get(endpoint);
        console.log('📈 Dashboard response:', response.data);
        
        setStats(response.data.stats || {});
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        console.error('Error details:', error.response?.data || error.message);
        
        // Set default stats
        const defaultStats = getDefaultStats(userData);
        setStats(defaultStats);
      }
    };

    const getDefaultStats = (userData) => {
      const role = userData.role;
      const employeeType = userData.employee_type;
      
      if (role === 'super_admin') {
        return {
          total_schools: 0,
          active_subscriptions: 0,
          total_revenue: 0,
          recent_signups: 0
        };
      }
      
      if (role === 'admin') {
        return {
          total_students: 0,
          total_employees: 0,
          total_parents: 0,
          total_fees_collected: 0,
          pending_payments: 0
        };
      }
      
      if (role === 'employee') {
        if (employeeType === 'teaching') {
          return {
            assigned_subjects: [],
            assigned_grades: [],
            total_students: 0,
            pending_attendance: 0,
            pending_results: 0
          };
        } else {
          // Non-teaching employee (including account staff)
          return {
            total_fees_collected: 0,
            pending_payments: 0,
            total_income: 0,
            total_expenses: 0,
            recent_transactions: []
          };
        }
      }
      
      if (role === 'student') {
        return {
          current_grade: '',
          attendance_rate: 0,
          average_score: 0,
          pending_fees: 0,
          upcoming_exams: []
        };
      }
      
      if (role === 'parent') {
        return {
          children_count: 0,
          total_pending_fees: 0,
          children_performance: [],
          recent_notifications: []
        };
      }
      
      return {};
    };

    loadDashboard();
  }, [navigate]);

  const getRoleSpecificDashboard = () => {
    if (!user) return null;

    const role = user.role;
    const employeeType = user.employee_type;

    if (role === 'super_admin') {
      return <SuperAdminDashboard user={user} stats={stats} navigate={navigate} />;
    }
    
    if (role === 'admin' || role === 'principal' || role === 'head_teacher') {
      return <AdminDashboard 
        user={user} 
        stats={stats} 
        hasActiveSubscription={hasActiveSubscription}
        canAccessFullFeatures={canAccessFullFeatures}
        navigate={navigate} 
      />;
    }
    
    if (role === 'employee') {
      if (employeeType === 'teaching') {
        return <TeachingStaffDashboard 
          user={user} 
          stats={stats} 
          canAccessFullFeatures={canAccessFullFeatures}
          navigate={navigate} 
        />;
      } else {
        // Non-teaching employee
        return <NonTeachingStaffDashboard 
          user={user} 
          stats={stats} 
          canAccessFullFeatures={canAccessFullFeatures}
          navigate={navigate} 
        />;
      }
    }
    
    if (role === 'student') {
      return <StudentDashboard 
        user={user} 
        stats={stats} 
        canAccessFullFeatures={canAccessFullFeatures}
        navigate={navigate} 
      />;
    }
    
    if (role === 'parent') {
      return <ParentDashboard 
        user={user} 
        stats={stats} 
        canAccessFullFeatures={canAccessFullFeatures}
        navigate={navigate} 
      />;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return getRoleSpecificDashboard();
}

// Admin Dashboard Component
function AdminDashboard({ user, stats, hasActiveSubscription, canAccessFullFeatures, navigate }) {
  const shouldShowLimitedBanner = !hasActiveSubscription || !canAccessFullFeatures;

  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      {/* School Status Banner */}
      {user?.school && shouldShowLimitedBanner && (
        <div className="mb-6 rounded-lg p-4 border bg-yellow-500/20 border-yellow-500">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">Limited Access Mode</h3>
              <p className="text-sm text-yellow-300">
                Your school "{user.school.name}" has limited access. Complete subscription to unlock all features.
              </p>
              <button
                onClick={() => navigate('/admin/subscriptions')}
                className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Subscription Banner */}
      {hasActiveSubscription && canAccessFullFeatures && (
        <div className="mb-6 rounded-lg p-4 border bg-green-500/20 border-green-500">
          <div className="flex items-center space-x-3">
            <School className="h-6 w-6 text-green-400" />
            <div>
              <h3 className="font-semibold text-green-400">Full Access Granted</h3>
              <p className="text-sm text-green-300">
                Your school "{user.school?.name}" has full access to all features.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Welcome to Admin Dashboard</h1>
        <p className="text-blue-300 mt-2">
          Welcome back, {user?.name || 'Admin'}! Manage your school efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Students", value: stats.total_students || 0, color: "bg-blue-500", icon: Users, path: "/admin/students" },
          { title: "Total Employees", value: stats.total_employees || 0, color: "bg-green-500", icon: Briefcase, path: "/admin/employees" },
          { title: "Total Parents", value: stats.total_parents || 0, color: "bg-purple-500", icon: GraduationCap, path: "/admin/parents" },
          { title: "Fees Collected", value: `₦${(stats.total_fees_collected || 0).toLocaleString()}`, color: "bg-yellow-500", icon: DollarSign, path: "/admin/feepayments" },
        ].map((stat, index) => (
          <div 
            key={index} 
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
            onClick={() => canAccessFullFeatures && navigate(stat.path)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            {!canAccessFullFeatures && (
              <div className="mt-3 text-xs text-yellow-400 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Subscription required
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Manage Students", path: "/admin/students", icon: Users, color: "text-blue-400", requiresFullAccess: true },
              { name: "Fee Management", path: "/admin/fees", icon: CreditCard, color: "text-yellow-400", requiresFullAccess: true },
              { name: "Employee Management", path: "/admin/employees", icon: Briefcase, color: "text-green-400", requiresFullAccess: true },
              { name: "Academic Records", path: "/admin/results", icon: FileText, color: "text-purple-400", requiresFullAccess: true },
              { name: "Attendance", path: "/admin/attendances", icon: Calendar, color: "text-orange-400", requiresFullAccess: true },
              { name: "Subscription", path: "/admin/subscriptions", icon: Crown, color: "text-pink-400", requiresFullAccess: false },
            ].map((action, index) => {
              const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && navigate(action.path)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg text-left transition-colors group ${
                    isDisabled 
                      ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <div>
                      <h3 className="font-semibold text-white">{action.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {isDisabled ? 'Subscription required' : 'Click to navigate'}
                      </p>
                    </div>
                  </div>
                  {isDisabled && (
                    <div className="mt-2 text-xs text-yellow-400 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Upgrade required
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {[
              { activity: "New student enrolled", time: "2 hours ago" },
              { activity: "Fee payment received", time: "4 hours ago" },
              { activity: "Employee added", time: "1 day ago" },
              { activity: "Exam results uploaded", time: "2 days ago" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                <span className="text-gray-300">{item.activity}</span>
                <span className="text-sm text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Teaching Staff Dashboard Component
function TeachingStaffDashboard({ user, stats, canAccessFullFeatures, navigate }) {
  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      {!canAccessFullFeatures && (
        <div className="mb-6 rounded-lg p-4 border bg-yellow-500/20 border-yellow-500">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">Limited Access Mode</h3>
              <p className="text-sm text-yellow-300">
                Your school's subscription is inactive. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-green-400">Teaching Staff Dashboard</h1>
        <p className="text-green-300 mt-2">
          Welcome back, {user?.name}! Manage your classes and academic records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Total Students", value: stats.total_students || 0, color: "bg-blue-500", icon: Users },
          { title: "Assigned Subjects", value: stats.assigned_subjects?.length || 0, color: "bg-purple-500", icon: BookOpen },
          { title: "Pending Attendance", value: stats.pending_attendance || 0, color: "bg-orange-500", icon: Calendar },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <h2 className="text-xl font-semibold mb-4">Teaching Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Take Attendance", path: "/admin/attendances", icon: Calendar, requiresFullAccess: true },
            { name: "Enter Results", path: "/admin/results", icon: FileText, requiresFullAccess: true },
            { name: "View Students", path: "/admin/students", icon: Users, requiresFullAccess: true },
            { name: "View Subjects", path: "/admin/subjects", icon: BookOpen, requiresFullAccess: true },
          ].map((action, index) => {
            const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && navigate(action.path)}
                disabled={isDisabled}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isDisabled 
                    ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-white">{action.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {isDisabled ? 'Subscription required' : 'Click to navigate'}
                    </p>
                  </div>
                </div>
                {isDisabled && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    School subscription required
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Non-Teaching Staff Dashboard Component (including account staff)
function NonTeachingStaffDashboard({ user, stats, canAccessFullFeatures, navigate }) {
  const isAccountStaff = user?.employee_type === 'non_teaching' || user?.role === 'accountant';

  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      {!canAccessFullFeatures && (
        <div className="mb-6 rounded-lg p-4 border bg-yellow-500/20 border-yellow-500">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">Limited Access Mode</h3>
              <p className="text-sm text-yellow-300">
                Your school's subscription is inactive. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">
          {isAccountStaff ? 'Account Staff Dashboard' : 'Non-Teaching Staff Dashboard'}
        </h1>
        <p className="text-yellow-300 mt-2">
          Welcome back, {user?.name}! {isAccountStaff ? 'Manage financial records and transactions.' : 'Manage administrative tasks.'}
        </p>
      </div>

      {isAccountStaff ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: "Fees Collected", value: `₦${(stats.total_fees_collected || 0).toLocaleString()}`, color: "bg-green-500", icon: TrendingUp },
              { title: "Pending Payments", value: `₦${(stats.pending_payments || 0).toLocaleString()}`, color: "bg-orange-500", icon: AlertTriangle },
              { title: "Total Income", value: `₦${(stats.total_income || 0).toLocaleString()}`, color: "bg-blue-500", icon: DollarSign },
              { title: "Total Expenses", value: `₦${(stats.total_expenses || 0).toLocaleString()}`, color: "bg-red-500", icon: TrendingDown },
            ].map((stat, index) => (
              <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Financial Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Manage Fees", path: "/admin/fees", icon: DollarSign, requiresFullAccess: true },
                { name: "Fee Payments", path: "/admin/feepayments", icon: CreditCard, requiresFullAccess: true },
                { name: "Transactions", path: "/admin/transactions", icon: TrendingUp, requiresFullAccess: true },
                { name: "Income/Expense", path: "/admin/incomes", icon: PieChart, requiresFullAccess: true },
              ].map((action, index) => {
                const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
                
                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && navigate(action.path)}
                    disabled={isDisabled}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      isDisabled 
                        ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-white">{action.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {isDisabled ? 'Subscription required' : 'Click to navigate'}
                        </p>
                      </div>
                    </div>
                    {isDisabled && (
                      <div className="mt-2 text-xs text-yellow-400 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        School subscription required
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Non-Teaching Staff Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "View School Info", path: "/admin/schools", icon: School, requiresFullAccess: true },
              { name: "View Students", path: "/admin/students", icon: Users, requiresFullAccess: true },
              { name: "View Employees", path: "/admin/employees", icon: Briefcase, requiresFullAccess: true },
              { name: "View Attendance", path: "/admin/attendances", icon: Calendar, requiresFullAccess: true },
            ].map((action, index) => {
              const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
              
              return (
                <button
                  key={index}
                  onClick={() => !isDisabled && navigate(action.path)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    isDisabled 
                      ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-white">{action.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {isDisabled ? 'Subscription required' : 'Click to navigate'}
                      </p>
                    </div>
                  </div>
                  {isDisabled && (
                    <div className="mt-2 text-xs text-yellow-400 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      School subscription required
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Student Dashboard Component
function StudentDashboard({ user, stats, canAccessFullFeatures, navigate }) {
  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      {!canAccessFullFeatures && (
        <div className="mb-6 rounded-lg p-4 border bg-yellow-500/20 border-yellow-500">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">Limited Access Mode</h3>
              <p className="text-sm text-yellow-300">
                Your school's subscription is inactive. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-purple-400">Student Dashboard</h1>
        <p className="text-purple-300 mt-2">
          Welcome back, {user?.name}! Check your academic progress and information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Attendance Rate", value: `${stats.attendance_rate || 0}%`, color: "bg-green-500", icon: Calendar },
          { title: "Average Score", value: stats.average_score || "N/A", color: "bg-blue-500", icon: FileText },
          { title: "Pending Fees", value: `₦${(stats.pending_fees || 0).toLocaleString()}`, color: "bg-orange-500", icon: DollarSign },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "My Report Card", path: "/student/report-card", icon: FileText, requiresFullAccess: true },
            { name: "PTA Information", path: "/student/pta", icon: Users, requiresFullAccess: true },
            { name: "My Attendance", path: "/student/attendance", icon: Calendar, requiresFullAccess: true },
            { name: "Fee Payments", path: "/student/payments", icon: CreditCard, requiresFullAccess: true },
          ].map((action, index) => {
            const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && navigate(action.path)}
                disabled={isDisabled}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isDisabled 
                    ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-white">{action.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {isDisabled ? 'Subscription required' : 'View details'}
                    </p>
                  </div>
                </div>
                {isDisabled && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    School subscription required
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Parent Dashboard Component
function ParentDashboard({ user, stats, canAccessFullFeatures, navigate }) {
  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      {!canAccessFullFeatures && (
        <div className="mb-6 rounded-lg p-4 border bg-yellow-500/20 border-yellow-500">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-400">Limited Access Mode</h3>
              <p className="text-sm text-yellow-300">
                Your school's subscription is inactive. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-500/20 border border-indigo-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-indigo-400">Parent Dashboard</h1>
        <p className="text-indigo-300 mt-2">
          Welcome back, {user?.name}! Monitor your child's progress and information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Children", value: stats.children_count || 0, color: "bg-purple-500", icon: Users },
          { title: "Pending Fees", value: `₦${(stats.total_pending_fees || 0).toLocaleString()}`, color: "bg-orange-500", icon: DollarSign },
          { title: "Avg Performance", value: "85%", color: "bg-green-500", icon: TrendingUp },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Parent Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Children's Report Cards", path: "/parent/report-card", icon: FileText, requiresFullAccess: true },
            { name: "PTA Information", path: "/parent/pta", icon: Users, requiresFullAccess: true },
            { name: "Fee Payments", path: "/parent/payments", icon: CreditCard, requiresFullAccess: true },
            { name: "Children's Attendance", path: "/parent/attendance", icon: Calendar, requiresFullAccess: true },
          ].map((action, index) => {
            const isDisabled = action.requiresFullAccess && !canAccessFullFeatures;
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && navigate(action.path)}
                disabled={isDisabled}
                className={`p-4 rounded-lg text-left transition-colors ${
                  isDisabled 
                    ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <action.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-white">{action.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {isDisabled ? 'Subscription required' : 'View details'}
                    </p>
                  </div>
                </div>
                {isDisabled && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    School subscription required
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Super Admin Dashboard Component
function SuperAdminDashboard({ user, stats, navigate }) {
  return (
    <div className="w-full h-full bg-slate-900 text-white p-6">
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-red-400">Super Admin Dashboard</h1>
        <p className="text-red-300 mt-2">
          Welcome back, {user?.name}! Manage the entire platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Schools", value: stats.total_schools || 0, color: "bg-blue-500", icon: School },
          { title: "Active Subscriptions", value: stats.active_subscriptions || 0, color: "bg-green-500", icon: Crown },
          { title: "Total Revenue", value: `₦${(stats.total_revenue || 0).toLocaleString()}`, color: "bg-yellow-500", icon: DollarSign },
          { title: "Recent Signups", value: stats.recent_signups || 0, color: "bg-purple-500", icon: Users },
        ].map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Platform Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Manage Schools", path: "/super-admin/schools", icon: School },
            { name: "Subscriptions", path: "/super-admin/subscriptions", icon: Crown },
            { name: "Pricing Plans", path: "/super-admin/pricing", icon: DollarSign },
            { name: "Revenue Reports", path: "/super-admin/reports/revenue", icon: TrendingUp },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center space-x-3">
                <action.icon className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-white">{action.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Manage platform</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}