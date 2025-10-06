'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQRBranding } from '@/hooks/useQRBranding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RotateCcw, Save, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BrandedQRGenerator from '@/app/reservas/components/BrandedQRGenerator';
import { MOCK_RESERVA } from '@/types/qr-branding';

export default function QRPersonalizadoPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  
  const { config, isLoading, error, updateConfig, resetConfig } = useQRBranding(businessId);
  
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Actualizar local config cuando cambia el config de la API
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Función para actualizar config local
  const updateLocalConfig = (path: string[], value: any) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  // Guardar cambios
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear a valores por defecto
  const handleReset = async () => {
    if (confirm('¿Estás seguro de restaurar los valores por defecto?')) {
      try {
        await resetConfig();
        setLocalConfig(config);
      } catch (err) {
        console.error('Error al resetear:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Personalizado</h1>
          <p className="text-gray-600 mt-1">
            Configura el diseño de los códigos QR para tus reservas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✅ Configuración guardada exitosamente
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Configuración */}
        <div>
          <Tabs defaultValue="mensaje" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mensaje">Mensaje</TabsTrigger>
              <TabsTrigger value="colores">Colores</TabsTrigger>
              <TabsTrigger value="campos">Campos</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
            </TabsList>

            {/* TAB: Mensaje */}
            <TabsContent value="mensaje" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mensaje de Bienvenida</CardTitle>
                  <CardDescription>
                    Personaliza el mensaje que verán tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="mensaje-texto">Texto del Mensaje</Label>
                    <Input
                      id="mensaje-texto"
                      value={localConfig.mensaje.texto}
                      onChange={(e) =>
                        updateLocalConfig(['mensaje', 'texto'], e.target.value)
                      }
                      placeholder="¡Te esperamos!"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensaje-emoji">Emoji</Label>
                    <Input
                      id="mensaje-emoji"
                      value={localConfig.mensaje.emoji}
                      onChange={(e) =>
                        updateLocalConfig(['mensaje', 'emoji'], e.target.value)
                      }
                      placeholder="🎉"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensaje-color">Color del Mensaje</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mensaje-color"
                        type="color"
                        value={localConfig.mensaje.color}
                        onChange={(e) =>
                          updateLocalConfig(['mensaje', 'color'], e.target.value)
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        value={localConfig.mensaje.color}
                        onChange={(e) =>
                          updateLocalConfig(['mensaje', 'color'], e.target.value)
                        }
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Colores */}
            <TabsContent value="colores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Marco y Colores</CardTitle>
                  <CardDescription>
                    Personaliza el marco con gradiente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Marco Habilitado</Label>
                    <Switch
                      checked={localConfig.marco.enabled}
                      onCheckedChange={(checked: boolean) =>
                        updateLocalConfig(['marco', 'enabled'], checked)
                      }
                    />
                  </div>

                  {localConfig.marco.enabled && (
                    <>
                      <div>
                        <Label htmlFor="color-primario">Color Primario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color-primario"
                            type="color"
                            value={localConfig.marco.colorPrimario}
                            onChange={(e) =>
                              updateLocalConfig(['marco', 'colorPrimario'], e.target.value)
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            value={localConfig.marco.colorPrimario}
                            onChange={(e) =>
                              updateLocalConfig(['marco', 'colorPrimario'], e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="color-secundario">Color Secundario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="color-secundario"
                            type="color"
                            value={localConfig.marco.colorSecundario}
                            onChange={(e) =>
                              updateLocalConfig(['marco', 'colorSecundario'], e.target.value)
                            }
                            className="w-20 h-10"
                          />
                          <Input
                            value={localConfig.marco.colorSecundario}
                            onChange={(e) =>
                              updateLocalConfig(['marco', 'colorSecundario'], e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="grosor-borde">Grosor del Borde ({localConfig.marco.grosorBorde}px)</Label>
                        <Input
                          id="grosor-borde"
                          type="range"
                          min="0"
                          max="10"
                          value={localConfig.marco.grosorBorde}
                          onChange={(e) =>
                            updateLocalConfig(['marco', 'grosorBorde'], Number(e.target.value))
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Campos */}
            <TabsContent value="campos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campos Visibles</CardTitle>
                  <CardDescription>
                    Selecciona qué información mostrar en el QR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(localConfig.camposMostrados).map(([campo, visible]) => (
                    <div key={campo} className="flex items-center justify-between">
                      <Label className="capitalize">
                        {localConfig.etiquetas[campo as keyof typeof localConfig.etiquetas]}
                      </Label>
                      <Switch
                        checked={visible}
                        onCheckedChange={(checked: boolean) =>
                          updateLocalConfig(['camposMostrados', campo], checked)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas Personalizadas</CardTitle>
                  <CardDescription>
                    Personaliza el nombre de cada campo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(localConfig.etiquetas).map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <Label htmlFor={`etiqueta-${campo}`} className="capitalize">
                        {campo}
                      </Label>
                      <Input
                        id={`etiqueta-${campo}`}
                        value={etiqueta}
                        onChange={(e) =>
                          updateLocalConfig(['etiquetas', campo], e.target.value)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Contacto */}
            <TabsContent value="contacto" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                  <CardDescription>
                    Agrega tus datos de contacto al QR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Mostrar Teléfono</Label>
                      <Switch
                        checked={localConfig.contacto.mostrarTelefono}
                        onCheckedChange={(checked: boolean) =>
                          updateLocalConfig(['contacto', 'mostrarTelefono'], checked)
                        }
                      />
                    </div>
                    {localConfig.contacto.mostrarTelefono && (
                      <Input
                        value={localConfig.contacto.telefono || ''}
                        onChange={(e) =>
                          updateLocalConfig(['contacto', 'telefono'], e.target.value)
                        }
                        placeholder="+507 6000-0000"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Mostrar Email</Label>
                      <Switch
                        checked={localConfig.contacto.mostrarEmail}
                        onCheckedChange={(checked: boolean) =>
                          updateLocalConfig(['contacto', 'mostrarEmail'], checked)
                        }
                      />
                    </div>
                    {localConfig.contacto.mostrarEmail && (
                      <Input
                        type="email"
                        value={localConfig.contacto.email || ''}
                        onChange={(e) =>
                          updateLocalConfig(['contacto', 'email'], e.target.value)
                        }
                        placeholder="info@negocio.com"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Mostrar Dirección</Label>
                      <Switch
                        checked={localConfig.contacto.mostrarDireccion}
                        onCheckedChange={(checked: boolean) =>
                          updateLocalConfig(['contacto', 'mostrarDireccion'], checked)
                        }
                      />
                    </div>
                    {localConfig.contacto.mostrarDireccion && (
                      <Input
                        value={localConfig.contacto.direccion || ''}
                        onChange={(e) =>
                          updateLocalConfig(['contacto', 'direccion'], e.target.value)
                        }
                        placeholder="Calle Principal, Ciudad"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel de Preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>
                    Así se verá tu QR personalizado
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent className="flex justify-center">
                <BrandedQRGenerator
                  reserva={MOCK_RESERVA}
                  config={localConfig}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
