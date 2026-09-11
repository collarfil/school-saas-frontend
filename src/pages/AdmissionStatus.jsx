import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import publicApi from "../api/axios"; // <-- Use publicApi
import { Search, CheckCircle, XCircle, Clock, AlertCircle, User, Calendar, Mail, Phone } from "lucide-react";

export default function AdmissionStatus() {
  const navigate = useNavigate();
  const [applicationNumber, setApplicationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!applicationNumber && !email) {
      toast.error("Please enter either Application Number or Email");
      return;
    }

    setLoading(true);
    setNotFound(false);
    setApplication(null);

    try {
      const params = {};
      if (applicationNumber) params.application_number = applicationNumber;
      if (email) params.email = email;

      const response = await publicApi.get("/admissions/status", { params });
      
      if (response.data?.status === 'success' && response.data?.data) {
        setApplication(response.data.data);
      } else {
        setNotFound(true);
        toast.error("Application not found. Please check your details.");
      }
    } catch (err) {
      console.error('❌ Status check error:', err);
      setNotFound(true);
      toast.error("Failed to check application status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500", icon: <Clock className="w-4 h-4" /> },
      under_review: { color: "bg-blue-500/20 text-blue-300 border-blue-500", icon: <Clock className="w-4 h-4" /> },
      interview_scheduled: { color: "bg-purple-500/20 text-purple-300 border-purple-500", icon: <Calendar className="w-4 h-4" /> },
      admitted: { color: "bg-green-500/20 text-green-300 border-green-500", icon: <CheckCircle className="w-4 h-4" /> },
      rejected: { color: "bg-red-500/20 text-red-300 border-red-500", icon: <XCircle className="w-4 h-4" /> },
      enrolled: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500", icon: <CheckCircle className="w-4 h-4" /> },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${s.color}`}>
        {s.icon}
        {status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Check Admission Status</h1>
          <p className="text-gray-400 mt-2">Enter your application number or email to check your admission status</p>
        </div>

        {/* Search Form */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Application Number</label>
              <input
                type="text"
                placeholder="e.g., ADM-2026-XXXXX"
                value={applicationNumber}
                onChange={(e) => setApplicationNumber(e.target.value)}
                className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {application && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Application Details</h3>
              {getStatusBadge(application.status)}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Applicant Name</p>
                  <p className="text-white font-medium">
                    {application.first_name} {application.middle_name || ''} {application.last_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-white">{application.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-white">{application.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Target Grade</p>
                  <p className="text-white">{application.grade?.name || 'N/A'}</p>
                </div>
              </div>

              {application.interview_date && (
                <div className="flex items-start gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                  <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-purple-300">Interview Scheduled</p>
                    <p className="text-purple-200 font-medium">
                      {formatDate(application.interview_date)}
                      {application.interview_venue && ` at ${application.interview_venue}`}
                    </p>
                  </div>
                </div>
              )}

              {application.rejection_reason && (
                <div className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-300">Reason</p>
                    <p className="text-red-200">{application.rejection_reason}</p>
                  </div>
                </div>
              )}

              {application.admission_list_id && (
                <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-green-300">Admission List</p>
                    <p className="text-green-200 font-medium">
                      {application.admission_list?.title || 'Admitted'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Application #: <span className="font-mono text-blue-400">{application.application_number}</span>
              </p>
              <p className="text-xs text-gray-500">
                Submitted: {formatDate(application.created_at)}
              </p>
            </div>
          </div>
        )}

        {notFound && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Application Not Found</h3>
            <p className="text-gray-400 mb-4">
              We couldn't find an application matching your search criteria.
              Please check your application number or email and try again.
            </p>
            <button
              onClick={() => navigate('/admission/apply')}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              New Application →
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Need help? <button className="text-blue-400 hover:text-blue-300">Contact Admissions</button>
          </p>
        </div>
      </div>
    </div>
  );
}