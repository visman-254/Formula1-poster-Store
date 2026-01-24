import React from "react";
import Shuffle from "./Shuffle"; // Assuming Shuffle component is available
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Clock, Building2 } from "lucide-react";
import Eldoret from "../assets/Eldoret.jpg"; 
import './Location.css'

const Location = () => {
  return (
    <div id="location" className="container mx-auto py-12 px-4 md:px-6 space-y-8">
      {/* Animated Heading */}
      <div className="text-center">
       <Shuffle
          text="How to find us"
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
        
      </div>

      
      <Card
        className="w-full max-w-4xl mx-auto shadow-xl transition-all duration-300 
                   hover:shadow-2xl hover:scale-[1.01] border-none 
                   bg-white dark:bg-black flex flex-col md:flex-row overflow-hidden rounded-xl font-sans text-sm"
      >
        
        <div className="md:w-1/2 lg:w-2/5 flex-shrink-0">
          <img 
            src={Eldoret} 
            alt="Eldoret Map" 
            className="w-full h-full object-cover object-center md:rounded-l-xl transition-transform duration-300 hover:scale-105" 
          />
        </div>


        
        <div className="md:w-1/2 lg:w-3/5 p-6 space-y-4">
          <CardHeader className="border-b dark:border-gray-700 pb-4 mb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-50">
              <Building2 className="w-7 h-7 text-primary dark:text-white" />
              Panna Music Centre Ltd
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-base text-gray-700 dark:text-gray-300">
            <InfoItem
              Icon={MapPin}
              text="Kenyatta Street, Opposite Telkom Building, Eldoret, Kenya"
            />

            <InfoItem Icon={Phone} text="+254 712 133 135" />

            <InfoItem Icon={Clock} text="Mon – Fri, 9:00 AM – 5:30 PM" />
            <InfoItem Icon={Clock} text="Sat, 9:00 AM – 3:00 PM" />
          </CardContent>
        </div>
      </Card>

      
      <div className="map-wrapper w-full max-w-4xl md:ml-40 rounded-xl overflow-hidden shadow-none transition-all duration-300">


        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d638.4781522802028!2d35.2746199!3d0.516303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x178101a47c4e972d%3A0xb666a4db321b7b53!2sPanna%20Music%20Centre%20Ltd!5e0!3m2!1sen!2ske!4v1695970800000!5m2!1sen!2ske" // Use your actual map URL
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Panna Music Centre Location"
        ></iframe>
      </div>
    </div>
  );
};


const InfoItem = ({ Icon, text }) => (
  <div className="flex items-start gap-3 transition-colors duration-300">
    <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
    <span>{text}</span>
  </div>
);

export default Location;