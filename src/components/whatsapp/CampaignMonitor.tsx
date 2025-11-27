'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  RefreshCw,
  BarChart3,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CampaignProgress {
  campaignId: string;
  name: string;
  status: 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  total: number;
  sent: number;
  failed: number;
  pending: number;
  startedAt: string;
  estimatedCompletion?: string;
  currentBatch?: number;
  totalBatches?: number;
  errors: string[];
}

interface CampaignMonitorProps {
  campaignId: string;
  onComplete?: (result: { sent: number; failed: number }) => void;
  onPause?: () => void;
  onResume?: () => void;
  refreshInterval?: number;
}

export default function CampaignMonitor({
  campaignId,
  onComplete,
  onPause,
  onResume,
  refreshInterval = 2000,
}: CampaignMonitorProps) {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/whatsapp/queue/${campaignId}/status`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);

        // Notificar cuando se complete
        if (data.status === 'COMPLETED' && onComplete) {
          onComplete({ sent: data.sent, failed: data.failed });
        }
      }
    } catch (error) {
      console.error('Error fetching campaign progress:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, onComplete]);

  useEffect(() => {
    fetchProgress();

    // Polling mientras está procesando
    const interval = setInterval(() => {
      if (progress?.status === 'PROCESSING') {
        fetchProgress();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchProgress, refreshInterval, progress?.status]);

  const handlePause = async () => {
    try {
      await fetch(`/api/whatsapp/queue/${campaignId}/pause`, { method: 'POST' });
      fetchProgress();
      onPause?.();
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleResume = async () => {
    try {
      await fetch(`/api/whatsapp/queue/${campaignId}/resume`, { method: 'POST' });
      fetchProgress();
      onResume?.();
    } catch (error) {
      console.error('Error resuming campaign:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
          <span className="text-slate-300">Cargando estado de la campaña...</span>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>No se pudo cargar el estado de la campaña</span>
        </div>
      </div>
    );
  }

  const percentComplete = Math.round((progress.sent / progress.total) * 100) || 0;
  const successRate = progress.sent > 0 
    ? Math.round(((progress.sent - progress.failed) / progress.sent) * 100) 
    : 0;

  const getStatusColor = () => {
    switch (progress.status) {
      case 'PROCESSING': return 'text-blue-400';
      case 'PAUSED': return 'text-yellow-400';
      case 'COMPLETED': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'PROCESSING': return <Activity className="w-5 h-5 animate-pulse" />;
      case 'PAUSED': return <Pause className="w-5 h-5" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5" />;
      case 'FAILED': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-800 ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-white">{progress.name}</h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {progress.status === 'PROCESSING' && 'Enviando mensajes...'}
                {progress.status === 'PAUSED' && 'Campaña pausada'}
                {progress.status === 'COMPLETED' && 'Campaña completada'}
                {progress.status === 'FAILED' && 'Campaña fallida'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProgress}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {progress.status === 'PROCESSING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </Button>
            )}

            {progress.status === 'PAUSED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4 mr-1" />
                Continuar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Content */}
      <div className="p-6 space-y-6">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progreso general</span>
            <span className="text-white font-medium">{percentComplete}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                progress.status === 'FAILED' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <MessageCircle className="w-4 h-4" />
              Total
            </div>
            <div className="text-2xl font-bold text-white">
              {progress.total.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Enviados
            </div>
            <div className="text-2xl font-bold text-green-400">
              {progress.sent.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <XCircle className="w-4 h-4" />
              Fallidos
            </div>
            <div className="text-2xl font-bold text-red-400">
              {progress.failed.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              Éxito
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {successRate}%
            </div>
          </div>
        </div>

        {/* Batch info */}
        {progress.currentBatch && progress.totalBatches && (
          <div className="text-center text-sm text-slate-400">
            Lote {progress.currentBatch} de {progress.totalBatches}
          </div>
        )}

        {/* Estimated completion */}
        {progress.status === 'PROCESSING' && progress.estimatedCompletion && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            Tiempo estimado restante: {progress.estimatedCompletion}
          </div>
        )}

        {/* Errors section */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
            >
              <AlertTriangle className="w-4 h-4" />
              {progress.errors.length} errores
              <span className="text-xs">({showErrors ? 'ocultar' : 'ver'})</span>
            </button>

            <AnimatePresence>
              {showErrors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-1 text-xs text-red-300">
                      {progress.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {error}
                        </li>
                      ))}
                      {progress.errors.length > 10 && (
                        <li className="text-red-400 mt-2">
                          ... y {progress.errors.length - 10} errores más
                        </li>
                      )}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
