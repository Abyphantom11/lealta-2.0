'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import QRCodeSVG from 'react-qr-code';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRBrandingConfig, DEFAULT_QR_BRANDING } from '@/types/qr-branding';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reserva {
  id: string;
  cliente: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  fecha: Date | string;
  hora: string;
  numeroPersonas: number;
  mesa?: string | null;
  promotor?: {
    nombre: string;
  } | null;
  observaciones?: string | null;
  qrToken: string;
  estado: string;
}

interface BrandedQRGeneratorProps {
  reserva: Reserva;
  config?: Partial<QRBrandingConfig>;
  businessName?: string;
  logoUrl?: string;
  onShare?: () => void;
}

export default function BrandedQRGenerator({
  reserva,
  config: partialConfig,
  businessName,
  logoUrl,
  onShare,
}: BrandedQRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Merge config con valores por defecto
  const config: QRBrandingConfig = useMemo(() => ({
    ...DEFAULT_QR_BRANDING,
    ...partialConfig,
    header: {
      ...DEFAULT_QR_BRANDING.header,
      ...(partialConfig?.header || {}),
      nombreEmpresa: businessName || partialConfig?.header?.nombreEmpresa || DEFAULT_QR_BRANDING.header.nombreEmpresa,
      logoUrl: logoUrl || partialConfig?.header?.logoUrl,
    },
  }), [partialConfig, businessName, logoUrl]);

  // Función para generar el canvas con el QR branded
  const generateBrandedQR = useCallback(async () => {
    const canvas = canvasRef.current;
    const qrDiv = qrRef.current;
    if (!canvas || !qrDiv) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas
    const { width, height } = config.layout;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = config.layout.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Border con gradiente (si está habilitado)
    if (config.marco.enabled) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, config.marco.colorPrimario);
      gradient.addColorStop(1, config.marco.colorSecundario);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = config.marco.grosorBorde;
      ctx.beginPath();
      ctx.roundRect(
        config.marco.grosorBorde / 2,
        config.marco.grosorBorde / 2,
        width - config.marco.grosorBorde,
        height - config.marco.grosorBorde,
        config.marco.borderRadius
      );
      ctx.stroke();
    }

    let currentY = config.layout.padding;

    // 🎨 HEADER - Logo + Nombre empresa
    if (config.header.mostrarLogo && config.header.logoUrl) {
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logo.onload = () => resolve();
          logo.onerror = reject;
          logo.src = config.header.logoUrl!;
        });
        
        const logoSize = 80;
        const logoX = (width - logoSize) / 2;
        ctx.drawImage(logo, logoX, currentY, logoSize, logoSize);
        currentY += logoSize + 16;
      } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
      }
    }

    // Nombre de la empresa
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `${config.header.fontWeight} ${config.header.fontSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(config.header.nombreEmpresa, width / 2, currentY);
    currentY += config.header.fontSize + 24;

    // 📋 DETALLES DE RESERVA
    const detalles: Array<{ label: string; value: string; campo: keyof typeof config.camposMostrados }> = [];

    if (config.camposMostrados.codigoReserva) {
      detalles.push({
        label: config.etiquetas.codigoReserva,
        value: reserva.qrToken,
        campo: 'codigoReserva'
      });
    }

    if (config.camposMostrados.nombreCliente) {
      detalles.push({
        label: config.etiquetas.nombreCliente,
        value: reserva.cliente.nombre,
        campo: 'nombreCliente'
      });
    }

    if (config.camposMostrados.fecha) {
      const fechaStr = typeof reserva.fecha === 'string' 
        ? reserva.fecha 
        : format(new Date(reserva.fecha), "d 'de' MMMM, yyyy", { locale: es });
      detalles.push({
        label: config.etiquetas.fecha,
        value: fechaStr,
        campo: 'fecha'
      });
    }

    if (config.camposMostrados.hora) {
      detalles.push({
        label: config.etiquetas.hora,
        value: reserva.hora,
        campo: 'hora'
      });
    }

    if (config.camposMostrados.numeroPersonas) {
      detalles.push({
        label: config.etiquetas.numeroPersonas,
        value: `${reserva.numeroPersonas} ${reserva.numeroPersonas === 1 ? 'persona' : 'personas'}`,
        campo: 'numeroPersonas'
      });
    }

    // ⭐ MESA - Solo si está habilitada Y tiene valor
    if (config.camposMostrados.mesa && reserva.mesa) {
      detalles.push({
        label: config.etiquetas.mesa,
        value: reserva.mesa,
        campo: 'mesa'
      });
    }

    // PROMOTOR - Solo si está habilitado Y tiene valor
    if (config.camposMostrados.promotor && reserva.promotor) {
      detalles.push({
        label: config.etiquetas.promotor,
        value: reserva.promotor.nombre,
        campo: 'promotor'
      });
    }

    // OBSERVACIONES - Solo si está habilitado Y tiene valor
    if (config.camposMostrados.observaciones && reserva.observaciones) {
      detalles.push({
        label: config.etiquetas.observaciones,
        value: reserva.observaciones,
        campo: 'observaciones'
      });
    }

    // Renderizar detalles
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px system-ui';
    
    detalles.forEach((detalle) => {
      ctx.fillStyle = '#666666';
      ctx.fillText(detalle.label + ':', config.layout.padding, currentY);
      currentY += 20;
      
      ctx.fillStyle = '#1a1a1a';
      
      // 🔧 Manejo especial para textos largos (como código de reserva)
      const maxWidth = width - (config.layout.padding * 2);
      
      // Para código de reserva, usar fuente más pequeña
      if (detalle.campo === 'codigoReserva') {
        ctx.font = '600 14px monospace'; // Fuente monospace más pequeña
      } else {
        ctx.font = '600 18px system-ui';
      }
      
      // Medir el texto
      const textMetrics = ctx.measureText(detalle.value);
      
      // Si el texto es más ancho que el espacio disponible, dividirlo en líneas
      if (textMetrics.width > maxWidth) {
        const words = detalle.value.split(' ');
        let line = '';
        const lines: string[] = [];
        
        // Si no hay espacios (como en códigos), dividir por caracteres
        if (words.length === 1) {
          const chars = detalle.value.split('');
          for (let i = 0; i < chars.length; i++) {
            const testLine = line + chars[i];
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && i > 0) {
              lines.push(line);
              line = chars[i];
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line);
        } else {
          // Dividir por palabras
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && i > 0) {
              lines.push(line.trim());
              line = words[i] + ' ';
            } else {
              line = testLine;
            }
          }
          if (line.trim()) lines.push(line.trim());
        }
        
        // Renderizar cada línea
        lines.forEach((lineText, index) => {
          ctx.fillText(lineText, config.layout.padding, currentY);
          if (index < lines.length - 1) {
            currentY += 18; // Espaciado entre líneas
          }
        });
        currentY += 32;
      } else {
        // Si el texto cabe, renderizarlo normalmente
        ctx.fillText(detalle.value, config.layout.padding, currentY);
        currentY += 32;
      }
      
      ctx.font = 'bold 16px system-ui';
    });

    currentY += 16;

    // 📱 QR CODE
    const qrSvg = qrDiv.querySelector('svg');
    if (qrSvg) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(qrSvg);
      const img = new Image();
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const qrSize = config.qr.size;
          const qrX = (width - qrSize) / 2;
          ctx.drawImage(img, qrX, currentY, qrSize, qrSize);
          currentY += qrSize + 24;
          resolve();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      });
    }

    // 💬 MENSAJE DE BIENVENIDA
    ctx.fillStyle = config.mensaje.color;
    ctx.font = `bold ${config.mensaje.fontSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${config.mensaje.emoji} ${config.mensaje.texto}`,
      width / 2,
      currentY
    );
    currentY += config.mensaje.fontSize + 24;

    // 📞 CONTACTO
    ctx.fillStyle = '#666666';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';

    if (config.contacto.mostrarTelefono && config.contacto.telefono) {
      ctx.fillText(`📞 ${config.contacto.telefono}`, width / 2, currentY);
      currentY += 20;
    }

    if (config.contacto.mostrarEmail && config.contacto.email) {
      ctx.fillText(`✉️ ${config.contacto.email}`, width / 2, currentY);
      currentY += 20;
    }

    if (config.contacto.mostrarDireccion && config.contacto.direccion) {
      ctx.fillText(`📍 ${config.contacto.direccion}`, width / 2, currentY);
    }
  }, [config, reserva]);

  // Generar el QR cuando el componente se monta o cambia la config
  useEffect(() => {
    const timer = setTimeout(() => {
      generateBrandedQR();
    }, 100);
    return () => clearTimeout(timer);
  }, [generateBrandedQR]);

  // Función para descargar
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `reserva-${reserva.qrToken}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Función para compartir
  const handleShare = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsGenerating(false);
      return;
    }

    try {
      // Generar blob de alta calidad
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('No se pudo generar la imagen'));
            }
          },
          'image/png',
          1.0 // Máxima calidad
        );
      });

      const fileName = `reserva-${config.header.nombreEmpresa.replace(/\s+/g, '-')}-${reserva.qrToken}.png`;
      const file = new File([blob], fileName, { 
        type: 'image/png',
        lastModified: Date.now()
      });

      // 🎯 INTENTO 1: Navigator Share API con archivo
      if (navigator.share) {
        try {
          // Verificar si el navegador puede compartir archivos
          const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
          
          if (canShareFiles) {
            await navigator.share({
              title: `Reserva - ${config.header.nombreEmpresa}`,
              text: `🍸 Reserva Confirmada\n\n👤 ${reserva.cliente.nombre}\n📅 ${typeof reserva.fecha === 'string' ? reserva.fecha : format(new Date(reserva.fecha), "d 'de' MMMM, yyyy", { locale: es })}\n⏰ ${reserva.hora}\n👥 ${reserva.numeroPersonas} ${reserva.numeroPersonas === 1 ? 'persona' : 'personas'}${reserva.mesa ? `\n🪑 Mesa ${reserva.mesa}` : ''}\n\n📱 Presenta este QR al llegar\n🅿️ Parqueadero gratuito e ilimitado dentro del edificio (S1, S2, S3, S4).\n🪪 Presentar cédula o pasaporte (en caso de pérdida, traer denuncia con respaldo).\n\n📍 Dirección: Diego de Almagro y Ponce Carrasco, Edificio Almagro 240, piso 13\n📎 Google Maps: \`https://g.co/kgs/KbKrU5N\`\n\n⏱️ Tiempo de espera: 10 minutos.\n❗ Para cambios o cancelaciones, avisarnos por este medio.\n\n✨ ¡Nos vemos pronto!`,
              files: [file],
            });
            onShare?.();
            setIsGenerating(false);
            return;
          }
        } catch (shareError) {
          console.warn('Navigator.share con archivo falló:', shareError);
          // Continuar con fallback
        }
      }

      // 🎯 INTENTO 2: Crear link temporal y copiar/compartir
      const url = URL.createObjectURL(blob);
      
      // Para móviles: intentar abrir en nueva ventana para compartir desde ahí
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Crear un link de descarga temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Dar feedback al usuario
        alert('✅ Imagen descargada. Ahora puedes compartirla desde tu galería a WhatsApp.');
        
        // Limpiar URL después de un delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // Desktop: descargar directamente
        handleDownload();
      }

      onShare?.();
    } catch (error) {
      console.error('Error al compartir:', error);
      // Último fallback: descargar
      handleDownload();
      alert('No se pudo compartir directamente. La imagen se ha descargado. Puedes compartirla manualmente desde tu galería.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR SVG oculto (usado para generar la imagen) */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG
          value={`res-${reserva.id}`}
          size={config.qr.size}
          fgColor={config.qr.foregroundColor}
          bgColor={config.qr.backgroundColor}
          level={config.qr.errorCorrectionLevel}
        />
      </div>

      {/* Canvas con el QR branded */}
      <div className="relative rounded-lg shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar
        </Button>
        <Button
          onClick={handleShare}
          variant="default"
          size="sm"
          className="gap-2"
          disabled={isGenerating}
        >
          <Share2 className="w-4 h-4" />
          {isGenerating ? 'Compartiendo...' : 'Compartir'}
        </Button>
      </div>
    </div>
  );
}
