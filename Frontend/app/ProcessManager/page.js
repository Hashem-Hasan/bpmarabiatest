'use client';
import React, { useEffect } from 'react';
import ProcessOwnerManagement from '../components/ProcessOwnerManagement';
import ProtectedRoute from '../components/ProtectedRoute';

const Page = () => {
  useEffect(() => {
    // Set overflow hidden on body to remove scrolling
    document.body.style.overflow = 'hidden';

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#F9F9F9] min-h-screen text-black justify-center">
      <ProtectedRoute >
      <ProcessOwnerManagement />
      </ProtectedRoute >
    </div>
  );
};

export default Page;
