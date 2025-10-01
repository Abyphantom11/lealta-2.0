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
      porcentajeCumplimiento: number;
      promedioPersonasPorReserva: number;
    };
    porAsistencia: {
      completadas: number;
      sobreaforo: number;
      caidas: number;
      parciales: number;
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
      noShow: number;
    };
  };
  rankings: {
    top5Dias: Array<{ fecha: string; cantidad: number }>;
    top5Clientes: Array<{ id: string; nombre: string; cantidad: number }>;
    top5Horarios: Array<{ horario: string; cantidad: number }>;
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

  const metricasGenerales = [
    ['Total de Reservas', data.metricas.generales.totalReservas.toString()],
    ['Personas Esperadas', data.metricas.generales.totalPersonasEsperadas.toString()],
    ['Asistentes Reales', data.metricas.generales.totalAsistentesReales.toString()],
    ['Cumplimiento', `${data.metricas.generales.porcentajeCumplimiento.toFixed(1)}%`],
    ['Promedio por Reserva', `${data.metricas.generales.promedioPersonasPorReserva.toFixed(1)} personas`],
  ];

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
    ['Caídas (0%)', data.metricas.porAsistencia.caidas.toString()],
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
    ['No Show', data.metricas.porEstado.noShow.toString()],
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

  // Tabla completa de reservas
  const detalleData = data.detalleReservas.map((r) => [
    r.fecha,
    r.hora,
    r.cliente,
    r.mesa || '-',
    r.esperadas.toString(),
    r.asistentes.toString(),
    r.comprobante,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Fecha', 'Hora', 'Cliente', 'Mesa', 'Esp.', 'Asist.', 'Pago']],
    body: detalleData.length > 0 ? detalleData : [['Sin reservas en este período', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 10, right: 10 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 15, halign: 'center' },
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

  // Footer para la última página si no se dibujó
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
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
