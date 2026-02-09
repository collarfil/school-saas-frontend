import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { 
  School, 
  Crown, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  LogOut,
  Settings
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_schools: 0,
    total_revenue: 0,
    active_users: 0,
    locked_schools: 0
  });
  const [schools, setSchools] = useState([]);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);

    try {
      console.log("📊 Fetching super admin dashboard data...");

      // Fetch schools
      const schoolsResponse = await api.get('/schools');
      const schoolsData = schoolsResponse.data.data || schoolsResponse.data || [];
      
      console.log("📋 Schools data:", schoolsData);

      setSchools(schoolsData);

      // Calculate stats
      const totalSchools = schoolsData.length;
      const lockedSchools = schoolsData.filter(school => !school.is_unlocked).length;
      const activeUsers = schoolsData.reduce((sum, school) => sum + (school.users_count || 0), 0);
      const totalRevenue = schoolsData.reduce((sum, school) => {
        // Calculate revenue from active subscriptions
        if (school.active_subscription) {
          return sum + (parseFloat(school.active_subscription.amount) || 0);
        }
        return sum;
      }, 0);

      setStats({
        total_schools: totalSchools,
        total_revenue: totalRevenue,
        active_users: activeUsers,
        locked_schools: lockedSchools
      });

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      
      const errorMessage = err.response?.data?.message || 
                         "Failed to load dashboard data";
      
      setApiError(errorMessage);
      toast.error(errorMessage);

      // Fallback to empty data
      setSchools([]);
      setStats({ total_schools: 0, total_revenue: 0, active_users: 0, locked_schools: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickUnlock = async (schoolId) => {
    try {
      await api.post(`/admin/schools/${schoolId}/unlock`);
      toast.success('School unlocked successfully');
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Unlock error:', err);
      toast.error(err.response?.data?.message || 'Failed to unlock school');
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Clear authorization header
    delete api.defaults.headers.common["Authorization"];
    
    toast.success("Logged out successfully");
    
    // Redirect to login page
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen bg-slate-900">
      {/* Header with Logout Button */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Manage schools and system settings
            </p>
          </div>
        </div>
        
        {/* Action Buttons Group */}
        <div className="flex items-center space-x-3">
          {/* Settings Button */}
          <button
            onClick={() => navigate("/super-admin/settings")}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            title="System Settings"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            title="Refresh Data"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>

          {/* Add School Button */}
          <button
            onClick={() => navigate("/super-admin/schools")}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add School</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* API Status Alert */}
      {apiError && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-yellow-300 font-medium">API Notice</p>
            <p className="text-yellow-400 text-sm">{apiError}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-3">
            <School className="h-8 w-8 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Total Schools
              </h3>
              <p className="text-2xl font-bold text-white">
                {stats.total_schools}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Active Users
              </h3>
              <p className="text-2xl font-bold text-white">
                {stats.active_users}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-white">
                ₦{stats.total_revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg hover:border-slate-600 transition-colors">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Locked Schools
              </h3>
              <p className="text-2xl font-bold text-white">
                {stats.locked_schools}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schools Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Schools</h2>
          <button
            onClick={() => navigate("/super-admin/schools")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors flex items-center space-x-2"
          >
            <span>Manage All Schools</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {schools.length > 0 ? (
          <div className="space-y-4">
            {schools.slice(0, 5).map((school, index) => (
              <div
                key={school.id || index}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <School className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {school.name || `School ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {school.email || "No email provided"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        school.is_unlocked 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {school.is_unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Users: {school.users_count || 0}
                      </span>
                      {school.active_subscription && (
                        <span className="text-xs text-green-400">
                          Active Subscription
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  {!school.is_unlocked && (
                    <button
                      onClick={() => handleQuickUnlock(school.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                    >
                      Unlock
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/super-admin/schools")}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <School className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              No Schools Found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating the first school
            </p>
            <button
              onClick={() => navigate("/super-admin/schools")}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-colors"
            >
              Create First School
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {schools.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{schools.filter(s => s.is_unlocked).length}</div>
            <div className="text-sm text-gray-400">Unlocked Schools</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{schools.filter(s => s.active_subscription).length}</div>
            <div className="text-sm text-gray-400">Active Subscriptions</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.locked_schools}</div>
            <div className="text-sm text-gray-400">Awaiting Activation</div>
          </div>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={() => navigate("/super-admin/schools")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Manage Schools
        </button>
        <button
          onClick={() => navigate("/super-admin/settings")}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          System Settings
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}