import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ElectronProvider } from "../components/ElectronProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lealta - Premium Customer Experience",
  description: "Sistema de captación y control de clientes para bares, restaurantes y discotecas",
  keywords: ["lealta", "restaurant", "bar", "customer", "loyalty"],
  authors: [{ name: "Lealta Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ElectronProvider>
          <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
            {children}
          </div>
        </ElectronProvider>
      </body>
    </html>
  );
}
