// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "./src/context/UserContext";

const AdminRoute = ({ children }) => {
  const { user } = useUser();

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Not admin
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
