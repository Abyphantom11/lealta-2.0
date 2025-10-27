"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verQRMenu() {
    try {
        const qrId = 'cmgpsqrn30005eyt0kn243p1l';
        // Buscar el QR con todos sus datos
        const qr = await prisma.qRLink.findUnique({
            where: { id: qrId },
            include: {
                Business: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                QRClick: {
                    take: 10,
                    orderBy: { clickedAt: 'desc' },
                    select: {
                        id: true,
                        clickedAt: true,
                        ipAddress: true,
                        userAgent: true,
                        referer: true,
                        country: true,
                        city: true
                    }
                }
            }
        });
        if (qr) {
            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║           📱 DATOS COMPLETOS DEL QR DE MENÚ                  ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📋 INFORMACIÓN BÁSICA');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🆔 ID Completo:', qr.id);
            console.log('🔗 Short ID:', qr.shortId);
            console.log('📝 Nombre:', qr.name);
            console.log('📄 Descripción:', qr.description || '(Sin descripción)');
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🏢 NEGOCIO ASOCIADO');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🏪 Business ID:', qr.businessId || '(Sin business)');
            console.log('🏢 Nombre del Negocio:', qr.Business?.name || '(Sin nombre)');
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔗 URLs Y REDIRECCIÓN');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 Target URL (Destino):', qr.targetUrl);
            console.log('🔄 Backup URL:', qr.backupUrl || '(Sin backup)');
            console.log('🌐 URL Corta Sugerida:', `https://tu-dominio.com/qr/${qr.shortId}`);
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 ESTADO Y CONFIGURACIÓN');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ Estado:', qr.isActive ? '🟢 ACTIVO' : '🔴 INACTIVO');
            console.log('⏰ Fecha de Expiración:', qr.expiresAt ? qr.expiresAt.toISOString() : '♾️  Sin expiración (permanente)');
            console.log('👁️  Total de Clicks:', qr.clickCount);
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📅 FECHAS');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📅 Creado:', qr.createdAt.toISOString());
            console.log('🔄 Última Actualización:', qr.updatedAt.toISOString());
            if (qr.QRClick && qr.QRClick.length > 0) {
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`📊 ÚLTIMOS ${qr.QRClick.length} CLICKS (${qr.clickCount} total)`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                for (const [i, click] of qr.QRClick.entries()) {
                    console.log(`\n${i + 1}. Click ID: ${click.id}`);
                    console.log(`   📅 Fecha: ${click.clickedAt.toISOString()}`);
                    console.log(`   🌍 IP: ${click.ipAddress || 'Desconocida'}`);
                    console.log(`   🌐 País: ${click.country || 'Desconocido'}`);
                    console.log(`   🏙️  Ciudad: ${click.city || 'Desconocida'}`);
                    console.log(`   🔗 Referer: ${click.referer || 'Directo'}`);
                    console.log(`   💻 User Agent: ${click.userAgent ? click.userAgent.substring(0, 60) + '...' : 'Desconocido'}`);
                }
            }
            else {
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📊 CLICKS');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('⚠️  No hay clicks registrados aún');
            }
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔍 ANÁLISIS');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const ahora = new Date();
            const diasDesdeCreacion = Math.floor((ahora.getTime() - qr.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`📆 Días desde creación: ${diasDesdeCreacion} días`);
            if (qr.expiresAt) {
                const diasParaExpirar = Math.floor((qr.expiresAt.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
                if (diasParaExpirar > 0) {
                    console.log(`⏳ Expira en: ${diasParaExpirar} días`);
                }
                else {
                    console.log(`⚠️  EXPIRADO hace: ${Math.abs(diasParaExpirar)} días`);
                }
            }
            if (diasDesdeCreacion > 0) {
                const clicksPorDia = (qr.clickCount / diasDesdeCreacion).toFixed(2);
                console.log(`📈 Promedio: ${clicksPorDia} clicks/día`);
            }
            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                    🎯 FIN DEL REPORTE                        ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        }
        else {
            console.log('❌ QR no encontrado');
        }
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
verQRMenu();
