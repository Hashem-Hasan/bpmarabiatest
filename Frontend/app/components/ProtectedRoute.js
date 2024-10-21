"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from "@nextui-org/react";
import axios from 'axios';

const ProtectedRoute = ({
  children, // The content to be wrapped by the ProtectedRoute
  adminRedirect = "/",
  employeeRedirect = "/employee-dashboard",
  adminDashboard = "/Dashboard"
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null indicates loading state
  const [role, setRole] = useState(null); // Track the role of the user
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const employeeToken = localStorage.getItem("employeeToken");

      // If no tokens are present, redirect immediately
      if (!token && !employeeToken) {
        setIsAuthenticated(false); // Set it to false since there are no tokens
        router.replace(adminRedirect);
        return;
      }

      try {
        // Validate employee token first
        if (employeeToken) {
          try {
            const employeeResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/validate-token`,
              {
                headers: { Authorization: `Bearer ${employeeToken}` },
              }
            );

            if (employeeResponse.data.valid && employeeResponse.data.role === 'employee') {
              setIsAuthenticated(true);
              setRole('employee');
              return;
            } else {
              localStorage.removeItem("employeeToken");
              setIsAuthenticated(false); // Mark as unauthenticated
              router.replace(adminRedirect);
              return;
            }
          } catch (error) {
            console.error("Employee token validation failed:", error);
            localStorage.removeItem("employeeToken");
            setIsAuthenticated(false); // Mark as unauthenticated
            router.replace(adminRedirect);
            return;
          }
        }

        // Validate admin token if no valid employee token
        if (token) {
          try {
            const adminResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/validate-token`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (adminResponse.data.valid && adminResponse.data.role === 'admin') {
              setIsAuthenticated(true);
              setRole('admin');
              return;
            } else {
              localStorage.removeItem("token");
              setIsAuthenticated(false); // Mark as unauthenticated
              router.replace(adminRedirect);
              return;
            }
          } catch (error) {
            console.error("Admin token validation failed:", error);
            localStorage.removeItem("token");
            setIsAuthenticated(false); // Mark as unauthenticated
            router.replace(adminRedirect);
            return;
          }
        }

        // If no valid tokens are found, redirect
        setIsAuthenticated(false); // Mark as unauthenticated
        router.replace(adminRedirect);
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("employeeToken");
        setIsAuthenticated(false); // Mark as unauthenticated
        router.replace(adminRedirect);
      }
    };

    checkAuth();
  }, [router, adminRedirect, employeeRedirect, adminDashboard]);

  // While authentication is being verified, show the spinner
  if (isAuthenticated === null) {
    return (
      <div className="flex bg-white justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Prevent admins from accessing employee routes
  if (role === 'admin' && pathname === "/employee-dashboard") {
    router.replace(adminDashboard);
    return null;
  }

  // Restrict employees to specific routes
  if (role === 'employee') {
    const allowedEmployeeRoutes = ["/employee-dashboard", "/Tool","/account-settings"];
    if (!allowedEmployeeRoutes.includes(pathname)) {
      router.replace(employeeRedirect);
      return null;
    }
  }

  // Render children when authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
