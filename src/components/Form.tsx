'use client';

import React, { useState, FormEvent } from 'react';
import { motion } from './motion';
import AlertMessage from './ui/AlertMessage';
import LoadingButton from './ui/LoadingButton';

interface FormField {
  readonly name: string;
  readonly label: string;
  readonly type:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'number'
    | 'date'
    | 'textarea'
    | 'select';
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly options?: { value: string; label: string }[];
  readonly icon?: React.ReactNode;
}

interface FormProps<T extends Record<string, any>> {
  readonly initialValues: T;
  readonly fields: FormField[];
  readonly onSubmit: (
    values: T
  ) => Promise<{ success: boolean; error?: string }>;
  readonly submitText: string;
  readonly loadingText?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly className?: string;
  readonly icon?: React.ReactNode;
}

export default function Form<T extends Record<string, any>>({
  initialValues,
  fields,
  onSubmit,
  submitText,
  loadingText = 'Procesando...',
  title,
  subtitle,
  className = '',
  icon,
}: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await onSubmit(values);

      if (result.success) {
        setSuccess('Operación completada con éxito');
      } else {
        setError(result.error || 'Ha ocurrido un error');
      }
    } catch (err) {
      console.error('Error en el formulario:', err);
      setError('Error de conexión: No se pudo procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para renderizar diferentes tipos de inputs
  const renderFieldInput = (
    field: FormField,
    values: Record<string, any>,
    handleChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => void
  ) => {
    if (field.type === 'textarea') {
      return (
        <textarea
          name={field.name}
          required={field.required}
          className="form-input"
          placeholder={field.placeholder}
          value={values[field.name] as string}
          onChange={handleChange}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select
          name={field.name}
          required={field.required}
          className="form-input"
          value={values[field.name] as string}
          onChange={handleChange}
        >
          <option value="">Seleccionar...</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        name={field.name}
        required={field.required}
        className="form-input"
        placeholder={field.placeholder}
        value={values[field.name] as string}
        onChange={handleChange}
        inputMode={field.type === 'tel' ? 'numeric' : undefined}
        pattern={field.type === 'tel' ? '[0-9]*' : undefined}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${className}`}
    >
      {(title || icon) && (
        <div className="text-center mb-8">
          {icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center"
            >
              {icon}
            </motion.div>
          )}
          {title && (
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          )}
          {subtitle && <p className="text-dark-400">{subtitle}</p>}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit}
        className="premium-card space-y-6"
      >
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              {field.icon && <span className="inline mr-2">{field.icon}</span>}
              {field.label}{' '}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {renderFieldInput(field, values, handleChange)}
          </div>
        ))}

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText={loadingText}
        >
          {submitText}
        </LoadingButton>
      </motion.form>
    </motion.div>
  );
}
