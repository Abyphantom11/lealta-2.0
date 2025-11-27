/**
 * 📱 PÁGINA DE TESTING WHATSAPP
 * Para probar el sistema de WhatsApp antes de integrarlo al dashboard principal
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, TestTube } from 'lucide-react';

export default function WhatsAppTestPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestMessage = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefono: phone,
          mensaje: message
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert('✅ ¡Mensaje enviado exitosamente!');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error enviando mensaje');
    } finally {
      setLoading(false);
    }
  };

  const runCampaignTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: 'welcome',
          variables: {
            negocio: 'Lealta Test'
          },
          filtros: {
            puntosMinimos: 0 // Para incluir todos los clientes
          }
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(`✅ Campaña enviada! ${data.resultados?.exitosos || 0} mensajes exitosos`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error enviando campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Test WhatsApp Sistema</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Individual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mensaje Individual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de teléfono
              </label>
              <Input
                placeholder="+593987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Debe ser un número que esté conectado al sandbox de Twilio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mensaje
              </label>
              <Textarea
                placeholder="¡Hola! Este es un mensaje de prueba desde Lealta."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={sendTestMessage}
              disabled={loading || !phone || !message}
              className="w-full"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensaje de Prueba
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Campaña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Campaña Masiva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">Template: Bienvenida</h4>
              <p className="text-sm text-blue-700">
                Enviará mensaje de bienvenida a todos los clientes en la base de datos que tengan teléfono válido.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm"><strong>Negocio:</strong> Lealta Test</p>
              <p className="text-sm"><strong>Filtro:</strong> Todos los clientes</p>
              <p className="text-sm"><strong>Template:</strong> Mensaje de bienvenida</p>
            </div>

            <Button
              onClick={runCampaignTest}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                'Procesando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Probar Campaña Masiva
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultados del Test</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Instrucciones para Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Conectar tu WhatsApp al Sandbox</h4>
            <p className="text-sm text-gray-600 mb-2">
              Envía un mensaje de WhatsApp al número: <strong>+1 415 523 8886</strong>
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Con el texto: <strong>join longer-pupil</strong>
            </p>
            <p className="text-sm text-gray-600">
              Esto conectará tu número personal al sandbox de Twilio para testing.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Probar Mensaje Individual</h4>
            <p className="text-sm text-gray-600">
              Usa tu número personal (el que conectaste al sandbox) para probar el envío individual.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Probar Campaña Masiva</h4>
            <p className="text-sm text-gray-600">
              Asegúrate de tener al menos un cliente en tu base de datos con un número de teléfono válido.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> En modo sandbox, solo puedes enviar mensajes a números que estén conectados al sandbox. 
              Para producción, necesitarás solicitar un número WhatsApp Business verificado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
