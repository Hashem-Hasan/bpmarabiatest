'use client';
import React, { useEffect } from 'react';
import ProcessRoleAssignment from '../components/ProcessRoleAssignment';
import ProtectedRoute from '../components/ProtectedRoute';

const Page = () => {
  useEffect(() => {
    // Set overflow hidden on body to prevent page scrolling
    document.body.style.overflow = 'hidden';

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden pt-16">
      <ProtectedRoute >
      <ProcessRoleAssignment />
      </ProtectedRoute >
    </div>
  );
};

export default Page;
