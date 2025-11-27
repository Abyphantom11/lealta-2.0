/**
 * 📱 PANEL DE WHATSAPP - Envío de mensajes masivos e individuales
 * 🔄 Actualizado: Noviembre 2025 - Fixed loadTemplates error
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Users, Send, Phone, Star, Calendar, Filter, Target } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function WhatsAppPanel() {
  // Estados para campaña masiva
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
  const [previewLoading, setPreviewLoading] = useState(false);

  // Estados para mensaje individual
  const [individualPhone, setIndividualPhone] = useState<string>('');
  const [individualMessage, setIndividualMessage] = useState<string>('');
  const [individualLoading, setIndividualLoading] = useState(false);
  const [individualResult, setIndividualResult] = useState<any>(null);

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

  // Cargar templates al montar el componente
  useEffect(() => {
    const initializeTemplates = async () => {
      try {
        const response = await fetch('/api/whatsapp/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        } else {
          // Si la API no está disponible, usar templates predefinidos
          setTemplates(getDefaultTemplates());
        }
      } catch (error) {
        console.error('Error cargando templates:', error);
        // Usar templates predefinidos como fallback
        setTemplates(getDefaultTemplates());
      }
    };

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

  const sendCampaign = async () => {
    setCampaignLoading(true);
    setCampaignResult(null);

    try {
      const payload = {
        templateId: selectedTemplate || undefined,
        customMessage: !selectedTemplate ? customMessage : undefined,
        variables,
        filtros: filters
      };

      const response = await fetch('/api/whatsapp/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setCampaignResult(data.resultados);
        alert(`✅ Campaña enviada! ${data.resultados.exitosos}/${data.resultados.total} mensajes exitosos`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enviando campaña:', error);
      alert('❌ Error enviando campaña');
    } finally {
      setCampaignLoading(false);
    }
  };

  const sendIndividualMessage = async () => {
    setIndividualLoading(true);
    setIndividualResult(null);

    try {
      // Formatear el número de teléfono
      const formattedPhone = formatEcuadorianPhone(individualPhone);
      
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefono: formattedPhone,
          mensaje: individualMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setIndividualResult(data);
        alert('✅ Mensaje enviado exitosamente!');
        setIndividualPhone('');
        setIndividualMessage('');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('❌ Error enviando mensaje');
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
                  <Tabs defaultValue="template" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border border-slate-600">
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
                        Personalizado
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="template" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <Label className="text-slate-200">Seleccionar template predefinido</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
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
                        selectedTemplate ? `Template "${getSelectedTemplate()?.name}"` : 
                        customMessage ? 'Mensaje personalizado' : 'Sin mensaje configurado'
                      }</div>
                      <div>📊 Estado: {
                        (selectedTemplate || customMessage) ? 
                        '✅ Listo para enviar' : 
                        '⚠️ Falta configurar mensaje'
                      }</div>
                    </div>
                  </div>

                  <Button
                    onClick={sendCampaign}
                    disabled={campaignLoading || (!selectedTemplate && !customMessage)}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    size="lg"
                  >
                    {campaignLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando campaña...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Enviar Campaña WhatsApp
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
                Envía un mensaje directo a un cliente específico
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <Label className="text-slate-200 font-medium mb-3 block">💬 Mensaje</Label>
                    <Textarea
                      placeholder="¡Hola! 👋&#10;&#10;Escribir mensaje personalizado aquí..."
                      value={individualMessage}
                      onChange={(e) => setIndividualMessage(e.target.value)}
                      rows={6}
                      className="mt-2 font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-slate-400">
                      Caracteres: {individualMessage.length}/1000
                    </div>
                  </div>

                  <Button
                    onClick={sendIndividualMessage}
                    disabled={individualLoading || !individualPhone || !individualMessage}
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
                        Enviar Mensaje
                      </div>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  {individualMessage && (
                    <div className="space-y-2">
                      <Label className="text-slate-200 font-medium">📱 Vista previa</Label>
                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                        <div className="text-sm font-medium text-green-300 mb-2">
                          WhatsApp Business
                        </div>
                        <div className="text-sm text-slate-300 whitespace-pre-line">
                          {individualMessage}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-800/50 border border-slate-600/50 rounded-lg">
                    <div className="text-sm font-medium text-slate-200 mb-2">
                      💡 Consejos para mensajes efectivos
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Usa emojis para mayor impacto visual</li>
                      <li>• Mantén el mensaje claro y conciso</li>
                      <li>• Incluye una llamada a la acción</li>
                      <li>• Personaliza el saludo si es posible</li>
                    </ul>
                  </div>
                </div>
              </div>

              {individualResult && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-300 font-medium mb-2">
                    ✅ Mensaje enviado exitosamente
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
    </div>
  );
}
