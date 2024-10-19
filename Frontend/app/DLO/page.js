import React from 'react'
import Dlogs from '../components/Dlogs'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div className='min-h-screen pt-12 text-black'>
      <ProtectedRoute/>
      <Dlogs/>
      <ProtectedRoute/>
    </div>
  )
}

export default page
