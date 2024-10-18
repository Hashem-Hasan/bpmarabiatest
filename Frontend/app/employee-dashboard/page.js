import React from 'react'
import EmployeeDashboard from '../components/EmployeeDashboard'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div>
      <ProtectedRoute />
      <EmployeeDashboard />
      <ProtectedRoute />
    </div>
  )
}

export default page
