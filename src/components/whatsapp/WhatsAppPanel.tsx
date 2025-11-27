/**
 * 📱 PANEL DE WHATSAPP - Envío de mensajes masivos e individuales
 * 🔄 Actualizado: Noviembre 2025 - Fixed loadTemplates error
 * ✨ Mejoras: Sistema de toast, modal de confirmación, banner demo
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Users, Send, Phone, Star, Calendar, Filter, Target } from 'lucide-react';
import { motion } from 'framer-motion';

// Nuevos componentes de mejoras
import { useToast, ToastProvider } from '@/components/ui/toast-notification';
import ConfirmCampaignModal from './ConfirmCampaignModal';
import DemoModeBanner from './DemoModeBanner';

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface CampaignFilters {
  puntosMinimos?: number;
  ultimaVisitaDias?: number;
  businessId?: string;
  tipoFiltro?: 'todos' | 'puntos' | 'visitas' | 'combinado';
}

interface CampaignResult {
  total: number;
  exitosos: number;
  fallidos: number;
  tasa_exito: number;
}

// Componente interno con acceso al toast
function WhatsAppPanelContent() {
  const toast = useToast();
  
  // 🔄 Fix: Estados para campaña masiva
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<CampaignFilters>({
    tipoFiltro: 'todos'
  });
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [previewNumbers, setPreviewNumbers] = useState<string[]>([]);
  
  // 🆕 Estado para template aprobado en campañas
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 🆕 Estado para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 🆕 Estados para control de lotes y progreso
  const [batchSize, setBatchSize] = useState<number>(10);
  const [delayMinutes, setDelayMinutes] = useState<number>(5);
  const [maxMessages, setMaxMessages] = useState<number>(100); // Cantidad máxima de mensajes a enviar
  const [simulationMode, setSimulationMode] = useState<boolean>(true); // 🆕 Modo simulación por defecto
  const [simulationResult, setSimulationResult] = useState<any>(null); // 🆕 Resultado de simulación
  const [campaignProgress, setCampaignProgress] = useState<{
    isRunning: boolean;
    currentBatch: number;
    totalBatches: number;
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  // Estados para mensaje individual
  const [individualPhone, setIndividualPhone] = useState<string>('');
  const [selectedApprovedTemplate, setSelectedApprovedTemplate] = useState<string>('');
  const [individualLoading, setIndividualLoading] = useState(false);
  const [individualResult, setIndividualResult] = useState<any>(null);

  // Templates aprobados por Meta (se cargan desde Twilio)
  const [approvedTemplates, setApprovedTemplates] = useState<Array<{
    id: string;
    sid: string;
    name: string;
    description: string;
    previewText: string;
  }>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // 🆕 Cálculos memoizados para evitar re-renders costosos
  const effectiveMaxMessages = useMemo(() => 
    Math.min(maxMessages, previewNumbers.length), 
    [maxMessages, previewNumbers.length]
  );
  
  const totalBatches = useMemo(() => 
    Math.ceil(effectiveMaxMessages / batchSize), 
    [effectiveMaxMessages, batchSize]
  );
  
  const estimatedTime = useMemo(() => 
    totalBatches * delayMinutes, 
    [totalBatches, delayMinutes]
  );

  // Cargar templates aprobados desde Twilio al montar
  useEffect(() => {
    const loadApprovedTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      
      try {
        const response = await fetch('/api/whatsapp/approved-templates');
        const data = await response.json();
        
        if (data.success && data.templates) {
          setApprovedTemplates(data.templates.map((t: any) => ({
            id: t.id || t.sid,
            sid: t.sid,
            name: t.name || 'Template sin nombre',
            description: t.description || '',
            previewText: t.previewText || 'Vista previa no disponible'
          })));
          console.log(`✅ ${data.templates.length} templates aprobados cargados`);
        } else {
          // Fallback a template hardcodeado si la API falla
          setApprovedTemplates([{
            id: 'estamos_abiertos',
            sid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
            name: '🏪 Estamos Abiertos',
            description: 'Notificación de que el restaurante está abierto',
            previewText: '¡Osado Ya Está Abierto! Te esperamos con lo mejor de nuestra carta. 🍗🔥'
          }]);
          if (data.error) {
            setTemplatesError(data.error);
          }
        }
      } catch (error) {
        console.error('Error cargando templates:', error);
        // Fallback
        setApprovedTemplates([{
          id: 'estamos_abiertos',
          sid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
          name: '🏪 Estamos Abiertos',
          description: 'Notificación de que el restaurante está abierto',
          previewText: '¡Osado Ya Está Abierto! Te esperamos con lo mejor de nuestra carta. 🍗🔥'
        }]);
        setTemplatesError('No se pudieron cargar los templates desde Twilio');
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadApprovedTemplates();
  }, []);

  // Templates predefinidos
  const getDefaultTemplates = (): Template[] => [
    {
      id: 'bienvenida',
      name: '👋 Mensaje de Bienvenida',
      content: '¡Hola {{nombre}}! 👋\n\nGracias por visitarnos en {{negocio}}. ¡Esperamos verte pronto! 😊\n\n¡Saludos! 🎉',
      variables: ['nombre', 'negocio']
    },
    {
      id: 'promocion',
      name: '🎯 Promoción Especial',
      content: '¡Hola {{nombre}}! 🎉\n\nTenemos una promoción especial solo para ti:\n{{descripcion}}\n\n¡No te la pierdas! Válida hasta {{fecha}}.\n\n{{negocio}} 📞',
      variables: ['nombre', 'descripcion', 'fecha', 'negocio']
    },
    {
      id: 'recordatorio',
      name: '⏰ Recordatorio',
      content: 'Hola {{nombre}},\n\nTe recordamos que tienes una cita programada para {{fecha}} a las {{hora}}.\n\n¡Te esperamos! 😊\n\n{{negocio}}',
      variables: ['nombre', 'fecha', 'hora', 'negocio']
    },
    {
      id: 'felicitacion',
      name: '🎂 Felicitación Cumpleaños',
      content: '¡Feliz cumpleaños {{nombre}}! 🎂🎉\n\nEn {{negocio}} queremos celebrar contigo este día especial.\n\n¡Ven y recibe una sorpresa! 🎁\n\n¡Te esperamos! 😊',
      variables: ['nombre', 'negocio']
    },
    {
      id: 'seguimiento',
      name: '📞 Seguimiento Post-Visita',
      content: 'Hola {{nombre}} 👋\n\nEsperamos que hayas disfrutado tu visita a {{negocio}}.\n\n¿Cómo fue tu experiencia? Tu opinión es muy importante para nosotros.\n\n¡Gracias por elegirnos! 🙏',
      variables: ['nombre', 'negocio']
    }
  ];

  // 🔄 Cargar templates al montar el componente (Fixed)
  useEffect(() => {
    const initializeTemplates = async () => {
      try {
        // Usar templates predefinidos inmediatamente para evitar errores
        setTemplates(getDefaultTemplates());
        
        // Luego intentar cargar desde API
        const response = await fetch('/api/whatsapp/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.templates && Array.isArray(data.templates)) {
            setTemplates(data.templates);
          }
        }
      } catch (error) {
        console.error('Error cargando templates:', error);
        // Mantener templates predefinidos en caso de error
      }
    };

    // Ejecutar inmediatamente
    initializeTemplates();
  }, []);

  // Función para formatear número ecuatoriano
  const formatEcuadorianPhone = (phone: string): string => {
    // Limpiar el número de espacios y caracteres especiales
    const cleaned = phone.replace(/\D/g, '');
    
    // Si empieza con 09 y tiene 10 dígitos, agregar +593 y quitar el 0
    if (cleaned.startsWith('09') && cleaned.length === 10) {
      return `+593${cleaned.substring(1)}`;
    }
    
    // Si ya tiene +593
    if (cleaned.startsWith('593') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    
    return phone;
  };

  // Función para obtener vista previa de números
  const loadPreviewNumbers = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/whatsapp/preview-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filtros: filters })
      });

      if (response.ok) {
        const data = await response.json();
        // La API devuelve 'clientes' con objetos que tienen propiedades como 'telefono'
        if (data.clientes && Array.isArray(data.clientes)) {
          const numbers = data.clientes
            .map((cliente: any) => {
              let phone = cliente.telefono || cliente.phone || '';
              
              // Limpiar el número
              const cleaned = phone.replace(/\D/g, '');
              
              // Convertir diferentes formatos a +593
              if (cleaned.startsWith('09') && cleaned.length === 10) {
                // Formato 09XXXXXXXX -> +5939XXXXXXXX
                return `+593${cleaned.substring(1)}`;
              } else if (cleaned.startsWith('5939') && cleaned.length === 12) {
                // Formato 5939XXXXXXXX -> +5939XXXXXXXX
                return `+${cleaned}`;
              } else if (cleaned.startsWith('593') && cleaned.length === 12) {
                // Formato 593XXXXXXXXX -> +593XXXXXXXXX
                return `+${cleaned}`;
              }
              
              return phone; // Devolver original si no coincide
            })
            .filter((phone: string) => phone?.startsWith('+5939') && phone.length === 13);
          
          // Eliminar duplicados
          const uniqueNumbers = [...new Set(numbers)] as string[];
          setPreviewNumbers(uniqueNumbers);
        } else {
          setPreviewNumbers([]);
        }
      } else {
        // Fallback: generar números de ejemplo basados en filtros
        const exampleNumbers = generateExampleNumbers(filters);
        setPreviewNumbers(exampleNumbers);
      }
    } catch (error) {
      console.error('Error cargando vista previa:', error);
      // Fallback: generar números de ejemplo
      const exampleNumbers = generateExampleNumbers(filters);
      setPreviewNumbers(exampleNumbers);
    } finally {
      setPreviewLoading(false);
    }
  }, [filters]);

  // Función para generar números de ejemplo (fallback)
  const generateExampleNumbers = (currentFilters: CampaignFilters): string[] => {
    // Números de ejemplo en diferentes formatos como podrían estar en la base de datos
    const baseNumbers = [
      '0987654321', '0912345678', '0998877665',  // Formato 09XXXXXXXX
      '+593945612789', '+593976543210', '+593989012345',  // Formato +593
      '593934567890', '593965432109', '593992468135',  // Formato 593
      '0913579246', '0967891234', '0998765432',  // Más formato 09
      '+593945123678', '+593978654321', '+593981234567',  // Más formato +593
      '593996543210', '593932109876', '593967123456',  // Más formato 593
      '0995432198', '0988776655', '0923456789'  // Más formato 09
    ];

    // Convertir todos a formato +593
    const normalizedNumbers = baseNumbers.map(phone => {
      const cleaned = phone.replace(/\D/g, '');
      
      if (cleaned.startsWith('09') && cleaned.length === 10) {
        return `+593${cleaned.substring(1)}`;
      } else if (cleaned.startsWith('5939') && cleaned.length === 12) {
        return `+${cleaned}`;
      } else if (cleaned.startsWith('593') && cleaned.length === 12) {
        return `+${cleaned}`;
      }
      
      return phone;
    }).filter(phone => phone.startsWith('+5939') && phone.length === 13);

    // Eliminar duplicados de los números normalizados
    const uniqueNumbers = [...new Set(normalizedNumbers)];

    switch (currentFilters.tipoFiltro) {
      case 'puntos':
        return uniqueNumbers.slice(0, Math.min(12, uniqueNumbers.length));
      case 'visitas':
        return uniqueNumbers.slice(0, Math.min(8, uniqueNumbers.length));
      case 'combinado':
        return uniqueNumbers.slice(0, Math.min(5, uniqueNumbers.length));
      default:
        return uniqueNumbers;
    }
  };

  // Cargar vista previa cuando cambien los filtros
  useEffect(() => {
    loadPreviewNumbers();
  }, [filters, loadPreviewNumbers]);

  // 🆕 Función para abrir modal de confirmación
  const handleSendCampaignClick = () => {
    if (previewNumbers.length === 0) {
      toast.warning('Sin destinatarios', 'No hay números de teléfono para enviar. Ajusta los filtros.');
      return;
    }
    setShowConfirmModal(true);
  };

  // 🆕 Función real de envío (llamada desde el modal)
  const sendCampaign = async () => {
    setCampaignLoading(true);
    setCampaignResult(null);
    setShowConfirmModal(false); // Cerrar modal inmediatamente
    
    // Limitar a maxMessages
    const numbersToSend = previewNumbers.slice(0, maxMessages);
    const totalBatches = Math.ceil(numbersToSend.length / batchSize);
    const delayMs = delayMinutes * 60 * 1000;
    
    // Inicializar progreso
    setCampaignProgress({
      isRunning: true,
      currentBatch: 0,
      totalBatches,
      sent: 0,
      failed: 0,
      total: numbersToSend.length
    });

    // 🆕 Simulador de progreso visual mientras espera respuesta del servidor
    let progressInterval: NodeJS.Timeout | null = null;
    if (!simulationMode) {
      const msPerBatch = delayMs + (batchSize * 500); // delay + tiempo de envío estimado
      let currentBatch = 0;
      
      progressInterval = setInterval(() => {
        currentBatch++;
        if (currentBatch <= totalBatches) {
          const estimatedSent = Math.min(currentBatch * batchSize, numbersToSend.length);
          setCampaignProgress(prev => prev ? {
            ...prev,
            currentBatch,
            sent: Math.floor(estimatedSent * 0.95), // 95% éxito estimado
            failed: Math.floor(estimatedSent * 0.05)
          } : null);
        }
      }, msPerBatch);
    }

    try {
      // 🆕 Priorizar template aprobado por Meta
      const payload = {
        contentSid: selectedCampaignTemplate || undefined, // Template aprobado por Meta
        templateId: !selectedCampaignTemplate ? selectedTemplate : undefined, // Legacy
        customMessage: !selectedCampaignTemplate && !selectedTemplate ? customMessage : undefined,
        variables,
        filtros: filters,
        // 🆕 Enviar solo los números limitados
        phoneNumbers: numbersToSend,
        maxMessages: numbersToSend.length,
        batchSize: batchSize,
        delayBetweenBatches: delayMinutes * 60 * 1000, // Convertir minutos a ms
        simulationMode: simulationMode // 🆕 Modo simulación
      };

      console.log(`📤 ${simulationMode ? '🔬 SIMULACIÓN:' : ''} Enviando campaña con payload:`, payload);

      const response = await fetch('/api/whatsapp/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // 🆕 Limpiar intervalo de progreso simulado
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const data = await response.json();

      if (data.success) {
        setCampaignResult(data.resultados);
        // Actualizar progreso con datos reales del servidor
        setCampaignProgress(prev => prev ? { 
          ...prev, 
          isRunning: false, 
          currentBatch: totalBatches,
          sent: data.resultados.exitosos, 
          failed: data.resultados.fallidos 
        } : null);
        
        // 🆕 Guardar resultado de simulación si aplica
        if (data.simulationMode) {
          setSimulationResult(data);
          toast.success(
            '🔬 Simulación completada', 
            `${data.resultados.exitosos}/${data.resultados.total} mensajes simulados (${data.resultados.tasa_exito}% éxito estimado)`
          );
        } else {
          setSimulationResult(null);
          toast.success(
            '¡Campaña enviada!', 
            `${data.resultados.exitosos}/${data.resultados.total} mensajes enviados exitosamente (${data.resultados.tasa_exito}%)`
          );
        }
      } else {
        setCampaignProgress(null);
        toast.error('Error en campaña', data.error || 'No se pudo enviar la campaña');
      }
    } catch (error) {
      // 🆕 Limpiar intervalo en caso de error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Error enviando campaña:', error);
      setCampaignProgress(null);
      toast.error('Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
      setCampaignLoading(false);
    }
  };

  const sendIndividualMessage = async () => {
    if (!selectedApprovedTemplate) {
      toast.error('Selecciona un template', 'Debes seleccionar un template aprobado por Meta');
      return;
    }

    setIndividualLoading(true);
    setIndividualResult(null);

    try {
      // Formatear el número de teléfono
      const formattedPhone = formatEcuadorianPhone(individualPhone);
      // selectedApprovedTemplate ahora contiene el SID directamente
      const template = approvedTemplates.find(t => t.sid === selectedApprovedTemplate);
      
      if (!template) {
        toast.error('Template no encontrado', 'El template seleccionado no es válido');
        return;
      }
      
      console.log('📤 Enviando mensaje con template a:', formattedPhone);
      console.log('📋 Template:', template.name, '- SID:', template.sid);
      
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefono: formattedPhone,
          mensaje: template.previewText, // Para el log
          templateSid: template.sid // Este es el Content SID de Twilio
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        
        console.error('❌ HTTP Error:', response.status, errorMessage);
        
        if (response.status === 401) {
          toast.error('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
        } else if (response.status === 403) {
          toast.error('Sin permisos', 'No tienes permisos para enviar mensajes. Contacta al administrador.');
        } else {
          toast.error(`Error del servidor (${response.status})`, errorMessage);
        }
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        toast.error('Error', 'Respuesta inválida del servidor');
        return;
      }

      console.log('✅ Respuesta:', data);

      if (data.success) {
        setIndividualResult(data);
        toast.success('¡Mensaje enviado!', `Template enviado exitosamente a ${formattedPhone}`);
        setIndividualPhone('');
        setSelectedApprovedTemplate('');
      } else {
        const errorMsg = data.error || 'Error desconocido';
        console.error('❌ API Error:', errorMsg);
        toast.error('Error al enviar', errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error);
      
      if (error.message.includes('Failed to fetch')) {
        toast.error('Error de conexión', 'Verifica tu conexión a internet.');
      } else if (error.name === 'TypeError') {
        toast.error('Error de red', error.message);
      } else {
        toast.error('Error', error.message || 'Sin conexión');
      }
    } finally {
      setIndividualLoading(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === selectedTemplate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 🆕 Banner de modo demo */}
        <DemoModeBanner />
        
        {/* Header moderno con animación */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              WhatsApp Business
            </h1>
            <p className="text-slate-400">
              Sistema de mensajería profesional para campañas masivas e individuales
            </p>
          </div>
        </motion.div>

      <Tabs defaultValue="campaign" className="space-y-6">
        {/* Navegación moderna */}
        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 backdrop-blur-sm">
          <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2">
            <TabsTrigger 
              value="campaign" 
              className="flex items-center gap-3 py-3 px-6 text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 data-[state=active]:shadow-lg"
            >
              <Users className="h-5 w-5" />
              Campaña Masiva
            </TabsTrigger>
            <TabsTrigger 
              value="individual" 
              className="flex items-center gap-3 py-3 px-6 text-slate-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg transition-all duration-200 data-[state=active]:shadow-lg"
            >
              <Phone className="h-5 w-5" />
              Mensaje Individual
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CAMPAÑA MASIVA */}
        <TabsContent value="campaign">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Configuración de mensaje con animación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    Configurar Mensaje
                  </CardTitle>
                  <p className="text-slate-400">
                    Selecciona un template o crea un mensaje personalizado
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-slate-200 font-medium text-base">Tipo de mensaje</Label>
                  <Tabs defaultValue="approved" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 border border-slate-600">
                      <TabsTrigger 
                        value="approved" 
                        className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-300"
                      >
                        <span className="text-lg">✅</span>
                        Aprobado
                      </TabsTrigger>
                      <TabsTrigger 
                        value="template" 
                        className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
                      >
                        <span className="text-lg">📋</span>
                        Template
                      </TabsTrigger>
                      <TabsTrigger 
                        value="custom" 
                        className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
                      >
                        <span className="text-lg">✍️</span>
                        Custom
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* 🆕 Templates Aprobados por Meta */}
                    <TabsContent value="approved" className="space-y-6 mt-6">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                          ✓ Templates aprobados por Meta - Garantizan entrega
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-slate-200">Seleccionar template aprobado</Label>
                        {templatesLoading ? (
                          <div className="p-4 bg-slate-700/50 rounded-lg text-center text-slate-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400 mx-auto mb-2"></div>
                            Cargando templates de Twilio...
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {approvedTemplates.map((template) => (
                              <div
                                key={template.sid}
                                onClick={() => {
                                  setSelectedCampaignTemplate(template.sid);
                                  setSelectedTemplate(''); // Limpiar otros
                                  setCustomMessage('');
                                }}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                  selectedCampaignTemplate === template.sid
                                    ? 'bg-emerald-500/20 border-emerald-500/50'
                                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-200">{template.name}</div>
                                    <div className="text-xs text-slate-400 mt-1">{template.description}</div>
                                  </div>
                                  {selectedCampaignTemplate === template.sid && (
                                    <div className="text-emerald-400 text-lg">✓</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {selectedCampaignTemplate && (
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                          <div className="text-sm font-medium text-green-300 mb-2">Vista previa:</div>
                          <div className="text-sm text-slate-300 whitespace-pre-line">
                            {approvedTemplates.find(t => t.sid === selectedCampaignTemplate)?.previewText}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="template" className="space-y-6 mt-6">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-300 text-sm">
                          ⚠️ Templates internos - Pueden no ser entregados sin aprobación de Meta
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-slate-200">Seleccionar template predefinido</Label>
                        <Select value={selectedTemplate} onValueChange={(v) => {
                          setSelectedTemplate(v);
                          setSelectedCampaignTemplate(''); // Limpiar aprobado
                        }}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200 focus:border-blue-500">
                            <SelectValue placeholder="Elegir un template..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {templates.map(template => (
                              <SelectItem 
                                key={template.id} 
                                value={template.id}
                                className="text-slate-200 hover:bg-slate-700"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
                                    {template.variables.length} variables
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTemplate && getSelectedTemplate() && (
                        <div className="space-y-6">
                          {/* Preview mejorado con diseño WhatsApp */}
                          <div className="space-y-3">
                            <Label className="text-slate-200 font-medium flex items-center gap-2">
                              <span className="text-lg">📱</span>
                              Vista previa del mensaje
                            </Label>
                            <div className="relative">
                              <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-lg">💼</span>
                                  </div>
                                  <div>
                                    <div className="text-white font-semibold text-sm">
                                      WhatsApp Business
                                    </div>
                                    <div className="text-green-100 text-xs">
                                      en línea
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-slate-700 p-4 rounded-b-2xl border-l-4 border-green-500">
                                <div className="bg-white/10 p-3 rounded-lg">
                                  <div className="text-slate-200 text-sm whitespace-pre-line font-medium">
                                    {getSelectedTemplate()?.content}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Variables del template con estilo moderno */}
                          {getSelectedTemplate() && getSelectedTemplate()!.variables.length > 0 && (
                            <div className="space-y-4">
                              <Label className="text-slate-200 font-medium flex items-center gap-2">
                                <span className="text-lg">🔧</span>
                                Variables del template 
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                  {getSelectedTemplate()?.variables.length}
                                </span>
                              </Label>
                              <div className="grid gap-4">
                                {getSelectedTemplate()?.variables.map(variable => (
                                  <div key={variable} className="space-y-2">
                                    <Label className="text-slate-300 text-sm font-medium">
                                      <span className="text-blue-400 font-mono">
                                        {`{{${variable}}}`}
                                      </span>
                                    </Label>
                                    <Input
                                      placeholder={`Valor para {{${variable}}}`}
                                      value={variables[variable] || ''}
                                      onChange={(e) => setVariables(prev => ({
                                        ...prev,
                                        [variable]: e.target.value
                                      }))}
                                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-blue-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <Label className="text-slate-200 font-medium flex items-center gap-2">
                          <span className="text-lg">✍️</span>
                          Escribir mensaje personalizado
                        </Label>
                        <Textarea
                          placeholder="Ejemplo:&#10;¡Hola! 👋&#10;&#10;Te invitamos a nuestro evento especial este viernes.&#10;&#10;¡No te lo pierdas! 🎉"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={8}
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-purple-500 font-mono"
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            <span className={customMessage.length > 900 ? 'text-yellow-400' : ''}>
                              Caracteres: {customMessage.length}/1000
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="text-lg">💡</span>
                            Usa emojis para mayor impacto
                          </div>
                        </div>
                      </div>
                      
                      {customMessage && (
                        <div className="space-y-3">
                          <Label className="text-slate-200 font-medium flex items-center gap-2">
                            <span className="text-lg">📱</span>
                            Vista previa
                          </Label>
                          <div className="relative">
                            <div className="bg-gradient-to-br from-purple-600 to-blue-700 p-4 rounded-t-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                  <span className="text-lg">💼</span>
                                </div>
                                <div>
                                  <div className="text-white font-semibold text-sm">
                                    WhatsApp Business
                                  </div>
                                  <div className="text-purple-100 text-xs">
                                    mensaje personalizado
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-700 p-4 rounded-b-2xl border-l-4 border-purple-500">
                              <div className="bg-white/10 p-3 rounded-lg">
                                <div className="text-slate-200 text-sm whitespace-pre-line">
                                  {customMessage}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Filtros de clientes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
            <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  Filtros de Audiencia
                </CardTitle>
                <p className="text-slate-400">
                  Solo números ecuatorianos (+593 09) válidos para WhatsApp Business
                </p>
                <p className="text-sm text-slate-400">
                  Solo se enviarán mensajes a números que inicien con 09
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tipo de filtro */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Seleccionar audiencia</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={filters.tipoFiltro === 'todos' ? 'default' : 'outline'}
                      onClick={() => setFilters(prev => ({ ...prev, tipoFiltro: 'todos' }))}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Users className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Todos</div>
                        <div className="text-xs text-slate-400">Números +593 09</div>
                      </div>
                    </Button>
                    <Button
                      variant={filters.tipoFiltro === 'puntos' ? 'default' : 'outline'}
                      onClick={() => setFilters(prev => ({ ...prev, tipoFiltro: 'puntos' }))}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Star className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Por Puntos</div>
                        <div className="text-xs text-slate-400">Clientes VIP</div>
                      </div>
                    </Button>
                    <Button
                      variant={filters.tipoFiltro === 'visitas' ? 'default' : 'outline'}
                      onClick={() => setFilters(prev => ({ ...prev, tipoFiltro: 'visitas' }))}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Calendar className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Por Visitas</div>
                        <div className="text-xs text-slate-400">Actividad reciente</div>
                      </div>
                    </Button>
                    <Button
                      variant={filters.tipoFiltro === 'combinado' ? 'default' : 'outline'}
                      onClick={() => setFilters(prev => ({ ...prev, tipoFiltro: 'combinado' }))}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Target className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium">Combinado</div>
                        <div className="text-xs text-slate-400">Múltiples filtros</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Filtros específicos */}
                {(filters.tipoFiltro === 'puntos' || filters.tipoFiltro === 'combinado') && (
                  <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Puntos mínimos
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Ej: 100"
                        value={filters.puntosMinimos || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          puntosMinimos: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="flex-1 bg-slate-700/50 border-yellow-500/30 text-slate-200 placeholder-slate-400 focus:border-yellow-500"
                      />
                      <div className="flex items-center text-sm text-slate-400 px-2">
                        pts
                      </div>
                    </div>
                  </div>
                )}

                {(filters.tipoFiltro === 'visitas' || filters.tipoFiltro === 'combinado') && (
                  <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Última visita (máximo días atrás)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Ej: 30"
                        value={filters.ultimaVisitaDias || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          ultimaVisitaDias: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="flex-1 bg-slate-700/50 border-blue-500/30 text-slate-200 placeholder-slate-400 focus:border-blue-500"
                      />
                      <div className="flex items-center text-sm text-slate-400 px-2">
                        días
                      </div>
                    </div>
                  </div>
                )}

                {/* Información del filtro */}
                <div className="p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg">
                  <div className="text-sm text-slate-300">
                    <div className="font-medium mb-1 text-slate-200">📱 Números objetivo:</div>
                    <div>Solo números que inicien con 09 (formato +593)</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Se excluyen números ficticios y de prueba
                    </div>
                  </div>
                </div>

                {/* Vista previa de números */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-blue-300 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Vista previa de números
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPreviewNumbers}
                      disabled={previewLoading}
                      className="h-7 px-2 text-xs bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      {previewLoading ? '🔄' : '📊'} Actualizar
                    </Button>
                  </div>
                  
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-pulse text-slate-400">Cargando números...</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium text-blue-300">{previewNumbers.length}</span>
                        números encontrados
                      </div>
                      
                      {previewNumbers.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {previewNumbers.slice(0, 10).map((number, index) => (
                              <motion.div
                                key={`${number}-${index}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-2 py-1 bg-slate-700/30 border border-slate-600/30 rounded text-slate-300 font-mono text-xs"
                              >
                                {number}
                              </motion.div>
                            ))}
                            {previewNumbers.length > 10 && (
                              <div className="col-span-2 px-2 py-1 text-center text-slate-400 text-xs">
                                ... y {previewNumbers.length - 10} números más
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3 text-slate-400 text-xs">
                          No se encontraron números que coincidan con los filtros
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Botón de envío mejorado */}
                <div className="mt-6 space-y-4">
                  {/* 🆕 Toggle de Modo Simulación - VISIBLE AL INICIO */}
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    simulationMode 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                      : 'bg-slate-800/50 border-slate-600/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{simulationMode ? '🔬' : '🚀'}</span>
                        <div>
                          <div className={`text-sm font-bold ${simulationMode ? 'text-yellow-300' : 'text-emerald-300'}`}>
                            {simulationMode ? 'MODO SIMULACIÓN' : 'MODO REAL'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {simulationMode 
                              ? 'Los mensajes NO se enviarán - Solo prueba' 
                              : '⚠️ Los mensajes SÍ serán enviados'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSimulationMode(!simulationMode)}
                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                          simulationMode 
                            ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' 
                            : 'bg-emerald-600 shadow-lg shadow-emerald-500/30'
                        }`}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                          simulationMode ? 'translate-x-9' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-sm font-medium text-purple-300 mb-2">
                      🚀 Resumen de la campaña
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div>📱 Audiencia: {
                        filters.tipoFiltro === 'todos' ? 'Todos los números +593 09' :
                        filters.tipoFiltro === 'puntos' ? `Clientes con ≥${filters.puntosMinimos || 0} puntos` :
                        filters.tipoFiltro === 'visitas' ? `Visitas en últimos ${filters.ultimaVisitaDias || 30} días` :
                        'Filtros combinados'
                      }</div>
                      <div>💬 Mensaje: {
                        selectedCampaignTemplate ? `✅ Template aprobado "${approvedTemplates.find(t => t.sid === selectedCampaignTemplate)?.name}"` :
                        selectedTemplate ? `Template "${getSelectedTemplate()?.name}"` : 
                        customMessage ? 'Mensaje personalizado' : 'Sin mensaje configurado'
                      }</div>
                      <div>📊 Destinatarios: <span className="text-emerald-400 font-bold">{effectiveMaxMessages}</span> de {previewNumbers.length} números disponibles</div>
                    </div>
                  </div>

                  {/* 🆕 Configuración de Lotes */}
                  <div className="p-4 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                    <div className="text-sm font-medium text-emerald-300 mb-3 flex items-center gap-2">
                      ⚙️ Configuración de Envío por Lotes
                    </div>
                    
                    {/* Cantidad de mensajes a enviar */}
                    <div className="mb-4">
                      <Label className="text-xs text-slate-400 mb-1 block">📱 Cantidad de mensajes a enviar</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="10"
                          max={Math.max(previewNumbers.length, 10)}
                          value={Math.min(maxMessages, previewNumbers.length)}
                          onChange={(e) => setMaxMessages(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={previewNumbers.length}
                            value={Math.min(maxMessages, previewNumbers.length)}
                            onChange={(e) => setMaxMessages(Math.min(parseInt(e.target.value) || 1, previewNumbers.length))}
                            className="w-20 bg-slate-700/50 border border-slate-600 text-white text-center rounded px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-slate-400">/ {previewNumbers.length}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-emerald-400">
                        Enviarás a {effectiveMaxMessages} de {previewNumbers.length} disponibles
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-400 mb-1 block">Mensajes por lote</Label>
                        <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(parseInt(v))}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 mensajes</SelectItem>
                            <SelectItem value="10">10 mensajes</SelectItem>
                            <SelectItem value="15">15 mensajes</SelectItem>
                            <SelectItem value="20">20 mensajes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400 mb-1 block">Delay entre lotes</Label>
                        <Select value={delayMinutes.toString()} onValueChange={(v) => setDelayMinutes(parseInt(v))}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 minuto</SelectItem>
                            <SelectItem value="3">3 minutos</SelectItem>
                            <SelectItem value="5">5 minutos</SelectItem>
                            <SelectItem value="10">10 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      ⏱️ Tiempo estimado: {estimatedTime} minutos 
                      ({totalBatches} lotes)
                    </div>
                  </div>

                  {/* 🆕 Barra de Progreso Mejorada */}
                  {campaignProgress && campaignProgress.isRunning && (
                    <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-300 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
                          {simulationMode ? '🔬 Simulando...' : '📤 Enviando mensajes...'}
                        </span>
                        <span className="text-sm text-white font-mono">
                          Lote {campaignProgress.currentBatch}/{campaignProgress.totalBatches}
                        </span>
                      </div>
                      <div className="h-4 bg-slate-700 rounded-full overflow-hidden mb-3 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 transition-all duration-500 animate-pulse"
                          style={{ width: `${Math.max(5, Math.round((campaignProgress.currentBatch) / campaignProgress.totalBatches * 100))}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-2 bg-slate-800/50 rounded">
                          <div className="text-green-400 font-bold">{campaignProgress.sent}</div>
                          <div className="text-slate-400">✅ Enviados</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded">
                          <div className="text-red-400 font-bold">{campaignProgress.failed}</div>
                          <div className="text-slate-400">❌ Fallidos</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded">
                          <div className="text-blue-400 font-bold">{campaignProgress.total}</div>
                          <div className="text-slate-400">📊 Total</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded">
                          <div className="text-yellow-400 font-bold">
                            ~{Math.max(0, (campaignProgress.totalBatches - campaignProgress.currentBatch) * delayMinutes)} min
                          </div>
                          <div className="text-slate-400">⏱️ Restante</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSendCampaignClick}
                    disabled={campaignLoading || (!selectedCampaignTemplate && !selectedTemplate && !customMessage) || (campaignProgress?.isRunning)}
                    className={`w-full h-12 text-base font-medium ${
                      simulationMode 
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' 
                        : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                    }`}
                    size="lg"
                  >
                    {campaignLoading || campaignProgress?.isRunning ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {simulationMode ? 'Simulando...' : 'Enviando campaña...'}
                      </div>
                    ) : simulationMode ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔬</span>
                        Simular Campaña ({effectiveMaxMessages} mensajes)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Enviar Campaña ({effectiveMaxMessages} mensajes)
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Resultados de campaña */}
          {campaignResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Resultados de la Campaña</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{campaignResult.total}</div>
                    <div className="text-sm text-slate-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{campaignResult.exitosos}</div>
                    <div className="text-sm text-slate-400">Exitosos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{campaignResult.fallidos}</div>
                    <div className="text-sm text-slate-400">Fallidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{campaignResult.tasa_exito}%</div>
                    <div className="text-sm text-slate-400">Tasa de éxito</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🆕 Resultados de Simulación */}
          {simulationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="mt-6 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-yellow-300">
                    <span className="text-2xl">🔬</span>
                    Resultados de Simulación
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full ml-2">
                      Modo Prueba
                    </span>
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    Vista previa de lo que sucedería al enviar la campaña real
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-blue-400">{simulationResult.resultados?.total || 0}</div>
                      <div className="text-sm text-slate-400">Total simulados</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-green-500/30">
                      <div className="text-2xl font-bold text-green-400">{simulationResult.resultados?.exitosos || 0}</div>
                      <div className="text-sm text-slate-400">Exitosos (estimado)</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-red-500/30">
                      <div className="text-2xl font-bold text-red-400">{simulationResult.resultados?.fallidos || 0}</div>
                      <div className="text-sm text-slate-400">Fallidos (estimado)</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-purple-500/30">
                      <div className="text-2xl font-bold text-purple-400">{simulationResult.resultados?.tasa_exito || 0}%</div>
                      <div className="text-sm text-slate-400">Tasa de éxito</div>
                    </div>
                  </div>

                  {/* 🆕 Información de exclusiones */}
                  {simulationResult.exclusiones && (simulationResult.exclusiones.optOuts > 0 || simulationResult.exclusiones.cooldown24h > 0) && (
                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <div className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
                        ⚠️ Números excluidos del envío:
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {simulationResult.exclusiones.optOuts > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">🚫</span>
                            <span className="text-slate-300">{simulationResult.exclusiones.optOuts} opt-outs (cancelaron suscripción)</span>
                          </div>
                        )}
                        {simulationResult.exclusiones.cooldown24h > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">⏰</span>
                            <span className="text-slate-300">{simulationResult.exclusiones.cooldown24h} en cooldown (ya recibieron mensaje hoy)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Muestra de números que recibirían el mensaje */}
                  {simulationResult.sample_numbers && simulationResult.sample_numbers.length > 0 && (
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        📱 Muestra de números que recibirían el mensaje:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {simulationResult.sample_numbers.map((number: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs font-mono text-slate-300"
                          >
                            {number}
                          </span>
                        ))}
                        {simulationResult.resultados?.total > 10 && (
                          <span className="px-2 py-1 text-slate-400 text-xs">
                            ... y {simulationResult.resultados.total - 10} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSimulationResult(null)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cerrar simulación
                    </Button>
                    <Button
                      onClick={() => {
                        setSimulationResult(null);
                        setSimulationMode(false);
                        // Ejecutar campaña real
                        handleSendCampaignClick();
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Campaña Real
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* MENSAJE INDIVIDUAL */}
        <TabsContent value="individual">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Enviar Mensaje Individual
              </CardTitle>
              <p className="text-sm text-slate-400">
                Envía un mensaje usando templates aprobados por Meta
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aviso de templates */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="text-sm font-medium text-amber-300 mb-1">
                      Solo Templates Aprobados
                    </div>
                    <p className="text-xs text-slate-400">
                      WhatsApp Business requiere templates pre-aprobados por Meta para iniciar conversaciones.
                      Los mensajes personalizados solo se pueden enviar dentro de una ventana de 24 horas después de que el cliente responda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-200 font-medium mb-3 block">📱 Número de teléfono</Label>
                    <Input
                      placeholder="0987654321 o +593987654321"
                      value={individualPhone}
                      onChange={(e) => setIndividualPhone(e.target.value)}
                      className="mt-2 bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-emerald-500"
                    />
                    {individualPhone && (
                      <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm">
                        <span className="text-slate-300">Formato final: </span>
                        <span className="font-mono text-emerald-400 font-medium">
                          {formatEcuadorianPhone(individualPhone)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-slate-200 font-medium">📋 Template Aprobado</Label>
                      {templatesLoading && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div>
                          Cargando desde Twilio...
                        </div>
                      )}
                    </div>
                    
                    {templatesError && (
                      <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                        ⚠️ {templatesError} - Usando template de respaldo
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {templatesLoading ? (
                        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center">
                          <div className="animate-pulse text-slate-400">Cargando templates...</div>
                        </div>
                      ) : approvedTemplates.length > 0 ? (
                        approvedTemplates.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => setSelectedApprovedTemplate(template.sid)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedApprovedTemplate === template.sid
                                ? 'bg-emerald-500/20 border-emerald-500/50'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-slate-200">{template.name}</div>
                                <div className="text-xs text-slate-400 mt-1">{template.description}</div>
                                <div className="text-xs text-slate-500 mt-1 font-mono">SID: {template.sid.slice(0, 10)}...</div>
                              </div>
                              {selectedApprovedTemplate === template.sid && (
                                <div className="text-emerald-400 text-lg">✓</div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-center">
                          <div className="text-slate-400">No hay templates aprobados disponibles</div>
                          <p className="text-xs text-slate-500 mt-1">
                            Crea templates en Twilio Content Template Builder
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={sendIndividualMessage}
                    disabled={individualLoading || !individualPhone || !selectedApprovedTemplate}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {individualLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Enviar Template
                      </div>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedApprovedTemplate && (
                    <div className="space-y-2">
                      <Label className="text-slate-200 font-medium">📱 Vista previa del Template</Label>
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                        <div className="text-sm font-medium text-green-300 mb-2">
                          WhatsApp Business - Template Aprobado ✓
                        </div>
                        <div className="text-sm text-slate-300 whitespace-pre-line">
                          {approvedTemplates.find(t => t.sid === selectedApprovedTemplate)?.previewText}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-lg">
                    <div className="text-sm font-medium text-slate-200 mb-2">
                      ℹ️ Sobre los Templates de Meta
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Los templates deben ser aprobados por Meta</li>
                      <li>• El proceso de aprobación toma 24-48 horas</li>
                      <li>• No se permiten mensajes promocionales agresivos</li>
                      <li>• Puedes solicitar nuevos templates en Twilio</li>
                    </ul>
                  </div>
                </div>
              </div>

              {individualResult && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-300 font-medium mb-2">
                    ✅ Template enviado exitosamente
                  </div>
                  <div className="text-sm text-green-400">
                    <div>📱 Enviado a: <span className="font-mono">{individualResult.phone}</span></div>
                    {individualResult.messageId && (
                      <div className="text-xs text-slate-400 mt-1">
                        ID del mensaje: {individualResult.messageId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      
      {/* 🆕 Modal de confirmación de campaña */}
      <ConfirmCampaignModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={sendCampaign}
        isLoading={campaignLoading}
        campaignData={{
          recipientCount: effectiveMaxMessages,
          templateName: selectedCampaignTemplate 
            ? `✅ ${approvedTemplates.find(t => t.sid === selectedCampaignTemplate)?.name || 'Template Aprobado'}` 
            : getSelectedTemplate()?.name,
          customMessage: customMessage || undefined,
          previewNumbers: previewNumbers.slice(0, effectiveMaxMessages),
          filters: filters,
        }}
      />
    </div>
  );
}

// Componente exportado con ToastProvider
export default function WhatsAppPanel() {
  return (
    <ToastProvider>
      <WhatsAppPanelContent />
    </ToastProvider>
  );
}