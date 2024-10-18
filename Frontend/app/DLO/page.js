import React from 'react'
import Dlogs from '../components/Dlogs'
import ProtectedRoute from '../components/ProtectedRoute'

const page = () => {
  return (
    <div>
      <ProtectedRoute/>
      <Dlogs/>
      <ProtectedRoute/>
    </div>
  )
}

export default page
