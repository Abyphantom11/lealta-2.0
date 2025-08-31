/**
 * Módulo de gestión de formularios
 * Proporciona hooks y utilidades para manejar formularios de manera consistente
 */

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { notificationService } from './';

// Tipos para validación de campos
export type ValidationRule<T = any> = (value: T, formValues?: Record<string, any>) => string | null;
export type FieldValidations<T = Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};
export type ValidationErrors<T = Record<string, any>> = Partial<Record<keyof T, string>>;

// Tipos de respuesta de formulario
export interface FormSubmitOptions<T = Record<string, any>> {
  onSuccess?: (data: any, formValues: T) => void;
  onError?: (error: any, formValues: T) => void;
  resetOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
  showErrorMessage?: boolean;
  errorMessage?: string;
}

// Hook principal para manejar formularios
export function useFormManagement<T extends Record<string, any>>(
  initialValues: T,
  validations?: FieldValidations<T>
) {
  // Estados del formulario
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Validar un campo específico
  const validateField = useCallback(
    (name: keyof T, value: any, allValues: T = values): string | null => {
      if (!validations || !validations[name]) return null;

      for (const rule of validations[name] || []) {
        const error = rule(value, allValues);
        if (error) return error;
      }

      return null;
    },
    [validations, values]
  );

  // Validar el formulario completo
  const validateForm = useCallback((): ValidationErrors<T> => {
    if (!validations) return {};

    const newErrors: ValidationErrors<T> = {};
    let hasErrors = false;

    (Object.keys(validations) as Array<keyof T>).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName], values);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    return hasErrors ? newErrors : {};
  }, [validateField, validations, values]);

  // Manejar cambios en campos individuales
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | 
      { target: { name: string; value: any; type?: string; checked?: boolean } }
    ) => {
      const target = e.target as { name: string; value: any; type?: string; checked?: boolean };
      const { name, value, type, checked } = target;
      const fieldName = name as keyof T;
      
      // Manejar diferentes tipos de inputs
      const newValue = type === 'checkbox' ? checked : value;
      
      setValues((prev) => ({ ...prev, [fieldName]: newValue }));
      setIsDirty(true);
      
      // Validar al cambiar si ya ha sido tocado
      if (touched[fieldName]) {
        const error = validateField(fieldName, newValue, { ...values, [fieldName]: newValue });
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || undefined,
        }));
      }
    },
    [validateField, values, touched]
  );

  // Manejar el evento blur para marcar como tocado
  const handleBlur = useCallback(
    (e: { target: { name: string } }) => {
      const { name } = e.target;
      const fieldName = name as keyof T;
      
      // Marcar como tocado
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));
      
      // Validar al perder el foco
      const error = validateField(fieldName, values[fieldName], values);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error || undefined,
      }));
    },
    [validateField, values]
  );

  // Establecer valores de forma manual
  const setFieldValue = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setIsDirty(true);
      
      if (touched[name]) {
        const error = validateField(name, value, { ...values, [name]: value });
        setErrors((prev) => ({
          ...prev,
          [name]: error || undefined,
        }));
      }
    },
    [validateField, values, touched]
  );

  // Establecer error de forma manual
  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error || undefined,
    }));
  }, []);

  // Tocar campo de forma manual
  const touchField = useCallback((name: keyof T) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  // Resetear el formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // Función para manejar el envío del formulario
  const handleSubmit = useCallback(
    async (
      submitFn: (values: T) => Promise<any>,
      options: FormSubmitOptions<T> = {}
    ) => {
      return async (e?: FormEvent) => {
        if (e) e.preventDefault();
        
        // Establecer cada campo como "tocado"
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>
        );
        setTouched(allTouched);
        
        // Validar antes de enviar
        const formErrors = validateForm();
        setErrors(formErrors);
        
        // Si hay errores, no continuar
        if (Object.keys(formErrors).length > 0) {
          if (options.showErrorMessage !== false) {
            notificationService.error({
              title: 'Error de validación',
              message: options.errorMessage || 'Por favor, corrige los errores en el formulario.',
            });
          }
          return;
        }
        
        // Iniciar envío
        setIsSubmitting(true);
        
        try {
          // Ejecutar función de envío
          const result = await submitFn(values);
          
          // Manejar éxito
          if (options.resetOnSuccess !== false) {
            resetForm();
          }
          
          if (options.showSuccessMessage !== false) {
            notificationService.success({
              title: 'Operación completada',
              message: options.successMessage || 'Formulario enviado correctamente.',
            });
          }
          
          if (options.onSuccess) {
            options.onSuccess(result, values);
          }
          
          return result;
        } catch (error) {
          // Manejar error
          if (options.showErrorMessage !== false) {
            notificationService.error({
              title: 'Error',
              message: options.errorMessage || 
                (error instanceof Error ? error.message : 'Ocurrió un error al procesar el formulario.'),
            });
          }
          
          if (options.onError) {
            options.onError(error, values);
          }
          
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [validateForm, values, resetForm]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    touchField,
    resetForm,
    handleSubmit,
    validateForm,
    validateField,
  };
}

// Reglas de validación comunes
export const validationRules = {
  required: (message = 'Este campo es obligatorio'): ValidationRule => 
    (value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    },
    
  minLength: (min: number, message?: string): ValidationRule<string> => 
    (value) => {
      if (!value || value.length < min) {
        return message || `Debe tener al menos ${min} caracteres`;
      }
      return null;
    },
    
  maxLength: (max: number, message?: string): ValidationRule<string> => 
    (value) => {
      if (value && value.length > max) {
        return message || `Debe tener máximo ${max} caracteres`;
      }
      return null;
    },
    
  email: (message = 'Correo electrónico inválido'): ValidationRule<string> => 
    (value) => {
      if (!value) return null;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value) ? null : message;
    },
    
  matches: (regex: RegExp, message: string): ValidationRule<string> => 
    (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },
    
  numeric: (message = 'Este campo debe ser numérico'): ValidationRule<string> => 
    (value) => {
      if (!value) return null;
      return /^\d+$/.test(value) ? null : message;
    },
    
  confirmValue: (
    fieldToMatch: string, 
    message = 'Los valores no coinciden'
  ): ValidationRule => 
    (value, formValues) => {
      if (!formValues || value !== formValues[fieldToMatch]) {
        return message;
      }
      return null;
    },
};

export default {
  useFormManagement,
  validationRules,
};
