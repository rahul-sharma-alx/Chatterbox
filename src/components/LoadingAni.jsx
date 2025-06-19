// src/components/LoadingAni.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingAni = ({ text = 'Loading...', size = 32, fullScreen = false }) => {
  const wrapperClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen bg-white z-[100] dark:bg-black'
    : 'flex items-center justify-center py-8 bg-white z-[100]';

  return (
    <div className={wrapperClasses}>
      <div className="flex items-center space-x-3">
        <Loader2
          className="animate-spin text-blue-500"
          size={size}
          strokeWidth={2.5}
        />
        {text && <p className="text-gray-600 dark:text-gray-300 text-lg">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingAni;
