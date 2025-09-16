// src/app/test-routing/page.tsx
'use client';

export default function TestRoutingPage() {
  const testUrls = [
    '/cafedani/admin',
    '/cafedani/staff', 
    '/cafedani/cliente'
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">🧪 Test de Routing por Business</h1>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">URLs de Prueba:</h2>
          
          {testUrls.map((url) => (
            <div key={url} className="border rounded-lg p-4">
              <a
                href={url}
                className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                {url}
              </a>
              <p className="text-gray-500 text-xs mt-1">
                Debería mostrar la página específica del business "cafedani"
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">¿Cómo funciona?</h3>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Middleware detecta el subdomain del URL</li>
            <li>• Valida que el business existe en BD</li>
            <li>• Reescribe la URL interna</li>
            <li>• Agrega headers de contexto</li>
            <li>• La página recibe el contexto del business</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
