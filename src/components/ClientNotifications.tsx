'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Importar dinámicamente para evitar problemas de SSR
const NotificationButton = dynamic(
  () => import('./NotificationButton').then(mod => ({ default: mod.NotificationButton })),
  { 
    ssr: false,
    loading: () => (
      <button className="px-3 py-2 rounded-lg bg-dark-800 border border-dark-600">
        <div className="h-4 w-4 bg-gray-400 rounded animate-pulse" />
      </button>
    )
  }
);

interface ClientNotificationsProps {
  className?: string;
}

export function ClientNotifications({ className }: ClientNotificationsProps) {
  return (
    <Suspense fallback={
      <button className={`px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 ${className || ''}`}>
        <div className="h-4 w-4 bg-gray-400 rounded animate-pulse" />
      </button>
    }>
      <NotificationButton className={className} />
    </Suspense>
  );
}
