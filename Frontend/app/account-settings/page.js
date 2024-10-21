import React from 'react'
import AccountSettings from '../components/AccountSettings'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div className='pt-16'>
      <ProtectedRoute>
      <AccountSettings />
      </ProtectedRoute>
    </div>
  )
}

export default page
