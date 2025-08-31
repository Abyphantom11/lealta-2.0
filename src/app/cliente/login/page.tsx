'use client';

import { useState } from 'react';
import { motion } from '../../../components/motion';
import { Shield, Mail, Lock, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AlertMessage from '../../../components/ui/AlertMessage';
import LoadingButton from '../../../components/ui/LoadingButton';
import { ClienteCredentials } from '../../../types/common';
import { usePost } from '@/contexts/ApiContext';

export default function ClienteLoginPage() {
  const router = useRouter();
  const { post, isLoading } = usePost();
  const [formData, setFormData] = useState<ClienteCredentials>({
    cedula: '',
    telefono: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Verificar cliente usando nuestro hook de API
      const response = await post('/api/cliente/verificar', {
        cedula: formData.cedula,
        telefono: formData.telefono,
      });
      
      if (response.success) {
        router.push('/cliente');
      } else {
        setError(response.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión: No se pudo procesar la solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Portal <span className="gradient-primary bg-clip-text text-transparent">Cliente</span>
          </h1>
          <p className="text-dark-400">
            Accede a tu portal de fidelización
          </p>
        </div>

        {/* Login Form */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="premium-card space-y-6"
        >
          <AlertMessage type="error" message={error} />

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Cédula
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="12345678"
              value={formData.cedula}
              onChange={(e) => setFormData(prev => ({...prev, cedula: e.target.value}))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Teléfono
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                className="form-input"
                placeholder="1234567890"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({...prev, telefono: e.target.value}))}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>

          <LoadingButton
            type="submit"
            isLoading={isLoading}
            loadingText="Verificando..."
          >
            Acceder
          </LoadingButton>
        </motion.form>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-dark-400 mb-4">¿Primera vez aquí?</p>
          <Link 
            href="/cliente/registro"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Registrarme
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
