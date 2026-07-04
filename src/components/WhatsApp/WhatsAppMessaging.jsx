import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Send, Users, Phone } from 'lucide-react';

export default function WhatsAppMessaging({ onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState([]);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.school?.id || user?.school_id;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber && recipients.length === 0) {
      toast.error('Please enter a phone number or select recipients');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    const schoolId = getSchoolId();

    try {
      // If multiple recipients, send to each
      const numbers = recipients.length > 0 ? recipients : [phoneNumber];
      
      for (const number of numbers) {
        await api.post('/whatsapp/send', {
          to_number: number,
          message: message,
          school_id: schoolId
        });
      }

      toast.success(`Message sent to ${numbers.length} recipient(s)`);
      setPhoneNumber('');
      setMessage('');
      setRecipients([]);
      onClose();
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-800 border-l border-slate-700 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold">WhatsApp Broadcast</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={sendMessage} className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number (with country code)
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 2348012345678"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
            disabled={sending}
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: 2348012345678 (Nigeria)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 resize-none"
            disabled={sending}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Send WhatsApp Message</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}