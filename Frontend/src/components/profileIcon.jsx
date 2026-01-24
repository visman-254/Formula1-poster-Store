import React from 'react';
import { LogOut } from "lucide-react";

const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
    window.location.href = "/";
    localStorage.clear();
};

const ProfileIcon = () => {
  return (
     <button
      onClick={onLogout}
      className="flex items-center space-x-2 text-slate-200 hover:text-slate-300 bg-white px-4 py-2 rounded-md"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </button>
   
  );
};

export default ProfileIcon;