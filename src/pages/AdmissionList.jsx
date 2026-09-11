import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdmissionList = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admissions/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Extract array safely across various backend response structures
      const responseData = res.data;
      if (Array.isArray(responseData)) {
        setApplicants(responseData);
      } else if (Array.isArray(responseData?.data)) {
        setApplicants(responseData.data);
      } else if (Array.isArray(responseData?.data?.data)) {
        setApplicants(responseData.data.data);
      } else if (Array.isArray(responseData?.applicants)) {
        setApplicants(responseData.applicants);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Failed to load admission list:', err);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admissions/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setApplicants((prev) =>
        (Array.isArray(prev) ? prev : []).map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-4">Loading applicants...</div>;

  const applicantList = Array.isArray(applicants) ? applicants : [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admission Applications List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Applicant Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicantList.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No applicants found.
                </td>
              </tr>
            ) : (
              applicantList.map((app) => (
                <tr key={app.id || app._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {app.fullName || `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'N/A'}
                  </td>
                  <td className="p-3">{app.email || 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      app.status === 'Admitted' || app.status === 'admitted' ? 'bg-green-100 text-green-800' :
                      app.status === 'Rejected' || app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      value={app.status || 'Pending'}
                      onChange={(e) => handleStatusChange(app.id || app._id, e.target.value)}
                      className="border p-1 rounded bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Admitted">Admitted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdmissionList;