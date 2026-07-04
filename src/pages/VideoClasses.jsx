import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Video, Calendar, Clock, Users, Plus, Play, StopCircle, RefreshCw } from 'lucide-react';
import VideoCallComponent from '../components/Video/VideoCallComponent';

export default function VideoClasses() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    class_id: '',
    title: '',
    description: '',
    start_time: '',
    duration: 30,
  });
  const [grades, setGrades] = useState([]);
  const [saving, setSaving] = useState(false);

  const getSchoolId = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.school?.id || storedUser?.school_id;
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    fetchGrades();
    fetchSessions();
  }, []);

  const fetchGrades = async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return;

    try {
      const response = await api.get('/grades', {
        params: { school_id: schoolId }
      });
      const gradesData = response.data?.data || response.data || [];
      setGrades(gradesData);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    const schoolId = getSchoolId();
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      // Get active sessions for the user
      const response = await api.get('/video-sessions/my-active', {
        params: { school_id: schoolId }
      });
      setSessions(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load video classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    const schoolId = getSchoolId();

    try {
      const response = await api.post('/video-sessions', {
        ...form,
        school_id: schoolId
      });

      if (response.data.status === 'success') {
        toast.success('Video session created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const joinSession = (session) => {
    setActiveSession(session);
  };

  const endSession = async (sessionId) => {
    try {
      await api.post(`/video-sessions/${sessionId}/end`);
      toast.success('Session ended');
      fetchSessions();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const resetForm = () => {
    setForm({
      class_id: '',
      title: '',
      description: '',
      start_time: '',
      duration: 30,
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isTeacher = user?.role === 'admin' || user?.employee_type === 'teaching';
  const isStudent = user?.role === 'student';

  if (activeSession) {
    return (
      <VideoCallComponent
        sessionId={activeSession.id}
        onClose={() => {
          setActiveSession(null);
          fetchSessions();
        }}
      />
    );
  }

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Video Classes</h2>
          <p className="text-gray-400 mt-1">
            {isTeacher ? 'Create and manage online classes' : 'Join your scheduled online classes'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Class</span>
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Video className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Classes</p>
              <p className="text-2xl font-bold text-white">{sessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Play className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Classes</p>
              <p className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Users className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Upcoming Classes</p>
              <p className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">All Classes</h3>
        </div>
        
        <div className="divide-y divide-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Loading classes...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No video classes found</p>
              {isTeacher && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-purple-400 hover:text-purple-300"
                >
                  Create your first class
                </button>
              )}
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{session.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{session.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(session.start_time)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{session.participants?.length || 0} participants</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        session.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : session.status === 'scheduled'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {session.status === 'active' ? 'Live Now' : 
                         session.status === 'scheduled' ? 'Scheduled' : 'Ended'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.status === 'active' && (
                      <>
                        <button
                          onClick={() => joinSession(session)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <Play className="h-4 w-4" />
                          <span>Join</span>
                        </button>
                        {isTeacher && (
                          <button
                            onClick={() => endSession(session.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            <StopCircle className="h-4 w-4" />
                            <span>End</span>
                          </button>
                        )}
                      </>
                    )}
                    {session.status === 'scheduled' && (
                      <span className="text-gray-400 text-sm">
                        {new Date(session.start_time) > new Date() ? 'Upcoming' : 'Starting soon'}
                      </span>
                    )}
                    {session.status === 'ended' && (
                      <span className="text-gray-500 text-sm">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchSessions}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Create Video Class</h2>
              <p className="text-gray-400 text-sm mt-1">Schedule a new online class</p>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Class <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                  disabled={saving}
                >
                  <option value="">Select a class</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Mathematics - Algebra Lesson"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What will be covered in this class?"
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  disabled={saving}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span>Create Class</span>
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