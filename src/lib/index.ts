/**
 * Punto centralizado de exportación para todos los servicios y utilidades
 * Facilita las importaciones y mejora la organización del código
 */

// Importar servicios y utilidades
import logger from './logger';
import notificationService from './notificationService';
import dateUtils from './dateUtils';
import numberUtils from './numberUtils';
import storage from './storage';
import apiService from './apiService';
import formManagement from './formManagement';

// Exportar servicios individuales
export { default as logger } from './logger';
export { default as notificationService } from './notificationService';
export * from './notificationService';

// Exportar utilidades
export { default as dateUtils } from './dateUtils';
export * from './dateUtils';

export { default as numberUtils } from './numberUtils';
export * from './numberUtils';

export { default as storage } from './storage';
export * from './storage';

// Exportar servicios de API
export { default as apiService } from './apiService';
export type { HttpMethod, RequestOptions, ApiResponse } from './apiService';
export { get, post, put, del, patch } from './apiService';

// Exportar gestión de formularios
export { default as formManagement } from './formManagement';
export * from './formManagement';

// Exportar tipos comunes
export * from '@/types/common';

/**
 * Servicio centralizado que agrupa todas las utilidades
 * Proporciona un punto único de acceso para herramientas comunes
 */
const services = {
  logger,
  notification: notificationService,
  date: dateUtils,
  number: numberUtils,
  storage,
  api: apiService,
  form: formManagement
};

export default services;
