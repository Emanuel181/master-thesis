"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { DEMO_USE_CASES } from './demoContext';

const UseCasesContext = createContext();

// Public routes that don't need use cases data
const PUBLIC_ROUTES = ['/', '/login', '/about', '/privacy', '/terms', '/changelog'];

export function UseCasesProvider({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);
  const isDemoMode = pathname?.startsWith('/demo');

  const fetchUseCases = useCallback(async () => {
    // In demo mode, use demo data instead of fetching
    if (isDemoMode) {
      // Transform demo use cases to match expected format
      const transformedDemoUseCases = DEMO_USE_CASES.map(uc => ({
        id: uc.id,
        title: uc.name,
        content: uc.description,
        shortDescription: uc.shortDescription,
        fullContent: uc.fullDescription,
        icon: uc.icon,
        pdfCount: uc.pdfCount,
        formattedTotalSize: uc.formattedTotalSize,
      }));
      setUseCases(transformedDemoUseCases);
      setLoading(false);
      return;
    }

    // Don't fetch if already in progress (deduplication)
    if (fetchInProgress.current) return;
    
    // Don't fetch if not authenticated or session is still loading
    if (status === 'loading') return;
    
    // Don't fetch on public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname?.startsWith('/login')
    );
    if (isPublicRoute) {
      setLoading(false);
      return;
    }
    
    // Don't fetch if not authenticated
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      fetchInProgress.current = true;
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
      
      const jsonResponse = await response.json();
      console.log('[UseCases] Fetch response:', jsonResponse);
      
      // Handle wrapped response from createApiHandler
      const data = jsonResponse.data || jsonResponse;
      console.log('[UseCases] Extracted data:', data);
      
      setUseCases(data.useCases || []);
    } catch (err) {
      setError(err.message);
      console.error('[UseCases] Error fetching use cases:', err);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [session, pathname, status, isDemoMode]);

  useEffect(() => {
    // Use requestIdleCallback for non-critical initial fetch
    const scheduleId = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(() => fetchUseCases(), { timeout: 2000 })
      : setTimeout(() => fetchUseCases(), 100);
    
    return () => {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(scheduleId);
      } else {
        clearTimeout(scheduleId);
      }
    };
  }, [fetchUseCases]);

  const refresh = useCallback(async () => {
    await fetchUseCases();
  }, [fetchUseCases]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    useCases,
    loading,
    error,
    refresh
  }), [useCases, loading, error, refresh]);

  return (
    <UseCasesContext.Provider value={contextValue}>
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
