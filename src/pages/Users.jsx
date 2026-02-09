// src/pages/Users.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleColor = (role) => {
    const colors = {
      super_admin: 'bg-purple-500/20 text-purple-300 border-purple-500',
      admin: 'bg-blue-500/20 text-blue-300 border-blue-500',
      employee: 'bg-green-500/20 text-green-300 border-green-500',
      student: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
      parent: 'bg-orange-500/20 text-orange-300 border-orange-500'
    };
    return colors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500';
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-gray-400">Manage system users</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No users found</div>
            <p className="text-gray-500">Users will appear here once registered</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">School</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-slate-700/40 transition-colors">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">{user.school?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}