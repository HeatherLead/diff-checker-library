import React, { createContext, useContext } from 'react';

const DiffCheckerContext = createContext(null);

export const DiffCheckerProvider = ({ value, children }) => {
  return (
    <DiffCheckerContext.Provider value={value}>
      {children}
    </DiffCheckerContext.Provider>
  );
};

export const useDiffChecker = () => {
  const context = useContext(DiffCheckerContext);
  if (!context) {
    return {};
  }
  return context;
};

export default DiffCheckerContext;
