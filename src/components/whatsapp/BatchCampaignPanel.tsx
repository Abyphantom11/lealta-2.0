/**
 * 📦 BATCH CAMPAIGN PANEL
 * Panel para crear y monitorear campañas de envío por lotes
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Package,
  Timer,
  Zap
} from 'lucide-react';

interface BatchCampaignConfig {
  preset: 'CONSERVATIVE' | 'NORMAL' | 'AGGRESSIVE' | 'CUSTOM';
  batchSize: number;
  delayMinutes: number;
}

interface CampaignProgress {
  totalRecipients: number;
  sent: number;
  failed: number;
  pending: number;
  percentComplete: number;
  currentBatch: number;
  totalBatches: number;
  currentBatchProgress: number;
  estimatedTimeRemaining: string;
}

interface ActiveCampaign {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  progress: CampaignProgress;
}

const PRESET_INFO = {
  CONSERVATIVE: {
    name: 'Conservador',
    icon: '🐢',
    batchSize: 5,
    delayMinutes: 5,
    description: 'Lento y seguro. Ideal para cuentas nuevas.',
    color: 'bg-blue-100 text-blue-800',
  },
  NORMAL: {
    name: 'Normal',
    icon: '⚖️',
    batchSize: 10,
    delayMinutes: 3,
    description: 'Balance perfecto. Recomendado.',
    color: 'bg-green-100 text-green-800',
  },
  AGGRESSIVE: {
    name: 'Rápido',
    icon: '🚀',
    batchSize: 20,
    delayMinutes: 2,
    description: 'Máxima velocidad. Requiere cuenta verificada.',
    color: 'bg-orange-100 text-orange-800',
  },
  CUSTOM: {
    name: 'Personalizado',
    icon: '⚙️',
    batchSize: 10,
    delayMinutes: 3,
    description: 'Configura tus propios parámetros.',
    color: 'bg-purple-100 text-purple-800',
  },
};

interface BatchCampaignPanelProps {
  selectedClients: string[];
  message: string;
  templateId?: string;
}

export default function BatchCampaignPanel({
  selectedClients,
  message,
  templateId,
}: BatchCampaignPanelProps) {
  const [config, setConfig] = useState<BatchCampaignConfig>({
    preset: 'NORMAL',
    batchSize: 10,
    delayMinutes: 3,
  });
  const [campaignName, setCampaignName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<ActiveCampaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Actualizar configuración cuando cambie el preset
  const handlePresetChange = (preset: string) => {
    const presetKey = preset as keyof typeof PRESET_INFO;
    const presetConfig = PRESET_INFO[presetKey];
    
    setConfig({
      preset: presetKey,
      batchSize: presetConfig.batchSize,
      delayMinutes: presetConfig.delayMinutes,
    });
  };

  // Calcular estimaciones
  const calculateEstimates = useCallback(() => {
    const totalBatches = Math.ceil(selectedClients.length / config.batchSize);
    const totalMinutes = 
      (selectedClients.length * 1 / 60) + // 1 seg por mensaje
      ((totalBatches - 1) * config.delayMinutes);
    
    return {
      totalBatches,
      totalMinutes: Math.ceil(totalMinutes),
      completionTime: new Date(Date.now() + totalMinutes * 60 * 1000),
    };
  }, [selectedClients.length, config]);

  const estimates = calculateEstimates();

  // Crear campaña
  const createCampaign = async (autoStart: boolean) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/batch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName || `Campaña ${new Date().toLocaleDateString()}`,
          message,
          templateId,
          clienteIds: selectedClients,
          batchSize: config.batchSize,
          delayMinutes: config.delayMinutes,
          autoStart,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveCampaign({
          id: data.campaign.id,
          name: data.campaign.name,
          status: autoStart ? 'RUNNING' : 'PENDING',
          progress: {
            totalRecipients: data.campaign.recipients.total,
            sent: 0,
            failed: 0,
            pending: data.campaign.recipients.total,
            percentComplete: 0,
            currentBatch: 0,
            totalBatches: data.campaign.batches.total,
            currentBatchProgress: 0,
            estimatedTimeRemaining: data.campaign.estimatedTime,
          },
        });

        // Iniciar polling de estado
        if (autoStart) {
          startStatusPolling(data.campaign.id);
        }
      } else {
        setError(data.error || 'Error creando campaña');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsCreating(false);
    }
  };

  // Polling de estado
  const startStatusPolling = (campaignId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/batch-campaign/${campaignId}/status`);
        const data = await response.json();

        if (data.success) {
          setActiveCampaign(prev => prev ? {
            ...prev,
            status: data.campaign.status,
            progress: data.progress,
          } : null);

          // Detener polling si la campaña terminó
          if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(data.campaign.status)) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000); // Cada 2 segundos

    return () => clearInterval(pollInterval);
  };

  // Acciones de campaña
  const campaignAction = async (action: 'start' | 'pause' | 'resume' | 'cancel') => {
    if (!activeCampaign) return;

    try {
      const response = await fetch(`/api/whatsapp/batch-campaign/${activeCampaign.id}/${action}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        const newStatus = {
          start: 'RUNNING',
          pause: 'PAUSED',
          resume: 'RUNNING',
          cancel: 'CANCELLED',
        }[action] as ActiveCampaign['status'];

        setActiveCampaign(prev => prev ? { ...prev, status: newStatus } : null);

        if (action === 'start' || action === 'resume') {
          startStatusPolling(activeCampaign.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Render del monitor de campaña activa
  const renderCampaignMonitor = () => {
    if (!activeCampaign) return null;

    const { progress, status } = activeCampaign;
    const statusColors = {
      PENDING: 'bg-gray-100 text-gray-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header con estado */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{activeCampaign.name}</h3>
            <Badge className={statusColors[status]}>
              {status === 'RUNNING' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {status}
            </Badge>
          </div>
          <div className="flex gap-2">
            {status === 'PENDING' && (
              <Button size="sm" onClick={() => campaignAction('start')}>
                <Play className="w-4 h-4 mr-1" /> Iniciar
              </Button>
            )}
            {status === 'RUNNING' && (
              <Button size="sm" variant="outline" onClick={() => campaignAction('pause')}>
                <Pause className="w-4 h-4 mr-1" /> Pausar
              </Button>
            )}
            {status === 'PAUSED' && (
              <Button size="sm" onClick={() => campaignAction('resume')}>
                <Play className="w-4 h-4 mr-1" /> Reanudar
              </Button>
            )}
            {['RUNNING', 'PAUSED', 'PENDING'].includes(status) && (
              <Button size="sm" variant="destructive" onClick={() => campaignAction('cancel')}>
                <Square className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Barra de progreso principal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso total</span>
            <span className="font-medium">{progress.percentComplete}%</span>
          </div>
          <Progress value={progress.percentComplete} className="h-3" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-700">{progress.sent}</div>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" /> Enviados
            </div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-700">{progress.failed}</div>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" /> Fallidos
            </div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-700">{progress.pending}</div>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-yellow-500" /> Pendientes
            </div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-700">
              {progress.currentBatch}/{progress.totalBatches}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Package className="w-3 h-3 text-blue-500" /> Lote actual
            </div>
          </div>
        </div>

        {/* Tiempo restante */}
        {status === 'RUNNING' && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
            <Timer className="w-4 h-4" />
            <span>Tiempo restante estimado: <strong>{progress.estimatedTimeRemaining}</strong></span>
          </div>
        )}

        {/* Progreso del lote actual */}
        {status === 'RUNNING' && progress.currentBatch > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Lote {progress.currentBatch} de {progress.totalBatches}</span>
              <span>{progress.currentBatchProgress}%</span>
            </div>
            <Progress value={progress.currentBatchProgress} className="h-1" />
          </div>
        )}

        {/* Mensaje de completado */}
        {status === 'COMPLETED' && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-green-800">¡Campaña completada!</h4>
            <p className="text-sm text-green-600">
              {progress.sent} de {progress.totalRecipients} mensajes enviados exitosamente
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Render del formulario de configuración
  const renderConfigForm = () => (
    <div className="space-y-6">
      {/* Nombre de la campaña */}
      <div className="space-y-2">
        <Label htmlFor="campaignName">Nombre de la campaña</Label>
        <Input
          id="campaignName"
          placeholder={`Campaña ${new Date().toLocaleDateString()}`}
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />
      </div>

      {/* Selector de preset */}
      <div className="space-y-2">
        <Label>Velocidad de envío</Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PRESET_INFO).map(([key, preset]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePresetChange(key)}
              className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                config.preset === key
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{preset.icon}</span>
                <span className="font-medium">{preset.name}</span>
              </div>
              <p className="text-xs text-slate-500">{preset.description}</p>
              <div className="mt-2 text-xs">
                <Badge variant="secondary" className="mr-1">
                  {preset.batchSize} msg/lote
                </Badge>
                <Badge variant="secondary">
                  cada {preset.delayMinutes} min
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Configuración personalizada */}
      <AnimatePresence>
        {config.preset === 'CUSTOM' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Mensajes por lote</Label>
                <Input
                  id="batchSize"
                  type="number"
                  min="1"
                  max="50"
                  value={config.batchSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    batchSize: parseInt(e.target.value) || 10
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayMinutes">Minutos entre lotes</Label>
                <Input
                  id="delayMinutes"
                  type="number"
                  min="1"
                  max="30"
                  value={config.delayMinutes}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    delayMinutes: parseInt(e.target.value) || 3
                  }))}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen y estimaciones */}
      <Card className="bg-slate-50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{selectedClients.length}</div>
              <div className="text-xs text-slate-500">Destinatarios</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{estimates.totalBatches}</div>
              <div className="text-xs text-slate-500">Lotes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">~{estimates.totalMinutes}m</div>
              <div className="text-xs text-slate-500">Duración</div>
            </div>
          </div>
          <div className="mt-3 text-center text-xs text-slate-500">
            Finalización estimada: {estimates.completionTime.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => createCampaign(false)}
          disabled={isCreating || selectedClients.length === 0}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Settings className="w-4 h-4 mr-2" />
          )}
          Crear (sin iniciar)
        </Button>
        <Button
          className="flex-1"
          onClick={() => createCampaign(true)}
          disabled={isCreating || selectedClients.length === 0}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          Crear e iniciar
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Campaña por Lotes
        </CardTitle>
        <CardDescription>
          Envía mensajes de forma gradual para evitar límites de la API
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeCampaign ? renderCampaignMonitor() : renderConfigForm()}
      </CardContent>
    </Card>
  );
}
