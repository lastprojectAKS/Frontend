import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminLayout from "../layouts/AdminLayout";

export default function ProtectedAdminRoute() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
