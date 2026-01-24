import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const PasswordChecker = ({ password }) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };

  const messages = {
    length: 'At least 8 characters',
    uppercase: 'At least one uppercase letter',
    lowercase: 'At least one lowercase letter',
    number: 'At least one number',
    specialChar: 'At least one special character',
  };

  return (
    <div className="mt-2 space-y-1">
      {Object.keys(checks).map((key) => (
        <div key={key} className={`flex items-center text-sm ${checks[key] ? 'text-green-500' : 'text-red-500'}`}>
          {checks[key] ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
          {messages[key]}
        </div>
      ))}
    </div>
  );
};

export default PasswordChecker;