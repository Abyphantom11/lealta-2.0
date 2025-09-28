export default function ReservasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {children}
    </div>
  );
}
