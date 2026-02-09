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
      {/* Sidebar */}
      {/* ... sidebar code same as your previous code ... */}
      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 hover:bg-slate-700 rounded">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">{menuItems.find(item => item.path === location.pathname)?.label || 'Super Admin'}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
