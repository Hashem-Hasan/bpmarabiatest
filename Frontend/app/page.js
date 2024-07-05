import React from 'react'
import Hero from './components/Hero'
import Csx from './components/Csx'
import Fea from './components/Fea'

const page = () => {
  return (
    <div className='bg-white text-black'>
      <Hero />
      <Csx />
      <Fea /> 
    </div>
  )
}

export default page
