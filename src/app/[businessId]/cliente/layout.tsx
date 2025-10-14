import { Metadata } from 'next';

interface ClienteLayoutProps {
  readonly children: React.ReactNode;
  readonly params: { businessId: string };
}

export async function generateMetadata({ params }: { params: { businessId: string } }): Promise<Metadata> {
  const businessSlug = params.businessId;
  const businessName = businessSlug.charAt(0).toUpperCase() + businessSlug.slice(1);
  
  return {
    title: `${businessName} - Mi Tarjeta`,
    description: `Portal de cliente para ${businessName}`,
    applicationName: businessName,
    
    // ✅ Meta tags específicos de Apple para iOS
    appleWebApp: {
      capable: true,
      title: businessName,
      statusBarStyle: 'black-translucent',
    },
    
    // Manifest dinámico (ya existe, solo lo referenciamos)
    manifest: `/api/manifest?business=${businessSlug}`,
    
    // Icons
    icons: {
      icon: '/icons/icon-192.png',
      shortcut: '/icons/icon-192.png',
      apple: '/icons/apple-touch-icon.png',
    },
  };
}

export default function ClienteLayout({ children }: ClienteLayoutProps) {
  // ✅ Este layout solo AGREGA meta tags para iOS
  // NO modifica el comportamiento existente
  return <>{children}</>;
}
