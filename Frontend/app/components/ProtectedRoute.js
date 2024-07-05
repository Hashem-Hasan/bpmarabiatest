// components/ProtectedRoute.js
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from "@nextui-org/react";
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/validate-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          router.push("/");
        }
      } catch (error) {
        console.error("Error validating token:", error);
        localStorage.removeItem("token");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" color="warning" /></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
