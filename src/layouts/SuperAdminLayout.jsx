// src/layouts/SuperAdminLayout.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { LayoutDashboard, School, Users, Settings, LogOut, Menu, X, Crown } from "lucide-react";

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const normalizeRole = (role) => role?.toLowerCase().replace(/\s+/g, "_");

    if (!savedUser?.role || normalizeRole(savedUser.role) !== "super_admin") {
      navigate("/login", { replace: true });
    } else {
      setUser(savedUser);
      setLoading(false);
    }
  }, [navigate]);

  const menuItems = [
    { path: "/super-admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/super-admin/schools", icon: School, label: "Schools" },
    { path: "/super-admin/register", icon: Users, label: "Create Users" },
    { path: "/super-admin/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              <span className="font-bold text-lg">SuperAdmin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-slate-700 text-white'
                    : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 hover:bg-slate-700 rounded">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">{menuItems.find(item => item.path === location.pathname)?.label || 'Super Admin'}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-300">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}