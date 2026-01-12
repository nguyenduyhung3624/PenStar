import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import { Spin } from "antd";
const RequireCustomerOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();
  const location = useLocation();
  if (!auth?.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang kiểm tra đăng nhập..." />
      </div>
    );
  }
  if (!auth?.user || !auth?.token) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
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
    if (!isCustomer) {
      return <Navigate to="/admin" replace state={{ from: location }} />;
    }
    return <>{children}</>;
  } catch (error) {
    console.debug("RequireCustomerOnly: Failed to decode token", error);
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
};
export default RequireCustomerOnly;
