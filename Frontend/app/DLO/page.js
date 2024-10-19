import React from 'react'
import Dlogs from '../components/Dlogs'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div className='pt-16'>
      <ProtectedRoute/>
      <Dlogs/>
      <ProtectedRoute/>
    </div>
  )
}

export default page
