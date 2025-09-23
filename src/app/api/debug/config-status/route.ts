import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 🔧 ENDPOINT DE DIAGNÓSTICO PARA PRODUCCIÓN
// Accesible en: /api/debug/config-status

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId') || 'cmfw0fujf0000eyv8eyhgfzja';
    
    console.log('🔍 Debug config status for business:', businessId);
    
    const configDir = path.join(process.cwd(), 'config', 'portal');
    const configFile = path.join(configDir, `portal-config-${businessId}.json`);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      businessId,
      environment: process.env.NODE_ENV || 'unknown',
      workingDirectory: process.cwd(),
      
      // Directory checks
      configDirectory: {
        path: configDir,
        exists: fs.existsSync(configDir),
        files: []
      },
      
      // Specific file checks
      businessConfigFile: {
        path: configFile,
        exists: fs.existsSync(configFile),
        stats: null,
        content: null,
        error: null
      },
      
      // API status
      apiChecks: {
        getTarjetasConfigCentral: null,
        portalConfigV2: null
      }
    };
    
    // Check directory contents
    if (diagnostics.configDirectory.exists) {
      try {
        const files = fs.readdirSync(configDir);
        diagnostics.configDirectory.files = files.map(file => {
          const filePath = path.join(configDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          };
        });
      } catch (error) {
        diagnostics.configDirectory.error = error.message;
      }
    }
    
    // Check specific business config file
    if (diagnostics.businessConfigFile.exists) {
      try {
        const stats = fs.statSync(configFile);
        diagnostics.businessConfigFile.stats = {
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        };
        
        const content = fs.readFileSync(configFile, 'utf8');
        const config = JSON.parse(content);
        
        diagnostics.businessConfigFile.content = {
          hasTarjetas: !!config.tarjetas,
          tarjetasCount: config.tarjetas?.length || 0,
          nombreEmpresa: config.nombreEmpresa,
          lastUpdated: config.settings?.lastUpdated,
          
          // Specific Plata card check
          plataTarjeta: config.tarjetas?.find(t => t.nivel === 'Plata') || null
        };
        
      } catch (error) {
        diagnostics.businessConfigFile.error = error.message;
      }
    }
    
    // Test getTarjetasConfigCentral function
    try {
      const { getTarjetasConfigCentral } = await import('@/lib/tarjetas-config-central');
      const centralConfig = await getTarjetasConfigCentral(businessId);
      
      diagnostics.apiChecks.getTarjetasConfigCentral = {
        success: true,
        tarjetasCount: centralConfig.tarjetas?.length || 0,
        nombreEmpresa: centralConfig.nombreEmpresa,
        plataTarjeta: centralConfig.tarjetas?.find(t => t.nivel === 'Plata') || null,
        erroresValidacion: centralConfig.erroresValidacion
      };
    } catch (error) {
      diagnostics.apiChecks.getTarjetasConfigCentral = {
        success: false,
        error: error.message
      };
    }
    
    // Test portal config v2 endpoint internally
    try {
      const configResponse = await fetch(`${request.nextUrl.origin}/api/portal/config-v2?businessId=${businessId}`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        diagnostics.apiChecks.portalConfigV2 = {
          success: true,
          tarjetasCount: configData.tarjetas?.length || 0,
          nombreEmpresa: configData.nombreEmpresa,
          dataSource: configData.settings?.dataSource,
          plataTarjeta: configData.tarjetas?.find(t => t.nivel === 'Plata') || null
        };
      } else {
        diagnostics.apiChecks.portalConfigV2 = {
          success: false,
          status: configResponse.status,
          statusText: configResponse.statusText
        };
      }
    } catch (error) {
      diagnostics.apiChecks.portalConfigV2 = {
        success: false,
        error: error.message
      };
    }
    
    return NextResponse.json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// También permitir POST para tests más específicos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessId = 'cmfw0fujf0000eyv8eyhgfzja' } = body;
    
    if (action === 'refresh-config') {
      // Force refresh configuration
      try {
        delete require.cache[require.resolve('@/lib/tarjetas-config-central')];
        const { getTarjetasConfigCentral } = await import('@/lib/tarjetas-config-central');
        const freshConfig = await getTarjetasConfigCentral(businessId);
        
        return NextResponse.json({
          success: true,
          message: 'Configuration refreshed',
          config: freshConfig
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown action'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
