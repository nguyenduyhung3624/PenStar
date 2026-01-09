import AppFooter from "@/components/layouts/clients/AppFooter";
import AppHeader from "@/components/layouts/clients/AppHeader";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { jwtDecode } from "jwt-decode";
const LayoutClient = () => {
  const auth = useAuth();
  const location = useLocation();
  if (auth?.user && auth?.token) {
    try {
      type DecodedToken = {
        role?: string;
        role_name?: string;
        role_id?: number;
      } & Record<string, unknown>;
      const decoded = jwtDecode<DecodedToken>(auth.token);
      const roleName = (decoded?.role ?? decoded?.role_name ?? "")
        .toString()
        .toLowerCase();
      const roleId = decoded?.role_id;
      const isCustomer =
        roleName === "customer" || (typeof roleId === "number" && roleId === 1);
      const currentPath = location.pathname;
      if (
        !isCustomer &&
        currentPath !== "/signin" &&
        currentPath !== "/signup"
      ) {
        return <Navigate to="/admin" replace />;
      }
    } catch (error) {
      console.debug("LayoutClient: Failed to decode token", error);
    }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      {}
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
};
export default LayoutClient;
