// Archivo para forzar actualización del cache
export const SCANNER_VERSION = "simple-v1.0.0";
export const UPDATED_DATE = "2025-01-18";

// Este archivo ayuda a identificar qué versión del scanner se está usando
export const getScannerInfo = () => ({
  version: SCANNER_VERSION,
  type: "QRScannerSimple",
  features: [
    "Single camera request",
    "No audio access",
    "Optimized performance", 
    "Hydration safe",
    "Real QR detection",
    "Clean architecture"
  ],
  updated: UPDATED_DATE
});
