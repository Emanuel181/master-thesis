"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const UseCasesContext = createContext();

export function UseCasesProvider({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUseCases = useCallback(async () => {
    // Don't fetch if not authenticated or if on login pages
    if (!session?.user?.id || pathname?.startsWith('/login')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/use-cases');
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { statusText: response.statusText };
        }
        
        console.log('[UseCases] Fetch status:', response.status, 'Error:', errorData);

        // Handle authentication errors (401 Unauthorized or 404 User not found)
        if (response.status === 401 || (response.status === 404 && errorData.error === 'User not found')) {
            console.warn('Authentication invalid or user not found. Signing out...');
            await signOut({ callbackUrl: '/login' });
            return;
        }

        console.error('Fetch failed with status:', response.status, errorData);
        
        throw new Error(errorData.error || 'Failed to fetch use cases');
      }
      const data = await response.json();
      setUseCases(data.useCases || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching use cases:', err);
    } finally {
      setLoading(false);
    }
  }, [session, pathname]);

  useEffect(() => {
    fetchUseCases();
  }, [fetchUseCases]);

  const refresh = async () => {
    await fetchUseCases();
  };

  return (
    <UseCasesContext.Provider value={{
      useCases,
      loading,
      error,
      refresh
    }}>
      {children}
    </UseCasesContext.Provider>
  );
}

export function useUseCases() {
  const context = useContext(UseCasesContext);
  if (!context) {
    throw new Error('useUseCases must be used within a UseCasesProvider');
  }
  return context;
}
