import { createBrowserRouter, RouterProvider } from "react-router-dom";

/* =======================
   LAYOUTS
======================= */
import MainLayout from "../layouts/MainLayout";
import SchoolLayout from "../layouts/AdminLayout"; // school users
import SuperAdminLayout from "../layouts/SuperAdminLayout";

/* =======================
   ROUTE GUARD
======================= */
import ProtectedRoute from "../components/ProtectedRoute";

/* =======================
   PUBLIC PAGES
======================= */
import Home from "../pages/Home";
import Login from "../pages/Login";
import SuperAdminRegister from "../pages/SuperAdminRegister";
import ChangePassword from "../pages/ChangePassword";

/* =======================
   PAYMENT
======================= */
import PaymentCallback from "../pages/PaymentCallback";
import PaymentSuccess from "../pages/PaymentSuccess";

/* =======================
   SCHOOL DASHBOARD PAGES
======================= */
import Dashboard from "../pages/Dashboard";
import Student from "../pages/Student";
import Session from "../pages/Session";
import Section from "../pages/Section";
import Grade from "../pages/Grade";
import Subject from "../pages/Subject";
import Parent from "../pages/Parent";
import Employee from "../pages/Employee";
import Fee from "../pages/Fee";
import FeePayment from "../pages/FeePayment";
import Transaction from "../pages/Transaction";
import Subscription from "../pages/Subscription";
import Income from "../pages/Income";
import Expense from "../pages/Expense";
import Result from "../pages/Result";
import ResultLocker from "../pages/ResultLocker";
import EmployeeGrade from "../pages/EmployeeGrade";
import EmployeeSubject from "../pages/EmployeeSubject";
import Attendance from "../pages/Attendance";

/* =======================
   EMPLOYEE PAGES
======================= */
import EmployeeDashboard from "../pages/EmployeeDashboard";

/* =======================
   STUDENT PAGES
======================= */
import StudentDashboard from "../pages/StudentDashboard";

/* =======================
   PARENT PAGES
======================= */
import ParentDashboard from "../pages/ParentDashboard";

/* =======================
   SUPER ADMIN PAGES
======================= */
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import SuperAdminSchools from "../pages/SuperAdminSchools";
import SuperAdminSettings from "../pages/SuperAdminSettings";
import SuperAdminUserRegister from "../pages/SuperAdminUserRegister";

/* =======================
   404
======================= */
import NotFound from "../pages/NotFound";

/* =======================
   SCHOOL ROUTES LIST
======================= */
const schoolPages = [
  ["students", Student],
  ["sessions", Session],
  ["sections", Section],
  ["grades", Grade],
  ["subjects", Subject],
  ["parents", Parent],
  ["employees", Employee],
  ["fees", Fee],
  ["feepayments", FeePayment],
  ["transactions", Transaction],
  ["incomes", Income],
  ["expenses", Expense],
  ["results", Result],
  ["resultlockers", ResultLocker],
  ["employee-grades", EmployeeGrade],
  ["employee-subjects", EmployeeSubject],
  ["attendances", Attendance],
];

/* =======================
   ROUTER
======================= */
const router = createBrowserRouter(
  [
    /* ---------- PUBLIC ---------- */
    {
      element: <MainLayout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/login", element: <Login /> },
        { path: "/register/super-admin", element: <SuperAdminRegister /> },

        // Paystack callbacks
        { path: "/payment/callback", element: <PaymentCallback /> },
        { path: "/payment/success", element: <PaymentSuccess /> },
        { path: "/subscription/callback", element: <PaymentCallback /> },
        { path: "/subscription/success", element: <PaymentCallback /> },
      ],
    },

    /* ---------- FORCE PASSWORD CHANGE ---------- */
    {
      path: "/change-password",
      element: <ChangePassword />,
    },

    /* ---------- SCHOOL ADMIN ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="admin">
          <SchoolLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/school/dashboard",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/subscriptions",
          element: (
            <ProtectedRoute requiredRole="admin">
              <Subscription />
            </ProtectedRoute>
          ),
        },
        ...schoolPages.map(([path, Component]) => ({
          path: `/school/${path}`,
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <Component />
            </ProtectedRoute>
          ),
        })),
      ],
    },

    /* ---------- TEACHING STAFF ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="employee">
          <SchoolLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/employee/dashboard",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <EmployeeDashboard />
            </ProtectedRoute>
          ),
        },
        // Teaching staff can view/create/edit students
        {
          path: "/employee/students",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Student />
            </ProtectedRoute>
          ),
        },
        {
          path: "/employee/attendances",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Attendance />
            </ProtectedRoute>
          ),
        },
        {
          path: "/employee/results",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Result />
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- ACCOUNT STAFF ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="employee">
          <SchoolLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/account/dashboard",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <EmployeeDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/subscriptions",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Subscription />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/fees",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Fee />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/feepayments",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <FeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/transactions",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Transaction />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/incomes",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Income />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/expenses",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Expense />
            </ProtectedRoute>
          ),
        },
        // Account staff can view fee reports
        {
          path: "/account/reports/fee-receipts",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <div>Fee Receipts Reports</div>
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- STUDENT ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="student">
          <SchoolLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/student/dashboard",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <StudentDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/report-card",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <div>Report Card Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/fees",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <div>Fee Statement Page</div>
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- PARENT ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="parent">
          <SchoolLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/parent/dashboard",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <ParentDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/reports",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <div>Children's Reports Page</div>
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/fees",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <div>Fee Statements Page</div>
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- SUPER ADMIN (SAAS OWNER) ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="super_admin">
          <SuperAdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "/super-admin/dashboard", element: <SuperAdminDashboard /> },
        { path: "/super-admin/schools", element: <SuperAdminSchools /> },
        { path: "/super-admin/settings", element: <SuperAdminSettings /> },
        { path: "/super-admin/register", element: <SuperAdminUserRegister /> },
      ],
    },

    /* ---------- 404 ---------- */
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

/* =======================
   EXPORT
======================= */
export default function AppRouter() {
  return <RouterProvider router={router} />;
}