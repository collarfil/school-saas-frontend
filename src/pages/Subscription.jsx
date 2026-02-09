import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  CheckCircle, 
  RefreshCw,
  AlertCircle,
  Shield,
  Clock,
  Users,
  Calendar,
  Package,
  History,
  AlertTriangle,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';

export default function Subscription() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    has_active_subscription: false,
    is_expired: true,
    expires_in: 0,
    school_unlocked: false,
    can_access_features: false,
    active_subscription: null
  });
  const [pricing, setPricing] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    plan_type: 'termly',
    term: '1st Term',
    school_session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    student_capacity: 100
  });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredSubscription, setExpiredSubscription] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Load user data
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    
    // Check if user should be redirected (if already subscribed)
    checkAndRedirect(storedUser);
  }, [navigate]);

  // Check if user should be redirected to dashboard
  const checkAndRedirect = async (userData) => {
    if (!userData?.id) return;
    
    try {
      const response = await api.get('/subscriptions/status/check');
      
      if (response.data.has_active_subscription && response.data.school_unlocked) {
        // User has active subscription, redirect to appropriate dashboard
        redirectToDashboard(userData);
      }
    } catch (err) {
      console.log('Redirect check failed:', err);
    }
  };

  // Main data loading effect
  useEffect(() => {
    if (user?.school?.id) {
      loadAllData();
      checkPendingPayments();
    }
    
    // Cleanup polling interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [user]);

  // Check for pending payments in localStorage
  const checkPendingPayments = () => {
    const pendingRef = localStorage.getItem('pending_payment_reference');
    if (pendingRef) {
      console.log('Found pending payment reference:', pendingRef);
      startPaymentPolling(pendingRef);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSubscriptions(),
        checkSubscriptionStatus(),
        loadPricing()
      ]);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions');
      console.log('Subscriptions loaded:', res.data);
      
      if (res.data.status === 'success' && res.data.data) {
        const subscriptionData = Array.isArray(res.data.data) 
          ? res.data.data 
          : res.data.data.subscriptions || res.data.data.data || [];
        
        setSubscriptions(subscriptionData);
        
        // Check for pending subscriptions
        const pendingSub = subscriptionData.find(sub => 
          (sub.payment_status === 'pending' || sub.status === 'pending') &&
          !sub.is_expired
        );
        
        if (pendingSub) {
          setPendingSubscription(pendingSub);
        }
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      if (err.response?.status === 402) {
        // Payment required - normal for new users
        setSubscriptions([]);
      }
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const res = await api.get('/subscriptions/status/check');
      console.log('Subscription status:', res.data);
      
      if (res.data) {
        const statusData = res.data.data || res.data;
        
        const newStatus = {
          has_active_subscription: statusData.has_active_subscription || 
                                 statusData.subscription_active || false,
          school_unlocked: statusData.school_unlocked || false,
          can_access_features: statusData.can_access_features || false,
          is_expired: statusData.is_expired || false,
          expires_in: statusData.expires_in || 0,
          active_subscription: statusData.active_subscription || null
        };
        
        setSubscriptionStatus(newStatus);
        
        // Store in localStorage
        localStorage.setItem('has_active_subscription', newStatus.has_active_subscription ? 'true' : 'false');
        localStorage.setItem('school_unlocked', newStatus.school_unlocked ? 'true' : 'false');
        localStorage.setItem('subscription_status', JSON.stringify(newStatus));
        
        // Update user data in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user) {
          user.school = user.school || {};
          user.school.is_unlocked = newStatus.school_unlocked;
          user.has_active_subscription = newStatus.has_active_subscription;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
        
        return newStatus;
      }
    } catch (err) {
      console.error('Status check error:', err);
      const defaultStatus = {
        has_active_subscription: false,
        school_unlocked: false,
        can_access_features: false,
        is_expired: true,
        expires_in: 0,
        active_subscription: null
      };
      
      setSubscriptionStatus(defaultStatus);
      localStorage.setItem('subscription_status', JSON.stringify(defaultStatus));
    }
  };

  // Update in Subscription.jsx
const redirectToDashboard = (userData) => {
  if (!userData) return;
  
  const userRole = userData.role?.toLowerCase();
  let redirectPath = '';
  
  // Determine dashboard based on role
  switch(userRole) {
    case 'super_admin':
      redirectPath = '/super-admin/dashboard';
      break;
    case 'admin':
      redirectPath = '/school/dashboard';
      break;
    case 'employee':
      const employeeType = userData.employee_type?.toLowerCase();
      if (employeeType === 'non_teaching') {
        redirectPath = '/account/dashboard';
      } else {
        redirectPath = '/employee/dashboard';
      }
      break;
    case 'student':
      redirectPath = '/student/dashboard';
      break;
    case 'parent':
      redirectPath = '/parent/dashboard';
      break;
    default:
      redirectPath = '/school/dashboard';
  }
  
  console.log(`Redirecting ${userRole} to: ${redirectPath}`);
  navigate(redirectPath, { replace: true });
};

  const loadPricing = async () => {
    try {
      const res = await api.get('/subscriptions/pricing-options');
      if (res.data.status === 'success' && res.data.data) {
        setPricing(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pricing:', err);
      // Set default pricing
      setPricing({
        termly: {
          base_price: 20000,
          per_student: 2000,
          duration: '4 months',
          duration_days: 120
        },
        yearly: {
          base_price: 50000,
          per_student: 5000,
          duration: '1 year',
          duration_days: 365
        }
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentForm.plan_type === 'termly' && !paymentForm.term) {
      newErrors.term = 'Please select a term';
    }
    
    if (paymentForm.plan_type === 'yearly' && !paymentForm.school_session) {
      newErrors.school_session = 'Please enter school session';
    }
    
    if (!paymentForm.student_capacity || paymentForm.student_capacity < 1) {
      newErrors.student_capacity = 'Student capacity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment initialization
  const handleInitializePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    if (!user?.school?.id) {
      toast.error('No school found for your account');
      return;
    }

    setPaymentLoading(true);
    setErrors({});

    try {
      // Determine pricing ID based on plan type
      const pricingId = paymentForm.plan_type === 'termly' ? 1 : 2;
      
      const payload = {
        pricing_id: pricingId,
        school_id: user.school.id,
        student_capacity: paymentForm.student_capacity,
        term: paymentForm.plan_type === 'termly' ? paymentForm.term : null,
        school_session: paymentForm.plan_type === 'yearly' ? paymentForm.school_session : null
      };

      console.log('Initializing payment with:', payload);
      
      const response = await api.post('/subscriptions/initialize-payment', payload);
      
      if (response.data.status === 'success') {
        const paymentData = response.data.data;
        const paymentUrl = paymentData.authorization_url || 
                          paymentData.payment_url || 
                          `https://checkout.paystack.com/${paymentData.reference}`;
        
        const reference = paymentData.reference;
        
        // Store reference for polling
        localStorage.setItem('pending_payment_reference', reference);
        
        // Open payment page
        toast.success('Redirecting to payment gateway...');
        
        // Try to open in new tab
        const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        
        if (!paymentWindow || paymentWindow.closed) {
          // Fallback: redirect in same tab
          window.location.href = paymentUrl;
        }
        
        setShowPaymentModal(false);
        
        // Start polling for payment verification
        startPaymentPolling(reference);
        
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      
      if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Payment creation failed');
      } else if (err.response?.status === 401) {
        toast.error('Please login again');
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Start payment polling
  const startPaymentPolling = (reference) => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let pollCount = 0;
    const maxPolls = 60; // 5 minutes (5 seconds * 60)
    
    const interval = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(interval);
        localStorage.removeItem('pending_payment_reference');
        toast.error('Payment verification timeout');
        return;
      }
      
      try {
        // Verify payment
        const verifyResponse = await api.post('/payments/verify', { reference });
        
        if (verifyResponse.data.status === 'success') {
          const paymentData = verifyResponse.data.data;
          
          if (paymentData.status === 'success' || paymentData.status === 'paid') {
            clearInterval(interval);
            localStorage.removeItem('pending_payment_reference');
            
            toast.success('Payment completed successfully!');
            
            // Update subscription status
            await checkSubscriptionStatus();
            
            // Get updated user data
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
              redirectToDashboard(user);
            }, 1500);
            
            // Refresh all data
            loadAllData();
            
          } else if (paymentData.status === 'failed') {
            clearInterval(interval);
            localStorage.removeItem('pending_payment_reference');
            toast.error('Payment failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling on errors
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  const handleCompletePayment = async (subscription) => {
    if (!subscription.payment_reference) {
      toast.error('No payment reference found');
      return;
    }

    // Check if payment is expired
    const now = new Date();
    const createdAt = new Date(subscription.created_at);
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      setExpiredSubscription(subscription);
      setShowExpiredModal(true);
      return;
    }

    // Continue with existing payment
    const paymentUrl = subscription.authorization_url || 
                      `https://checkout.paystack.com/${subscription.payment_reference}`;
    
    localStorage.setItem('pending_payment_reference', subscription.payment_reference);
    
    const paymentWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    
    if (!paymentWindow || paymentWindow.closed) {
      window.location.href = paymentUrl;
    }
    
    startPaymentPolling(subscription.payment_reference);
  };

  const handleCreateNewPayment = async () => {
    if (!expiredSubscription) return;

    try {
      toast.loading('Creating new payment...');
      
      const pricingId = expiredSubscription.plan_type === 'termly' ? 1 : 2;
      
      const payload = {
        pricing_id: pricingId,
        school_id: expiredSubscription.school_id,
        student_capacity: expiredSubscription.student_capacity || 100,
        term: expiredSubscription.plan_type === 'termly' ? expiredSubscription.term : null,
        school_session: expiredSubscription.plan_type === 'yearly' ? expiredSubscription.school_session : null
      };

      const response = await api.post('/subscriptions/initialize-payment', payload);
      
      if (response.data.status === 'success') {
        toast.dismiss();
        const paymentData = response.data.data;
        const paymentUrl = paymentData.authorization_url || 
                          `https://checkout.paystack.com/${paymentData.reference}`;
        
        localStorage.setItem('pending_payment_reference', paymentData.reference);
        
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        setShowExpiredModal(false);
        
        startPaymentPolling(paymentData.reference);
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to create new payment');
    }
  };

  const handleCancelPayment = async () => {
    if (!expiredSubscription) return;

    try {
      toast.loading('Cancelling payment...');
      await api.delete(`/subscriptions/${expiredSubscription.id}`);
      toast.success('Payment cancelled');
      setShowExpiredModal(false);
      loadAllData();
    } catch (err) {
      toast.error('Failed to cancel payment');
    }
  };

  const calculateEstimatedPrice = () => {
    if (!pricing || !pricing[paymentForm.plan_type]) {
      return 0;
    }
    
    const plan = pricing[paymentForm.plan_type];
    const basePrice = plan.base_price || 0;
    const perStudent = plan.per_student || 0;
    const studentCapacity = paymentForm.student_capacity || 0;
    
    return basePrice + (studentCapacity * perStudent);
  };

  const formatCurrency = (amount) => {
    return `₦${(amount || 0).toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      case 'expired': return 'bg-red-500/20 text-red-300 border-red-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  const handleRefresh = () => {
    loadAllData();
    toast.success('Refreshing data...');
  };

  const handleGoToDashboard = () => {
    redirectToDashboard(user);
  };

  // If loading, show loading state
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-6">
      {/* Expired Payment Modal */}
      {showExpiredModal && expiredSubscription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl p-6 max-w-md w-full border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3" />
                <h3 className="text-xl font-bold">Payment Expired</h3>
              </div>
              <button
                onClick={() => setShowExpiredModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                This payment link has expired. Would you like to create a new one?
              </p>
              
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <code className="text-gray-300 font-mono text-sm">
                      {expiredSubscription.payment_reference?.slice(0, 12)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-300">{formatDate(expiredSubscription.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-gray-300 font-semibold">
                      {formatCurrency(expiredSubscription.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelPayment}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewPayment}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Create New Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Status Banner */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          subscriptionStatus.school_unlocked
            ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/10 border-green-500/30'
            : 'bg-gradient-to-r from-red-900/20 to-rose-900/10 border-red-500/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                subscriptionStatus.school_unlocked
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                {subscriptionStatus.school_unlocked ? (
                  <Unlock className="h-8 w-8 text-green-400" />
                ) : (
                  <Lock className="h-8 w-8 text-red-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {subscriptionStatus.school_unlocked
                    ? 'School Unlocked & Active'
                    : 'School Features Locked'
                  }
                </h2>
                <p className="text-gray-300 mb-4">
                  {subscriptionStatus.school_unlocked
                    ? `Your subscription is active and all features are available. You're logged in as ${user?.role || 'user'}.`
                    : 'Subscribe to unlock all school management features.'
                  }
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Status: <span className={`font-semibold ${
                        subscriptionStatus.school_unlocked ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {subscriptionStatus.school_unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Role: <span className="font-semibold text-blue-400 capitalize">
                        {user?.role || 'Unknown'}
                      </span>
                    </span>
                  </div>
                  {subscriptionStatus.expires_in > 0 && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        Expires in: {subscriptionStatus.expires_in} days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              {subscriptionStatus.school_unlocked ? (
                <button
                  onClick={handleGoToDashboard}
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg shadow-green-500/25"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg shadow-blue-500/25"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Subscribe Now</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pending Payment Notice */}
        {pendingSubscription && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/10 rounded-xl border border-yellow-500/20">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <p className="font-medium text-yellow-200">Pending Payment Detected</p>
                <p className="text-sm text-yellow-300">
                  Complete your pending payment to unlock features
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        {pricing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-400" />
                  Termly Plan
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full">
                  {pricing.termly?.duration || '4 months'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold mb-2">
                    {formatCurrency(pricing.termly?.base_price || 20000)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Base price + {formatCurrency(pricing.termly?.per_student || 2000)} per student
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Per student:</span>
                    <span className="font-medium">{formatCurrency(pricing.termly?.per_student || 2000)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-medium">{pricing.termly?.duration_days || 120} days</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-400" />
                  Yearly Plan
                </h3>
                <span className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full">
                  {pricing.yearly?.duration || '1 year'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold mb-2">
                    {formatCurrency(pricing.yearly?.base_price || 50000)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Base price + {formatCurrency(pricing.yearly?.per_student || 5000)} per student
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Per student:</span>
                    <span className="font-medium">{formatCurrency(pricing.yearly?.per_student || 5000)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-medium">{pricing.yearly?.duration_days || 365} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions Table */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Subscription History</h3>
                <p className="text-gray-400">View all your subscription records</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>New Subscription</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Loading subscriptions...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-300 mb-2">No subscriptions yet</h4>
                <p className="text-gray-500 mb-6">Create your first subscription to get started</p>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-colors"
                >
                  Create Subscription
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-700/50">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Plan</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Students</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Amount</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Valid Until</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Payment</th>
                    <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub, index) => (
                    <tr key={sub.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium">
                          {sub.plan_type === 'termly' 
                            ? `Termly - ${sub.term || 'N/A'}`
                            : `Yearly - ${sub.school_session || 'N/A'}`
                          }
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{sub.student_capacity || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold">
                        {formatCurrency(parseFloat(sub.amount) || 0)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(sub.valid_until)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(sub.status)}`}>
                          {sub.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          sub.payment_status === 'paid' 
                            ? 'bg-green-500/20 text-green-300 border-green-500'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                        }`}>
                          {sub.payment_status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {sub.payment_status === 'pending' && (
                          <button
                            onClick={() => handleCompletePayment(sub)}
                            className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Complete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl p-6 max-w-md w-full border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-400" />
                New Subscription
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                disabled={paymentLoading}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleInitializePayment} className="space-y-5">
              {/* Plan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose Plan Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, plan_type: 'termly'})}
                    className={`p-4 rounded-xl border transition-colors ${
                      paymentForm.plan_type === 'termly'
                        ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500 text-white'
                        : 'bg-slate-800/50 border-slate-600 text-gray-300 hover:border-slate-500'
                    }`}
                    disabled={paymentLoading}
                  >
                    <div className="text-left">
                      <div className="font-bold mb-1">Termly</div>
                      <div className="text-xs text-gray-400">Per term basis</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, plan_type: 'yearly'})}
                    className={`p-4 rounded-xl border transition-colors ${
                      paymentForm.plan_type === 'yearly'
                        ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500 text-white'
                        : 'bg-slate-800/50 border-slate-600 text-gray-300 hover:border-slate-500'
                    }`}
                    disabled={paymentLoading}
                  >
                    <div className="text-left">
                      <div className="font-bold mb-1">Yearly</div>
                      <div className="text-xs text-gray-400">Annual subscription</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Term Selection */}
              {paymentForm.plan_type === 'termly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Term *
                  </label>
                  <select
                    value={paymentForm.term}
                    onChange={(e) => setPaymentForm({...paymentForm, term: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    required
                    disabled={paymentLoading}
                  >
                    <option value="">Select Term</option>
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                  {errors.term && (
                    <p className="text-red-400 text-sm mt-2">{errors.term}</p>
                  )}
                </div>
              )}

              {/* Session Input */}
              {paymentForm.plan_type === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    School Session *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2024/2025"
                    value={paymentForm.school_session}
                    onChange={(e) => setPaymentForm({...paymentForm, school_session: e.target.value})}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    required
                    disabled={paymentLoading}
                  />
                  {errors.school_session && (
                    <p className="text-red-400 text-sm mt-2">{errors.school_session}</p>
                  )}
                </div>
              )}

              {/* Student Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Student Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={paymentForm.student_capacity}
                  onChange={(e) => setPaymentForm({...paymentForm, student_capacity: parseInt(e.target.value) || 1})}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  required
                  disabled={paymentLoading}
                />
                {errors.student_capacity && (
                  <p className="text-red-400 text-sm mt-2">{errors.student_capacity}</p>
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Estimated Total:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(calculateEstimatedPrice())}
                  </span>
                </div>
                {pricing && pricing[paymentForm.plan_type] && (
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Base price:</span>
                      <span>{formatCurrency(pricing[paymentForm.plan_type].base_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Students ({paymentForm.student_capacity} × {formatCurrency(pricing[paymentForm.plan_type].per_student)}):</span>
                      <span>{formatCurrency(paymentForm.student_capacity * pricing[paymentForm.plan_type].per_student)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Pay Now</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="text-center pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment via Paystack</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}