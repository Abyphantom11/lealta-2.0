'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { AlertTriangle, ArrowRight, Building2 } from 'lucide-react';

/**
 * 🚫 RUTA LEGACY BLOQUEADA
 * Esta ruta ya no es válida. Los usuarios deben acceder vía /{businessId}/reservas
 * para mantener el aislamiento de datos entre negocios.
 */
export default function LegacyReservasPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect después de 5 segundos si no actúan
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToBusinessSelect = () => {
    // TODO: Implementar página de selección de negocio cuando esté lista
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-amber-200/20 bg-gradient-to-b from-amber-50/5 to-transparent">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-amber-100/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-xl text-white mb-2">
            Ruta No Disponible
          </CardTitle>
          <p className="text-slate-300 text-sm">
            Esta ruta legacy ha sido deshabilitada por seguridad
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-start space-x-3">
              <Building2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-white font-medium text-sm">
                  Acceso por Negocio Requerido
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Para mantener la seguridad y privacidad de los datos, ahora debes 
                  acceder a las reservas a través de la ruta específica de tu negocio: 
                  <code className="text-amber-300 bg-slate-900/50 px-1 py-0.5 rounded text-xs">
                    /{'{'}businessId{'}'}/reservas
                  </code>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGoToBusinessSelect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Seleccionar Mi Negocio
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Redirigiendo automáticamente en 5 segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
