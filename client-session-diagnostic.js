// 🔧 DIAGNÓSTICO Y FIX PARA clienteSession
// Script para resolver problemas de almacenamiento de sesión del cliente

console.log('🔍 === DIAGNÓSTICO CLIENTE SESSION ===');

// 1. Verificar disponibilidad de Storage APIs
function checkStorageAvailability() {
  console.log('\n📊 1. VERIFICANDO STORAGE APIS:');
  
  try {
    const localStorageAvailable = typeof(Storage) !== 'undefined' && 'localStorage' in window;
    const sessionStorageAvailable = typeof(Storage) !== 'undefined' && 'sessionStorage' in window;
    
    console.log('✅ localStorage disponible:', localStorageAvailable);
    console.log('✅ sessionStorage disponible:', sessionStorageAvailable);
    
    if (localStorageAvailable) {
      // Test write/read
      localStorage.setItem('test_storage', 'test_value');
      const testValue = localStorage.getItem('test_storage');
      localStorage.removeItem('test_storage');
      console.log('✅ localStorage funcional:', testValue === 'test_value');
    }
    
    return { localStorageAvailable, sessionStorageAvailable };
  } catch (error) {
    console.error('❌ Error verificando storage:', error);
    return { localStorageAvailable: false, sessionStorageAvailable: false };
  }
}

// 2. Verificar datos existentes de clienteSession
function checkExistingSession() {
  console.log('\n📊 2. VERIFICANDO DATOS EXISTENTES:');
  
  const prefix = 'lealta_mobile_';
  const keys = [
    `${prefix}clienteSession`,
    `${prefix}clienteSession_backup`,
    `${prefix}clienteSession_mobile`
  ];
  
  keys.forEach(key => {
    try {
      const localData = localStorage.getItem(key);
      const sessionData = sessionStorage.getItem(key);
      
      console.log(`🔍 ${key}:`);
      console.log(`  localStorage:`, localData ? 'EXISTE' : 'NO EXISTE');
      console.log(`  sessionStorage:`, sessionData ? 'EXISTE' : 'NO EXISTE');
      
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          console.log(`  📄 Contenido localStorage:`, parsed);
          
          // Verificar expiración
          if (parsed.expires && Date.now() > parsed.expires) {
            console.log(`  ⏰ DATOS EXPIRADOS (${new Date(parsed.expires)})`);
          } else {
            console.log(`  ✅ DATOS VÁLIDOS`);
          }
        } catch (parseError) {
          console.log(`  ❌ ERROR PARSING localStorage:`, parseError);
        }
      }
    } catch (error) {
      console.error(`❌ Error verificando ${key}:`, error);
    }
  });
}

// 3. Verificar configuración del navegador
function checkBrowserConfig() {
  console.log('\n📊 3. VERIFICANDO CONFIGURACIÓN DEL NAVEGADOR:');
  
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('🔒 Cookies habilitadas:', navigator.cookieEnabled);
  console.log('🌍 Idioma:', navigator.language);
  console.log('📱 Es móvil:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  
  // Verificar modo privado
  try {
    const isPrivateMode = !window.indexedDB;
    console.log('🔒 Modo privado detectado:', isPrivateMode);
  } catch (error) {
    console.log('🔒 No se pudo detectar modo privado');
  }
}

// 4. Crear sesión de prueba
function createTestSession() {
  console.log('\n📊 4. CREANDO SESIÓN DE PRUEBA:');
  
  try {
    const testSessionData = {
      data: {
        cedula: '12345678',
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
    };
    
    const prefix = 'lealta_mobile_';
    const key = `${prefix}clienteSession`;
    
    localStorage.setItem(key, JSON.stringify(testSessionData));
    console.log('✅ Sesión de prueba creada');
    
    // Verificar que se guardó
    const retrieved = localStorage.getItem(key);
    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      console.log('✅ Sesión de prueba verificada:', parsed);
      return true;
    } else {
      console.log('❌ No se pudo verificar la sesión de prueba');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creando sesión de prueba:', error);
    return false;
  }
}

// 5. Limpiar datos corruptos
function cleanCorruptedData() {
  console.log('\n📊 5. LIMPIANDO DATOS CORRUPTOS:');
  
  const prefix = 'lealta_mobile_';
  let cleanedCount = 0;
  
  // Verificar localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          JSON.parse(value); // Verificar que es JSON válido
        }
      } catch (error) {
        console.log(`🗑️ Removiendo datos corruptos: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  }
  
  // Verificar sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const value = sessionStorage.getItem(key);
        if (value) {
          JSON.parse(value); // Verificar que es JSON válido
        }
      } catch (error) {
        console.log(`🗑️ Removiendo datos corruptos: ${key}`);
        sessionStorage.removeItem(key);
        cleanedCount++;
      }
    }
  }
  
  console.log(`✅ ${cleanedCount} elementos corruptos removidos`);
}

// 6. Función principal de diagnóstico
function runDiagnostic() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  const storageAvailability = checkStorageAvailability();
  checkExistingSession();
  checkBrowserConfig();
  cleanCorruptedData();
  
  if (storageAvailability.localStorageAvailable) {
    const testSuccess = createTestSession();
    if (testSuccess) {
      console.log('\n✅ DIAGNÓSTICO COMPLETADO: Storage funcionando correctamente');
      console.log('💡 Recomendación: Recargar la página y intentar hacer login nuevamente');
    } else {
      console.log('\n❌ DIAGNÓSTICO COMPLETADO: Problemas con storage');
      console.log('💡 Recomendación: Verificar configuración del navegador o usar modo incógnito');
    }
  } else {
    console.log('\n❌ DIAGNÓSTICO COMPLETADO: Storage no disponible');
    console.log('💡 Recomendación: Verificar que JavaScript está habilitado y no está en modo muy restrictivo');
  }
}

// 7. Función para forzar login (emergency fix)
function emergencyLogin(cedula) {
  console.log('\n🚨 EMERGENCY LOGIN PARA:', cedula);
  
  try {
    const sessionData = {
      data: {
        cedula: cedula.trim(),
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
    };
    
    const prefix = 'lealta_mobile_';
    const mainKey = `${prefix}clienteSession`;
    const backupKey = `${prefix}clienteSession_backup`;
    
    // Guardar en múltiples ubicaciones
    localStorage.setItem(mainKey, JSON.stringify(sessionData));
    localStorage.setItem(backupKey, JSON.stringify(sessionData));
    sessionStorage.setItem(mainKey, JSON.stringify(sessionData));
    
    console.log('✅ Emergency login completado');
    console.log('💡 Recargar la página para ver los cambios');
    
    return true;
  } catch (error) {
    console.error('❌ Error en emergency login:', error);
    return false;
  }
}

// Ejecutar diagnóstico automáticamente
runDiagnostic();

// Exportar funciones para uso manual
window.clientSessionDiagnostic = {
  runDiagnostic,
  emergencyLogin,
  cleanCorruptedData,
  checkExistingSession
};
