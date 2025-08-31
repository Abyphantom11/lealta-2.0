'use client';

import { useState, useCallback } from 'react';

export type ValidationRule<T> = {
  validate: (value: any, formValues: T) => boolean;
  message: string;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

/**
 * Hook para gestionar la validación de formularios
 * @param initialValues - Valores iniciales del formulario
 * @param validationRules - Reglas de validación para cada campo
 * @returns Funciones y estados para validación
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar un campo específico
  const validateField = useCallback(
    (name: keyof T, value: any) => {
      const fieldRules = validationRules[name];
      if (!fieldRules) return true;

      for (const rule of fieldRules) {
        if (!rule.validate(value, values)) {
          setErrors((prev) => ({ ...prev, [name]: rule.message }));
          return false;
        }
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });

      return true;
    },
    [validationRules, values]
  );

  // Manejar cambios en los campos
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      validateField(name as keyof T, value);
    },
    [validateField]
  );

  // Manejar el enfoque en un campo
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name as keyof T, values[name as keyof T]);
    },
    [validateField, values]
  );

  // Validar el formulario completo
  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const name in validationRules) {
      const fieldRules = validationRules[name as keyof T];
      if (!fieldRules) continue;

      for (const rule of fieldRules) {
        if (!rule.validate(values[name as keyof T], values)) {
          newErrors[name] = rule.message;
          isValid = false;
          break;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values]);

  // Establecer un valor específico
  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
    },
    [validateField]
  );

  // Reiniciar el formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setFieldValue,
    resetForm,
  };
}

// Reglas de validación comunes
export const validationRules = {
  required: (message = 'Este campo es requerido'): ValidationRule<any> => ({
    validate: (value) => !!value && value.toString().trim() !== '',
    message,
  }),
  email: (message = 'Email inválido'): ValidationRule<any> => ({
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  minLength: (length: number, message?: string): ValidationRule<any> => ({
    validate: (value) => !value || value.length >= length,
    message: message || `Debe tener al menos ${length} caracteres`,
  }),
  maxLength: (length: number, message?: string): ValidationRule<any> => ({
    validate: (value) => !value || value.length <= length,
    message: message || `Debe tener máximo ${length} caracteres`,
  }),
  numeric: (message = 'Solo se permiten números'): ValidationRule<any> => ({
    validate: (value) => !value || /^\d+$/.test(value),
    message,
  }),
  match: (fieldName: string, message = 'Los campos no coinciden'): ValidationRule<any> => ({
    validate: (value, formValues) => value === formValues[fieldName],
    message,
  }),
};
