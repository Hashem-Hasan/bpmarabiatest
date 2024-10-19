import React from 'react'
import EmployeeManagement from '../components/Employees'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div className=' pt-12 text-black'>
      <ProtectedRoute />
      <EmployeeManagement />
      <ProtectedRoute />
    </div>
  )
}

export default page
