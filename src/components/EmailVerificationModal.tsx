'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, X } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  businessName: string;
  onClose: () => void;
  onVerified: (verificationId: string) => void;
}

export function EmailVerificationModal({
  isOpen,
  email,
  businessName,
  onClose,
  onVerified,
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<'sending' | 'verify' | 'success'>('sending');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [canResend, setCanResend] = useState(false);

  // Enviar código de verificación
  const sendVerificationCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email,
          businessName,
          type: 'email-verification',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        setTimeLeft(data.expiresIn || 10);
        startCountdown(data.expiresIn || 10);
      } else {
        setError(data.error || 'Error enviando el código');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar código
  const verifyCode = async () => {
    if (code.length < 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email,
          code: code.toUpperCase(),
          type: 'email-verification',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onVerified(data.verificationId);
        }, 1500);
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer
  const startCountdown = (minutes: number) => {
    let timeInSeconds = minutes * 60;
    const timer = setInterval(() => {
      timeInSeconds--;
      setTimeLeft(Math.ceil(timeInSeconds / 60));
      
      if (timeInSeconds <= 120) { // 2 minutos
        setCanResend(true);
      }
      
      if (timeInSeconds <= 0) {
        clearInterval(timer);
        setCanResend(true);
      }
    }, 1000);
  };

  // Auto-enviar al abrir el modal
  useState(() => {
    if (isOpen && step === 'sending') {
      sendVerificationCode();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'success' ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <Mail className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {step === 'sending' && 'Enviando código...'}
            {step === 'verify' && 'Verificar Email'}
            {step === 'success' && '¡Email verificado!'}
          </h3>
          <p className="text-gray-400 text-sm">
            {step === 'sending' && `Enviando código de verificación a ${email}`}
            {step === 'verify' && `Ingresa el código enviado a ${email}`}
            {step === 'success' && 'Tu email ha sido verificado exitosamente'}
          </p>
        </div>

        {/* Content */}
        {step === 'sending' && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Enviando código de verificación...</p>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de verificación
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
            </div>

            {timeLeft > 0 && (
              <div className="text-center text-sm text-gray-400">
                El código expira en {timeLeft} minutos
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {canResend && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Reenviar código
                </button>
              )}
              <button
                type="button"
                onClick={verifyCode}
                disabled={isLoading || code.length < 6}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className="text-green-400 mb-4">¡Email verificado exitosamente!</p>
            <p className="text-gray-400 text-sm">Continuando con el registro...</p>
          </div>
        )}

        {/* Close button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
