import React, { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import { useLocation } from "react-router-dom";

const Contactus = () => {
  const location = useLocation();
  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    setIsAdminPage(location.pathname.startsWith("/admin"));
  }, [location]);

  if (isAdminPage) {
    return null;
  }

  return (
    <footer className="footer bg-white text-gray-600 dark:bg-black dark:text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Brand */}
        <div>
          <h2 className="text-xl font-bold text-white">Panna Music Center</h2>
          <p className="mt-4 text-sm">
             Your destination for all things electronics, and Samsung-authorized repairs.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2">
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="/products" className="hover:text-white">Products</a></li>
            <li><a href="/orders" className="hover:text-white">Orders</a></li>
            <li><a href="/cart" className="hover:text-white">Cart</a></li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white">Contact Us</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={16} /> support@pannamusic.com
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> +254 712 133 135
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} /> Eldoret, Kenya
            </li>
          </ul>

          {/* Socials */}
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-white"><Facebook size={20} /></a>
            <a href="#" className="hover:text-white"><Twitter size={20} /></a>
            <a  href="https://www.instagram.com/pannamusiceld/" 
  target="_blank" 
  rel="noopener noreferrer"  className="hover:text-white"><Instagram size={20} /></a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © {new Date().getFullYear()} panna music center. All rights reserved.
      </div>
    </footer>
  );
};

export default Contactus;
