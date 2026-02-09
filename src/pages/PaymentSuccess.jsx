import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Home, ExternalLink, Clock } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = searchParams.get('reference');
    if (ref) {
      setReference(ref);
    }
    
    // Auto-close loading after 2 seconds
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    // Show success toast
    toast.success('Payment completed successfully!');
    
    // Auto-redirect to subscriptions after 5 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/admin/subscriptions');
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [navigate, searchParams]);

  const handleGoToSubscriptions = () => {
    navigate('/admin/subscriptions');
  };

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
              Thank you for your payment. Your subscription has been activated successfully.
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
                <span className="text-sm">Your subscription is now active and ready to use.</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleGoToSubscriptions}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go to Subscriptions</span>
            </button>
            
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-slate-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Processing your payment...</span>
              </div>
            ) : (
              <div className="text-green-400">
                Redirecting to subscriptions page in 5 seconds...
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 pt-4 border-t border-slate-700/50 w-full">
            <p>If you have any issues, please contact support with your transaction reference.</p>
          </div>
        </div>
      </div>
    </div>
  );
}