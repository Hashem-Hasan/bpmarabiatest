'use client'
import React, { useEffect } from 'react';
import AdminDashboard from '@/app/components/ADMDashboard';
import DepartmentsWithProcesses from '../components/DepartmentsWithProcesses';
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
    <section className='flex flex-col bg-[#F9F9F9] min-h-screen text-black '>
      <ProtectedRoute />
      <AdminDashboard />
      <DepartmentsWithProcesses />
      <ProtectedRoute />

    </section>
  );
}

export default Page;
