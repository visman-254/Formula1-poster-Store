// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "./src/context/UserContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useUser();

  // Still loading from localStorage — don't redirect yet
  if (loading) return null;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Not admin
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

// POS route — accessible by cashier and admin only
export const POSRoute = ({ children }) => {
  const { user, loading } = useUser();

  // Still loading from localStorage — don't redirect yet
  if (loading) return null;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Not cashier or admin
  if (user.role !== "cashier" && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
