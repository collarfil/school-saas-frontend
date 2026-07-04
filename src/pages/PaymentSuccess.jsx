import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, Home, ExternalLink, Clock, Loader, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ref = searchParams.get('reference');
    if (ref) {
      setReference(ref);
      verifyPayment(ref);
    } else {
      setError('No payment reference found');
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyPayment = async (ref) => {
    try {
      const response = await api.post('/subscriptions/verify', { reference: ref });
      
      if (response.data.status === 'success') {
        setSuccess(true);
        toast.success('Payment successful! Your school is now activated.');
        
        // Update user data in localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.school) {
          user.school.is_unlocked = true;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        // Auto redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/school/dashboard', { replace: true });
        }, 3000);
      } else {
        setError('Payment verification failed');
        toast.error('Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment. Please contact support.');
      toast.error('Payment verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/school/dashboard');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader className="h-16 w-16 animate-spin mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
          <p className="text-gray-300">Please wait while we confirm your transaction</p>
          {reference && (
            <p className="text-sm text-gray-400 mt-4">Reference: {reference}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Payment Verification Failed</h2>
          <p className="mb-2">{error}</p>
          <p className="mb-8">Please contact support or try again.</p>
          <button
            onClick={() => navigate('/school/subscriptions')}
            className="bg-white text-red-700 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Return to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-900/20 to-emerald-900/10 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">
              Payment Successful!
            </h1>
            
            <p className="text-gray-300">
              Thank you for your payment. Your school has been activated successfully.
            </p>
            
            {reference && (
              <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400">Transaction Reference:</p>
                <code className="font-mono text-white text-sm break-all">
                  {reference}
                </code>
              </div>
            )}
            
            <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
              <div className="flex items-center space-x-2 text-green-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Redirecting to dashboard...</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleGoToDashboard}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </button>
            
            <button
              onClick={handlePrintReceipt}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-slate-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500 pt-4 border-t border-slate-700/50 w-full">
            <p>If you have any issues, please contact support with your transaction reference.</p>
          </div>
        </div>
      </div>
    </div>
  );
}