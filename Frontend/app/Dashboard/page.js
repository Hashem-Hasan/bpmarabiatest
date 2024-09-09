import React from 'react'
import AdminDashboard from '@/app/components/ADMDashboard'
import DepartmentsWithProcesses from '../components/DepartmentsWithProcesses'
const page = () => {
  return (
    <div className='flex flex-col bg-white text-black justify-center'>
      <AdminDashboard />
      <DepartmentsWithProcesses />
    </div>
  )
}

export default page
