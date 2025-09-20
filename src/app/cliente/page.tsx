'use client';

import { BrandingProvider } from './components/branding/BrandingProvider';
import AuthHandler from './components/AuthHandler';

export default function ClienteV2Page() {
  return (
    <BrandingProvider businessId="cmfr2y0ia0000eyvw7ef3k20u">
      <AuthHandler />
    </BrandingProvider>
  );
}
