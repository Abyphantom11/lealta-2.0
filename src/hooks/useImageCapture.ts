// Mock hook para testing
export function useImageCapture() {
  return {
    capturedImage: null,
    captureImage: () => {},
    isCapturing: false,
    error: null
  };
}
