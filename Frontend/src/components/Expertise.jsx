// Expertise.jsx - No CSS file needed
import React, { useState, useEffect } from "react"
import TrueFocus from './TrueFocus'
import PixelTransition from './PixelTransition'

import samsungRetail from "../assets/hand.jpg"
import samsungRepairs from "../assets/repair2.jpg"
import aeono from "../assets/aeno.jpg"
import canyon from "../assets/canyongaming.jpg"

const Expertise = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <section className="py-20 px-4 md:px-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 mb-16">
        {/* Left - Title */}
        <div>
          <TrueFocus
            sentence="Our Services"
            manualMode={false}
            blurAmount={5}
            borderColor="red"
            animationDuration={2}
            pauseBetweenAnimations={1}
          />
        </div>

        {/* Right - Description */}
        <div className="flex flex-col justify-center">
          <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            At Panna Music Center Eldoret, we're more than just a store we're a
            trusted retailer for certified Samsung products, high-quality AENO
            appliances, and Canyon's latest audio and gaming gear.
          </p>
          <a
            href="#services"
            className="font-medium text-gray-900 dark:text-gray-100 relative inline-block w-fit group"
          >
            Explore our offerings →
            <span className="absolute left-0 bottom-[-3px] w-full h-[2px] bg-gray-900 dark:bg-gray-100 scale-x-0 origin-right transition-transform duration-300 group-hover:scale-x-100 group-hover:origin-left" />
          </a>
        </div>
      </div>

      {/* Services Grid */}
      <div
        id="services"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Card 1 - Samsung Retail */}
        <div className="p-8 rounded-xl text-gray-900 dark:text-gray-100 min-h-[220px] flex flex-col justify-start shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_5px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-white dark:bg-black">
          <PixelTransition
            firstContent={
              <img
                src={samsungRetail}
                alt="Samsung Retail Store"
                className="mt-6 w-full max-h-[280px] object-cover rounded-lg"
              />
            }
            secondContent={
              <div className="w-full h-full grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-center">
                <div>
                  <h3 className="text-xl mb-4 font-bold">Samsung Retail Store</h3>
                  <p className="text-sm leading-relaxed">
                    Explore the latest Samsung smartphones, tablets, TVs, and accessories
                    all genuine, all backed by warranty, straight from the source.
                  </p>
                </div>
              </div>
            }
            gridSize={12}
            pixelColor="#ffffff"
            animationStepDuration={0.4}
            className="custom-pixel-card"
          />
          <div className="text-center mt-2 text-sm text-gray-900 dark:text-white">
            {isMobile ? "Psst! Click me" : "Psst! Hover me"}
          </div>
        </div>

        {/* Card 2 - Samsung Repairs */}
        <div className="p-8 rounded-xl text-gray-900 dark:text-gray-100 min-h-[220px] flex flex-col justify-start shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_5px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-white dark:bg-black">
          <PixelTransition
            firstContent={
              <img
                src={samsungRepairs}
                alt="Samsung Certified Repairs"
                className="mt-6 w-full max-h-[280px] object-cover rounded-lg"
              />
            }
            secondContent={
              <div className="w-full h-full grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-center">
                <div>
                  <h3 className="text-xl mb-4 font-bold">Samsung Certified Repairs</h3>
                  <p className="text-sm leading-relaxed">
                    Get your Samsung devices serviced by certified technicians using
                    genuine parts. Reliable repairs that keep your devices running like new.
                  </p>
                </div>
              </div>
            }
            gridSize={12}
            pixelColor="#ffffff"
            animationStepDuration={0.4}
            className="custom-pixel-card"
          />
          <div className="text-center mt-2 text-sm text-gray-900 dark:text-white">
            {isMobile ? "Psst! Click me" : "Psst! Hover me"}
          </div>
        </div>

        {/* Card 3 - AEON */}
        <div className="p-8 rounded-xl text-gray-900 dark:text-gray-100 min-h-[220px] flex flex-col justify-start shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_5px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-white dark:bg-black">
          <PixelTransition
            firstContent={
              <img
                src={aeono}
                alt="AEON Home Appliances"
                className="mt-6 w-full max-h-[280px] object-cover rounded-lg"
              />
            }
            secondContent={
              <div className="w-full h-full grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-center">
                <div>
                  <h3 className="text-xl mb-4 font-bold">AENO Home Appliances</h3>
                  <p className="text-sm leading-relaxed">
                    Bringing comfort and efficiency into your home with reliable and
                    affordable AENO appliances built for everyday living.
                  </p>
                </div>
              </div>
            }
            gridSize={12}
            pixelColor="#ffffff"
            animationStepDuration={0.4}
            className="custom-pixel-card"
          />
          <div className="text-center mt-2 text-sm text-gray-900 dark:text-white">
            {isMobile ? "Psst! Click me" : "Psst! Hover me"}
          </div>
        </div>

        {/* Card 4 - Canyon */}
        <div className="p-8 rounded-xl text-gray-900 dark:text-gray-100 min-h-[220px] flex flex-col justify-start shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_5px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] bg-white dark:bg-black">
          <PixelTransition
            firstContent={
              <img
                src={canyon}
                alt="Canyon Audio & Gaming Gear"
                className="mt-6 w-full max-h-[280px] object-cover rounded-lg"
              />
            }
            secondContent={
              <div className="w-full h-full grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-lg text-center">
                <div>
                  <h3 className="text-xl mb-4 font-bold">Canyon Audio & Gaming Gear</h3>
                  <p className="text-sm leading-relaxed">
                    From stylish ear appliances like earbuds and headphones, to advanced
                    gaming accessories like RGB keyboards and precision mice — Canyon
                    has you covered.
                  </p>
                </div>
              </div>
            }
            gridSize={12}
            pixelColor="#ffffff"
            animationStepDuration={0.4}
            className="custom-pixel-card"
          />
          <div className="text-center mt-2 text-sm text-gray-900 dark:text-white">
            {isMobile ? "Psst! Click me" : "Psst! Hover me"}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Expertise