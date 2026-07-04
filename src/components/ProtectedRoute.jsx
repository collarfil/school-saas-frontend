import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/axios"; // Make sure this points to your axios instance

// Utility to normalize roles
const normalizeRole = (role) => role?.toLowerCase().replace(/\s+/g, "_");

// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

export default function ProtectedRoute({ children, requiredRole, requireSubscription = false }) {
  const [authState, setAuthState] = useState({
    user: null,
    subscriptionStatus: null,
    loading: true,
  });

  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");
        const token = localStorage.getItem("token");

        if (!savedUser || !token) {
          if (mounted) setAuthState({ user: null, subscriptionStatus: null, loading: false });
          return;
        }

        const normalizedUser = { ...savedUser, role: normalizeRole(savedUser.role) };

        let subscriptionStatus = { has_active_subscription: true };
        if (requireSubscription && normalizedUser.role === "admin") {
          try {
            const response = await api.get("/subscriptions/status/check", {
              headers: { Authorization: `Bearer ${token}` },
            });
            subscriptionStatus = response.data;
          } catch (error) {
            subscriptionStatus = { has_active_subscription: false };
          }
        }

        if (mounted) {
          setAuthState({ user: normalizedUser, subscriptionStatus, loading: false });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) setAuthState({ user: null, subscriptionStatus: null, loading: false });
      }
    };

    checkAuth();
    return () => { mounted = false; };
  }, [requiredRole, requireSubscription, location.pathname]);

  const { user, subscriptionStatus, loading } = authState;

  // Show loading while checking auth
  if (loading) return <LoadingSpinner />;

  // No user found
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // Role authorization check
  // In ProtectedRoute.jsx - update the role authorization check section

// Role authorization check
// In ProtectedRoute.jsx - replace the role authorization check section

// Role authorization check
if (requiredRole && user.role !== normalizeRole(requiredRole)) {
  // Redirect to appropriate dashboard based on user's actual role
  switch (user.role) {
    case "super_admin":
      return <Navigate to="/super-admin/dashboard" replace />;
    case "admin":
      // Check if school is unlocked to determine where to redirect
      if (user.school?.is_unlocked) {
        return <Navigate to="/school/dashboard" replace />;
      } else {
        return <Navigate to="/school/subscriptions" replace />;
      }
    case "employee":
      if (user.employee_type === 'teaching') {
        return <Navigate to="/employee/dashboard" replace />;
      } else {
        return <Navigate to="/account/dashboard" replace />;
      }
    case "student":
      return <Navigate to="/student/dashboard" replace />;
    case "parent":
      return <Navigate to="/parent/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}
  // Subscription check for admin
  if (requireSubscription && user.role === "admin" && !subscriptionStatus?.has_active_subscription) {
    return <Navigate to="/school/subscriptions" replace />;
  }

  // Access granted
  return children;
}
