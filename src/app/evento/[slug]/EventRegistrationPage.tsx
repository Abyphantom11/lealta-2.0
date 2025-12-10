'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Share2,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import QRCode from 'qrcode';

interface EventData {
  id: string;
  name: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  imageUrl?: string;
  primaryColor: string;
  requirePhone: boolean;
  requireEmail: boolean;
  customFields?: Array<{ name: string; type: string; required: boolean }>;
  status: string;
  maxCapacity: number;
  availableSpots: number;
  isOpen: boolean;
  business: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

interface Props {
  readonly slug: string;
}

type RegistrationStep = 'cedula' | 'datos' | 'success';

export default function EventRegistrationPage({ slug }: Readonly<Props>) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Registration flow state
  const [step, setStep] = useState<RegistrationStep>('cedula');
  const [cedula, setCedula] = useState('');
  
  // Form state for new clients
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Loading states
  const [checkingCedula, setCheckingCedula] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Success state
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  
  // Promoter referral tracking
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Capture referral code from URL on mount
  useEffect(() => {
    if (typeof globalThis.window !== 'undefined') {
      const params = new URLSearchParams(globalThis.window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref);
        console.log('📊 Referral code captured:', ref);
      }
    }
  }, []);

  // Load event data
  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events/public/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Evento no encontrado');
          } else {
            setError('Error al cargar el evento');
          }
          return;
        }
        const data = await res.json();
        setEvent(data);
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug]);

  // Generate QR image when token is available
  useEffect(() => {
    if (qrToken && event) {
      const generateQR = async () => {
        try {
          const qrUrl = await QRCode.toDataURL(qrToken, {
            width: 300,
            margin: 2,
            color: {
              dark: event.primaryColor || '#000000',
              light: '#ffffff'
            }
          });
          setQrImageUrl(qrUrl);
        } catch (err) {
          console.error('Error generating QR:', err);
        }
      };
      generateQR();
    }
  }, [qrToken, event]);

  // Format cedula as user types (remove non-numeric characters)
  const handleCedulaChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setCedula(cleaned);
  };

  // Step 1: Check if cedula exists
  const handleCheckCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || cedula.length < 6) {
      setError('Por favor ingresa una cédula válida');
      return;
    }

    setCheckingCedula(true);
    setError(null);

    try {
      // First check if already registered for this event
      const checkRes = await fetch(`/api/events/${event.id}/guests/check?cedula=${cedula}`);
      const checkData = await checkRes.json();

      if (checkData.alreadyRegistered) {
        // Already registered, show their QR
        setQrToken(checkData.qrToken);
        setGuestName(checkData.guestName);
        setStep('success');
        return;
      }

      // Check if client exists in the database
      const clienteRes = await fetch(`/api/events/check-cliente?cedula=${cedula}&eventId=${event.id}`);
      const clienteData = await clienteRes.json();

      if (clienteData.exists && clienteData.cliente) {
        // Client exists, register directly with their data
        await registerGuest({
          clienteId: clienteData.cliente.id,
          cedula: clienteData.cliente.cedula,
          nombre: clienteData.cliente.nombre,
          telefono: clienteData.cliente.telefono,
          correo: clienteData.cliente.correo
        });
      } else {
        // Client doesn't exist, show full form
        setStep('datos');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setCheckingCedula(false);
    }
  };

  // Register guest (for both existing and new clients)
  const registerGuest = async (data: {
    clienteId?: string;
    cedula: string;
    nombre: string;
    telefono?: string;
    correo?: string;
  }) => {
    if (!event) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: data.clienteId,
          cedula: data.cedula,
          name: data.nombre,
          phone: data.telefono,
          email: data.correo,
          guestCount: 1, // Always 1, individual tickets
          referralCode: referralCode // Pass promoter referral code
        })
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('Ya estás registrado para este evento');
          if (result.existingGuest?.qrToken) {
            setQrToken(result.existingGuest.qrToken);
            setGuestName(data.nombre);
            setStep('success');
          }
        } else {
          setError(result.error || 'Error al registrarse');
        }
        return;
      }

      // Success!
      setQrToken(result.guest.qrToken);
      setGuestName(data.nombre);
      setStep('success');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit new client data
  const handleSubmitNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    await registerGuest({
      cedula,
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      correo: correo.trim() || undefined
    });
  };

  const downloadQR = () => {
    if (!qrImageUrl || !event) return;
    
    const link = document.createElement('a');
    link.download = `entrada-${event.name.replace(/\s+/g, '-')}.png`;
    link.href = qrImageUrl;
    link.click();
  };

  const shareQR = async () => {
    if (!qrImageUrl || !event) return;
    
    try {
      if (navigator.share) {
        const blob = await (await fetch(qrImageUrl)).blob();
        const file = new File([blob], 'entrada.png', { type: 'image/png' });
        await navigator.share({
          title: `Mi entrada para ${event.name}`,
          text: `¡Estoy registrado para ${event.name}!`,
          files: [file]
        });
      } else {
        await navigator.clipboard.writeText(qrToken || '');
        alert('Código copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Reset to start
  const resetForm = () => {
    setStep('cedula');
    setCedula('');
    setNombre('');
    setTelefono('');
    setCorreo('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl shadow-lg p-8 max-w-md text-center border border-gray-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {error}
          </h1>
          <p className="text-gray-400">
            El evento que buscas no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const primaryColor = event.primaryColor || '#6366f1';
  const eventDate = new Date(event.eventDate);
  const hasBackgroundImage = !!event.imageUrl;

  // Success view - Show QR
  if (step === 'success' && qrToken) {
    return (
      <div 
        className="min-h-screen py-8 px-4 relative"
        style={{
          backgroundColor: '#0f0f0f',
          backgroundImage: hasBackgroundImage ? `url(${event.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <div className="max-w-md mx-auto relative z-10">
          <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-gray-800">
            <div className="text-center mb-6">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}30` }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <h1 className="text-2xl font-bold text-white">¡Registro Exitoso!</h1>
              <p className="text-gray-400 mt-1">Tu entrada para <strong className="text-white">{event.name}</strong></p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <div className="flex justify-center mb-4">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="QR de entrada" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 bg-gray-700 animate-pulse rounded-lg" />
                )}
              </div>
              <p className="text-center text-sm text-gray-400">Muestra este código QR en la entrada</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 text-white">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{guestName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 mt-2 text-sm">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span>Cédula: {cedula}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>{format(eventDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <Download className="w-5 h-5" />
                Descargar
              </button>
              <button
                onClick={shareQR}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <Share2 className="w-5 h-5" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div 
      className="min-h-screen py-8 px-4 relative"
      style={{
        backgroundColor: '#0f0f0f',
        backgroundImage: hasBackgroundImage ? `url(${event.imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="max-w-md mx-auto relative z-10">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-gray-800">
          <div className="text-center mb-6">
            {event.business.logoUrl && (
              <img 
                src={event.business.logoUrl} 
                alt={event.business.name}
                className="h-12 w-auto mx-auto mb-4 rounded-lg"
              />
            )}
            <h1 className="text-2xl font-bold text-white">{event.name}</h1>
            {event.description && <p className="text-gray-400 mt-2">{event.description}</p>}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-6 py-4 border-y border-gray-700">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{format(eventDate, "d MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{event.startTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-5 h-5" style={{ color: primaryColor }} />
              <span>{event.availableSpots} lugares</span>
            </div>
          </div>

          {event.isOpen ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'cedula' ? 'text-white' : 'bg-green-900/50 text-green-400'
                  }`}
                  style={{ backgroundColor: step === 'cedula' ? primaryColor : undefined }}
                >
                  {step === 'cedula' ? '1' : '✓'}
                </div>
                <div 
                  className="w-12 h-1 rounded"
                  style={{ backgroundColor: step === 'datos' ? primaryColor : '#374151' }}
                />
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === 'datos' ? 'text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                  style={{ backgroundColor: step === 'datos' ? primaryColor : undefined }}
                >
                  2
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              {step === 'cedula' && (
                <form onSubmit={handleCheckCedula} className="space-y-4">
                  <div>
                    <label htmlFor="cedula-input" className="block text-sm font-medium text-gray-300 mb-1">
                      Número de cédula *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="cedula-input"
                        type="text"
                        inputMode="numeric"
                        value={cedula}
                        onChange={(e) => handleCedulaChange(e.target.value)}
                        required
                        minLength={6}
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:border-transparent text-lg tracking-wider text-white placeholder-gray-500"
                        style={{ outlineColor: primaryColor }}
                        placeholder="0123456789"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ingresa tu cédula para registrarte</p>
                  </div>

                  <button
                    type="submit"
                    disabled={checkingCedula || cedula.length < 6}
                    className="w-full py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {checkingCedula ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 'datos' && (
                <form onSubmit={handleSubmitNewClient} className="space-y-4">
                  <div className="p-3 bg-blue-900/30 border border-blue-800 rounded-lg text-sm mb-4">
                    <p className="font-medium text-blue-300">¡Primera vez aquí!</p>
                    <p className="text-blue-400">Completa tus datos para registrarte</p>
                  </div>

                  <div>
                    <label htmlFor="cedula-display" className="block text-sm font-medium text-gray-300 mb-1">
                      Cédula
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="cedula-display"
                        type="text"
                        value={cedula}
                        disabled
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="nombre-input" className="block text-sm font-medium text-gray-300 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      id="nombre-input"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                      style={{ outlineColor: primaryColor }}
                      placeholder="Tu nombre completo"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="telefono-input" className="block text-sm font-medium text-gray-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      id="telefono-input"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                      style={{ outlineColor: primaryColor }}
                      placeholder="0999999999"
                    />
                  </div>

                  <div>
                    <label htmlFor="correo-input" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      id="correo-input"
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                      style={{ outlineColor: primaryColor }}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 px-4 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Cambiar cédula
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !nombre.trim()}
                      className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        '🎟️ Obtener entrada'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white mb-1">
                {event.status === 'ACTIVE' && event.availableSpots <= 0 ? 'Evento Lleno' : 'Registro Cerrado'}
              </h2>
              <p className="text-gray-400">
                {event.status === 'ACTIVE' && event.availableSpots <= 0 
                  ? 'Se ha alcanzado la capacidad máxima.'
                  : 'El registro para este evento no está disponible.'}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-700 text-center">
            <p className="text-sm text-gray-500">Organizado por <strong className="text-gray-300">{event.business.name}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
