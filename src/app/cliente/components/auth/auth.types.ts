export interface AuthProps {
  step: 'presentation' | 'cedula' | 'register' | 'dashboard';
  setStep: (step: 'presentation' | 'cedula' | 'register' | 'dashboard') => void;
  cedula: string;
  setCedula: (cedula: string) => void;
  formData: {
    nombre: string;
    telefono: string;
    correo: string;
  };
  setFormData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  clienteData: any;
  setClienteData: (data: any) => void;
  setOldLevel?: (level: string) => void;
  setNewLevel?: (level: string) => void;
  setShowLevelUpAnimation?: (show: boolean) => void;
  onLevelUpDetected?: (oldLevel: string, newLevel: string) => void;
}

// Interfaces específicas para cada componente
export interface PresentationViewProps {
  setStep: (step: 'presentation' | 'cedula' | 'register' | 'dashboard') => void;
}

export interface CedulaFormProps {
  setStep: (step: 'presentation' | 'cedula' | 'register' | 'dashboard') => void;
  cedula: string;
  setCedula: (cedula: string) => void;
  setClienteData: (data: any) => void;
}

export interface RegisterFormProps {
  setStep: (step: 'presentation' | 'cedula' | 'register' | 'dashboard') => void;
  cedula: string;
  formData: {
    nombre: string;
    telefono: string;
    email: string;
  };
  setFormData: (data: any) => void;
  setClienteData: (data: any) => void;
}
