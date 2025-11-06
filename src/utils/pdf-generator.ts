import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Interfaz para los datos del reporte
 */
interface ReportData {
  periodo: {
    mes: number;
    año: number;
    mesNombre: string;
  };
  metricas: {
    generales: {
      totalReservas: number;
      totalPersonasEsperadas: number;
      totalAsistentesReales: number;
      porcentajeCumplimiento?: number; // Opcional, se calcula si no viene
      // ✅ NUEVAS MÉTRICAS SIN RESERVA
      totalRegistrosSinReserva?: number;
      totalPersonasSinReserva?: number;
      promedioPersonasSinReservaPorDia?: number;
      diasConSinReserva?: number;
      // ✅ MÉTRICAS COMBINADAS
      totalPersonasAtendidas?: number; // Asistentes reales + Sin reserva
      totalEventosAtendidos?: number; // Total reservas + Total registros sin reserva
    };
    porAsistencia: {
      completadas: number;
      sobreaforo: number;
      caidas: number;
      parciales: number;
      canceladas: number;
    };
    porPago: {
      conComprobante: number;
      sinComprobante: number;
      porcentajeConComprobante: number;
    };
    porEstado: {
      pending: number;
      confirmed: number;
      checkedIn: number;
      completed: number;
      cancelled: number;
    };
    porPromotor?: Array<{
      id: string;
      nombre: string;
      totalReservas: number;
      personasEsperadas: number;
      personasAsistieron: number;
      reservasCompletadas: number;
      reservasParciales: number;
      reservasCaidas: number;
      reservasSobreaforo: number;
      reservasCanceladas: number;
      porcentajeCumplimiento: number;
    }>;
    // ✅ NUEVA SECCIÓN: SIN RESERVA
    sinReserva?: {
      totalRegistros: number;
      totalPersonas: number;
      promedioDiario: number;
      diasConRegistros: number;
      registrosPorDia: Array<{ fecha: string; registros: number; personas: number }>;
    };
  };
  rankings: {
    top5Dias: Array<{ fecha: string; cantidad: number }>;
    top5Clientes: Array<{ id: string; nombre: string; cantidad: number }>;
    top5Horarios: Array<{ horario: string; cantidad: number }>;
    top5Promotores?: Array<{ id: string; nombre: string; cantidad: number; cumplimiento: number }>;
    // ✅ NUEVOS RANKINGS SIN RESERVA
    top5DiasSinReserva?: Array<{ fecha: string; personas: number; registros: number }>;
  };
  detalleReservas: Array<{
    id: string;
    fecha: string;
    hora: string;
    cliente: string;
    email: string;
    mesa: string;
    esperadas: number;
    asistentes: number;
    estado: string;
    comprobante: string;
    promotor?: string;
  }>;
  // ✅ NUEVA SECCIÓN: DETALLE SIN RESERVA
  detalleSinReservas?: Array<{
    id: string;
    fecha: string;
    hora: string;
    personas: number;
    notas: string;
    registradoPor: string;
  }>;
}

interface BusinessInfo {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

/**
 * Genera un PDF profesional con el reporte de reservas mensual
 */
export function generateReservationReport(
  data: ReportData,
  businessInfo: BusinessInfo
): jsPDF {
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [41, 128, 185]; // Azul
  const successColor: [number, number, number] = [46, 204, 113]; // Verde
  const grayColor: [number, number, number] = [127, 140, 141]; // Gris

  let yPosition = 20;

  // ==========================================
  // PÁGINA 1: PORTADA Y MÉTRICAS GENERALES
  // ==========================================

  // Header - Logo/Nombre del negocio
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(businessInfo.nombre, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Mensual de Reservas', 105, 30, { align: 'center' });

  yPosition = 50;

  // Información del período
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Período: ${data.periodo.mesNombre} ${data.periodo.año}`, 20, yPosition);
  
  yPosition += 3;
  doc.setDrawColor(...grayColor);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // ==========================================
  // SECCIÓN 1: MÉTRICAS GENERALES
  // ==========================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Metricas Generales', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Calcular porcentaje de cumplimiento si no viene en los datos
  const porcentajeCumplimiento = data.metricas.generales.porcentajeCumplimiento ?? 
    (data.metricas.generales.totalPersonasEsperadas > 0 
      ? (data.metricas.generales.totalAsistentesReales / data.metricas.generales.totalPersonasEsperadas) * 100
      : 0);

  const metricasGenerales = [
    ['Total de Reservas', data.metricas.generales.totalReservas.toString()],
    ['Personas Esperadas', data.metricas.generales.totalPersonasEsperadas.toString()],
    ['Asistentes Reales', data.metricas.generales.totalAsistentesReales.toString()],
    ['Cumplimiento', `${porcentajeCumplimiento.toFixed(1)}%`],
  ];

  // ✅ Agregar métricas de sin reserva si están disponibles
  if (data.metricas.sinReserva) {
    metricasGenerales.push(
      ['--- Sin Reserva (Walk-ins) ---', '---'],
      ['Total Registros Sin Reserva', data.metricas.sinReserva.totalRegistros.toString()],
      ['Total Personas Sin Reserva', data.metricas.sinReserva.totalPersonas.toString()],
      ['Promedio Diario Sin Reserva', data.metricas.sinReserva.promedioDiario.toFixed(1)],
      ['Días con Registros', data.metricas.sinReserva.diasConRegistros.toString()],
      ['--- Totales Combinados ---', '---'],
      ['Total Personas Atendidas', (data.metricas.generales.totalPersonasAtendidas || 
        (data.metricas.generales.totalAsistentesReales + data.metricas.sinReserva.totalPersonas)).toString()],
    );
  }

  autoTable(doc, {
    startY: yPosition,
    head: [['Métrica', 'Valor']],
    body: metricasGenerales,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, fontSize: 11, fontStyle: 'bold' },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: function(data) {
      // ✅ Destacar las secciones separadoras
      if (data.cell.text[0]?.includes('---')) {
        data.cell.styles.fillColor = [240, 240, 240];
        data.cell.styles.fontStyle = 'italic';
        data.cell.styles.textColor = [100, 100, 100];
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ==========================================
  // SECCIÓN 2: ANÁLISIS POR ASISTENCIA
  // ==========================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisis por Asistencia', 20, yPosition);
  yPosition += 8;

  const asistenciaData = [
    ['Completadas (100%)', data.metricas.porAsistencia.completadas.toString()],
    ['Sobreaforo (>100%)', data.metricas.porAsistencia.sobreaforo.toString()],
    ['Parciales (<100%)', data.metricas.porAsistencia.parciales.toString()],
    ['Caidas (No asistieron)', data.metricas.porAsistencia.caidas.toString()],
    ['Canceladas (Con aviso)', data.metricas.porAsistencia.canceladas.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: asistenciaData,
    theme: 'striped',
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ==========================================
  // SECCIÓN 3: ANÁLISIS DE PAGOS
  // ==========================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisis de Pagos', 20, yPosition);
  yPosition += 8;

  const pagosData = [
    ['Con Comprobante', data.metricas.porPago.conComprobante.toString()],
    ['Sin Comprobante', data.metricas.porPago.sinComprobante.toString()],
    ['Porcentaje con Comprobante', `${data.metricas.porPago.porcentajeConComprobante.toFixed(1)}%`],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: pagosData,
    theme: 'striped',
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ==========================================
  // SECCIÓN 4: ANÁLISIS POR ESTADO
  // ==========================================
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisis por Estado', 20, yPosition);
  yPosition += 8;

  const estadosData = [
    ['Pendientes', data.metricas.porEstado.pending.toString()],
    ['Confirmadas', data.metricas.porEstado.confirmed.toString()],
    ['Checked-In', data.metricas.porEstado.checkedIn.toString()],
    ['Completadas', data.metricas.porEstado.completed.toString()],
    ['Canceladas', data.metricas.porEstado.cancelled.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: estadosData,
    theme: 'striped',
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'center', fontStyle: 'bold' },
    },
  });

  // ==========================================
  // PÁGINA 2: RANKINGS
  // ==========================================
  doc.addPage();
  yPosition = 20;

  // Header secundario
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Rankings y Estadisticas', 105, 15, { align: 'center' });

  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // TOP 5 DÍAS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 5 Dias con Mas Reservas', 20, yPosition);
  yPosition += 8;

  const top5DiasData = data.rankings.top5Dias.map((d) => [
    d.fecha,
    d.cantidad.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Fecha', 'Reservas']],
    body: top5DiasData.length > 0 ? top5DiasData : [['Sin datos', '-']],
    theme: 'grid',
    headStyles: { fillColor: successColor },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // TOP 5 CLIENTES
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 5 Clientes con Mas Reservas', 20, yPosition);
  yPosition += 8;

  const top5ClientesData = data.rankings.top5Clientes.map((c) => [
    c.nombre,
    c.cantidad.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Cliente', 'Reservas']],
    body: top5ClientesData.length > 0 ? top5ClientesData : [['Sin datos', '-']],
    theme: 'grid',
    headStyles: { fillColor: successColor },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // TOP 5 HORARIOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 5 Horarios Mas Populares', 20, yPosition);
  yPosition += 8;

  const top5HorariosData = data.rankings.top5Horarios.map((h) => [
    h.horario,
    h.cantidad.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Horario', 'Reservas']],
    body: top5HorariosData.length > 0 ? top5HorariosData : [['Sin datos', '-']],
    theme: 'grid',
    headStyles: { fillColor: successColor },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // � NUEVO: TOP 5 DÍAS SIN RESERVA
  // ==========================================
  if (data.rankings.top5DiasSinReserva && data.rankings.top5DiasSinReserva.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Dias con Mas Clientes Sin Reserva', 20, yPosition);
    yPosition += 8;

    const top5DiasSinReservaData = data.rankings.top5DiasSinReserva.map((d) => [
      d.fecha,
      d.registros.toString(),
      d.personas.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Registros', 'Personas']],
      body: top5DiasSinReservaData,
      theme: 'grid',
      headStyles: { fillColor: [26, 188, 156] }, // Color turquesa para sin reserva
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ==========================================
  // �🎯 NUEVO: TOP 5 PROMOTORES
  // ==========================================
  if (data.rankings.top5Promotores && data.rankings.top5Promotores.length > 0) {
    // Verificar si necesitamos nueva página
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Analisis de Promotores', 105, 15, { align: 'center' });
      
      yPosition = 35;
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Promotores (Mayor Asistencia)', 20, yPosition);
    yPosition += 8;

    const top5PromotoresData = data.rankings.top5Promotores.map((p) => [
      p.nombre,
      p.cantidad.toString(),
      `${p.cumplimiento.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Promotor', 'Reservas', 'Cumplimiento']],
      body: top5PromotoresData,
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18] }, // Color naranja para promotores
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 45, halign: 'center', fontStyle: 'bold' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ==========================================
  // 👥 NUEVO: ANÁLISIS DETALLADO POR PROMOTOR
  // ==========================================
  if (data.metricas.porPromotor && data.metricas.porPromotor.length > 0) {
    // Verificar si necesitamos nueva página
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
      
      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Analisis de Promotores', 105, 15, { align: 'center' });
      
      yPosition = 35;
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Analisis Completo por Promotor', 20, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text('(Esperados vs Asistieron)', 20, yPosition);
    yPosition += 5;
    doc.setTextColor(0, 0, 0);

    // Ordenar por asistentes (mayor a menor)
    const promotoresOrdenados = [...data.metricas.porPromotor].sort(
      (a, b) => b.personasAsistieron - a.personasAsistieron
    );

    const promotoresData = promotoresOrdenados.map((p) => [
      p.nombre,
      p.totalReservas.toString(),
      p.personasEsperadas.toString(),
      p.personasAsistieron.toString(),
      `${p.porcentajeCumplimiento.toFixed(1)}%`,
      p.reservasCaidas.toString(),
      p.reservasCanceladas.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Promotor', 'Reservas', 'Esperados', 'Asistieron', 'Cumpl.', 'Caídas', 'Cancel.']],
      body: promotoresData,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182], fontSize: 8 }, // Color morado
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ==========================================
  // PÁGINA 3: TABLA DETALLADA
  // ==========================================
  doc.addPage();
  yPosition = 20;

  // Header terciario
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Reservas', 105, 15, { align: 'center' });

  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // Tabla completa de reservas (con promotor si está disponible)
  const tienePromotores = data.detalleReservas.some(r => r.promotor);
  
  let detalleData: any[];
  let headers: string[];
  let columnStyles: any;

  if (tienePromotores) {
    // Ordenar alfabéticamente por promotor
    const reservasOrdenadas = [...data.detalleReservas].sort((a, b) => {
      const promotorA = (a.promotor || 'Sin asignar').toLowerCase();
      const promotorB = (b.promotor || 'Sin asignar').toLowerCase();
      return promotorA.localeCompare(promotorB);
    });

    // Versión con promotor
    detalleData = reservasOrdenadas.map((r) => [
      r.fecha,
      r.hora,
      r.cliente,
      r.promotor || 'Sin asignar',
      r.esperadas.toString(),
      r.asistentes.toString(),
    ]);
    
    headers = ['Fecha', 'Hora', 'Cliente', 'Promotor', 'Esp.', 'Asist.'];
    
    columnStyles = {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 50 },
      3: { cellWidth: 45 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    };
  } else {
    // Versión original sin promotor
    detalleData = data.detalleReservas.map((r) => [
      r.fecha,
      r.hora,
      r.cliente,
      r.mesa || '-',
      r.esperadas.toString(),
      r.asistentes.toString(),
      r.comprobante,
    ]);
    
    headers = ['Fecha', 'Hora', 'Cliente', 'Mesa', 'Esp.', 'Asist.', 'Pago'];
    
    columnStyles = {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
    };
  }

  autoTable(doc, {
    startY: yPosition,
    head: [headers],
    body: detalleData.length > 0 ? detalleData : [['Sin reservas en este período', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 10, right: 10 },
    columnStyles: columnStyles,
    didDrawPage: () => {
      // Footer en cada página
      const pageCount = doc.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `Página ${currentPage} de ${pageCount} | Generado: ${new Date().toLocaleString('es-ES')}`,
        105,
        285,
        { align: 'center' }
      );
      
      // Línea de separación del footer
      doc.setDrawColor(...grayColor);
      doc.setLineWidth(0.3);
      doc.line(20, 280, 190, 280);
    },
  });

  // Footer para la última página si no se dibujó
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
  
  // ==========================================
  // 🆕 NUEVA PÁGINA: DETALLE SIN RESERVA
  // ==========================================
  if (data.detalleSinReservas && data.detalleSinReservas.length > 0) {
    doc.addPage();
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Clientes Sin Reserva', 105, 15, { align: 'center' });

    yPosition = 35;
    doc.setTextColor(0, 0, 0);

    // Tabla de registros sin reserva
    const sinReservaData = data.detalleSinReservas.map((r) => [
      r.fecha,
      r.hora,
      r.personas.toString(),
      r.notas || 'Sin notas',
      r.registradoPor || 'Sistema',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Hora', 'Personas', 'Notas', 'Registrado Por']],
      body: sinReservaData,
      theme: 'striped',
      headStyles: { fillColor: [26, 188, 156], fontSize: 10 }, // Color turquesa
      bodyStyles: { fontSize: 9 },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 70 },
        4: { cellWidth: 30 },
      },
      didDrawPage: () => {
        // Footer en cada página
        const pageCount = doc.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
          `Página ${currentPage} de ${pageCount} | Generado: ${new Date().toLocaleString('es-ES')}`,
          105,
          285,
          { align: 'center' }
        );
        
        // Línea de separación del footer
        doc.setDrawColor(...grayColor);
        doc.setLineWidth(0.3);
        doc.line(20, 280, 190, 280);
      },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Generado por Lealta 2.0 | ${businessInfo.nombre}`,
    105,
    290,
    { align: 'center' }
  );

  return doc;
}

/**
 * Descarga el PDF generado
 */
export function downloadReportPDF(
  data: ReportData,
  businessInfo: BusinessInfo,
  filename?: string
): void {
  const doc = generateReservationReport(data, businessInfo);
  const defaultFilename = `reporte-reservas-${data.periodo.mesNombre}-${data.periodo.año}.pdf`;
  doc.save(filename || defaultFilename);
}
