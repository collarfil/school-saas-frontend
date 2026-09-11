// src/pages/PublicAdmissionList.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import publicApi from "../api/axios"; // <-- Use publicApi instead of api
import { Search, Calendar, Award, CheckCircle, Users, FileText, ExternalLink } from "lucide-react";

export default function PublicAdmissionList() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplicants, setShowApplicants] = useState(false);

  const getSchoolId = () => {
    return 1; // Default school ID for public view
  };

  useEffect(() => {
    fetchPublishedLists();
  }, []);

  const fetchPublishedLists = async () => {
    setLoading(true);
    try {
      const schoolId = getSchoolId();
      const response = await publicApi.get("/admission-lists", {
        params: { school_id: schoolId, is_published: true }
      });
      
      const listsData = response.data?.data?.data || response.data?.data || [];
      setLists(listsData);
    } catch (err) {
      console.error('Failed to fetch admission lists:', err);
      setLists([]);
      // Don't show toast for public errors - just show empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchListApplicants = async (listId) => {
    try {
      const schoolId = getSchoolId();
      const response = await publicApi.get(`/admission-lists/${listId}`, {
        params: { school_id: schoolId }
      });
      
      const data = response.data?.data;
      setApplicants(data?.applicants || []);
      setSelectedList(data);
      setShowApplicants(true);
    } catch (err) {
      console.error('Failed to fetch list applicants:', err);
      toast.error('Failed to load admission list');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredApplicants = applicants.filter(app => {
    const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || 
           (app.application_number || '').toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admission lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admission Lists</h1>
          <p className="text-gray-400 mt-2">Check published admission lists and results</p>
        </div>

        {!showApplicants ? (
          // Show list of published admission lists
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.length === 0 ? (
              <div className="col-span-full bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300">No Admission Lists Published</h3>
                <p className="text-gray-500 mt-2">Check back later for updates</p>
                <button
                  onClick={() => navigate('/admission/apply')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  Apply for Admission
                </button>
              </div>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => fetchListApplicants(list.id)}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {list.title}
                      </h3>
                      <p className="text-sm text-gray-400">{list.batch_number}</p>
                    </div>
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs border border-green-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Published
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Published: {formatDate(list.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{list.applicants_count || 0} applicants</span>
                    </div>
                    {list.grade && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span>{list.grade.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {list.school_session?.name || 'N/A'}
                    </span>
                    <span className="text-blue-400 group-hover:text-blue-300 text-sm flex items-center gap-1">
                      View Applicants
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Show applicants in a list
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedList?.title}</h3>
                <p className="text-sm text-gray-400">{selectedList?.batch_number}</p>
              </div>
              <button
                onClick={() => { setShowApplicants(false); setSelectedList(null); setApplicants([]); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                ← Back to Lists
              </button>
            </div>

            <div className="p-4 border-b border-slate-700">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or application number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Application #</th>
                    <th className="py-3 px-4">Applicant Name</th>
                    <th className="py-3 px-4">Target Grade</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400">
                        No applicants found
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-blue-400">
                          {app.application_number || `ADM-${app.id}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {app.first_name || ''} {app.last_name || ''}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {app.grade?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                            ADMITTED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between text-xs text-gray-400">
              <span>Total: {filteredApplicants.length} applicants</span>
              <span>Published: {formatDate(selectedList?.published_at)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}