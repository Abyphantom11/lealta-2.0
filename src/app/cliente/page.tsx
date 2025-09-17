'use client';

import { BrandingProvider } from './components/branding/BrandingProvider';
import AuthHandler from './components/AuthHandler';

export default function ClienteV2Page() {
  return (
    <BrandingProvider>
      <AuthHandler />
    </BrandingProvider>
  );
}

export function ClienteLegacyPage() {
  return (
    <div style={{padding: 32, color: 'gray', textAlign: 'center'}}>
      <h2>Acceso al portal cliente</h2>
      <p>Por favor accede usando la URL de tu negocio: <br /><b>/[businessId]/cliente</b></p>
      <p>Ejemplo: <code>/arepa/cliente</code></p>
    </div>
  );
}
