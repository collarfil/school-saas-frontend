import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  School,
  Calendar,
  Grid,
  ClipboardList,
  Book,
  Users,
  User,
  Video,
  Briefcase,
  Wallet,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  FileText,
  Lock,
  ChevronDown,
  BarChart3,
  Receipt,
  PieChart,
  Crown,
  AlertTriangle,
  CalendarDays,
  GraduationCap,
  DollarSign,
  // ADD MISSING IMPORTS
  MessageCircle,  // For Live Chat
  Edit,           // For Whiteboard
  UserPlus,       // For Admissions
  Settings        // For Settings (if needed)
} from "lucide-react";
import api from '../api/axios';

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    // Super admin always has full access
    if (user.role === 'super_admin') {
      setHasActiveSubscription(true);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/subscriptions/status/check');
      setHasActiveSubscription(response.data.has_active_subscription);
    } catch (error) {
      console.error('Subscription check failed:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  // Define menu configurations based on your role system
  const getMenuItems = () => {
    const role = user.role;
    const employeeType = user.employee_type;
    
    // Common menus for all roles
    const commonMenus = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: <Home className="w-4 h-4" />,
        type: 'single',
        requiresSubscription: role !== 'super_admin'
      },
    ];

    // Admin (School Admin) - Full Access
    if (role === 'admin') {
      return [
        ...commonMenus.map(menu => ({
          ...menu,
          path: '/school/dashboard'
        })),
        {
          id: 'school',
          title: 'School',
          icon: <School className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Session", path: "/school/sessions", icon: <Calendar className="w-4 h-4" /> },
            { name: "Section", path: "/school/sections", icon: <Grid className="w-4 h-4" /> },
            { name: "Grade", path: "/school/grades", icon: <ClipboardList className="w-4 h-4" /> },
            { name: "Subject", path: "/school/subjects", icon: <Book className="w-4 h-4" /> },
            { name: "Admission", path: "/school/admissions", icon: <UserPlus className="w-4 h-4" /> },
          ]
        },
        {
          id: 'student',
          title: 'Student',
          icon: <Users className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Parent", path: "/school/parents", icon: <User className="w-4 h-4" /> },
            { name: "Student", path: "/school/students", icon: <Users className="w-4 h-4" /> },
          ]
        },
        {
          id: 'financials',
          title: 'Financials',
          icon: <Wallet className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: false,
          submenus: [
            { name: "Subscription", path: "/school/subscriptions", icon: <Crown className="w-4 h-4" /> },
            { name: "Fees", path: "/school/fees", icon: <Wallet className="w-4 h-4" />, requiresSubscription: true },
            { name: "Fee Payment", path: "/school/feepayments", icon: <CreditCard className="w-4 h-4" />, requiresSubscription: true },
            { name: "Transaction", path: "/school/transactions", icon: <ShoppingBag className="w-4 h-4" />, requiresSubscription: true },
            { name: "Income", path: "/school/incomes", icon: <TrendingUp className="w-4 h-4" />, requiresSubscription: true },
            { name: "Expense", path: "/school/expenses", icon: <TrendingDown className="w-4 h-4" />, requiresSubscription: true },
          ]
        },
        {
          id: 'employee',
          title: 'Employee',
          icon: <Briefcase className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Employee", path: "/school/employees", icon: <Briefcase className="w-4 h-4" /> },
            { name: "Employee-Grade", path: "/school/employee-grades", icon: <ClipboardList className="w-4 h-4" /> },
            { name: "Employee-Subject", path: "/school/employee-subjects", icon: <Book className="w-4 h-4" /> },
            { name: "Attendance", path: "/school/attendances", icon: <CalendarDays className="w-4 h-4" /> },
            { name: "Timetable", path: "/school/timetables", icon: <Calendar className="w-4 h-4" /> },
          ]
        },
        {
          id: 'onlinelearning',
          title: 'Online Learning',
          icon: <Book className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Live Classes", path: "/school/live-classes", icon: <Book className="w-4 h-4" /> },
            { name: "Assignments", path: "/school/assignments", icon: <Grid className="w-4 h-4" /> },
            { name: "Assignment Submissions", path: "/school/assignment-submissions", icon: <Users className="w-4 h-4" /> },
            { name: "Class Attendance", path: "/school/class-attendances", icon: <CalendarDays className="w-4 h-4" /> },
            { name: "Recordings", path: "/school/recordings", icon: <Video className="w-4 h-4" /> },
            { name: "Meetings", path: "/school/meetings", icon: <CalendarDays className="w-4 h-4" /> },
            { name: "Meeting Participants", path: "/school/meeting-participants", icon: <Users className="w-4 h-4" /> },
            { name: "Polls", path: "/school/polls", icon: <ClipboardList className="w-4 h-4" /> },
            { name: "Poll Responses", path: "/school/poll-responses", icon: <Users className="w-4 h-4" /> },
            { name: "Live Chat", path: "/school/live-chats", icon: <MessageCircle className="w-4 h-4" /> },
            { name: "Whiteboard", path: "/school/whiteboards", icon: <Edit className="w-4 h-4" /> },
          ]
        },
        {
          id: 'reports',
          title: 'Reports',
          icon: <BarChart3 className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Student Result", path: "/school/reports/student-results", icon: <FileText className="w-4 h-4" /> },
            { name: "School Fee Receipts", path: "/school/reports/fee-receipts", icon: <Receipt className="w-4 h-4" /> },
            { name: "Income & Expenditure", path: "/school/reports/income-expenditure", icon: <PieChart className="w-4 h-4" /> },
            { name: "Academic Reports", path: "/school/reports/academic", icon: <BarChart3 className="w-4 h-4" /> },
            { name: "Employee Reports", path: "/school/reports/employees", icon: <Briefcase className="w-4 h-4" /> },
          ]
        },
        {
          id: 'academic',
          title: 'Academic Records',
          icon: <FileText className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Results", path: "/school/results", icon: <FileText className="w-4 h-4" /> },
            { name: "Result Locker", path: "/school/resultlockers", icon: <Lock className="w-4 h-4" /> },
          ]
        }
      ];
    }

    // Employee - Teaching Staff
    if (role === 'employee' && employeeType === 'teaching') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/employee/dashboard',
          type: 'single',
          requiresSubscription: true
        },
        {
          id: 'academic',
          title: 'Academic',
          icon: <FileText className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Attendance", path: "/employee/attendances", icon: <CalendarDays className="w-4 h-4" /> },
            { name: "Results", path: "/employee/results", icon: <FileText className="w-4 h-4" /> },
          ]
        }
      ];
    }

    // Employee - Non-Teaching Staff (Account)
    if (role === 'employee' && employeeType === 'non_teaching') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/account/dashboard',
          type: 'single',
          requiresSubscription: true
        },
        {
          id: 'financials',
          title: 'Financials',
          icon: <Wallet className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: false,
          submenus: [
            { name: "Subscription", path: "/school/subscriptions", icon: <Crown className="w-4 h-4" /> },
            { name: "Fees", path: "/account/fees", icon: <Wallet className="w-4 h-4" />, requiresSubscription: true },
            { name: "Fee Payment", path: "/account/feepayments", icon: <CreditCard className="w-4 h-4" />, requiresSubscription: true },
            { name: "Transaction", path: "/account/transactions", icon: <ShoppingBag className="w-4 h-4" />, requiresSubscription: true },
            { name: "Income", path: "/account/incomes", icon: <TrendingUp className="w-4 h-4" />, requiresSubscription: true },
            { name: "Expense", path: "/account/expenses", icon: <TrendingDown className="w-4 h-4" />, requiresSubscription: true },
          ]
        }
      ];
    }

    // Student
    if (role === 'student') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/student/dashboard',
          type: 'single',
          requiresSubscription: true
        },
        {
          id: 'academic',
          title: 'My Academic',
          icon: <GraduationCap className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Report Card", path: "/student/report-card", icon: <FileText className="w-4 h-4" /> },
            { name: "PTA Information", path: "/student/pta", icon: <Users className="w-4 h-4" /> },
          ]
        }
      ];
    }

    // Parent
    if (role === 'parent') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/parent/dashboard',
          type: 'single',
          requiresSubscription: true
        },
        {
          id: 'academic',
          title: "Child's Information",
          icon: <User className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: true,
          submenus: [
            { name: "Report Card", path: "/parent/report-card", icon: <FileText className="w-4 h-4" /> },
            { name: "PTA Information", path: "/parent/pta", icon: <Users className="w-4 h-4" /> },
          ]
        }
      ];
    }

    // Super Admin
    if (role === 'super_admin') {
      return [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: <Home className="w-4 h-4" />,
          path: '/super-admin/dashboard',
          type: 'single',
          requiresSubscription: false
        },
        {
          id: 'platform',
          title: 'Platform Management',
          icon: <School className="w-4 h-4" />,
          type: 'dropdown',
          requiresSubscription: false,
          submenus: [
            { name: "Schools", path: "/super-admin/schools", icon: <School className="w-4 h-4" /> },
            { name: "Subscriptions", path: "/super-admin/subscriptions", icon: <Crown className="w-4 h-4" /> },
            { name: "Pricing", path: "/super-admin/pricing", icon: <DollarSign className="w-4 h-4" /> },
          ]
        }
      ];
    }

    return commonMenus;
  };

  const menuItems = getMenuItems();

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuOpen = (menuId) => openMenus.includes(menuId);
  const isActiveLink = (path) => pathname === path;
  const isActiveMenu = (menu) => {
    if (menu.type === 'single') return isActiveLink(menu.path);
    if (menu.type === 'dropdown') {
      return menu.submenus.some(submenu => isActiveLink(submenu.path));
    }
    return false;
  };

  const canAccessMenuItem = (menu) => {
    // Super admin always has access
    if (user.role === 'super_admin') return true;
    
    // Admin always sees all menus (even without subscription)
    if (user.role === 'admin') return true;
    
    // For other roles, check subscription
    if (!menu.requiresSubscription) return true;
    return hasActiveSubscription;
  };

  const canAccessSubmenu = (submenu) => {
    // Super admin always has access
    if (user.role === 'super_admin') return true;
    
    // Admin always sees all submenus
    if (user.role === 'admin') return true;
    
    // For other roles, check subscription
    if (!submenu.requiresSubscription) return true;
    return hasActiveSubscription;
  };

  const handleMenuClick = (menu, submenu = null) => {
    const targetPath = submenu ? submenu.path : menu.path;
    const requiresSub = submenu ? submenu.requiresSubscription : menu.requiresSubscription;
    
    // Super admin and admin bypass subscription checks for viewing
    if (['super_admin', 'admin'].includes(user.role)) return true;
    
    if (requiresSub && !hasActiveSubscription) {
      // Redirect to subscription page
      navigate('/school/subscriptions');
      return false;
    }
    return true;
  };

  const getRoleDisplayName = () => {
    const role = user.role;
    const employeeType = user.employee_type;
    
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'School Admin';
    if (role === 'employee') {
      return employeeType === 'teaching' ? 'Teaching Staff' : 'Account Staff';
    }
    if (role === 'student') return 'Student';
    if (role === 'parent') return 'Parent';
    return role;
  };

  const getDashboardTitle = () => {
    const role = user.role;
    const employeeType = user.employee_type;
    
    if (role === 'super_admin') return 'Super Admin Panel';
    if (role === 'admin') return 'Admin Panel';
    if (role === 'employee') {
      return employeeType === 'teaching' ? 'Teaching Staff Panel' : 'Account Staff Panel';
    }
    if (role === 'student') return 'Student Portal';
    if (role === 'parent') return 'Parent Portal';
    return 'School System';
  };

  const getDashboardSubtitle = () => {
    const role = user.role;
    const employeeType = user.employee_type;
    
    if (role === 'super_admin') return 'Platform Management';
    if (role === 'admin') return 'School Management System';
    if (role === 'employee') {
      return employeeType === 'teaching' ? 'Teaching Dashboard' : 'Financial Dashboard';
    }
    if (role === 'student') return 'Student Dashboard';
    if (role === 'parent') return 'Parent Dashboard';
    return 'School Portal';
  };

  if (loading) {
    return (
      <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col h-screen overflow-hidden border-r border-slate-700">
        <div className="p-6 border-b border-slate-700 bg-slate-800">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col h-screen overflow-hidden border-r border-slate-700">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <h2 className="text-2xl font-bold text-white text-center">
          {getDashboardTitle()}
        </h2>
        <p className="text-sm text-slate-300 text-center mt-2">
          {getDashboardSubtitle()}
        </p>
        
        <div className="mt-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
          <p className="text-sm text-blue-300 text-center font-medium">
            {getRoleDisplayName()}
          </p>
        </div>
        
        {/* Subscription Status Badge */}
        {user.role !== 'super_admin' && user.role !== 'admin' && (
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium text-center ${
            hasActiveSubscription 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          }`}>
            {hasActiveSubscription ? '✓ Active Subscription' : '⚠ Subscription Required'}
          </div>
        )}
        
        {/* Admin Subscription Warning */}
        {user.role === 'admin' && !hasActiveSubscription && (
          <div className="mt-3 px-3 py-1 rounded-full text-xs font-medium text-center bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            ⚠ Limited Access Mode
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-4">
          {menuItems.map((menu) => {
            if (!canAccessMenuItem(menu)) return null;

            return (
              <div key={menu.id} className="space-y-1">
                {/* Single Menu Item */}
                {menu.type === 'single' && (
                  <Link
                    to={menu.path}
                    onClick={(e) => {
                      if (!handleMenuClick(menu)) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActiveLink(menu.path)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white border border-transparent"
                    } ${!canAccessMenuItem(menu) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`transition-transform duration-200 ${isActiveLink(menu.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {menu.icon}
                    </div>
                    <span className="font-medium">{menu.title}</span>
                    {isActiveLink(menu.path) && (
                      <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full"></div>
                    )}
                    {!canAccessMenuItem(menu) && (
                      <AlertTriangle className="w-4 h-4 text-yellow-400 ml-auto" />
                    )}
                  </Link>
                )}

                {/* Dropdown Menu Item */}
                {menu.type === 'dropdown' && (
                  <>
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group border ${
                        isActiveMenu(menu)
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-200 ${isActiveMenu(menu) ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {menu.icon}
                        </div>
                        <span className="font-medium">{menu.title}</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isMenuOpen(menu.id) ? 'rotate-180 text-blue-300' : 'text-slate-400'
                        }`} 
                      />
                    </button>

                    {/* Submenu Items */}
                    {isMenuOpen(menu.id) && (
                      <div className="ml-6 space-y-1 border-l-2 border-slate-600 pl-3 py-1">
                        {menu.submenus.map((submenu, index) => {
                          if (!canAccessSubmenu(submenu)) return null;

                          return (
                            <Link
                              key={`${menu.id}-${submenu.name}-${index}`}
                              to={submenu.path}
                              onClick={(e) => {
                                if (!handleMenuClick(menu, submenu)) {
                                  e.preventDefault();
                                }
                              }}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                isActiveLink(submenu.path)
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent"
                              } ${!canAccessSubmenu(submenu) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className={`transition-transform duration-200 ${isActiveLink(submenu.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {submenu.icon}
                              </div>
                              <span className="text-sm font-medium">{submenu.name}</span>
                              {isActiveLink(submenu.path) && (
                                <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                              )}
                              {!canAccessSubmenu(submenu) && (
                                <AlertTriangle className="w-3 h-3 text-yellow-400 ml-auto" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">
            {getDashboardSubtitle()}
          </p>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </aside>
  );
}