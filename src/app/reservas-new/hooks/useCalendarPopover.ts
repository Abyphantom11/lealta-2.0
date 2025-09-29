"use client";

import { useState, useCallback, useEffect } from 'react';

export function useCalendarPopover() {
  const [isOpen, setIsOpen] = useState(false);

  const openPopover = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePopover = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closePopover();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closePopover]);

  return {
    isOpen,
    openPopover,
    closePopover,
    togglePopover,
    setIsOpen
  };
}
