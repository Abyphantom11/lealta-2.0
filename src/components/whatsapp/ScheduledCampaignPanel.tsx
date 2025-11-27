'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOptionalBusinessContext } from '@/contexts/BusinessContext';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Users, 
  Send, 
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface ApprovedTemplate {
  id: string;
  sid: string;
  name: string;
  description: string;
  previewText: string;
}

interface CampaignProgress {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  totalTargeted: number;
  totalSent: number;
  totalFailed: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining?: string;
  nextBatchAt?: string;
}

export default function ScheduledCampaignPanel() {
  // Obtener businessId del contexto de sesión (opcional, no lanza error)
  const businessContext = useOptionalBusinessContext();
  const businessId = businessContext?.businessId || null;
  const businessName = businessContext?.businessName || null;
  const contextLoading = businessContext?.isLoading || false;
  
  // Estados de configuración
  const [totalClientes, setTotalClientes] = useState<number>(150);
  const [batchSize, setBatchSize] = useState<number>(10);
  const [delayMinutes, setDelayMinutes] = useState<number>(5);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Estados de UI
  const [templates, setTemplates] = useState<ApprovedTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientesDisponibles, setClientesDisponibles] = useState<number>(0);
  const [loadingClientes, setLoadingClientes] = useState(true);
  
  // Campaña activa
  const [activeCampaign, setActiveCampaign] = useState<CampaignProgress | null>(null);
  const [polling, setPolling] = useState(false);

  // Cargar clientes disponibles
  useEffect(() => {
    const loadClientes = async () => {
      if (!businessId) return;
      
      try {
        setLoadingClientes(true);
        const res = await fetch(`/api/clientes/count?businessId=${businessId}`);
        const data = await res.json();
        if (data.count !== undefined) {
          setClientesDisponibles(data.count);
        }
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    loadClientes();
  }, [businessId]);

  // Cargar templates aprobados
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch('/api/whatsapp/approved-templates');
        const data = await res.json();
        if (data.success && data.templates) {
          setTemplates(data.templates);
        }
      } catch (err) {
        console.error('Error cargando templates:', err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Polling para progreso de campaña
  useEffect(() => {
    if (!activeCampaign || activeCampaign.status === 'COMPLETED' || activeCampaign.status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      setPolling(true);
      try {
        const res = await fetch(`/api/whatsapp/scheduled-campaign?id=${activeCampaign.id}`);
        const data = await res.json();
        if (data.success && data.campaign) {
          setActiveCampaign(data.campaign);
        }
      } catch (err) {
        console.error('Error obteniendo progreso:', err);
      } finally {
        setPolling(false);
      }
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, [activeCampaign]);

  // Calcular estimaciones
  const totalBatches = Math.ceil(totalClientes / batchSize);
  const totalMinutes = totalBatches * delayMinutes;
  const estimatedTime = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min`
    : `${totalMinutes} minutos`;

  // Crear campaña
  const handleCreateCampaign = async () => {
    if (!selectedTemplate) {
      setError('Selecciona un template aprobado');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/whatsapp/scheduled-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          contentSid: selectedTemplate,
          totalClientes,
          batchSize,
          delayBetweenBatches: delayMinutes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActiveCampaign(data.campaign);
      } else {
        setError(data.error || 'Error creando campaña');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  // Controlar campaña
  const handleCampaignAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!activeCampaign) return;

    try {
      const res = await fetch('/api/whatsapp/scheduled-campaign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          action,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (action === 'cancel') {
          setActiveCampaign(null);
        } else if (data.campaign) {
          setActiveCampaign(data.campaign);
        }
      }
    } catch (err) {
      console.error('Error controlando campaña:', err);
    }
  };

  // Calcular porcentaje de progreso
  const progressPercent = activeCampaign 
    ? Math.round((activeCampaign.totalSent + activeCampaign.totalFailed) / activeCampaign.totalTargeted * 100)
    : 0;

  // Si está cargando el contexto
  if (contextLoading) {
    return (
      <Card className="bg-slate-800/90 border-slate-700">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-slate-400 mt-2">Cargando contexto...</p>
        </CardContent>
      </Card>
    );
  }

  // Si no hay businessId en la sesión (fuera del contexto de un negocio)
  if (!businessId) {
    return (
      <Card className="bg-slate-800/90 border-amber-500/30">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-amber-400" />
          <p className="text-amber-300 mt-2">Campañas programadas no disponibles</p>
          <p className="text-slate-400 text-sm">
            Esta función solo está disponible dentro del panel de un negocio específico.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Accede desde: /[tu-negocio]/superadmin
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info del negocio */}
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <span>Negocio:</span>
        <span className="text-slate-400 font-medium">{businessName || businessId}</span>
      </div>

      {/* Campaña Activa */}
      {activeCampaign && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeCampaign.status === 'RUNNING' && (
                  <div className="animate-pulse">
                    <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                  </div>
                )}
                {activeCampaign.status === 'PAUSED' && (
                  <Pause className="h-5 w-5 text-amber-400" />
                )}
                {activeCampaign.status === 'COMPLETED' && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                <span className="text-white">Campaña en Progreso</span>
                {polling && <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />}
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${
                activeCampaign.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300' :
                activeCampaign.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-300' :
                activeCampaign.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {activeCampaign.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progreso</span>
                <span className="text-white font-medium">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-white">{activeCampaign.totalTargeted}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">{activeCampaign.totalSent}</div>
                <div className="text-xs text-slate-400">Enviados</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{activeCampaign.totalFailed}</div>
                <div className="text-xs text-slate-400">Fallidos</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {activeCampaign.currentBatch}/{activeCampaign.totalBatches}
                </div>
                <div className="text-xs text-slate-400">Lote</div>
              </div>
            </div>

            {/* Tiempo restante */}
            {activeCampaign.estimatedTimeRemaining && activeCampaign.status === 'RUNNING' && (
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Clock className="h-4 w-4" />
                <span>Tiempo restante estimado: {activeCampaign.estimatedTimeRemaining}</span>
              </div>
            )}

            {/* Controles */}
            {activeCampaign.status !== 'COMPLETED' && activeCampaign.status !== 'FAILED' && (
              <div className="flex gap-3 pt-2">
                {activeCampaign.status === 'RUNNING' ? (
                  <Button 
                    onClick={() => handleCampaignAction('pause')}
                    variant="outline"
                    className="flex-1 border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleCampaignAction('resume')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reanudar
                  </Button>
                )}
                <Button 
                  onClick={() => handleCampaignAction('cancel')}
                  variant="outline"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}

            {activeCampaign.status === 'COMPLETED' && (
              <Button 
                onClick={() => setActiveCampaign(null)}
                className="w-full bg-slate-600 hover:bg-slate-700"
              >
                Nueva Campaña
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuración de Nueva Campaña */}
      {!activeCampaign && (
        <Card className="bg-slate-800/90 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                <Send className="h-5 w-5 text-white" />
              </div>
              Campaña Programada con Lotes
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Envía mensajes de forma gradual y segura para proteger tu número
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de Template */}
            <div className="space-y-3">
              <Label className="text-slate-200">Template Aprobado por Meta</Label>
              {templatesLoading ? (
                <div className="p-4 bg-slate-700/50 rounded-lg text-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Cargando templates...
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.sid}
                      onClick={() => setSelectedTemplate(template.sid)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTemplate === template.sid
                          ? 'bg-emerald-500/20 border-emerald-500/50'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-200">{template.name}</div>
                          <div className="text-xs text-slate-400">{template.description}</div>
                        </div>
                        {selectedTemplate === template.sid && (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clientes disponibles */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-300 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes con teléfono disponibles:
                </span>
                {loadingClientes ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                ) : (
                  <span className="text-white font-bold text-lg">{clientesDisponibles.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Configuración de lotes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total a Enviar
                </Label>
                <Input
                  type="number"
                  value={totalClientes}
                  onChange={(e) => setTotalClientes(Math.min(parseInt(e.target.value) || 0, clientesDisponibles))}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  min={1}
                  max={clientesDisponibles || 1000}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Por Lote
                </Label>
                <Input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  min={1}
                  max={50}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Delay (min)
                </Label>
                <Input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 5)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  min={1}
                  max={30}
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Total de lotes:</span>
                  <span className="text-white font-medium">{totalBatches}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo estimado:</span>
                  <span className="text-emerald-400 font-medium">{estimatedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo estimado:</span>
                  <span className="text-amber-400 font-medium">${(totalClientes * 0.055).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Presets recomendados:</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTotalClientes(150); setBatchSize(10); setDelayMinutes(5); }}
                  className="text-xs border-slate-600 text-slate-300"
                >
                  Día 1 (150)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTotalClientes(175); setBatchSize(10); setDelayMinutes(4); }}
                  className="text-xs border-slate-600 text-slate-300"
                >
                  Día 2 (175)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTotalClientes(175); setBatchSize(10); setDelayMinutes(4); }}
                  className="text-xs border-slate-600 text-slate-300"
                >
                  Día 3 (175)
                </Button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Botón de inicio */}
            <Button
              onClick={handleCreateCampaign}
              disabled={creating || !selectedTemplate || totalClientes < 1}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-lg"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Iniciando campaña...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar Campaña ({totalClientes} clientes)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
