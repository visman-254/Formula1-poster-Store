import React, { useState } from 'react';
import { ChevronDown, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
 import './Faqs.css'; 
const eldoretMap = "uploaded:Map of Eldoret (1997).jpg-38bb317b-21f2-4985-9133-bc8913342743";



const faqItems = [
  {
    question: "Do you offer certified Samsung repair services?",
    answer: "Yes, we are an authorized service center for Samsung products. Our technicians use genuine Samsung parts and are fully certified to ensure reliable repairs under warranty.",
  },
  {
    question: "What brands do you retail besides Samsung?",
    answer: "We are proud retailers for several trusted brands, including high-quality AENO home appliances and a wide range of Canyon audio and gaming accessories.",
  },
  {
    question: "Do you offer financing or installment plans?",
    answer: "We partner with several local financial institutions to offer flexible installment plans on select products. Please visit our store or call us for the latest financing options and eligibility requirements.",
  },
  {
    question: "Where exactly is Panna Music Centre located in Eldoret?",
  }
   
    
];


const FAQItem = ({ question, answer, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mb-2`}>
      <button
       
        className="button-cont

            

          flex justify-between items-center w-full p-4 
          font-semibold text-base transition-all duration-200 
          rounded-lg
          
          /* LIGHT MODE: White BG, Black Text (Button will pop against the gray-100 container) */
          bg-white text-gray-200
          
          /* DARK MODE: Dark BG, White Text */
          dark:bg-gray-800 dark:text-gray-50 
          
          /* Hover & Shadow */
          shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700
          
          ${isOpen ? 'rounded-b-none' : ''}
        "
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        
        <ChevronDown 
          className={`w-5 h-5 text-primary dark:text-primary-light transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out 
          bg-white dark:bg-gray-800 /* Background matches button when open */
          border border-t-0 border-gray-200 dark:border-gray-700 
          rounded-b-lg
          ${isOpen ? 'max-h-96 opacity-100 py-3' : 'max-h-0 opacity-0'}`
        }
      >
        <p className="text-gray-600 dark:text-gray-400 px-4 pb-4 leading-relaxed">
          {answer}
          
          
          {question.includes("Panna Music Centre located") && (
            <span className="block mt-2 text-sm italic">
                We are conveniently located on Kenyatta Street, directly opposite Telkom Building in the Eldoret CBD. You can find detailed map directions in our 'Location' section.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};


const Faqs = () => {
  return (
   
    <section className="py-16 md:py-24  dark:bg-black transition-colors duration-500 font-sans text-sm ">
      <div className="container mx-auto px-4 max-w-6xl">
        
        
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-3 text-primary">
            Your Questions, Answered.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Connect with support, or check our frequently asked questions below.
          </p>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-3 border-primary/50">
              Frequently Asked Questions
            </h3>
            
     
            <div className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-0">
              {faqItems.map((item, index) => (
                <FAQItem 
                  key={index} 
                  question={item.question} 
                  answer={item.answer}
                  isLast={index === faqItems.length - 1} 
                />
              ))}
            </div>
          </div>
          
         
          <div className="lg:col-span-1 space-y-8">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 border-b pb-3 border-primary/50">
              Need Direct Help?
            </h3>
            
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
              <ContactLink 
                Icon={Phone} 
                title="Call Our Team" 
                detail="+254 712 133 135" 
                href="tel:+254712345678"
                color="text-green-500"
              />
              <ContactLink 
                Icon={Mail} 
                title="Email Support" 
                detail="support@pannamusic.co.ke" 
                href="mailto:support@pannamusic.co.ke"
                color="text-indigo-500"
              />
              <ContactLink 
                Icon={MessageCircle} 
                title="WhatsApp Us" 
                detail="Chat Now" 
                href="https://wa.me/254712133135"
                color="text-blue-500"
              />
            </div>
            
            
            <div className="rounded-xl shadow-md border border-primary/20 transition-all duration-300 hover:shadow-xl overflow-hidden group">
              
              
              <div className="h-32 relative overflow-hidden">
                <img 
                  src={eldoretMap} 
                  alt="Map of Eldoret showing store location" 
                  className="w-full h-full object-cover grayscale opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                />     
                <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/5 backdrop-blur-sm transition-all duration-300 flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-primary dark:text-primary-light flex-shrink-0 drop-shadow-lg"/>
                </div>
              </div>
              
              
              <a href="#location" className="p-4 bg-primary/10 dark:bg-primary/20 flex items-center gap-4 text-left">
                <div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white">Visit Our Store</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Kenyatta Street, Opposite Telkom Building, Eldoret.
                  </p>
                  <span className="text-primary dark:text-primary-light text-sm font-medium mt-1 inline-block hover:underline">
                    Get Directions →
                  </span>
                </div>
              </a>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
};

// Helper Component for Contact Links (Unchanged)
const ContactLink = ({ Icon, title, detail, href, color }) => (
  <a 
    href={href} 
    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 group"
    target={href.startsWith('http') ? '_blank' : '_self'}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
  >
    <Icon className={`w-6 h-6 ${color} flex-shrink-0 group-hover:scale-105 transition-transform`} />
    <div>
      <h4 className="font-semibold text-base text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-300">{detail}</p>
    </div>
  </a>
);

export default Faqs;