// components/ProfileSkeleton.jsx
import React from 'react';

const ProfileSkeleton = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 animate-pulse">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="flex space-x-8 mt-4">
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-full h-40 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSkeleton;
