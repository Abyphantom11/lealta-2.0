'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings, Palette, QrCode, Bell } from 'lucide-react';

interface ConfigLayoutProps {
  children: React.ReactNode;
  params: { businessId: string };
}

export default function ConfiguracionLayout({ children, params }: ConfigLayoutProps) {
  const pathname = usePathname();
  const { businessId } = params;

  const menuItems = [
    {
      title: 'General',
      href: `/${businessId}/admin/configuracion`,
      icon: Settings,
      description: 'Configuración general del negocio',
    },
    {
      title: 'Branding',
      href: `/${businessId}/admin/configuracion/branding`,
      icon: Palette,
      description: 'Logo, colores y marca',
    },
    {
      title: 'QR Personalizado',
      href: `/${businessId}/admin/configuracion/qr-personalizado`,
      icon: QrCode,
      description: 'Diseño de códigos QR',
    },
    {
      title: 'Notificaciones',
      href: `/${businessId}/admin/configuracion/notificaciones`,
      icon: Bell,
      description: 'Alertas y notificaciones',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
            <p className="text-sm text-gray-600">Personaliza tu negocio</p>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-start gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
