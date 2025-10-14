// Configuración temporal para desarrollo - deshabilitar rate limiter
export const DISABLE_RATE_LIMITER = process.env.NODE_ENV === 'development';

// Helper para crear respuesta exitosa cuando rate limiter está deshabilitado
export const createSuccessResponse = () => ({
  success: true,
  limit: 1000,
  remaining: 999,
  reset: Date.now() + 60000,
  pending: Promise.resolve()
});

export const createRateLimitResponse = (message: string = 'Rate limit exceeded') => {
  return new Response(JSON.stringify({ 
    error: message,
    retryAfter: 60 
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '60'
    }
  });
};
