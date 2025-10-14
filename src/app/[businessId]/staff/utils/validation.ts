// Validation utilities for staff module

export const validateCedula = (cedula: string): boolean => {
  return cedula.length >= 6;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d+$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizePhoneInput = (input: string): string => {
  // Solo permitir números y algunos símbolos comunes de teléfono
  return input.replace(/[^0-9+\-() ]/g, '');
};

export const validateRegistrationData = (data: {
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
}): { isValid: boolean; error?: string } => {
  const { cedula, nombre, telefono, email } = data;

  if (!cedula.trim()) {
    return { isValid: false, error: 'La cédula es obligatoria' };
  }

  if (!nombre.trim()) {
    return { isValid: false, error: 'El nombre completo es obligatorio' };
  }

  if (!telefono.trim()) {
    return { isValid: false, error: 'El teléfono es obligatorio' };
  }

  if (!email.trim()) {
    return { isValid: false, error: 'El email es obligatorio' };
  }

  if (!validatePhoneNumber(telefono)) {
    return { isValid: false, error: 'El teléfono debe contener solo números' };
  }

  if (!validateEmail(email)) {
    return { isValid: false, error: 'Por favor ingrese un email válido' };
  }

  return { isValid: true };
};
