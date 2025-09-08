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
