"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const UseCasesContext = createContext();

export function UseCasesProvider({ children }) {
  const { data: session } = useSession();
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUseCases = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/use-cases');
      if (!response.ok) {
        console.error('Fetch failed with status:', response.status, response.statusText);
        throw new Error('Failed to fetch use cases');
      }
      const data = await response.json();
      setUseCases(data.useCases || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching use cases:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

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
