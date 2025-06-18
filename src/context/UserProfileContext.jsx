//src/context/UserProfileContext.jsx
import React, { createContext, useContext, useState } from 'react';

const UserProfileContext = createContext();

export const useUserProfile = () => useContext(UserProfileContext);

export const UserProfileProvider = ({ children }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <UserProfileContext.Provider value={{ selectedUserId, setSelectedUserId }}>
      {children}
    </UserProfileContext.Provider>
  );
};
