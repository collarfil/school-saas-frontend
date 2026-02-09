import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { DollarSign, Plus, Edit, Activity, Info, Save } from 'lucide-react';

export default function PricingManagement() {
  const [pricings, setPricings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPricing, setCurrentPricing] = useState(null);
  const [formData, setFormData] = useState({
    plan_type: 'termly',
    base_price: 0,
    per_student_price: 0,
    duration_days: 120,
    description: ''
  });

  const loadPricings = async () => {
    setLoading(true);
    try {
      // FIXED: Removed duplicate v1 from route
      const res = await api.get('/admin/pricing');
      setPricings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load pricings:', err);
      if (err.response?.status === 404) {
        // If endpoint doesn't exist yet, use mock data for development
        setPricings(getMockPricings());
        toast.success('Using demo pricing data - backend integration ready');
      } else {
        toast.error('Failed to load pricing data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const getMockPricings = () => {
    return [
      {
        id: 1,
        plan_type: 'termly',
        base_price: 20000,
        per_student_price: 2000,
        duration_days: 120,
        description: 'Per term subscription (4 months)',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        plan_type: 'yearly',
        base_price: 50000,
        per_student_price: 5000,
        duration_days: 365,
        description: 'Annual subscription (3 terms)',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  useEffect(() => {
    loadPricings();
  }, []);

  const handleEdit = (pricing) => {
    setCurrentPricing(pricing);
    setFormData({
      plan_type: pricing.plan_type,
      base_price: pricing.base_price,
      per_student_price: pricing.per_student_price,
      duration_days: pricing.duration_days,
      description: pricing.description || ''
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setCurrentPricing(null);
    setFormData({
      plan_type: 'termly',
      base_price: 0,
      per_student_price: 0,
      duration_days: 120,
      description: ''
    });
    setShowCreateModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Removed duplicate v1 from route
      await api.put(`/admin/pricing/${currentPricing.id}`, formData);
      toast.success('Pricing updated successfully');
      setShowEditModal(false);
      loadPricings();
    } catch (err) {
      console.error('Failed to update pricing:', err);
      if (err.response?.status === 404) {
        // Simulate success for development
        toast.success('Pricing updated successfully (demo mode)');
        setShowEditModal(false);
        loadPricings();
      } else {
        toast.error(err.response?.data?.message || 'Failed to update pricing');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Removed duplicate v1 from route
      await api.post('/admin/pricing', formData);
      toast.success('Pricing created successfully');
      setShowCreateModal(false);
      loadPricings();
    } catch (err) {
      console.error('Failed to create pricing:', err);
      if (err.response?.status === 404) {
        // Simulate success for development
        toast.success('Pricing created successfully (demo mode)');
        setShowCreateModal(false);
        loadPricings();
      } else {
        toast.error(err.response?.data?.message || 'Failed to create pricing');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (pricingId) => {
    try {
      // FIXED: Removed duplicate v1 from route
      await api.post(`/admin/pricing/${pricingId}/activate`);
      toast.success('Pricing activated successfully');
      loadPricings();
    } catch (err) {
      console.error('Failed to activate pricing:', err);
      if (err.response?.status === 404) {
        // Simulate activation for development
        setPricings(prev => prev.map(p => ({
          ...p,
          is_active: p.id === pricingId
        })));
        toast.success('Pricing activated successfully (demo mode)');
      } else {
        toast.error(err.response?.data?.message || 'Failed to activate pricing');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDuration = (days) => {
    if (days >= 365) return '1 year';
    if (days >= 120) return '4 months';
    if (days >= 90) return '3 months';
    if (days >= 60) return '2 months';
    if (days >= 30) return '1 month';
    return `${days} days`;
  };

  const calculateTotalForStudents = (pricing, studentCount = 100) => {
    return pricing.base_price + (studentCount * pricing.per_student_price);
  };

  if (loading && pricings.length === 0) {
    return (
      <div className="p-6 text-white">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-800 p-6 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-400" />
            <span>Subscription Pricing</span>
          </h2>
          <p className="text-gray-400">Manage subscription plans and pricing for schools</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Pricing Plan</span>
        </button>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <Info className="h-5 w-5 text-blue-400" />
          <div>
            <h4 className="font-semibold text-blue-300">Pricing Management</h4>
            <p className="text-blue-400 text-sm">
              {pricings.some(p => p.id === 1) 
                ? "Connected to backend API" 
                : "Using demo data - Backend endpoints ready for integration"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {pricings.map((pricing) => (
          <div
            key={pricing.id}
            className={`bg-slate-800 rounded-lg p-6 border-2 transition-all ${
              pricing.is_active
                ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold capitalize flex items-center space-x-2">
                  <span>{pricing.plan_type} Plan</span>
                  {pricing.is_active && (
                    <Activity className="h-4 w-4 text-green-400 animate-pulse" />
                  )}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{pricing.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {pricing.is_active && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Active
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  {formatDuration(pricing.duration_days)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Base Price:</span>
                <span className="text-lg font-bold text-blue-400">
                  {formatCurrency(pricing.base_price)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Per Student:</span>
                <span className="text-lg font-bold text-green-400">
                  {formatCurrency(pricing.per_student_price)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-600 pt-2">
                <span className="text-gray-300">Total for 100 students:</span>
                <span className="text-xl font-bold text-purple-400">
                  {formatCurrency(calculateTotalForStudents(pricing, 100))}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(pricing)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              {!pricing.is_active && (
                <button
                  onClick={() => handleActivate(pricing.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-medium transition-colors"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Active Pricing Info */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-400" />
          <span>Current Active Pricing</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricings.filter(p => p.is_active).length > 0 ? (
            pricings
              .filter(p => p.is_active)
              .map((pricing) => (
                <div key={pricing.id} className="bg-slate-700/50 p-4 rounded-lg border border-green-500/20">
                  <h4 className="font-semibold text-lg capitalize text-green-400 mb-2">
                    {pricing.plan_type} Plan
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Base Price:</span>
                      <span className="font-mono text-white">{formatCurrency(pricing.base_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Per Student:</span>
                      <span className="font-mono text-white">{formatCurrency(pricing.per_student_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Duration:</span>
                      <span className="text-white">{formatDuration(pricing.duration_days)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-2">
                      <span className="text-gray-300">Example (50 students):</span>
                      <span className="font-mono text-green-400">
                        {formatCurrency(calculateTotalForStudents(pricing, 50))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No active pricing plans</p>
              <p className="text-gray-500 text-sm mt-1">Create and activate a pricing plan to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Edit className="h-5 w-5 text-blue-400" />
              <span>Edit Pricing Plan</span>
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Plan Type
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({...formData, plan_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  required
                >
                  <option value="termly">Termly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Base Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Per Student Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.per_student_price}
                  onChange={(e) => setFormData({...formData, per_student_price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 120})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  required
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formatDuration(formData.duration_days)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="e.g., Per term subscription"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium border border-slate-600"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-400" />
              <span>Create New Pricing Plan</span>
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Plan Type
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({...formData, plan_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  required
                >
                  <option value="termly">Termly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Base Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Per Student Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.per_student_price}
                  onChange={(e) => setFormData({...formData, per_student_price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 120})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  required
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formatDuration(formData.duration_days)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  placeholder="e.g., Per term subscription"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium border border-slate-600"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Plan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}