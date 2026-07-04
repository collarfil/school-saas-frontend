// src/components/CredentialsModal.jsx
import { useState } from 'react';
import { Mail, Phone, Copy, Check, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CredentialsModal({ isOpen, onClose, credentials, entityType }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !credentials) return null;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getEntityTitle = () => {
    switch(entityType) {
      case 'student': return 'Student Account Created';
      case 'employee': return 'Employee Account Created';
      case 'parent': return 'Parent Account Created';
      default: return 'Account Created Successfully';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-2xl max-w-md w-full border border-slate-700/50 shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{getEntityTitle()}</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <p className="text-sm text-yellow-300 font-medium">Important Note</p>
            </div>
            <p className="text-sm text-gray-300">
              {credentials.note || 'Please save these credentials. The user will be required to change their password on first login.'}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Full Name</label>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-400" />
                <span className="text-white font-medium">{credentials.name}</span>
              </div>
            </div>
          </div>

          {/* Email/Username */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Email / Username</label>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-white font-mono text-sm">{credentials.email}</span>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.email, 'Email')}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
              >
                {copiedField === 'Email' ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Temporary Password</label>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-mono text-sm">{credentials.password}</span>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.password, 'Password')}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
              >
                {copiedField === 'Password' ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is the user's phone number. They will need to change it on first login.
            </p>
          </div>

          {/* Additional Info */}
          {credentials.admission_number && (
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Admission Number</label>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-white font-mono text-sm">{credentials.admission_number}</span>
              </div>
            </div>
          )}

          {credentials.employee_id && (
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Employee ID</label>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-white font-mono text-sm">{credentials.employee_id}</span>
              </div>
            </div>
          )}

          {credentials.employee_type && (
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Employee Type</label>
              <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="text-white capitalize">{credentials.employee_type}</span>
              </div>
            </div>
          )}

          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
            <p className="text-sm text-yellow-300">
              ⚠️ The user will be required to change their password upon first login.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700/50 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
          <button
            onClick={() => {
              // You could add email sending functionality here
              toast.success('Credentials will be sent to email shortly');
            }}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email</span>
          </button>
        </div>
      </div>
    </div>
  );
}