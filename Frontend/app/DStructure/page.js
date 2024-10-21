import React from 'react'
import DepartmentStructure from '../components/DepartmentStructure'
import ProtectedRoute from '../components/ProtectedRoute'

const Page = () => {
  return (
    <div className='bg-white'>
        <ProtectedRoute>
        <DepartmentStructure />
        </ProtectedRoute>
    </div>
  )
}

export default Page;
