'use client';

import React from 'react';
import QRCodeSVG from 'react-qr-code';

interface CardDesign {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  shadowColor: string;
  shadowSize: string;
  headerColor: string;
  textColor: string;
}

interface Reserva {
  id: string;
  cliente: {
    nombre: string;
  };
  fecha: Date | string;
  hora: string;
  numeroPersonas: number;
  qrToken: string;
}

interface QRCardProps {
  readonly reserva: Reserva;
  readonly businessName: string;
  readonly cardDesign: CardDesign;
}

export default function QRCard({
  reserva,
  businessName,
  cardDesign,
}: QRCardProps) {
  const formatDate = (date: Date | string) => {
    let d: Date;
    
    if (typeof date === 'string') {
      // Si la fecha viene como string (ej: "2025-10-15"), agregar tiempo local para evitar problemas de zona horaria
      if (date.includes('T')) {
        // Si ya tiene tiempo, usarla directamente
        d = new Date(date);
      } else {
        // Si es solo fecha (YYYY-MM-DD), agregar tiempo local para evitar offset UTC
        d = new Date(date + 'T00:00:00');
      }
    } else {
      d = date;
    }
    
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const shadowClass = {
    'none': '',
    'lg': 'shadow-lg',
    'xl': 'shadow-2xl shadow-black/40',
  }[cardDesign.shadowSize] || 'shadow-lg';

  const isGradient = cardDesign.backgroundColor.includes('gradient');
  const isDarkCard = cardDesign.backgroundColor.includes('#0a0a0a') || 
                     cardDesign.backgroundColor.includes('#1a1a1a') || 
                     cardDesign.backgroundColor.includes('#2d2d2d');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tarjeta */}
      <div
        className={`relative overflow-hidden ${shadowClass}`}
        style={{
          background: isGradient ? cardDesign.backgroundColor : undefined,
          backgroundColor: !isGradient ? cardDesign.backgroundColor : undefined,
          borderRadius: `${cardDesign.borderRadius}px`,
          borderWidth: `${cardDesign.borderWidth}px`,
          borderStyle: 'solid',
          borderColor: cardDesign.borderColor,
          padding: `${cardDesign.padding}px`,
          maxWidth: '400px',
          width: '100%',
        }}
      >
        {/* Efecto de brillo sutil para tarjetas mate (Black Card) */}
        {isDarkCard && (
          <>
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
                mixBlendMode: 'overlay',
              }}
            />
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              }}
            />
          </>
        )}

        {/* Header - Nombre del Negocio */}
        <div className="text-center mb-6 relative z-10">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ 
              color: cardDesign.headerColor,
              textShadow: isDarkCard ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {businessName}
          </h2>
          <div
            className="text-xs tracking-wider uppercase"
            style={{ color: cardDesign.textColor }}
          >
            Reserva Confirmada
          </div>
        </div>

        {/* Nombre del Cliente - Prominente */}
        <div className="text-center mb-6 relative z-10">
          <div
            className="text-xl font-semibold"
            style={{ 
              color: cardDesign.headerColor,
              textShadow: isDarkCard ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
            {reserva.cliente.nombre}
          </div>
        </div>

        {/* QR Code - Centrado con más espacio */}
        <div className="flex justify-center mb-6 bg-white p-6 rounded-lg relative z-10 mx-2" style={{
          boxShadow: isDarkCard ? '0 4px 20px rgba(0,0,0,0.4)' : 'none'
        }}>
          <QRCodeSVG
            value={`res-${reserva.id}`}
            size={180}
            level="M"
            fgColor="#000000"
            bgColor="#ffffff"
            style={{ display: 'block' }}
          />
        </div>

        {/* Detalles en Grid 2x2 - Compacto */}
        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
          <div>
            <div
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: cardDesign.textColor }}
            >
              Fecha
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: cardDesign.headerColor }}
            >
              {formatDate(reserva.fecha)}
            </div>
          </div>
          
          <div>
            <div
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: cardDesign.textColor }}
            >
              Hora
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: cardDesign.headerColor }}
            >
              {reserva.hora}
            </div>
          </div>

          <div>
            <div
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: cardDesign.textColor }}
            >
              Personas
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: cardDesign.headerColor }}
            >
              {reserva.numeroPersonas}
            </div>
          </div>

          <div>
            <div
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: cardDesign.textColor }}
            >
              Código
            </div>
            <div
              className="text-sm font-medium truncate"
              style={{ color: cardDesign.headerColor }}
            >
              {reserva.qrToken}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center text-xs pt-4 border-t relative z-10"
          style={{
            color: cardDesign.textColor,
            borderColor: isDarkCard ? 'rgba(255,255,255,0.1)' : cardDesign.textColor + '30',
          }}
        >
          Presenta este código al llegar
        </div>
      </div>
    </div>
  );
}
