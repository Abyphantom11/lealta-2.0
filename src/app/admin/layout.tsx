import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Lealta',
  description: 'Panel de administración para gestión de clientes y consumos',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}
