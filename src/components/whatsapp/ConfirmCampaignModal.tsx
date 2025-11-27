'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Send, X, Users, MessageCircle, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  campaignData: {
    recipientCount: number;
    templateName?: string;
    customMessage?: string;
    estimatedTime?: number; // en minutos
    estimatedCost?: number;
    previewNumbers?: string[];
    filters?: {
      tipoFiltro?: string;
      puntosMinimos?: number;
      ultimaVisitaDias?: number;
    };
  };
}

export default function ConfirmCampaignModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  campaignData
}: ConfirmCampaignModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  const isConfirmEnabled = confirmText.toLowerCase() === 'enviar';

  const handleConfirm = () => {
    if (isConfirmEnabled && !isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  // Calcular tiempo estimado (1 segundo por mensaje + overhead)
  const estimatedMinutes = Math.ceil((campaignData.recipientCount * 1.2) / 60);

  // Calcular costo estimado ($0.055 por mensaje)
  const estimatedCost = (campaignData.recipientCount * 0.055).toFixed(2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con warning */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Confirmar Envío de Campaña
                  </h2>
                  <p className="text-amber-200/80 text-sm mt-1">
                    Esta acción enviará mensajes a múltiples destinatarios
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats de la campaña */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-400 text-sm">Destinatarios</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {campaignData.recipientCount.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-slate-400 text-sm">Tiempo estimado</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ~{estimatedMinutes} min
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="text-slate-400 text-sm">Template</span>
                  </div>
                  <div className="text-sm font-medium text-white truncate">
                    {campaignData.templateName || 'Mensaje personalizado'}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-400 text-sm">Costo estimado</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${estimatedCost}
                  </div>
                </div>
              </div>

              {/* Preview de números (colapsible) */}
              {campaignData.previewNumbers && campaignData.previewNumbers.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    <span>{showAdvancedInfo ? '▼' : '▶'}</span>
                    Ver primeros destinatarios ({Math.min(5, campaignData.previewNumbers.length)} de {campaignData.recipientCount})
                  </button>
                  
                  <AnimatePresence>
                    {showAdvancedInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
                          {campaignData.previewNumbers.slice(0, 5).map((number, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-slate-500">{idx + 1}.</span>
                              <span className="font-mono text-slate-300">{number}</span>
                            </div>
                          ))}
                          {campaignData.recipientCount > 5 && (
                            <div className="text-slate-500 text-sm mt-2">
                              ... y {campaignData.recipientCount - 5} más
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Advertencia */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-300 font-medium mb-1">
                      Importante
                    </p>
                    <p className="text-red-200/70">
                      Una vez iniciada, la campaña no puede cancelarse. Los mensajes se enviarán de forma progresiva. 
                      Asegúrate de que el mensaje y los destinatarios son correctos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input de confirmación */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400">
                  Escribe <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400">ENVIAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe ENVIAR"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 p-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isConfirmEnabled || isLoading}
                className={`flex-1 ${
                  isConfirmEnabled
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-slate-700 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirmar Envío
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
