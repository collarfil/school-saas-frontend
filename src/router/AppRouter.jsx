import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

/* =======================
   LAYOUTS
======================= */
import MainLayout from "../layouts/MainLayout";
import SchoolLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

/* =======================
   ROUTE GUARD
======================= */
import ProtectedRoute from "../components/ProtectedRoute";

/* =======================
  FORGOT PASSWORD & RESET
======================= */
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

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
import Admission from "../pages/Admission";
import Timetable from "../pages/Timetable";
import Assignment from "../pages/Assignment";
import AssignmentSubmission from "../pages/AssignmentSubmission";
import LiveClass from "../pages/LiveClass";
import LiveChat from "../pages/LiveChat";
import Recording from "../pages/Recording";
import Poll from "../pages/Poll";
import PollResponse from "../pages/PollResponse";
import Whiteboard from "../pages/Whiteboard";
import ClassAttendance from "../pages/ClassAttendance"; // Fixed typo: ClassAttendannce -> ClassAttendance
import Meeting from "../pages/Meeting";
import MeetingParticipant from "../pages/MeetingParticipant";

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

/* ======================
   REPORTS
======================= */
import StudentReport from "../pages/reports/StudentReport";
import FeeReceipts from "../pages/reports/FeeReceipts";
import IncomeExpenditure from "../pages/reports/IncomeExpenditure";
import AcademicReport from "../pages/reports/AcademicReport";
import EmployeesReport from "../pages/reports/EmployeesReport";

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
  ["admissions", Admission],
  ["timetables", Timetable],
  ["assignments", Assignment],
  ["assignment-submissions", AssignmentSubmission],
  ["live-classes", LiveClass],
  ["live-chats", LiveChat],
  ["recordings", Recording],
  ["polls", Poll],
  ["poll-responses", PollResponse],
  ["whiteboards", Whiteboard],
  ["class-attendances", ClassAttendance],
  ["meetings", Meeting],
  ["meeting-participants", MeetingParticipant],
  ["exam-sessions", () => import("../pages/ExamSession").then(module => module.default)],
  ["exam-grades", () => import("../pages/ExamGrade").then(module => module.default)],
  ["exam-results", () => import("../pages/ExamResult").then(module => module.default)],
  ["student-responses", () => import("../pages/StudentResponse").then(module => module.default)],
  ["exam-types", () => import("../pages/ExamType").then(module => module.default)],
  ["options", () => import("../pages/Option").then(module => module.default)],
  ["exam", () => import("../pages/Exam").then(module => module.default)],
  ["questions", () => import("../pages/Question").then(module => module.default)],
  
  

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
        { path: "/forgot-password", element: <ForgotPassword /> },
        { path: "/reset-password", element: <ResetPassword /> },
        { path: "/register/super-admin", element: <SuperAdminRegister /> },
        { path: "/change-password", element: <ChangePassword /> },
        
        // Paystack callbacks
        { path: "/payment/callback", element: <PaymentCallback /> },
        { path: "/payment/success", element: <PaymentSuccess /> },
        { path: "/subscription/callback", element: <PaymentCallback /> },
        { path: "/subscription/success", element: <PaymentSuccess /> },
      ],
    },

    /* ---------- REDIRECTS (Catch old admin paths) ---------- */
    {
      path: "/admin",
      element: <Navigate to="/school/dashboard" replace />,
    },
    {
      path: "/admin/*",
      element: <Navigate to="/school/dashboard" replace />,
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
        // Reports
        {
          path: "/school/reports/student-results",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <StudentReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/fee-receipts",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <FeeReceipts />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/income-expenditure",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <IncomeExpenditure />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/academic",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <AcademicReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/employees",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <EmployeesReport />
            </ProtectedRoute>
          ),
        },
        // Dynamic school pages
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
        <ProtectedRoute requiredRole="employee" employeeType="teaching">
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
        {
          path: "/employee/timetables",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <Timetable />
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- ACCOUNT STAFF ---------- */
    {
      element: (
        <ProtectedRoute requiredRole="employee" employeeType="non_teaching">
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
        {
          path: "/account/reports/fee-receipts",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <FeeReceipts />
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
              <StudentReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/fees",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <FeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/timetables",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <Timetable />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/attendances",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <Attendance />
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
          path: "/parent/children",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <Student />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/report-card",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <StudentReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/fees",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <FeePayment />
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
        { path: "/super-admin/subscriptions", element: <Subscription /> },
        { path: "/super-admin/settings", element: <SuperAdminSettings /> },
        { path: "/super-admin/register", element: <SuperAdminUserRegister /> },
        { path: "/super-admin/pricing", element: <div>Pricing Management</div> },
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