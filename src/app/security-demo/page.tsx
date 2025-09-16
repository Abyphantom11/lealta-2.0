// src/app/security-demo/page.tsx
'use client';

import { useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function SecurityDemoPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    url: string;
    expected: string;
    status: 'pending' | 'pass' | 'fail';
    result?: string;
  }>>([]);

  const securityTests = [
    {
      test: 'Acceso legítimo',
      url: '/cafedani/admin',
      expected: 'Acceso permitido si el usuario pertenece a Café Dani',
      description: 'Usuario logueado en Café Dani accede a su dashboard'
    },
    {
      test: 'Intento de acceso cruzado',
      url: '/arepa/admin',
      expected: 'Acceso denegado - Business mismatch',
      description: 'Usuario de Café Dani intenta acceder a Arepa Express'
    },
    {
      test: 'Business inexistente',
      url: '/empresafake/admin',
      expected: 'Redirect a login - Business not found',
      description: 'Intentar acceder a un business que no existe'
    },
    {
      test: 'Sin sesión',
      url: '/cafedani/admin',
      expected: 'Redirect a login - No session',
      description: 'Acceso sin estar logueado'
    }
  ];

  const runSecurityTest = async (test: any, index: number) => {
    setTestResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...test, status: 'pending' };
      return newResults;
    });

    try {
      // Simular acceso a la URL
      const response = await fetch(test.url, {
        method: 'GET',
        redirect: 'manual' // No seguir redirects automáticamente
      });

      let result = '';
      let status: 'pass' | 'fail' = 'fail';

      if (response.type === 'opaqueredirect' || response.status === 302) {
        result = 'Redirect detectado ✅';
        status = 'pass';
      } else if (response.ok) {
        result = 'Acceso permitido ✅';
        status = test.expected.includes('permitido') ? 'pass' : 'fail';
      } else {
        result = `Error ${response.status}`;
        status = 'fail';
      }

      setTestResults(prev => {
        const newResults = [...prev];
        newResults[index] = { ...test, status, result };
        return newResults;
      });

    } catch (error) {
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[index] = { 
          ...test, 
          status: 'fail', 
          result: 'Error de conexión' 
        };
        return newResults;
      });
    }
  };

  const runAllTests = () => {
    securityTests.forEach((test, index) => {
      setTimeout(() => runSecurityTest(test, index), index * 1000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔐 Demo de Seguridad - Business Isolation
              </h1>
              <p className="text-gray-600">
                Validación de aislamiento entre businesses
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">
              ¿Cómo funciona la seguridad?
            </h2>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Validación de sesión:</strong> El middleware verifica que el usuario esté logueado</li>
              <li>• <strong>Business matching:</strong> El businessId de la sesión DEBE coincidir con el de la URL</li>
              <li>• <strong>Doble verificación:</strong> Se valida en BD que el usuario pertenece al business</li>
              <li>• <strong>Redirects automáticos:</strong> Accesos inválidos redirigen a login con mensaje específico</li>
            </ul>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tests de Seguridad</h2>
            <button
              onClick={runAllTests}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ejecutar Tests
            </button>
          </div>

          <div className="grid gap-4">
            {securityTests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {testResults[index]?.status === 'pending' && (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                    )}
                    {testResults[index]?.status === 'pass' && (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    )}
                    {testResults[index]?.status === 'fail' && (
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    )}
                    <h3 className="font-semibold">{test.test}</h3>
                  </div>
                  <button
                    onClick={() => runSecurityTest(test, index)}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    Probar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>URL:</strong>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {test.url}
                    </code>
                  </div>
                  <div>
                    <strong>Esperado:</strong>
                    <span className="ml-2 text-gray-600">{test.expected}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mt-2">{test.description}</p>

                {testResults[index]?.result && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Resultado:</strong> {testResults[index].result}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-blue-600" />
              Business: Café Dani
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Subdomain:</strong> cafedani
              </div>
              <div>
                <strong>Admin:</strong> admin@cafedani.com
              </div>
              <div>
                <strong>Password:</strong> admin123
              </div>
              <div>
                <strong>URL:</strong>
                <code className="ml-1 bg-blue-100 px-1 rounded">/cafedani/admin</code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-green-600" />
              Business: Arepa Express
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Subdomain:</strong> arepa
              </div>
              <div>
                <strong>Admin:</strong> admin@arepaexpress.com
              </div>
              <div>
                <strong>Password:</strong> admin456
              </div>
              <div>
                <strong>URL:</strong>
                <code className="ml-1 bg-green-100 px-1 rounded">/arepa/admin</code>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-800">Instrucciones de Prueba</h3>
          </div>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>Inicia sesión con admin@cafedani.com / admin123</li>
            <li>Visita /cafedani/admin (debe funcionar ✅)</li>
            <li>Cambia la URL a /arepa/admin (debe redirigir a login ❌)</li>
            <li>Inicia sesión con admin@arepaexpress.com / admin456</li>
            <li>Ahora /arepa/admin debe funcionar y /cafedani/admin debe fallar</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
