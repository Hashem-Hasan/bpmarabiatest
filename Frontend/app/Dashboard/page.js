'use client'
import React, { useEffect } from 'react';
import AdminDashboard from '@/app/components/ADMDashboard';
import DepartmentsWithProcesses from '../components/DepartmentsWithProcesses';
import ProtectedRoute from '../components/ProtectedRoute';

const Page = () => {
 

  return (
    <ProtectedRoute>
    <section className='flex flex-col justify-center bg-[#F9F9F9] min-h-screen text-black '>
      <section className='scale-50 md:scale-60 lg:scale-80 xl:scale-85 2xl:scale-100'>
      <AdminDashboard />
      <DepartmentsWithProcesses />
      </section>

    </section>
    </ProtectedRoute >
  );
}

export default Page;
