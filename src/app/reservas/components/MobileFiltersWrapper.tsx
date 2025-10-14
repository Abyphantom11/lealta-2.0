"use client";

import dynamic from 'next/dynamic';

// Tipos para el componente
interface MobileFiltersWrapperProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

// Loading state para los filtros móviles
function MobileFiltersLoading() {
  return (
    <div className="lg:hidden mb-4">
      <div className="flex gap-2 mb-3">
        <div className="flex-1 h-11 bg-gray-200 rounded animate-pulse" />
        <div className="w-11 h-11 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Importación dinámica para evitar SSR
const MobileFilters = dynamic(
  () => import('./MobileFilters').then(mod => ({ default: mod.MobileFilters })),
  {
    ssr: false,
    loading: () => <MobileFiltersLoading />
  }
);

export default function MobileFiltersWrapper(props: MobileFiltersWrapperProps) {
  return <MobileFilters {...props} />;
}
