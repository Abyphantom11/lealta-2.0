'use client';
import { Suspense } from 'react';
import { NotificationButton } from './NotificationButton';

interface ClientNotificationsProps {
  readonly className?: string;
}

export function ClientNotifications({ className }: Readonly<ClientNotificationsProps>) {
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
