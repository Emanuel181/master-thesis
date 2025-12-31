"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook to save and restore scroll position for a ScrollArea or element
 * @param {React.RefObject} scrollRef - Reference to the scrollable element (ScrollArea viewport)
 * @param {string} customKey - Optional custom key for storage (defaults to pathname)
 */
export function useScrollRestoration(scrollRef, customKey) {
  const pathname = usePathname();
  const storageKey = `scroll_${customKey || pathname}`;
  const isRestored = useRef(false);

  // Save scroll position on scroll (debounced)
  const saveScrollPosition = useCallback(() => {
    if (!scrollRef?.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    if (scrollTop > 0) {
      sessionStorage.setItem(storageKey, scrollTop.toString());
    }
  }, [scrollRef, storageKey]);

  // Restore scroll position on mount
  useEffect(() => {
    if (!scrollRef?.current || isRestored.current) return;

    const savedPosition = sessionStorage.getItem(storageKey);
    if (savedPosition) {
      // Small delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = parseInt(savedPosition, 10);
          isRestored.current = true;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [scrollRef, storageKey]);

  // Add scroll listener with debounce
  useEffect(() => {
    const element = scrollRef?.current;
    if (!element) return;

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScrollPosition, 150);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [scrollRef, saveScrollPosition]);

  // Clear position when navigating away (optional - can be removed if you want to keep position forever)
  useEffect(() => {
    return () => {
      // Don't clear on unmount - we want to restore when coming back
    };
  }, []);

  return {
    clearPosition: () => sessionStorage.removeItem(storageKey),
  };
}

export default useScrollRestoration;
