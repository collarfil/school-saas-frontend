import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, AlertCircle, Home } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const ref = searchParams.get('reference');
      const errorParam = searchParams.get('error');
      
      if (errorParam) {
        setPaymentStatus('error');
        setMessage('Payment was cancelled or failed');
        setError(errorParam);
        toast.error('Payment was cancelled');
        return;
      }

      if (!ref) {
        setPaymentStatus('error');
        setMessage('No payment reference found');
        toast.error('Invalid payment reference');
        return;
      }

      setReference(ref);

      try {
        // Verify payment with backend
        const response = await api.post('/payments/verify', {
          reference: ref
        });

        if (response.data.status === 'success') {
          setPaymentStatus('success');
          setMessage('Payment verified successfully!');
          
          // Show success toast
          toast.success('Payment completed successfully!', {
            duration: 5000
          });

          // Redirect to subscriptions page after 3 seconds
          setTimeout(() => {
            navigate('/subscriptions');
          }, 3000);
        } else {
          setPaymentStatus('error');
          setMessage(response.data.message || 'Payment verification failed');
          toast.error('Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setPaymentStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify payment');
        toast.error('Payment verification failed');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    if (reference) {
      // Try to continue the payment
      window.location.href = `https://checkout.paystack.com/${reference}`;
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return 'bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-500/30';
      case 'error':
        return 'bg-gradient-to-br from-red-900/20 to-rose-900/10 border-red-500/30';
      default:
        return 'bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center p-4">
      <div className={`w-full max-w-md p-8 rounded-2xl border ${getStatusColor()} shadow-2xl`}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            {getStatusIcon()}
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">
              {paymentStatus === 'success' && 'Payment Successful!'}
              {paymentStatus === 'error' && 'Payment Failed'}
              {paymentStatus === 'verifying' && 'Verifying Payment'}
            </h1>
            
            <p className="text-gray-300">
              {message}
            </p>
            
            {reference && (
              <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400">Reference:</p>
                <code className="font-mono text-white text-sm break-all">
                  {reference}
                </code>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {paymentStatus === 'error' && reference && (
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Retry Payment</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/subscriptions')}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-slate-700"
            >
              <Home className="h-4 w-4" />
              <span>Go to Subscriptions</span>
            </button>
          </div>
          
          {paymentStatus === 'verifying' && (
            <div className="text-sm text-gray-400">
              Please wait while we verify your payment...
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="text-sm text-green-400">
              Redirecting to subscriptions page in 3 seconds...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}