'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus, ExternalLink, Copy, BarChart3, Trash2, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';

interface QRLink {
  id: string;
  shortId: string;
  name: string;
  targetUrl: string;
  backupUrl?: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
}

export default function QRManagerPage() {
  const [links, setLinks] = useState<QRLink[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLink, setEditingLink] = useState<QRLink | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    targetUrl: '',
    backupUrl: '',
    expiresAt: ''
  });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const response = await fetch('/api/qr-links');
      const data = await response.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error('Error loading links:', error);
      toast.error('Error cargando enlaces');
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!formData.name || !formData.targetUrl) {
      toast.error('Nombre y URL son requeridos');
      return;
    }

    setSaving(true);
    try {
      if (editingLink) {
        // Modo edición
        const response = await fetch(`/api/qr-links/${editingLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            isActive: editingLink.isActive
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success('QR Link actualizado exitosamente');
          setLinks(prev => prev.map(link => 
            link.id === editingLink.id 
              ? { ...link, ...formData }
              : link
          ));
          resetForm();
        } else {
          toast.error(data.message || 'Error actualizando link');
        }
      } else {
        // Modo creación
        const response = await fetch('/api/qr-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
          toast.success('QR Link creado exitosamente');
          setLinks(prev => [data.link, ...prev]);
          resetForm();
        } else {
          toast.error(data.message || 'Error creando link');
        }
      }
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Error guardando link');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', targetUrl: '', backupUrl: '', expiresAt: '' });
    setShowCreateForm(false);
    setEditingLink(null);
    setIsDuplicating(false);
  };

  const startEdit = (link: QRLink) => {
    setFormData({
      name: link.name,
      targetUrl: link.targetUrl,
      backupUrl: link.backupUrl || '',
      expiresAt: link.expiresAt || ''
    });
    setEditingLink(link);
    setIsDuplicating(false); // No estamos duplicando, estamos editando
    setShowCreateForm(true);
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/qr-links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setLinks(prev => prev.map(link => 
          link.id === linkId 
            ? { ...link, isActive: !currentStatus }
            : link
        ));
        toast.success(`QR Link ${!currentStatus ? 'activado' : 'desactivado'}`);
      }
    } catch (error) {
      console.error('Error toggling link status:', error);
      toast.error('Error cambiando estado del link');
    }
  };

  const duplicateLink = (link: QRLink) => {
    setFormData({
      name: `${link.name} (Copia)`,
      targetUrl: link.targetUrl,
      backupUrl: link.backupUrl || '',
      expiresAt: link.expiresAt || ''
    });
    setEditingLink(null); // No es edición, es creación nueva
    setIsDuplicating(true); // Marcar que estamos duplicando
    setShowCreateForm(true);
    toast.info('Crear nuevo QR basado en: ' + link.name);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const generateQRImage = (shortId: string) => {
    const qrUrl = `${window.location.origin}/r/${shortId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}&ecc=M&margin=10`;
  };

  const getQRUrl = (shortId: string) => {
    return `${window.location.origin}/r/${shortId}`;
  };

  const downloadQR = async (link: QRLink) => {
    try {
      const qrUrl = `${window.location.origin}/r/${link.shortId}`;
      // Generar QR de alta calidad para descarga (300x300)
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&ecc=M&margin=10&format=png`;
      
      // Descargar la imagen
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${link.name.replace(/[^a-zA-Z0-9]/g, '_')}_${link.shortId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`QR descargado: ${link.name}`);
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Error al descargar el QR');
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este QR link?')) return;

    try {
      const response = await fetch(`/api/qr-links/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Link eliminado');
        setLinks(prev => prev.filter(link => link.id !== id));
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Error eliminando link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando QR Manager...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <QrCode className="h-8 w-8 text-blue-600" />
                QR Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Genera QR codes con redirección dinámica. Cambia el destino sin regenerar el QR.
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
                setIsDuplicating(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo QR Link
            </Button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {(() => {
                  if (editingLink) return `Editar QR Link: ${editingLink.name}`;
                  if (isDuplicating) return 'Crear copia de QR existente';
                  return 'Crear Nuevo QR Link';
                })()}
              </CardTitle>
              {editingLink && (
                <p className="text-sm text-gray-600">
                  ID: {editingLink.shortId} • Clicks: {editingLink.clickCount} • 
                  <span className="text-blue-600 font-medium"> Editando destino sin cambiar QR</span>
                </p>
              )}
              {isDuplicating && (
                <p className="text-sm text-orange-600">
                  ⚠️ Esto creará un nuevo QR independiente con su propio código
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="qr-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del QR
                </label>
                <Input
                  id="qr-name"
                  placeholder="ej: Campaña Navidad 2024"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="target-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL Destino
                </label>
                <Input
                  id="target-url"
                  placeholder="https://mitienda.com/promo"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="backup-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL Backup (opcional)
                </label>
                <Input
                  id="backup-url"
                  placeholder="https://mitienda.com/fallback"
                  value={formData.backupUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, backupUrl: e.target.value }))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="expires-at" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Expiración (opcional)
                </label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={createLink} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      {editingLink ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      {editingLink ? 'Actualizar QR Link' : 'Crear QR Link'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links List */}
        <div className="space-y-4">
          {links.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay QR Links creados
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primer QR link con redirección dinámica
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer QR Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            links.map((link) => (
              <Card key={link.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* QR Code Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center">
                        <img 
                          src={generateQRImage(link.shortId)}
                          alt={`QR para ${link.name}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        QR Code
                      </p>
                    </div>

                    {/* Link Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {link.name}
                        </h3>
                        <Badge 
                          variant={link.isActive ? "default" : "secondary"}
                          className={`cursor-pointer transition-colors ${
                            link.isActive 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-gray-400 hover:bg-gray-500'
                          }`}
                          onClick={() => toggleLinkStatus(link.id, link.isActive)}
                          title={`Click para ${link.isActive ? 'desactivar' : 'activar'}`}
                        >
                          {link.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {link.expiresAt && (
                          <Badge variant="outline">
                            Expira: {new Date(link.expiresAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 min-w-0 flex-shrink-0">QR URL:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 text-xs truncate flex-1 min-w-0">
                            {getQRUrl(link.shortId)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(getQRUrl(link.shortId))}
                            className="flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 min-w-0 flex-shrink-0">Destino:</span>
                          <a 
                            href={link.targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 truncate flex-1 min-w-0 text-xs"
                            title={link.targetUrl}
                          >
                            <span className="truncate">{link.targetUrl}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>

                        {link.backupUrl && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 min-w-0 flex-shrink-0">Backup:</span>
                            <a 
                              href={link.backupUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline flex items-center gap-1 truncate flex-1 min-w-0 text-xs"
                              title={link.backupUrl}
                            >
                              <span className="truncate">{link.backupUrl}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Clicks:</span>
                            <Badge variant="outline">{link.clickCount}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Creado:</span>
                            <span className="text-xs text-gray-500">
                              {new Date(link.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Editar destino del QR"
                        onClick={() => startEdit(link)}
                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Duplicar como nuevo QR"
                        onClick={() => duplicateLink(link)}
                        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" title="Ver Analytics">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Descargar QR en alta calidad"
                        onClick={() => downloadQR(link)}
                        className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteLink(link.id)}
                        title="Eliminar permanentemente"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
