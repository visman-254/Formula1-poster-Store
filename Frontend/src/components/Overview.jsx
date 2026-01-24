
import React from 'react'
import Shuffle from '../components/Shuffle'
import walltv from "../assets/walltv.jpg"
import pmc2 from "../assets/pmc2.png"

const Overview = () => {
  return (
    <div className="font-roboto py-12 px-4">
      <div className="grid grid-cols-1 gap-4">
        <Shuffle
          text="Overview"
          shuffleDirection="right"
          duration={0.55}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.01}
          threshold={0.1}
          triggerOnce={false}
          triggerOnHover={false}
          triggerOnView={true}
          respectReducedMotion={true}
        />

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4 md:px-8 py-8 max-w-[1000px] mx-auto md:translate-x-[100px]">
          
         
          <div className="order-first md:order-none flex justify-center">
            <div className="relative w-full h-[400px] overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
              
              <img
                src={walltv}
                alt="Panna Music"
                className="w-full h-full object-cover rounded-lg"
              />
              
             
              <img
                src={pmc2}
                alt="Panna Music Logo"
                className="absolute top-[73%] left-[70%] -translate-x-1/2 -translate-y-1/2 w-[120px] md:w-[150px] h-auto z-10 drop-shadow-2xl animate-[logoFloat_3s_ease-in-out_infinite]"
              />
            </div>
          </div>

          
          <div className="max-w-[600px]">
            <p className="text-sm md:text-base leading-relaxed p-4 md:p-6 rounded-lg bg-stone-300 text-gray-900 dark:bg-stone-800 dark:text-gray-100 transition-colors duration-500 shadow-md">
              Welcome to <span className="font-bold">Panna Music Centre Ltd</span> — Eldoret's home of electronics you can trust.

              <span className="block mt-4">
                <span className="font-bold text-xl">Since 1988,</span> we've grown from a simple music shop into a one-stop destination for genuine gadgets, appliances, and accessories. As an authorized Samsung Retail and Service Partner, we don't just sell devices — we keep them running with certified repairs and expert care.
              </span>

              <span className="block mt-4">
                At Panna Music, quality and customer satisfaction come first. Whether you're upgrading to the latest smartphone, repairing your TV, or looking for reliable home electronics, you'll always find authentic products and a team ready to serve you.
              </span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -55%) scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}

export default Overview