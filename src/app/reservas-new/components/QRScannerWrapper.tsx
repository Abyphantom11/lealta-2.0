"use client";

import dynamic from 'next/dynamic';
import { ScanLine } from 'lucide-react';

// Componente de loading para el scanner
function QRScannerLoading() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 bg-gray-300 rounded mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded mb-2 w-48" />
            <div className="h-3 bg-gray-200 rounded w-64" />
          </div>
        </div>
      </div>
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <ScanLine className="h-12 w-12 animate-pulse" />
          <p className="text-sm">Cargando scanner...</p>
        </div>
      </div>
    </div>
  );
}

// Tipos para el componente
interface QRScannerWrapperProps {
  onScan: (qrCode: string) => Promise<void>;
  onError?: (error: string) => void;
}

// Importación dinámica del componente limpio para evitar SSR  
const QRScannerClean = dynamic(
  () => import('./QRScannerClean').then(mod => ({ default: mod.QRScannerClean })),
  {
    ssr: false,
    loading: () => <QRScannerLoading />
  }
);

export default function QRScannerWrapper(props: Readonly<QRScannerWrapperProps>) {
  return <QRScannerClean {...props} />;
}