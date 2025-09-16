// src/app/system-status/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Settings, Users, Database } from 'lucide-react';

interface SystemStatus {
  totalBusinesses: number;
  activeUsers: number;
  routeStatus: {
    legacy: { blocked: number; redirected: number };
    businessRoutes: { active: number };
  };
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setIsLoading(true);
      // Simular carga de datos del sistema
      setTimeout(() => {
        setStatus({
          totalBusinesses: 2,
          activeUsers: 3,
          routeStatus: {
            legacy: { blocked: 1, redirected: 3 },
            businessRoutes: { active: 6 }
          }
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading system status:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🛡️ Estado del Sistema - Lealta
                </h1>
                <p className="text-gray-600">
                  Monitoreo de seguridad y business isolation
                </p>
              </div>
            </div>
            <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-800 text-sm font-medium">Sistema Operativo</span>
            </div>
          </div>
        </div>

        {/* Estrategia Híbrida Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Rutas Críticas</h3>
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bloqueadas:</span>
                <span className="font-medium text-red-600">
                  {status?.routeStatus.legacy.blocked || 0}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                /superadmin → Bloqueo total
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Rutas Usuario</h3>
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Redirigidas:</span>
                <span className="font-medium text-blue-600">
                  {status?.routeStatus.legacy.redirected || 0}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                /admin, /staff, /cliente → Auto-redirect
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Business Routes</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Activas:</span>
                <span className="font-medium text-green-600">
                  {status?.routeStatus.businessRoutes.active || 0}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                /cafedani/*, /arepa/*
              </div>
            </div>
          </div>
        </div>

        {/* Business Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Businesses Activos</h3>
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Café Dani</h4>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Activo</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Subdomain: <code className="bg-gray-100 px-1 rounded">cafedani</code></div>
                  <div>URLs: <code className="bg-blue-100 px-1 rounded">/cafedani/*</code></div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Arepa Express</h4>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Activo</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Subdomain: <code className="bg-gray-100 px-1 rounded">arepa</code></div>
                  <div>URLs: <code className="bg-blue-100 px-1 rounded">/arepa/*</code></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Usuarios Activos</h3>
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total de usuarios:</span>
                <span className="font-medium">{status?.activeUsers || 0}</span>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>• admin@cafedani.com (Café Dani)</div>
                <div>• admin@arepaexpress.com (Arepa Express)</div>
                <div>• staff@cafedani.com (Café Dani)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estrategia Híbrida Explicación */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            Estrategia Híbrida Implementada
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-red-900 mb-2">🚫 Rutas Críticas - Bloqueo Total</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• <code>/superadmin</code> → Redirect a business-selection</li>
                <li>• Fuerza selección consciente de business</li>
                <li>• Máxima seguridad para funciones críticas</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">🔄 Rutas Usuario - Redirección Inteligente</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <code>/admin</code> → <code>/cafedani/admin</code></li>
                <li>• <code>/staff</code> → <code>/cafedani/staff</code></li>
                <li>• <code>/cliente</code> → <code>/cafedani/cliente</code></li>
                <li>• UX suave, migración transparente</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-green-50 p-3 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>✅ Resultado:</strong> Máxima seguridad + Mejor experiencia de usuario. 
              Las rutas críticas están completamente protegidas, mientras que las rutas de usuario 
              migran automáticamente al contexto correcto de business.
            </p>
          </div>
        </div>

        {/* URLs de Prueba */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🧪 URLs de Prueba</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-red-900 mb-2">Rutas Bloqueadas:</h4>
              <div className="space-y-1 text-sm">
                <a href="/superadmin" className="block text-red-600 hover:text-red-800 font-mono">
                  /superadmin → Bloqueada
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Rutas Redirigidas:</h4>
              <div className="space-y-1 text-sm">
                <a href="/admin" className="block text-blue-600 hover:text-blue-800 font-mono">
                  /admin → Auto-redirect
                </a>
                <a href="/staff" className="block text-blue-600 hover:text-blue-800 font-mono">
                  /staff → Auto-redirect
                </a>
                <a href="/cliente" className="block text-blue-600 hover:text-blue-800 font-mono">
                  /cliente → Auto-redirect
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
