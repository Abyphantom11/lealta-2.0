'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { motion } from '../motion';

interface OptimizedImageProps {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly className?: string;
  readonly sizes?: string;
  readonly priority?: boolean;
  readonly fallbackSrc?: string;
  readonly animate?: boolean;
}

/**
 * Componente de imagen optimizado con Next.js
 * Reemplaza etiquetas <img> con soporte para animaciones y carga fallback
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  fallbackSrc = '/placeholder-image.png',
  animate = false
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Determinar la fuente de la imagen (original o fallback)
  const imageSrc = error ? fallbackSrc : src;
  
  // Para URLs relativas sin / inicial
  const fullSrc = imageSrc.startsWith('http') || imageSrc.startsWith('/') 
    ? imageSrc 
    : `/${imageSrc}`;

  // Componente base de imagen
  const ImageComponent = (
    <NextImage
      src={fullSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
      onLoad={() => setLoaded(true)}
      style={{ objectFit: 'cover' }}
    />
  );

  // Aplicar animación si se solicita
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.95 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {ImageComponent}
      </motion.div>
    );
  }

  return ImageComponent;
}
