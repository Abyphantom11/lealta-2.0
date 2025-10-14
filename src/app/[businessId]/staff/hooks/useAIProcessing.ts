// Custom hook for AI processing logic

import { useCallback } from 'react';
import { ConsumoService } from '../services/consumoService';
import { AIService } from '../services/aiService';
import { AnalysisProduct, EditableProduct } from '../types/ai.types';

export const useAIProcessing = (
  user: any,
  puntosPorDolar: number,
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
) => {

  const processFormSubmission = useCallback(async (
    selectedFiles: File[],
    selectedFile: File | null,
    cedula: string,
    setIsProcessing: (processing: boolean) => void,
    setAiResult: (result: any) => void,
    setEditableData: (data: any) => void,
    setShowConfirmation: (show: boolean) => void
  ) => {
    if ((!selectedFile && selectedFiles.length === 0) || !cedula) {
      showNotification('error', 'Por favor complete todos los campos requeridos');
      return;
    }

    if (cedula.length < 6) {
      showNotification('error', 'La cédula debe tener al menos 6 dígitos');
      return;
    }

    setIsProcessing(true);
    
    // Determinar si usar múltiples imágenes o una sola
    const isMultipleImages = selectedFiles.length > 1;
    
    if (isMultipleImages) {
      showNotification('info', `📱 Subiendo ${selectedFiles.length} imágenes y procesando con IA...`);
    } else {
      showNotification('info', '📱 Subiendo imagen y procesando con IA...');
    }

    try {
      const formData = new FormData();
      
      if (isMultipleImages) {
        // Para múltiples imágenes, usar analyze-multi
        selectedFiles.forEach((file) => {
          formData.append(`images`, file);
        });
        formData.append('cedula', cedula);
        formData.append('businessId', user?.businessId || '');
        formData.append('empleadoId', user?.id || '');
      } else {
        // Para una sola imagen, usar analyze normal
        const fileToUpload = selectedFile || selectedFiles[0];
        if (fileToUpload) {
          formData.append('image', fileToUpload);
          formData.append('cedula', cedula);
          formData.append('businessId', user?.businessId || '');
          formData.append('empleadoId', user?.id || '');
        }
      }

      const data = await ConsumoService.processImageTicket(formData, isMultipleImages);

      console.log('🔎 Respuesta del servidor:', data);
      console.log('🔎 data.requiresConfirmation:', data.requiresConfirmation);

      if (data.requiresConfirmation) {
        console.log('✅ Mostrando cuadro de confirmación...');
        
        if (isMultipleImages && data.isBatchProcess) {
          // Procesamiento de múltiples imágenes - consolidar datos inteligentemente
          const batch = data.data.batch;
          const summary = batch.summary;
          const successfulResults = batch.results.filter((r: any) => r.status === 'completed' && r.analysis);
          
          console.log('🔎 Analizando múltiples imágenes...');
          console.log('Resultados exitosos:', successfulResults.length);
          
          // Detectar si todas las imágenes son de la misma cuenta
          const isSameReceipt = AIService.detectSameReceipt(successfulResults);
          
          // Consolidar productos de forma inteligente evitando duplicados
          const productMap = new Map<string, AnalysisProduct>();
          const allEmployees: string[] = [];
          let consolidatedTotal = 0;
          
          successfulResults.forEach((result: any, index: number) => {
            if (result.analysis) {
              console.log(`📋 Procesando imagen ${index + 1}:`, result.analysis.productos.length, 'productos');
              
              // Filtrar y procesar productos de esta imagen
              const validProducts = result.analysis.productos.filter((p: AnalysisProduct) => !AIService.shouldFilterProduct(p));
              console.log(`✅ Productos válidos en imagen ${index + 1}:`, validProducts.length, 'de', result.analysis.productos.length);
              
              validProducts.forEach((producto: AnalysisProduct) => {
                const normalizedName = producto.nombre.toLowerCase().trim();
                
                // Detectar nombres cortados o parciales y corregirlos o filtrarlos
                const correctedName = AIService.correctPartialProductName(normalizedName);
                
                // Si correctPartialProductName retorna null, significa que el producto debe filtrarse
                if (correctedName === null && normalizedName !== producto.nombre.toLowerCase().trim()) {
                  console.log(`🚫 Producto filtrado por nombre poco confiable: "${producto.nombre}"`);
                  return; // Saltar este producto
                }
                
                // Detectar el formato de mayúsculas del POS basándose en el producto original
                const isUpperCase = producto.nombre === producto.nombre.toUpperCase();
                const finalName = correctedName || producto.nombre;
                
                // Aplicar formato consistente basado en el estilo detectado
                const formattedName = isUpperCase ? finalName.toUpperCase() : finalName;
                const finalKey = finalName.toLowerCase().trim();
                
                console.log(`🔎 Procesando: "${producto.nombre}" → "${formattedName}" (formato: ${isUpperCase ? 'MAYÚSCULAS' : 'minúsculas'})`);
                
                // Lógica inteligente para manejar duplicados
                if (productMap.has(finalKey)) {
                  const existing = productMap.get(finalKey)!;
                  console.log(`🔄 Producto duplicado encontrado: ${formattedName} (existente: x${existing.cantidad}, nuevo: x${producto.cantidad})`);
                  
                  // Si las cantidades son diferentes, tomar el mayor (más confiable)
                  if (producto.cantidad !== existing.cantidad) {
                    if (producto.cantidad > existing.cantidad) {
                      console.log(`📊 Actualizando cantidad: x${existing.cantidad} → x${producto.cantidad}`);
                      productMap.set(finalKey, {
                        ...producto,
                        nombre: formattedName
                      });
                    }
                  } else if (isUpperCase && !existing.nombre.includes(existing.nombre.toUpperCase())) {
                    // Si tienen la misma cantidad, mantener el formato más consistente
                    // Preferir MAYÚSCULAS si el sistema POS las usa
                    productMap.set(finalKey, {
                      ...producto,
                      nombre: formattedName
                    });
                  }
                } else {
                  // Producto nuevo, agregarlo
                  console.log(`✨ Nuevo producto agregado: ${formattedName} x${producto.cantidad}`);
                  productMap.set(finalKey, {
                    ...producto,
                    nombre: formattedName
                  });
                }
              });
              
              // Agregar empleado si fue detectado
              if (result.analysis.empleadoDetectado) {
                allEmployees.push(result.analysis.empleadoDetectado);
              }
              
              // Solo sumar el total de la primera imagen si es la misma cuenta
              if (!isSameReceipt || index === 0) {
                consolidatedTotal += result.analysis.total || 0;
              }
            }
          });
          
          // Convertir el Map a array
          const consolidatedProducts = Array.from(productMap.values());
          
          // Usar el total detectado correctamente
          const finalTotal = isSameReceipt ? 
            (successfulResults[0]?.analysis?.total || summary.totalAmount) : 
            consolidatedTotal;
          
          // Log de depuración para ver la consolidación
          console.log('🔎 Consolidación de productos:');
          console.log(`📊 Imágenes procesadas: ${successfulResults.length}`);
          console.log(`📋 Productos únicos consolidados: ${consolidatedProducts.length}`);
          console.log(`💰 Total final: $${finalTotal} (misma cuenta: ${isSameReceipt})`);
          consolidatedProducts.forEach(p => {
            console.log(`  • ${p.nombre} x${p.cantidad} - $${p.precio.toFixed(2)}`);
          });
          
          // Obtener empleados únicos
          const uniqueEmployees = [...new Set(allEmployees.filter(Boolean))];
          const primaryEmployee = uniqueEmployees.length > 0 ? uniqueEmployees.join(', ') : 'No detectado';
          
          // Crear datos consolidados para el popup
          const consolidatedData = {
            cliente: data.data.cliente,
            analisis: {
              empleadoDetectado: primaryEmployee,
              productos: consolidatedProducts,
              total: finalTotal,
              confianza: Math.round(summary.averageConfidence * 100),
            },
            metadata: {
              ...data.data.metadata,
              imagenUrl: `/uploads/multi/batch_${batch.batchId}`, // URL representativa
              isBatchProcess: true,
              totalImages: batch.totalImages,
              successfulImages: batch.successfulImages,
              sameReceipt: isSameReceipt,
            }
          };
          
          setAiResult(consolidatedData);
          setEditableData({
            empleado: primaryEmployee,
            productos: consolidatedProducts.map((p: AnalysisProduct) => ({
              name: p.nombre,
              price: p.precio,
              line: `${p.nombre} x${p.cantidad} - $${p.precio.toFixed(2)}`,
            })),
            total: finalTotal,
          });
          
          const receiptMsg = isSameReceipt ? 
            ` (misma cuenta detectada - total único: $${finalTotal.toFixed(2)})` : 
            ` (múltiples cuentas - total combinado: $${finalTotal.toFixed(2)})`;
          
          showNotification(
            'success',
            `🤖 IA procesó ${batch.successfulImages}/${batch.totalImages} imágenes. ${consolidatedProducts.length} productos únicos detectados${receiptMsg}`
          );
        } else {
          // Procesamiento de imagen única (lógica original)
          setAiResult(data.data);
          setEditableData({
            empleado: data.data.analisis.empleadoDetectado || 'No detectado',
            productos: data.data.analisis.productos.map((p: AnalysisProduct) => ({
              name: p.nombre,
              price: p.precio,
              line: `${p.nombre} x${p.cantidad} - $${p.precio.toFixed(2)}`,
            })),
            total: data.data.analisis.total,
          });
          
          showNotification(
            'success',
            `🤖 IA procesó el ticket con ${data.data.analisis.confianza}% de confianza. Revisa y confirma los datos.`
          );
        }
        
        setShowConfirmation(true);
        console.log('🔎 showConfirmation establecido a true');
      } else {
        console.log('❌ No se cumplió la condición para mostrar confirmación');
        showNotification('error', `Error al procesar: ${data.error || 'Respuesta inesperada'}`);
      }
    } catch (error: any) {
      console.error('Error de conexión:', error);
      if (error.name === 'AbortError') {
        showNotification('error', '⏰ El procesamiento tomó demasiado tiempo. Intenta de nuevo.');
      } else {
        showNotification('error', 'Error de conexión: No se pudo procesar la solicitud');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [user, showNotification]);

  const confirmarDatosIA = useCallback(async (
    editableData: any,
    aiResult: any,
    setIsProcessing: (processing: boolean) => void,
    setTodayStats: (stats: any) => void,
    setRecentTickets: (tickets: any) => void,
    resetFormularioOCR: () => void
  ) => {
    if (!editableData || !aiResult) return;

    setIsProcessing(true);
    try {
      // Enviar datos confirmados al endpoint de confirmación
      const confirmationData = {
        clienteId: aiResult.cliente.id,
        businessId: aiResult.metadata.businessId,
        empleadoId: aiResult.metadata.empleadoId,
        productos: editableData.productos.map((p: EditableProduct) => ({
          nombre: p.name,
          cantidad: 1, // Por ahora asumimos cantidad 1
          precio: p.price,
          categoria: 'otro', // Categoría por defecto
        })),
        total: editableData.total,
        puntos: Math.floor(editableData.total * puntosPorDolar), // Puntos dinámicos basados en configuración
        empleadoDetectado: editableData.empleado,
        confianza: aiResult.analisis.confianza / 100, // Convertir a decimal
        imagenUrl: aiResult.metadata.imagenUrl,
        metodoPago: 'efectivo',
        notas: `Confirmado por staff - Confianza IA: ${aiResult.analisis.confianza}%`,
      };

      const data = await ConsumoService.confirmAIData(confirmationData);

      showNotification('success', '✅ Consumo confirmado y registrado exitosamente');

      // Actualizar estadísticas del día
      setTodayStats((prev: any) => ({
        ...prev,
        ticketsProcessed: prev.ticketsProcessed + 1,
        totalPoints: prev.totalPoints + data.data.puntosGenerados,
        totalAmount: prev.totalAmount + data.data.totalRegistrado,
      }));

      // Agregar a tickets recientes
      const newTicket = {
        id: data.data.consumoId?.toString() || Date.now().toString(),
        cedula: data.data.clienteCedula || '',
        cliente: data.data.clienteNombre || '',
        productos: editableData.productos?.map((p: EditableProduct) => p.name) || [],
        total: data.data.totalRegistrado,
        puntos: data.data.puntosGenerados,
        fecha: new Date().toISOString().split('T')[0],
        monto: data.data.totalRegistrado,
        items: editableData.productos?.map((p: EditableProduct) => p.name) || [],
        hora: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        tipo: 'IA',
      };

      setRecentTickets((prev: any) => [newTicket, ...prev.slice(0, 4)]);

      // Limpiar formulario después de confirmación exitosa
      resetFormularioOCR();
    } catch (error: any) {
      console.error('Error confirmando datos:', error);
      showNotification('error', `Error al confirmar: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [puntosPorDolar, showNotification]);

  const cancelarConfirmacion = useCallback((
    setShowConfirmation: (show: boolean) => void,
    setAiResult: (result: any) => void,
    setEditableData: (data: any) => void,
    setIsProcessing: (processing: boolean) => void
  ) => {
    setShowConfirmation(false);
    setAiResult(null);
    setEditableData(null);
    setIsProcessing(false);
    showNotification('info', 'Confirmación cancelada. Puedes capturar otra imagen.');
  }, [showNotification]);

  return {
    processFormSubmission,
    confirmarDatosIA,
    cancelarConfirmacion,
  };
};
