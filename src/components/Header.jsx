import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Home, User, LayoutDashboard, Menu, Crown } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isSuperAdminArea = location.pathname.startsWith("/super-admin");
  const isAdminArea = location.pathname.startsWith("/admin");

  // For main layout (public pages)
  if (!isAdminArea && !isSuperAdminArea) {
    return (
      <header className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 shadow-lg border-b border-slate-700">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              School SaaS
            </h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </Link>

        <nav className="flex items-center space-x-6">
          {!token ? (
            <>
              {/* Public Navigation */}
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-300 hover:text-indigo-300 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                to="/login" 
                className="flex items-center space-x-2 text-gray-300 hover:text-indigo-300 transition-colors font-medium"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>

              <Link 
                to="/register/super-admin" 
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
            </>
          ) : (
            /* Authenticated User Navigation */
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Dashboard Link - Different for super admin */}
              <Link 
                to={isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard"} 
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>
      </header>
    );
  }

  // For admin/super-admin layout (protected pages)
  return (
    <header className="flex items-center justify-between bg-slate-800 px-6 py-4 border-b border-slate-700">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Page title */}
      <div className="flex-1 lg:flex-none">
        <h1 className="text-xl font-semibold text-white">
          {getPageTitle(location.pathname)}
        </h1>
        <p className="text-sm text-gray-400">
          Welcome back, {user?.name}
          {isSuperAdmin && (
            <span className="ml-2 text-yellow-400">
              • Super Administrator
            </span>
          )}
        </p>
      </div>

      {/* Admin Header Navigation */}
      <nav className="flex items-center space-x-4">
        {/* User Info */}
        <div className="hidden md:flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isSuperAdmin ? 'bg-yellow-500' : 'bg-indigo-500'
          }`}>
            {isSuperAdmin ? (
              <Crown className="h-4 w-4 text-white" />
            ) : (
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-white font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Register Button (only for Super Admin) */}
        {isSuperAdmin && (
          <Link 
            to="/admin/register" 
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Register User</span>
          </Link>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-slate-800 border-b border-slate-700 lg:hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSuperAdmin ? 'bg-yellow-500' : 'bg-indigo-500'
              }`}>
                {isSuperAdmin ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <span className="text-white font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
              </div>
            </div>
            
            {isSuperAdmin && (
              <Link 
                to="/admin/register" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus className="h-5 w-5" />
                <span>Register User</span>
              </Link>
            )}
            
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-gray-300 hover:text-red-400 w-full py-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// Helper function to get page title from pathname
function getPageTitle(pathname) {
  const routes = {
    '/super-admin/dashboard': 'Super Admin Dashboard',
    '/admin/dashboard': 'Dashboard',
    '/admin/schools': 'Schools',
    '/admin/students': 'Students',
    '/admin/parents': 'Parents',
    '/admin/employees': 'Employees',
    '/admin/fees': 'Fees',
    '/admin/feepayments': 'Fee Payments',
    '/admin/transactions': 'Transactions',
    '/admin/subscriptions': 'Subscriptions',
    '/admin/incomes': 'Income',
    '/admin/expenses': 'Expenses',
    '/admin/results': 'Results',
    '/admin/resultlockers': 'Result Locker',
    '/admin/register': 'Register User'
  };
  
  return routes[pathname] || 'Admin Panel';
}