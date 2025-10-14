'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ConfiguracionPage() {
  const params = useParams();
  const businessId = params.businessId as string;

  const configCards = [
    {
      title: 'QR Personalizado',
      description: 'Diseña códigos QR únicos para tus reservas con tu marca',
      href: `/${businessId}/admin/configuracion/qr-personalizado`,
      color: 'indigo',
      features: [
        'Marco con gradiente personalizable',
        'Logo de tu negocio',
        'Campos opcionales configurables',
        'Mensaje de bienvenida',
      ],
    },
    {
      title: 'Branding',
      description: 'Configura los colores, logo y estilo de tu marca',
      href: `/${businessId}/admin/configuracion/branding`,
      color: 'purple',
      features: [
        'Logo y colores corporativos',
        'Tipografía personalizada',
        'Temas personalizados',
      ],
      comingSoon: true,
    },
    {
      title: 'Notificaciones',
      description: 'Configura alertas y notificaciones automáticas',
      href: `/${businessId}/admin/configuracion/notificaciones`,
      color: 'blue',
      features: [
        'Emails automáticos',
        'SMS a clientes',
        'Alertas de sistema',
      ],
      comingSoon: true,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600 mt-2">
          Personaliza la experiencia de tu negocio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {configCards.map((card) => (
          <Card
            key={card.title}
            className={`relative ${
              card.comingSoon ? 'opacity-75' : ''
            }`}
          >
            {card.comingSoon && (
              <div className="absolute top-4 right-4">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Próximamente
                </span>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-${card.color}-500`}></div>
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-4">
                {card.features.map((feature) => (
                  <li key={feature} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {!card.comingSoon && (
                <Link href={card.href}>
                  <Button className="w-full gap-2">
                    Configurar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>¿Necesitas ayuda?</CardTitle>
          <CardDescription>
            Recursos y documentación para configurar tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/docs">📚 Documentación</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">💬 Soporte</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
