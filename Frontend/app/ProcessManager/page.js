'use client';
import React, { useEffect } from 'react';
import ProcessOwnerManagement from '../components/ProcessOwnerManagement';
import ProtectedRoute from '../components/ProtectedRoute';

const Page = () => {
 
  return (
    <div className="">
      <ProtectedRoute />
      <ProcessOwnerManagement />
      <ProtectedRoute />
    </div>
  );
};

export default Page;
