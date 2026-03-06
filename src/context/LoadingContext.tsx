import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadingManager } from '../lib/loading';
import { Loader2 } from 'lucide-react';

const LoadingContext = createContext(false);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(loadingManager.getIsLoading());

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe(setIsLoading);
    return unsubscribe;
  }, []);

  return (
    <LoadingContext.Provider value={isLoading}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Loader2 className="animate-spin text-brand" size={48} />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
