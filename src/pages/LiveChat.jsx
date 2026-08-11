import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Send, MessageSquare, User, Clock, Trash2, Reply, XCircle } from "lucide-react";

export default function LiveChat() {
  const [messages, setMessages] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  const getSchoolId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.school?.id || user?.school_id;
  };

  const fetchMeetings = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    try {
      const res = await api.get("/meetings", { params: { school_id: schoolId } });
      setMeetings(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch meetings:", err);
      toast.error("Failed to load meetings");
    }
  };

  const fetchMessages = async () => {
    if (!selectedMeeting) return;
    
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      const res = await api.get("/live-chat", { 
        params: { meeting_id: selectedMeeting, school_id: schoolId } 
      });
      setMessages(res.data?.data || []);
      scrollToBottom();
    } catch (err) {
      console.error("❌ Failed to fetch messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeeting) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMeeting]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedMeeting) {
      toast.error("Please select a meeting");
      return;
    }

    setSending(true);
    try {
      const schoolId = getSchoolId();
      const payload = {
        meeting_id: selectedMeeting,
        school_id: schoolId,
        message: messageText.trim() || replyMessage.trim(),
        reply_to: replyTo,
        is_teacher_message: user?.role === 'admin' || user?.role === 'employee'
      };

      await api.post("/live-chat", payload);
      
      setMessageText("");
      setReplyMessage("");
      setReplyTo(null);
      await fetchMessages();
      scrollToBottom();
      
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message.id);
    setReplyMessage(`@${message.user?.name || 'Unknown'}: `);
    document.getElementById('message-input')?.focus();
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      const schoolId = getSchoolId();
      await api.delete(`/live-chat/${messageId}`, {
        params: { school_id: schoolId }
      });
      toast.success("Message deleted");
      await fetchMessages();
    } catch (err) {
      console.error("❌ Failed to delete message:", err);
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTeacher = user?.role === 'admin' || user?.role === 'employee';

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Live Chat</h2>
          <p className="text-gray-400 text-sm">Real-time messaging for online classes</p>
        </div>
      </div>

      {/* Meeting Selector */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Select Meeting <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedMeeting}
            onChange={(e) => setSelectedMeeting(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Select a meeting to chat</option>
            {meetings.map((meeting) => (
              <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      {selectedMeeting ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-1">
                  <div className={`flex items-start gap-3 ${message.is_teacher_message ? 'bg-blue-900/20 p-2 rounded-lg' : ''}`}>
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        message.is_teacher_message ? 'bg-blue-600' : 'bg-slate-600'
                      }`}>
                        {message.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {message.user?.name || 'Unknown'}
                          {message.is_teacher_message && (
                            <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded-full">Teacher</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => handleReply(message)}
                            className="text-gray-400 hover:text-blue-400 p-1 rounded transition-colors"
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          {(isTeacher || message.user_id === user?.id) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap mt-1">
                        {message.message}
                      </p>
                      {message.replies && message.replies.length > 0 && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-slate-600 pl-3">
                          {message.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
                                  {reply.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-xs">{reply.user?.name || 'Unknown'}</span>
                                  <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-xs text-gray-300">{reply.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Indicator */}
          {replyTo && (
            <div className="px-4 py-2 bg-slate-700/50 border-t border-slate-600 flex items-center justify-between">
              <span className="text-sm text-gray-300">
                Replying to: <span className="text-blue-400">
                  {messages.find(m => m.id === replyTo)?.user?.name || 'Unknown'}
                </span>
              </span>
              <button
                onClick={() => { setReplyTo(null); setReplyMessage(""); }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 flex gap-3">
            <input
              id="message-input"
              type="text"
              placeholder={replyTo ? "Type your reply..." : "Type your message..."}
              value={replyTo ? replyMessage : messageText}
              onChange={(e) => {
                if (replyTo) {
                  setReplyMessage(e.target.value);
                } else {
                  setMessageText(e.target.value);
                }
              }}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || (!messageText.trim() && !replyMessage.trim())}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">Select a Meeting</h3>
          <p className="text-gray-400 mt-2">Choose a meeting from the dropdown above to start chatting</p>
        </div>
      )}
    </div>
  );
}