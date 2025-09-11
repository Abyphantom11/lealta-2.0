import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'portal-config.json');

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Archivo de configuración no encontrado' },
        { status: 404 }
      );
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error leyendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error leyendo configuración del portal' },
      { status: 500 }
    );
  }
}
