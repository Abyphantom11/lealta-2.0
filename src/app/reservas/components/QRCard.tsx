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
  
  // 🎄 Detectar tema Navidad
  const isChristmas = cardDesign.borderColor === '#C41E3A' && 
                      cardDesign.headerColor === '#FFD700';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tarjeta */}
      <div
        data-qr-card
        className={`relative ${shadowClass} ${(isHalloween || isChristmas) ? 'overflow-visible' : 'overflow-hidden'}`}
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
          boxShadow: (isHalloween || isChristmas) ? `0 0 30px ${cardDesign.borderColor}40, 0 0 60px ${cardDesign.borderColor}20` : undefined,
        }}
      >
        {/* 🎃 Decoraciones de Halloween - ESTÁTICAS para renderizado */}
        {isHalloween && (
          <>
            {/* Calabazas en esquinas superiores */}
            <div 
              className="absolute top-2 left-2 select-none pointer-events-none"
              style={{ fontSize: '32px', lineHeight: 1 }}
            >
              🎃
            </div>
            <div 
              className="absolute top-2 right-2 select-none pointer-events-none"
              style={{ fontSize: '32px', lineHeight: 1 }}
            >
              🎃
            </div>
            
            {/* Murciélagos laterales */}
            <div 
              className="absolute select-none pointer-events-none opacity-50"
              style={{ top: '25%', left: '8px', fontSize: '20px', lineHeight: 1 }}
            >
              🦇
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-50"
              style={{ top: '35%', right: '8px', fontSize: '20px', lineHeight: 1 }}
            >
              🦇
            </div>
            
            {/* Fantasma inferior */}
            <div 
              className="absolute bottom-3 right-3 select-none pointer-events-none opacity-60"
              style={{ fontSize: '24px', lineHeight: 1 }}
            >
              👻
            </div>
            
            {/* Luna en la parte superior central */}
            <div 
              className="absolute select-none pointer-events-none opacity-40"
              style={{ top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '28px', lineHeight: 1 }}
            >
              🌙
            </div>
            
            {/* Telarañas SVG en esquinas */}
            <svg 
              className="absolute top-0 left-0 opacity-30 pointer-events-none" 
              width="60" 
              height="60" 
              viewBox="0 0 60 60"
            >
              <path d="M0,0 L0,30 L30,30 L30,0 Z" fill="none" stroke="#9ca3af" strokeWidth="1.5"/>
              <path d="M0,6 L24,6" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M0,12 L18,12" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M0,18 L12,18" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M6,0 L6,24" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M12,0 L12,18" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M18,0 L18,12" stroke="#9ca3af" strokeWidth="0.8"/>
              <circle cx="27" cy="27" r="2.5" fill="#9ca3af"/>
            </svg>
            
            <svg 
              className="absolute top-0 right-0 opacity-30 pointer-events-none" 
              width="60" 
              height="60" 
              viewBox="0 0 60 60"
              style={{ transform: 'scaleX(-1)' }}
            >
              <path d="M0,0 L0,30 L30,30 L30,0 Z" fill="none" stroke="#9ca3af" strokeWidth="1.5"/>
              <path d="M0,6 L24,6" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M0,12 L18,12" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M0,18 L12,18" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M6,0 L6,24" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M12,0 L12,18" stroke="#9ca3af" strokeWidth="0.8"/>
              <path d="M18,0 L18,12" stroke="#9ca3af" strokeWidth="0.8"/>
              <circle cx="27" cy="27" r="2.5" fill="#9ca3af"/>
            </svg>
            
            {/* Efecto de brillo naranja sutil - será visible en captura */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 107, 26, 0.08) 0%, transparent 70%)',
              }}
            />
            
            {/* Estrellas decorativas */}
            <div 
              className="absolute select-none pointer-events-none opacity-50"
              style={{ top: '15%', left: '15%', fontSize: '14px', lineHeight: 1 }}
            >
              ⭐
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-50"
              style={{ top: '20%', right: '15%', fontSize: '12px', lineHeight: 1 }}
            >
              ⭐
            </div>
          </>
        )}

        {/* 🎄 Decoraciones de Navidad - ESTÁTICAS para renderizado */}
        {isChristmas && (
          <>
            {/* Árbol de navidad en esquina superior izquierda */}
            <div 
              className="absolute top-2 left-2 select-none pointer-events-none"
              style={{ fontSize: '28px', lineHeight: 1 }}
            >
              🎄
            </div>
            
            {/* Estrella dorada en esquina superior derecha */}
            <div 
              className="absolute top-2 right-2 select-none pointer-events-none"
              style={{ fontSize: '28px', lineHeight: 1 }}
            >
              ⭐
            </div>
            
            {/* Copos de nieve laterales */}
            <div 
              className="absolute select-none pointer-events-none opacity-60"
              style={{ top: '20%', left: '8px', fontSize: '18px', lineHeight: 1 }}
            >
              ❄️
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-60"
              style={{ top: '30%', right: '8px', fontSize: '16px', lineHeight: 1 }}
            >
              ❄️
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-40"
              style={{ top: '45%', left: '6px', fontSize: '14px', lineHeight: 1 }}
            >
              ❄️
            </div>
            
            {/* Regalos en esquinas inferiores */}
            <div 
              className="absolute bottom-3 left-3 select-none pointer-events-none"
              style={{ fontSize: '22px', lineHeight: 1 }}
            >
              🎁
            </div>
            <div 
              className="absolute bottom-3 right-3 select-none pointer-events-none"
              style={{ fontSize: '22px', lineHeight: 1 }}
            >
              🎅
            </div>
            
            {/* Campanas decorativas */}
            <div 
              className="absolute select-none pointer-events-none opacity-50"
              style={{ top: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '24px', lineHeight: 1 }}
            >
              🔔
            </div>
            
            {/* Bastones de caramelo laterales */}
            <div 
              className="absolute select-none pointer-events-none opacity-60"
              style={{ bottom: '25%', left: '6px', fontSize: '16px', lineHeight: 1 }}
            >
              🍬
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-60"
              style={{ bottom: '35%', right: '6px', fontSize: '16px', lineHeight: 1 }}
            >
              🍬
            </div>
            
            {/* Efecto de brillo navideño rojo/dorado sutil */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 20%, rgba(255, 215, 0, 0.08) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(196, 30, 58, 0.06) 0%, transparent 40%)',
              }}
            />
            
            {/* Estrellas decorativas adicionales */}
            <div 
              className="absolute select-none pointer-events-none opacity-40"
              style={{ top: '15%', left: '20%', fontSize: '12px', lineHeight: 1 }}
            >
              ✨
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-40"
              style={{ top: '12%', right: '20%', fontSize: '10px', lineHeight: 1 }}
            >
              ✨
            </div>
            <div 
              className="absolute select-none pointer-events-none opacity-30"
              style={{ bottom: '15%', left: '45%', fontSize: '10px', lineHeight: 1 }}
            >
              ✨
            </div>
          </>
        )}

        {/* Efecto de brillo sutil para tarjetas mate (Black Card) */}
        {isDarkCard && !isHalloween && !isChristmas && (
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
              textShadow: isDarkCard || isHalloween || isChristmas ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
              ...(isHalloween && {
                // Sombra naranja estática que sí se renderiza en imagen
                textShadow: `0 0 15px ${cardDesign.headerColor}99, 0 2px 10px rgba(0,0,0,0.5)`,
              }),
              ...(isChristmas && {
                // Sombra dorada navideña
                textShadow: `0 0 20px ${cardDesign.headerColor}99, 0 2px 10px rgba(0,0,0,0.5)`,
              })
            }}
          >
            {isHalloween ? '🎃 ' : ''}{businessName}{isHalloween ? ' 🎃' : ''}
          </h2>
          <div
            className="text-xs tracking-wider uppercase"
            style={{ color: cardDesign.textColor }}
          >
            {isHalloween && '👻 Reserva Confirmada 👻'}
            {isChristmas && '🎅 Reserva Confirmada 🎅'}
            {!isHalloween && !isChristmas && 'Reserva Confirmada'}
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
