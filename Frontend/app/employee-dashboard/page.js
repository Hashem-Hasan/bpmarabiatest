import React from 'react'
import EmployeeDashboard from '../components/EmployeeDashboard'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div className=' min-h-screen pt-12 text-black'>
      <ProtectedRoute />
      <EmployeeDashboard />
      <ProtectedRoute />
    </div>
  )
}

export default page
