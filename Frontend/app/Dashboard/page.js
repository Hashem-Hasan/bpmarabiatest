'use client'
import React, { useEffect } from 'react';
import AdminDashboard from '@/app/components/ADMDashboard';
import DepartmentsWithProcesses from '../components/DepartmentsWithProcesses';
import ProtectedRoute from '../components/ProtectedRoute';

const Page = () => {
 

  return (
    <section className='flex flex-col justify-center bg-[#F9F9F9] min-h-screen text-black '>
      <ProtectedRoute />
      <AdminDashboard />
      <DepartmentsWithProcesses />
      <ProtectedRoute />

    </section>
  );
}

export default Page;
