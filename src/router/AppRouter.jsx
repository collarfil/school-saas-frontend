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
   AUTH & PUBLIC PAGES
======================= */
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Home from "../pages/Home";
import Login from "../pages/Login";
import SuperAdminRegister from "../pages/SuperAdminRegister";
import ChangePassword from "../pages/ChangePassword";

/* =======================
   NEW PUBLIC PAGES (About, Features, Pricing, Schools)
======================= */
import About from "../pages/About";
import Features from "../pages/Features";
import Pricing from "../pages/Pricing";
import Schools from "../pages/Schools";

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
import OnlineFeePayment from "../pages/OnlineFeePayment";
import OnlinePayment from "../pages/OnlinePayment";
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
import AdmissionList from "../pages/AdmissionList";
import Timetable from "../pages/Timetable";
import Assignment from "../pages/Assignment";
import AssignmentSubmission from "../pages/AssignmentSubmission";
import LiveClass from "../pages/LiveClass";
import LiveChat from "../pages/LiveChat";
import Recording from "../pages/Recording";
import Poll from "../pages/Poll";
import PollResponse from "../pages/PollResponse";
import Whiteboard from "../pages/Whiteboard";
import ClassAttendance from "../pages/ClassAttendance";
import Meeting from "../pages/Meeting";
import MeetingParticipant from "../pages/MeetingParticipant";

/* =======================
   PUBLIC ADMISSION PAGES
======================= */
import PublicAdmission from "../pages/PublicAdmission";
import AdmissionStatus from "../pages/AdmissionStatus";
import PublicAdmissionList from "../pages/PublicAdmissionList";

/* =======================
   REPORTS PAGES
======================= */
import PTA from "../pages/Reports/PTA";
import SummaryReport from "../pages/Reports/SummaryReport";
import IncomeReport from "../pages/Reports/IncomeReport";
import ExpenseReport from "../pages/Reports/ExpenseReport";
import ProfitLossReport from "../pages/Reports/ProfitLossReport";
import FeeInvoiceReport from "../pages/Reports/FeeInvoiceReport";
import StudentReport from "../pages/Reports/StudentReport";
import ReportCard from "../pages/Reports/ReportCard";

import AcademicReport from "../pages/reports/AcademicReport";
import EmployeesReport from "../pages/reports/EmployeesReport";
import FeeReceipts from "../pages/reports/FeeReceipts";
import IncomeExpenditure from "../pages/reports/IncomeExpenditure";

/* =======================
   CBT PAGES
======================= */
import ExamSession from "../pages/ExamSession";
import ExamGrade from "../pages/ExamGrade";
import ExamResult from "../pages/ExamResult";
import StudentResponse from "../pages/StudentResponse";
import ExamType from "../pages/ExamType";
import Option from "../pages/Option";
import Exam from "../pages/Exam";
import Question from "../pages/Question";

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
  ["onlinefees", OnlineFeePayment],
  ["online-fee-payments", OnlineFeePayment],
  ["online-payments", OnlinePayment],
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
  ["admission-list", AdmissionList],
  ["timetables", Timetable],
  ["assignments", Assignment],
  ["assignment-submissions", AssignmentSubmission],
  ["live-classes", LiveClass],
  ["live-chats", LiveChat],
  ["recordings", Recording],
  ["poll", Poll],
  ["poll-responses", PollResponse],
  ["whiteboards", Whiteboard],
  ["class-attendances", ClassAttendance],
  ["meetings", Meeting],
  ["meeting-participants", MeetingParticipant],
  ["exam-sessions", ExamSession],
  ["exam-grades", ExamGrade],
  ["exam-results", ExamResult],
  ["student-responses", StudentResponse],
  ["exam-types", ExamType],
  ["exam-options", Option],
  ["exams", Exam],
  ["questions", Question],
  ["pta", PTA],
];

/* =======================
   ROUTER
======================= */
const router = createBrowserRouter(
  [
    /* ---------- PUBLIC ROUTES ---------- */
    {
      element: <MainLayout />,
      children: [
        // Main routes
        { path: "/", element: <Home /> },

        // ✅ NEW PUBLIC PAGES
        { path: "/about", element: <About /> },
        { path: "/features", element: <Features /> },
        { path: "/pricing", element: <Pricing /> },
        { path: "/schools", element: <Schools /> },

        // Auth & account
        { path: "/login", element: <Login /> },
        { path: "/forgot-password", element: <ForgotPassword /> },
        { path: "/reset-password", element: <ResetPassword /> },
        { path: "/register/super-admin", element: <SuperAdminRegister /> },
        { path: "/change-password", element: <ChangePassword /> },
        { path: "/payment/callback", element: <PaymentCallback /> },
        { path: "/payment/success", element: <PaymentSuccess /> },
        { path: "/subscription/callback", element: <PaymentCallback /> },
        { path: "/subscription/success", element: <PaymentSuccess /> },

        // ===== PUBLIC ADMISSION ROUTES =====
        { path: "/admission/apply", element: <PublicAdmission /> },
        { path: "/admission/status", element: <AdmissionStatus /> },
        { path: "/admission/lists", element: <PublicAdmissionList /> },
      ],
    },

    /* ---------- REDIRECTS ---------- */
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
        // ===== REPORTS =====
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
        {
          path: "/school/reports/generate",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <ReportCard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/summary",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <SummaryReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/income",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <IncomeReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/expense",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <ExpenseReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/profit-loss",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <ProfitLossReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/school/reports/fee-invoice",
          element: (
            <ProtectedRoute requiredRole="admin" requireSubscription>
              <FeeInvoiceReport />
            </ProtectedRoute>
          ),
        },
        // ===== DYNAMIC SCHOOL PAGES =====
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
        {
          path: "/employee/reports/generate",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <ReportCard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/employee/reports/student-results",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <StudentReport />
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
          path: "/account/online-fee-payments",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <OnlineFeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account/online-payments",
          element: (
            <ProtectedRoute requiredRole="employee" requireSubscription>
              <OnlinePayment />
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
              <ReportCard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/fees",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <OnlineFeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/student/pay-fees",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <OnlineFeePayment />
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
        {
          path: "/student/results",
          element: (
            <ProtectedRoute requiredRole="student" requireSubscription>
              <StudentReport />
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
              <ReportCard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/fees",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <OnlineFeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/pay-fees",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <OnlineFeePayment />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/results",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <StudentReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "/parent/pta",
          element: (
            <ProtectedRoute requiredRole="parent" requireSubscription>
              <PTA />
            </ProtectedRoute>
          ),
        },
      ],
    },

    /* ---------- SUPER ADMIN ---------- */
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

    /* ---------- 404 - Catch all unmatched routes ---------- */
    {
      path: "*",
      element: <NotFound />,
    },
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