# 🎨 PERSONALIZACIÓN DE QR CON BRANDING - ANÁLISIS Y PROPUESTA

## 🎯 OBJETIVO

Crear QR codes personalizados con branding de la empresa que incluyan:
- 🏢 Logo y colores de la empresa
- 📝 Nombre del cliente y detalles de reserva
- 💬 Mensaje personalizable ("¡Te esperamos!", etc.)
- 🎨 Marco/frame con el estilo del negocio
- 📱 Optimizado para compartir en WhatsApp/Email/Redes

---

## 💡 IDEAS Y ENFOQUES POSIBLES

### 🎨 **OPCIÓN 1: Canvas API (Frontend) - RECOMENDADO**

**Ventajas:**
- ✅ Render en tiempo real en navegador
- ✅ No requiere API externa
- ✅ Preview instantáneo
- ✅ Totalmente personalizable
- ✅ Sin costos adicionales
- ✅ Export a PNG/JPG de alta calidad

**Desventajas:**
- ⚠️ Requiere más código frontend
- ⚠️ Procesamiento en cliente

**Stack:**
```typescript
- Canvas API (nativo browser)
- react-qr-code (genera SVG del QR)
- Branding config desde DB
- Fonts personalizadas (Google Fonts)
```

---

### 🖼️ **OPCIÓN 2: Librería de QR con Estilos (qrcode-styled)**

**Ventajas:**
- ✅ QR con logo en el centro
- ✅ Colores personalizados
- ✅ Gradientes y estilos
- ✅ Librería madura

**Desventajas:**
- ⚠️ Limitado a estilos del QR mismo
- ⚠️ Marco/texto requiere Canvas adicional

**Stack:**
```bash
npm install qrcode-styled
```

---

### 🚀 **OPCIÓN 3: API de Generación (Cloudinary/Imgix)**

**Ventajas:**
- ✅ Procesamiento en servidor
- ✅ URLs permanentes
- ✅ Optimización automática
- ✅ CDN incluido

**Desventajas:**
- ❌ Costos adicionales
- ❌ Dependencia externa
- ❌ Latencia en generación

---

### 🏆 **OPCIÓN HÍBRIDA (RECOMENDACIÓN FINAL)**

Combinar lo mejor de cada enfoque:

```
1. Canvas API para render del marco + textos + logo
2. react-qr-code para el QR base
3. Branding config desde DB (ya existe)
4. Export a PNG de alta calidad
5. Opcional: Upload a Cloudinary para compartir URL
```

---

## 🎨 DISEÑO PROPUESTO

### 📐 **Layout del QR Personalizado**

```
┌─────────────────────────────────────────┐
│                                         │
│  [LOGO]      NOMBRE EMPRESA             │  ← Header con branding
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         ¡Confirmación de Reserva!       │  ← Título
│                                         │
│         👤 Juan Pérez                   │  ← Nombre cliente
│         📅 15 Oct 2025 - 🕐 20:00      │  ← Fecha/Hora
│         👥 4 personas                   │  ← Personas
│         📍 Mesa 5                       │  ← Mesa (si aplica)
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │       [QR CODE]             │     │  ← QR centrado
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│       Código: RES-ABC123               │  ← Código de reserva
│                                         │
├─────────────────────────────────────────┤
│                                         │
│       💬 ¡Te esperamos!                │  ← Mensaje personalizado
│                                         │
│    📞 +507 6000-0000                   │  ← Contacto
│    📧 contacto@negocio.com             │
│                                         │
└─────────────────────────────────────────┘
    ↑                                   ↑
    Border con color primario del negocio
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### 📋 **FASE 1: Estructura de Datos**

#### **1.1 Extender Branding Config**

```typescript
// src/types/branding.ts
export interface QRBrandingConfig {
  // Configuración del marco
  marco: {
    enabled: boolean;
    colorPrimario: string;      // Del branding existente
    colorSecundario: string;    // Del branding existente
    grosorBorde: number;        // px (default: 4)
    borderRadius: number;       // px (default: 16)
  };
  
  // Configuración del header
  header: {
    mostrarLogo: boolean;
    logoUrl?: string;           // Del branding existente
    nombreEmpresa: string;      // Del branding existente
    fontSize: number;           // default: 24
    fontWeight: 'normal' | 'bold' | 'black';
  };
  
  // Configuración del mensaje
  mensaje: {
    texto: string;              // "¡Te esperamos!", "¡Nos vemos pronto!", etc.
    emoji: string;              // "💬", "🎉", "✨", etc.
    fontSize: number;           // default: 20
    color: string;              // default: colorPrimario
  };
  
  // Información de contacto
  contacto: {
    mostrarTelefono: boolean;
    telefono?: string;
    mostrarEmail: boolean;
    email?: string;
    mostrarDireccion: boolean;
    direccion?: string;
  };
  
  // Configuración del QR
  qr: {
    size: number;               // default: 300
    foregroundColor: string;    // default: '#000000'
    backgroundColor: string;    // default: '#ffffff'
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'; // default: 'M'
    incluirLogo: boolean;       // Logo en centro del QR
    logoSize: number;           // % del QR (default: 20)
  };
  
  // Layout general
  layout: {
    width: number;              // default: 600
    height: number;             // default: 900
    backgroundColor: string;    // default: '#ffffff'
    padding: number;            // default: 40
  };
}

// Valores por defecto
export const DEFAULT_QR_BRANDING: QRBrandingConfig = {
  marco: {
    enabled: true,
    colorPrimario: '#6366f1',
    colorSecundario: '#8b5cf6',
    grosorBorde: 4,
    borderRadius: 16,
  },
  header: {
    mostrarLogo: true,
    nombreEmpresa: 'Mi Negocio',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mensaje: {
    texto: '¡Te esperamos!',
    emoji: '🎉',
    fontSize: 20,
    color: '#6366f1',
  },
  contacto: {
    mostrarTelefono: true,
    mostrarEmail: true,
    mostrarDireccion: false,
  },
  qr: {
    size: 300,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
    incluirLogo: false,
    logoSize: 20,
  },
  layout: {
    width: 600,
    height: 900,
    backgroundColor: '#ffffff',
    padding: 40,
  },
};
```

#### **1.2 Actualizar Schema Prisma**

```prisma
// prisma/schema.prisma

model Business {
  id               String   @id @default(cuid())
  name             String
  
  // ... campos existentes ...
  
  // 🎨 QR Branding Config
  qrBrandingConfig Json?    @default("{}")  // Almacena QRBrandingConfig
  
  // Valores rápidos para queries
  qrMensajeBienvenida String? @default("¡Te esperamos!")
  qrMostrarLogo       Boolean @default(true)
  qrMostrarContacto   Boolean @default(true)
}
```

---

### 🎨 **FASE 2: Componente de Generación**

#### **2.1 Componente BrandedQRGenerator**

```typescript
// src/app/reservas/components/BrandedQRGenerator.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Download, Share2, Eye, Settings } from "lucide-react";
import QRCode from "react-qr-code";
import { Reserva } from "../types/reservation";
import { QRBrandingConfig, DEFAULT_QR_BRANDING } from "@/types/branding";
import { toast } from "sonner";

interface BrandedQRGeneratorProps {
  reserva: Reserva;
  businessId: string;
  brandingConfig?: QRBrandingConfig;
}

export function BrandedQRGenerator({
  reserva,
  businessId,
  brandingConfig = DEFAULT_QR_BRANDING,
}: BrandedQRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generar QR branded al montar o cambiar config
  useEffect(() => {
    generateBrandedQR();
  }, [reserva, brandingConfig]);

  const generateBrandedQR = async () => {
    const canvas = canvasRef.current;
    const qrContainer = qrRef.current;
    
    if (!canvas || !qrContainer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);

    try {
      const { width, height, backgroundColor, padding } = brandingConfig.layout;
      
      // Setup canvas
      canvas.width = width;
      canvas.height = height;

      // Fondo
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Marco/Border
      if (brandingConfig.marco.enabled) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, brandingConfig.marco.colorPrimario);
        gradient.addColorStop(1, brandingConfig.marco.colorSecundario);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = brandingConfig.marco.grosorBorde;
        ctx.roundRect(
          brandingConfig.marco.grosorBorde / 2,
          brandingConfig.marco.grosorBorde / 2,
          width - brandingConfig.marco.grosorBorde,
          height - brandingConfig.marco.grosorBorde,
          brandingConfig.marco.borderRadius
        );
        ctx.stroke();
      }

      let currentY = padding;

      // HEADER: Logo + Nombre Empresa
      if (brandingConfig.header.mostrarLogo && brandingConfig.header.logoUrl) {
        try {
          const logo = await loadImage(brandingConfig.header.logoUrl);
          const logoSize = 60;
          ctx.drawImage(logo, padding, currentY, logoSize, logoSize);
          
          // Nombre empresa al lado del logo
          ctx.fillStyle = brandingConfig.marco.colorPrimario;
          ctx.font = `${brandingConfig.header.fontWeight} ${brandingConfig.header.fontSize}px Inter, sans-serif`;
          ctx.fillText(
            brandingConfig.header.nombreEmpresa,
            padding + logoSize + 20,
            currentY + logoSize / 2 + 8
          );
          
          currentY += logoSize + 30;
        } catch (error) {
          console.error('Error loading logo:', error);
          // Si falla el logo, solo mostrar texto
          ctx.fillStyle = brandingConfig.marco.colorPrimario;
          ctx.font = `${brandingConfig.header.fontWeight} ${brandingConfig.header.fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(
            brandingConfig.header.nombreEmpresa,
            width / 2,
            currentY + 20
          );
          currentY += 50;
        }
      }

      // Línea separadora
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      currentY += 30;

      // TÍTULO
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡Confirmación de Reserva!', width / 2, currentY);
      currentY += 40;

      // INFORMACIÓN DE LA RESERVA
      ctx.fillStyle = '#4b5563';
      ctx.font = '20px Inter, sans-serif';
      ctx.textAlign = 'center';

      // Nombre cliente
      ctx.fillText(`👤 ${reserva.cliente.nombre}`, width / 2, currentY);
      currentY += 35;

      // Fecha y hora
      ctx.fillText(
        `📅 ${reserva.fecha} • 🕐 ${reserva.hora}`,
        width / 2,
        currentY
      );
      currentY += 35;

      // Número de personas
      ctx.fillText(`👥 ${reserva.numeroPersonas} personas`, width / 2, currentY);
      currentY += 35;

      // Mesa (si aplica)
      if (reserva.mesa) {
        ctx.fillText(`📍 Mesa ${reserva.mesa}`, width / 2, currentY);
        currentY += 35;
      }

      currentY += 20;

      // QR CODE
      const qrSvg = qrContainer.querySelector('svg');
      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const qrImage = await loadImage(svgUrl);
        const qrSize = brandingConfig.qr.size;
        const qrX = (width - qrSize) / 2;
        
        // Fondo blanco para el QR
        ctx.fillStyle = brandingConfig.qr.backgroundColor;
        ctx.fillRect(qrX - 10, currentY - 10, qrSize + 20, qrSize + 20);
        
        // QR
        ctx.drawImage(qrImage, qrX, currentY, qrSize, qrSize);
        URL.revokeObjectURL(svgUrl);
        
        currentY += qrSize + 30;
      }

      // Código de reserva
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Código: ${reserva.qrToken || reserva.id}`, width / 2, currentY);
      currentY += 40;

      // Línea separadora
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      currentY += 30;

      // MENSAJE PERSONALIZADO
      ctx.fillStyle = brandingConfig.mensaje.color;
      ctx.font = `bold ${brandingConfig.mensaje.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        `${brandingConfig.mensaje.emoji} ${brandingConfig.mensaje.texto}`,
        width / 2,
        currentY
      );
      currentY += 40;

      // INFORMACIÓN DE CONTACTO
      if (brandingConfig.contacto.mostrarTelefono && brandingConfig.contacto.telefono) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`📞 ${brandingConfig.contacto.telefono}`, width / 2, currentY);
        currentY += 25;
      }

      if (brandingConfig.contacto.mostrarEmail && brandingConfig.contacto.email) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`📧 ${brandingConfig.contacto.email}`, width / 2, currentY);
        currentY += 25;
      }

      if (brandingConfig.contacto.mostrarDireccion && brandingConfig.contacto.direccion) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(`📍 ${brandingConfig.contacto.direccion}`, width / 2, currentY);
      }

      // Generar preview URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error generando QR branded:', error);
      toast.error('Error al generar el QR personalizado');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reserva-${reserva.cliente.nombre.replace(/\s+/g, '-')}-${reserva.fecha}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('QR descargado exitosamente');
    }, 'image/png', 1.0);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        toast.error('Error al compartir');
        return;
      }

      // Web Share API
      if (navigator.share) {
        const file = new File([blob], `reserva-${reserva.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Confirmación de Reserva',
          text: `Reserva confirmada para ${reserva.cliente.nombre} - ${reserva.fecha} ${reserva.hora}`,
          files: [file],
        });
        
        toast.success('QR compartido exitosamente');
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        toast.success('QR copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Error al compartir el QR');
    }
  };

  return (
    <div className="space-y-4">
      {/* QR Hidden (para generar el SVG) */}
      <div ref={qrRef} className="hidden">
        <QRCode
          value={`RES-${reserva.id}`}
          size={brandingConfig.qr.size}
          fgColor={brandingConfig.qr.foregroundColor}
          bgColor={brandingConfig.qr.backgroundColor}
          level={brandingConfig.qr.errorCorrectionLevel}
        />
      </div>

      {/* Canvas (donde se dibuja el QR branded) */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Preview */}
      {previewUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <img
            src={previewUrl}
            alt="QR Branded Preview"
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={handleDownload}
          disabled={isGenerating || !previewUrl}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>

        <Button
          onClick={handleShare}
          disabled={isGenerating || !previewUrl}
          variant="outline"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </div>
    </div>
  );
}
```

---

### ⚙️ **FASE 3: Panel de Configuración**

#### **3.1 Página de Configuración de QR Branding**

```typescript
// src/app/[businessId]/admin/qr-branding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRBrandingConfig, DEFAULT_QR_BRANDING } from "@/types/branding";
import { toast } from "sonner";
import { Save, Eye, RefreshCw } from "lucide-react";

export default function QRBrandingConfigPage({ params }: { params: { businessId: string } }) {
  const [config, setConfig] = useState<QRBrandingConfig>(DEFAULT_QR_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/business/${params.businessId}/qr-branding`);
      const data = await res.json();
      
      if (data.config) {
        setConfig({ ...DEFAULT_QR_BRANDING, ...data.config });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${params.businessId}/qr-branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) throw new Error('Error saving');

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Restaurar configuración por defecto?')) {
      setConfig(DEFAULT_QR_BRANDING);
      toast.success('Configuración restaurada');
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Personalización de QR</h1>
          <p className="text-gray-600 mt-2">
            Configura cómo se verán los códigos QR de las reservas
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mensaje" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mensaje">Mensaje</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="contacto">Contacto</TabsTrigger>
          <TabsTrigger value="marco">Marco</TabsTrigger>
          <TabsTrigger value="qr">QR</TabsTrigger>
        </TabsList>

        {/* Tab Mensaje */}
        <TabsContent value="mensaje" className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Mensaje de Bienvenida</h3>

            <div className="space-y-4">
              <div>
                <Label>Texto del Mensaje</Label>
                <Input
                  value={config.mensaje.texto}
                  onChange={(e) => setConfig({
                    ...config,
                    mensaje: { ...config.mensaje, texto: e.target.value }
                  })}
                  placeholder="¡Te esperamos!"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Mensaje que verá el cliente en su QR
                </p>
              </div>

              <div>
                <Label>Emoji</Label>
                <Input
                  value={config.mensaje.emoji}
                  onChange={(e) => setConfig({
                    ...config,
                    mensaje: { ...config.mensaje, emoji: e.target.value }
                  })}
                  placeholder="🎉"
                  maxLength={2}
                />
              </div>

              <div>
                <Label>Tamaño de Fuente</Label>
                <Input
                  type="number"
                  value={config.mensaje.fontSize}
                  onChange={(e) => setConfig({
                    ...config,
                    mensaje: { ...config.mensaje, fontSize: parseInt(e.target.value) }
                  })}
                  min={14}
                  max={32}
                />
              </div>

              <div>
                <Label>Color del Mensaje</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.mensaje.color}
                    onChange={(e) => setConfig({
                      ...config,
                      mensaje: { ...config.mensaje, color: e.target.value }
                    })}
                    className="w-20"
                  />
                  <Input
                    value={config.mensaje.color}
                    onChange={(e) => setConfig({
                      ...config,
                      mensaje: { ...config.mensaje, color: e.target.value }
                    })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Vista Previa:</p>
              <p
                className="text-center font-bold"
                style={{
                  fontSize: `${config.mensaje.fontSize}px`,
                  color: config.mensaje.color,
                }}
              >
                {config.mensaje.emoji} {config.mensaje.texto}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab Header */}
        <TabsContent value="header" className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Configuración del Header</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mostrar Logo</Label>
                <Switch
                  checked={config.header.mostrarLogo}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    header: { ...config.header, mostrarLogo: checked }
                  })}
                />
              </div>

              {config.header.mostrarLogo && (
                <div>
                  <Label>URL del Logo</Label>
                  <Input
                    value={config.header.logoUrl || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      header: { ...config.header, logoUrl: e.target.value }
                    })}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
              )}

              <div>
                <Label>Nombre de la Empresa</Label>
                <Input
                  value={config.header.nombreEmpresa}
                  onChange={(e) => setConfig({
                    ...config,
                    header: { ...config.header, nombreEmpresa: e.target.value }
                  })}
                />
              </div>

              <div>
                <Label>Peso de la Fuente</Label>
                <select
                  value={config.header.fontWeight}
                  onChange={(e) => setConfig({
                    ...config,
                    header: { ...config.header, fontWeight: e.target.value as any }
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="black">Black</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab Contacto */}
        <TabsContent value="contacto" className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Teléfono</Label>
                  <Switch
                    checked={config.contacto.mostrarTelefono}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, mostrarTelefono: checked }
                    })}
                  />
                </div>
                {config.contacto.mostrarTelefono && (
                  <Input
                    value={config.contacto.telefono || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, telefono: e.target.value }
                    })}
                    placeholder="+507 6000-0000"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Email</Label>
                  <Switch
                    checked={config.contacto.mostrarEmail}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, mostrarEmail: checked }
                    })}
                  />
                </div>
                {config.contacto.mostrarEmail && (
                  <Input
                    type="email"
                    value={config.contacto.email || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, email: e.target.value }
                    })}
                    placeholder="contacto@negocio.com"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Dirección</Label>
                  <Switch
                    checked={config.contacto.mostrarDireccion}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, mostrarDireccion: checked }
                    })}
                  />
                </div>
                {config.contacto.mostrarDireccion && (
                  <Input
                    value={config.contacto.direccion || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      contacto: { ...config.contacto, direccion: e.target.value }
                    })}
                    placeholder="Calle 50, Ciudad de Panamá"
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab Marco */}
        <TabsContent value="marco" className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Marco y Bordes</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activar Marco</Label>
                <Switch
                  checked={config.marco.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    marco: { ...config.marco, enabled: checked }
                  })}
                />
              </div>

              {config.marco.enabled && (
                <>
                  <div>
                    <Label>Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.marco.colorPrimario}
                        onChange={(e) => setConfig({
                          ...config,
                          marco: { ...config.marco, colorPrimario: e.target.value }
                        })}
                        className="w-20"
                      />
                      <Input
                        value={config.marco.colorPrimario}
                        onChange={(e) => setConfig({
                          ...config,
                          marco: { ...config.marco, colorPrimario: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.marco.colorSecundario}
                        onChange={(e) => setConfig({
                          ...config,
                          marco: { ...config.marco, colorSecundario: e.target.value }
                        })}
                        className="w-20"
                      />
                      <Input
                        value={config.marco.colorSecundario}
                        onChange={(e) => setConfig({
                          ...config,
                          marco: { ...config.marco, colorSecundario: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Grosor del Borde (px)</Label>
                    <Input
                      type="number"
                      value={config.marco.grosorBorde}
                      onChange={(e) => setConfig({
                        ...config,
                        marco: { ...config.marco, grosorBorde: parseInt(e.target.value) }
                      })}
                      min={0}
                      max={20}
                    />
                  </div>

                  <div>
                    <Label>Border Radius (px)</Label>
                    <Input
                      type="number"
                      value={config.marco.borderRadius}
                      onChange={(e) => setConfig({
                        ...config,
                        marco: { ...config.marco, borderRadius: parseInt(e.target.value) }
                      })}
                      min={0}
                      max={50}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab QR */}
        <TabsContent value="qr" className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Configuración del QR Code</h3>

            <div className="space-y-4">
              <div>
                <Label>Tamaño del QR (px)</Label>
                <Input
                  type="number"
                  value={config.qr.size}
                  onChange={(e) => setConfig({
                    ...config,
                    qr: { ...config.qr, size: parseInt(e.target.value) }
                  })}
                  min={200}
                  max={500}
                />
              </div>

              <div>
                <Label>Color del QR</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.qr.foregroundColor}
                    onChange={(e) => setConfig({
                      ...config,
                      qr: { ...config.qr, foregroundColor: e.target.value }
                    })}
                    className="w-20"
                  />
                  <Input
                    value={config.qr.foregroundColor}
                    onChange={(e) => setConfig({
                      ...config,
                      qr: { ...config.qr, foregroundColor: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Color de Fondo del QR</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.qr.backgroundColor}
                    onChange={(e) => setConfig({
                      ...config,
                      qr: { ...config.qr, backgroundColor: e.target.value }
                    })}
                    className="w-20"
                  />
                  <Input
                    value={config.qr.backgroundColor}
                    onChange={(e) => setConfig({
                      ...config,
                      qr: { ...config.qr, backgroundColor: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Nivel de Corrección de Errores</Label>
                <select
                  value={config.qr.errorCorrectionLevel}
                  onChange={(e) => setConfig({
                    ...config,
                    qr: { ...config.qr, errorCorrectionLevel: e.target.value as any }
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="L">Bajo (L) - 7%</option>
                  <option value="M">Medio (M) - 15%</option>
                  <option value="Q">Alto (Q) - 25%</option>
                  <option value="H">Muy Alto (H) - 30%</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Nivel más alto = más resistente a daños pero QR más denso
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 🔌 **FASE 4: API Endpoints**

```typescript
// src/app/api/business/[businessId]/qr-branding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/requireAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  return withAuth(request, async (session) => {
    try {
      const business = await prisma.business.findUnique({
        where: { id: params.businessId },
        select: { qrBrandingConfig: true },
      });

      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      return NextResponse.json({ config: business.qrBrandingConfig || {} });
    } catch (error) {
      console.error('Error fetching QR branding config:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  return withAuth(request, async (session) => {
    try {
      const { config } = await request.json();

      await prisma.business.update({
        where: { id: params.businessId },
        data: {
          qrBrandingConfig: config,
          // Extraer valores clave para queries rápidas
          qrMensajeBienvenida: config.mensaje?.texto,
          qrMostrarLogo: config.header?.mostrarLogo,
          qrMostrarContacto: config.contacto?.mostrarTelefono || config.contacto?.mostrarEmail,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating QR branding config:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  });
}
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### 📅 Timeline (5-7 días)

```
DÍA 1-2: Diseño y Tipos
├── Definir interface QRBrandingConfig
├── Actualizar schema Prisma
├── Migrar database
└── Crear mockups de diseño

DÍA 3-4: Componente de Generación
├── Crear BrandedQRGenerator component
├── Implementar Canvas rendering
├── Agregar funciones de export/share
└── Testing básico

DÍA 5: Panel de Configuración
├── Crear página de config
├── Implementar formularios
├── Live preview
└── API endpoints

DÍA 6-7: Integración y Testing
├── Integrar en ReservationConfirmation
├── Testing E2E
├── Ajustes de UX
└── Documentación
```

---

## 💡 FEATURES ADICIONALES (NICE-TO-HAVE)

### 🎨 Templates Prediseñados

```typescript
export const QR_TEMPLATES = {
  elegant: {
    // Elegante con gradientes suaves
  },
  modern: {
    // Moderno con colores vibrantes
  },
  minimal: {
    // Minimalista blanco/negro
  },
  festive: {
    // Festivo con decoraciones
  },
};
```

### 📱 Optimización por Canal

```typescript
// Diferentes formatos según destino
- WhatsApp: 800x1200px (vertical)
- Email: 600x800px (estándar)
- Instagram Stories: 1080x1920px (9:16)
- Print: 2400x3600px (alta resolución)
```

### 🎭 Temas Estacionales

```typescript
// Auto-switch según fecha
- Navidad (Dic): Colores rojos/verdes
- Halloween (Oct): Naranja/negro
- Verano: Colores vibrantes
- Default: Branding normal
```

---

## 🎯 CONCLUSIÓN Y RECOMENDACIÓN

### ✅ **OPCIÓN RECOMENDADA: Canvas API (Opción 1)**

**Razones:**
1. ✅ Control total del diseño
2. ✅ Sin dependencias externas costosas
3. ✅ Personalizable al 100%
4. ✅ Export de alta calidad
5. ✅ Funciona offline
6. ✅ Performance excelente

### 📊 **Valor Agregado:**

```
ANTES:
- QR simple básico
- Sin branding
- Aspecto genérico

DESPUÉS:
- QR totalmente branded
- Look profesional
- Incrementa confianza del cliente
- Marketing automático (logo visible)
- Experiencia premium
```

### 🚀 **¿Empezamos con la implementación?**

Te puedo ayudar a:
1. Crear los tipos en TypeScript
2. Actualizar el schema Prisma
3. Implementar el componente BrandedQRGenerator
4. Crear el panel de configuración
5. Integrar en el modal de confirmación

**¿Por dónde quieres comenzar?** 🎨
