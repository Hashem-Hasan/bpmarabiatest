import React from 'react'
import CompanyStructure from '../components/CompanyStructure'
import ProtectedRoute from '../components/ProtectedRoute'

const Page = () => {
  return (
    <div className='bg-white overflow-hidden h-screen'>
        <ProtectedRoute>
        <CompanyStructure />
        </ProtectedRoute>
        
      
    </div>
  )
}

export default Page;
