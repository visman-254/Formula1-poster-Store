// Home.jsx - No CSS file needed
import React from 'react'
import Hero from '../components/Hero'
import Overview from '../components/Overview'
import Expertise from '../components/Expertise'
import Location from '../components/Location'
import Faqs from '../components/Faqs'

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="w-full">
        <Hero />
        <Overview />
        <Expertise />
        <Faqs />
        <Location />
      </div>
    </div>
  )
}

export default Home