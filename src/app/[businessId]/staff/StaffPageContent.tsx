// ========================================
// 📦 SECCIÓN: IMPORTS Y DEPENDENCIAS (1-18)
// ========================================
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from '../../../components/motion';
import { useRequireAuth } from '../../../hooks/useAuth';
import RoleSwitch from '../../../components/RoleSwitch';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  User,
  History,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Award,
  X,
  Zap,
  UserPlus,
  Copy,
} from 'lucide-react';
import logger from '@/lib/logger';
import HostSearchModal from '@/components/staff/HostSearchModal';
import GuestConsumoToggle from '@/components/staff/GuestConsumoToggle';
import type { HostSearchResult } from '@/types/host-tracking';

// ========================================
// 🔧 SECCIÓN: INTERFACES Y TIPOS (19-100)
// ========================================

// Type for notifications
type NotificationType = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

// Types for customer info
interface CustomerInfo {
  id: string;
  nombre: string;
  cedula: string;
  puntos: number;
  email?: string;
  telefono?: string;
  nivel?: string;
  totalGastado?: number;
  frecuencia?: string;
  ultimaVisita?: string | null;
}

// Types for product data
interface Product {
  id?: string;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
  name?: string; // Para compatibilidad con diferentes formatos
  price?: number; // Para compatibilidad con diferentes formatos
}

interface EditableProduct {
  name: string;
  price: number;
  line: string;
}

// Types for AI analysis results
interface AnalysisProduct {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
}

interface AIAnalysis {
  empleadoDetectado: string;
  productos: AnalysisProduct[];
  total: number;
  confianza: number;
}

interface AIResult {
  cliente: {
    id: string;
    nombre: string;
    cedula: string;
    puntos: number;
  };
  analisis: AIAnalysis;
  metadata: {
    businessId: string;
    empleadoId: string;
    imagenUrl: string;
    isBatchProcess?: boolean;
    totalImages?: number;
    successfulImages?: number;
  };
}

// Types for recent tickets and stats
interface RecentTicket {
  id: string;
  cliente: string;
  cedula: string;
  productos: string[];
  total: number;
  puntos: number;
  fecha: string;
  monto: number;
  items: string[];
  hora: string;
  tipo?: string;
}

interface TodayStats {
  ticketsProcessed: number;
  totalPoints: number;
  uniqueCustomers: number;
  totalAmount: number;
}

// Types for consumption data
interface ConsumoData {
  id?: string;
  cliente:
    | string
    | {
        cedula: string;
        nombre: string;
      };
  cedula: string;
  productos: Product[];
  total: number;
  puntos: number;
  fecha: string;
  tipo?: string;
}

interface StaffPageContentProps {
  businessId: string;
}

// Por ahora, vamos a crear un componente básico
// TODO: Migrar toda la funcionalidad del staff page original
export default function StaffPageContent({ businessId }: StaffPageContentProps) {
  const { user, loading } = useRequireAuth('STAFF');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Panel de Staff</h1>
              <p className="text-gray-600">Negocio: {businessId}</p>
            </div>
            <RoleSwitch 
              currentRole={'STAFF'}
              currentPath={`/${businessId}/staff`}
              businessId={businessId}
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Registrar Consumo */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <Zap className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Registrar Consumo</h3>
              </div>
              <p className="mb-4">Procesar consumos de clientes</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
                Procesar
              </button>
            </div>

            {/* Buscar Cliente */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <Users className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Buscar Cliente</h3>
              </div>
              <p className="mb-4">Encontrar información del cliente</p>
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50">
                Buscar
              </button>
            </div>

            {/* Historial */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <History className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Historial</h3>
              </div>
              <p className="mb-4">Ver transacciones recientes</p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50">
                Ver
              </button>
            </div>
          </div>

          {/* Información del Business */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Contexto de Negocio:</strong> {businessId}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Staff: {user?.name || 'Usuario'} | Rol: {user?.role}
            </p>
          </div>

          {/* TODO: Migrar funcionalidades completas del staff page original */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Nota:</strong> Este es el componente básico de Staff. 
              La funcionalidad completa se migrará del componente original.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
