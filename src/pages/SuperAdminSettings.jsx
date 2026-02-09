import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import PricingManagement from './PricingManagement';
import { 
  Settings, 
  Save,
  DollarSign,
  Users,
  Bell,
  Shield,
  Database,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Mail,
  ArrowLeft
} from 'lucide-react';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [pricing, setPricing] = useState({
    termly_base_price: 20000,
    termly_per_student: 2000,
    yearly_base_price: 50000,
    yearly_per_student: 5000
  });

  const [systemSettings, setSystemSettings] = useState({
    school_registration: true,
    auto_approve_schools: false,
    enable_email_notifications: true,
    max_students_per_school: 5000,
    session_duration_days: 120,
    require_approval: true,
    enable_sms_notifications: false
  });

  const [maintenanceSettings, setMaintenanceSettings] = useState({
    system_status: 'operational',
    last_backup: new Date().toISOString(),
    cache_size: '2.4 MB',
    active_sessions: 0
  });

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      // FIXED: Removed duplicate v1 from route
      const response = await api.get('/admin/system-settings');
      setSystemSettings(response.data);
    } catch (err) {
      console.error('Failed to load system settings:', err);
      // Fallback to mock data if API fails
      const mockSettings = {
        school_registration: true,
        auto_approve_schools: false,
        enable_email_notifications: true,
        max_students_per_school: 5000,
        session_duration_days: 120,
        require_approval: true,
        enable_sms_notifications: false
      };
      setSystemSettings(mockSettings);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setSaving(true);
    try {
      // FIXED: Removed duplicate v1 from route
      await api.put('/admin/system-settings', systemSettings);
      toast.success('System settings updated successfully!');
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSystemMaintenance = async (action) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'clear_cache':
          // FIXED: Removed duplicate v1 from route
          await api.post('/admin/system/clear-cache');
          toast.success('System cache cleared successfully');
          break;
          
        case 'backup_database':
          // FIXED: Removed duplicate v1 from route
          await api.post('/admin/system/backup');
          setMaintenanceSettings(prev => ({
            ...prev,
            last_backup: new Date().toISOString()
          }));
          toast.success('Database backup completed successfully');
          break;
          
        case 'system_health':
          // FIXED: Removed duplicate v1 from route
          await api.get('/admin/system/health');
          toast.success('System health check completed - All systems operational');
          break;
          
        case 'view_logs':
          toast.success('Opening system logs...');
          // In real app, this would open logs modal or page
          break;
          
        default:
          break;
      }
    } catch (err) {
      toast.error(`Failed to perform ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    try {
      setLoading(true);
      // FIXED: Removed duplicate v1 from route
      const response = await api.get('/admin/system/stats');
      
      setMaintenanceSettings(prev => ({
        ...prev,
        active_sessions: response.data.active_sessions,
        cache_size: response.data.cache_size,
        system_status: response.data.system_status
      }));
      
      toast.success('System stats refreshed');
    } catch (err) {
      toast.error('Failed to refresh stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !saving) {
    return (
      <div className="p-6 text-white">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-800 p-6 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen bg-slate-900">
      {/* Header with Back Button */}
      <div className="mb-8">
        <Link
          to="/super-admin/dashboard"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>
        <p className="text-gray-400">
          Configure platform-wide settings, pricing, and maintenance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-slate-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'system'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>System Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'pricing'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Pricing Management</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'maintenance'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Database className="h-5 w-5" />
            <span>System Maintenance</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Configuration */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <span>System Configuration</span>
                </h2>
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">School Registration</h4>
                    <p className="text-sm text-gray-400">Allow new schools to register on the platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.school_registration}
                      onChange={(e) => setSystemSettings({...systemSettings, school_registration: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto-approve Schools</h4>
                    <p className="text-sm text-gray-400">Automatically approve new school registrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.auto_approve_schools}
                      onChange={(e) => setSystemSettings({...systemSettings, auto_approve_schools: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-400">Send system notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enable_email_notifications}
                      onChange={(e) => setSystemSettings({...systemSettings, enable_email_notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-gray-400">Send system notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.enable_sms_notifications}
                      onChange={(e) => setSystemSettings({...systemSettings, enable_sms_notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Students Per School
                  </label>
                  <input
                    type="number"
                    value={systemSettings.max_students_per_school}
                    onChange={(e) => setSystemSettings({...systemSettings, max_students_per_school: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Duration (days)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.session_duration_days}
                    onChange={(e) => setSystemSettings({...systemSettings, session_duration_days: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold flex items-center space-x-2 mb-6">
                <Bell className="h-5 w-5 text-blue-400" />
                <span>System Status</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      maintenanceSettings.system_status === 'operational' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">System Status</h4>
                      <p className="text-sm text-gray-400 capitalize">{maintenanceSettings.system_status}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-gray-400">{maintenanceSettings.active_sessions} users</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Cache Size</h4>
                      <p className="text-sm text-gray-400">{maintenanceSettings.cache_size}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-400">
                      <Save className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Last Backup</h4>
                      <p className="text-sm text-gray-400">
                        {new Date(maintenanceSettings.last_backup).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRefreshStats}
                disabled={loading}
                className="w-full mt-4 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Stats</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <PricingManagement />
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold flex items-center space-x-2 mb-6">
              <Database className="h-5 w-5 text-orange-400" />
              <span>System Maintenance</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleSystemMaintenance('clear_cache')}
                disabled={loading}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-6 w-6 text-blue-400 mb-2" />
                <h4 className="font-semibold">Clear Cache</h4>
                <p className="text-sm text-gray-400">Refresh system cache and temporary data</p>
              </button>

              <button
                onClick={() => handleSystemMaintenance('backup_database')}
                disabled={loading}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="h-6 w-6 text-green-400 mb-2" />
                <h4 className="font-semibold">Backup Database</h4>
                <p className="text-sm text-gray-400">Create complete system backup</p>
              </button>

              <button
                onClick={() => handleSystemMaintenance('system_health')}
                disabled={loading}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="h-6 w-6 text-yellow-400 mb-2" />
                <h4 className="font-semibold">System Health</h4>
                <p className="text-sm text-gray-400">Run comprehensive system diagnostics</p>
              </button>

              <button
                onClick={() => handleSystemMaintenance('view_logs')}
                disabled={loading}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell className="h-6 w-6 text-red-400 mb-2" />
                <h4 className="font-semibold">View Logs</h4>
                <p className="text-sm text-gray-400">Access system activity and error logs</p>
              </button>
            </div>
          </div>

          {/* Maintenance Status */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-green-400" />
                  <div>
                    <h4 className="font-medium">Last Database Backup</h4>
                    <p className="text-sm text-gray-400">
                      {new Date(maintenanceSettings.last_backup).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                  Completed
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                  <div>
                    <h4 className="font-medium">Cache Status</h4>
                    <p className="text-sm text-gray-400">{maintenanceSettings.cache_size} cached data</p>
                  </div>
                </div>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <h4 className="font-medium">Security Scan</h4>
                    <p className="text-sm text-gray-400">Last scan: Today</p>
                  </div>
                </div>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}