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
  
  // 🎃 Detectar tema Halloween
  const isHalloween = cardDesign.borderColor === '#FF6B1A' && 
                      cardDesign.headerColor === '#FF8C00';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tarjeta */}
      <div
        data-qr-card
        className={`relative overflow-hidden ${shadowClass} ${isHalloween ? 'halloween-card' : ''}`}
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
          boxShadow: isHalloween ? `0 0 30px ${cardDesign.borderColor}40, 0 0 60px ${cardDesign.borderColor}20` : undefined,
        }}
      >
        {/* 🎃 Efectos especiales de Halloween */}
        {isHalloween && (
          <>
            {/* Calabazas decorativas en las esquinas */}
            <div className="absolute top-3 left-3 text-3xl animate-pulse" style={{ animationDuration: '2s' }}>
              🎃
            </div>
            <div className="absolute top-3 right-3 text-3xl animate-pulse" style={{ animationDuration: '2.5s' }}>
              🎃
            </div>
            
            {/* Murciélagos */}
            <div className="absolute top-1/4 left-2 text-xl opacity-60 animate-bounce" style={{ animationDuration: '3s' }}>
              🦇
            </div>
            <div className="absolute top-1/3 right-2 text-xl opacity-60 animate-bounce" style={{ animationDuration: '3.5s' }}>
              🦇
            </div>
            
            {/* Fantasma flotante */}
            <div className="absolute bottom-4 right-4 text-2xl animate-bounce opacity-70" style={{ animationDuration: '2s' }}>
              👻
            </div>
            
            {/* Telarañas en las esquinas superiores */}
            <svg className="absolute top-0 left-0 w-16 h-16 opacity-40" viewBox="0 0 100 100">
              <path d="M0,0 L0,50 L50,50 L50,0 Z" fill="none" stroke="#9ca3af" strokeWidth="1"/>
              <path d="M0,10 L40,10" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M0,20 L30,20" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M10,0 L10,40" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M20,0 L20,30" stroke="#9ca3af" strokeWidth="0.5"/>
              <circle cx="45" cy="45" r="2" fill="#9ca3af"/>
            </svg>
            
            <svg className="absolute top-0 right-0 w-16 h-16 opacity-40 transform scale-x-[-1]" viewBox="0 0 100 100">
              <path d="M0,0 L0,50 L50,50 L50,0 Z" fill="none" stroke="#9ca3af" strokeWidth="1"/>
              <path d="M0,10 L40,10" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M0,20 L30,20" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M10,0 L10,40" stroke="#9ca3af" strokeWidth="0.5"/>
              <path d="M20,0 L20,30" stroke="#9ca3af" strokeWidth="0.5"/>
              <circle cx="45" cy="45" r="2" fill="#9ca3af"/>
            </svg>
            
            {/* Efecto de brillo naranja */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 107, 26, 0.1) 0%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite',
              }}
            />
          </>
        )}

        {/* Efecto de brillo sutil para tarjetas mate (Black Card) */}
        {isDarkCard && !isHalloween && (
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
              textShadow: isDarkCard ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
              ...(isHalloween && {
                textShadow: `0 0 10px ${cardDesign.headerColor}, 0 0 20px ${cardDesign.headerColor}80`,
                animation: 'glow 2s ease-in-out infinite',
              })
            }}
          >
            {isHalloween ? '🎃 ' : ''}{businessName}{isHalloween ? ' 🎃' : ''}
          </h2>
          <div
            className="text-xs tracking-wider uppercase"
            style={{ color: cardDesign.textColor }}
          >
            {isHalloween ? '👻 Reserva Confirmada 👻' : 'Reserva Confirmada'}
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
            {reserva.cliente?.nombre || 'Sin nombre'}
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
              className="text-[10px] font-mono font-medium break-all leading-tight"
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
