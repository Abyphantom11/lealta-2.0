import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BRANDING_FILE = path.join(process.cwd(), 'branding-config.json');

export async function GET() {
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = fs.readFileSync(BRANDING_FILE, 'utf8');
      const branding = JSON.parse(data);
      return NextResponse.json(branding);
    } else {
      // Valores por defecto
      const defaultBranding = {
        businessName: 'LEALTA',
        logoUrl: '',
        primaryColor: '#2563EB'
      };
      return NextResponse.json(defaultBranding);
    }
  } catch (error) {
    console.error('Error loading branding:', error);
    return NextResponse.json(
      { error: 'Error loading branding' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const branding = await request.json();
    
    // Validar datos
    if (!branding.businessName || !branding.primaryColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Guardar en archivo
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(branding, null, 2));
    
    console.log('Branding saved:', branding);
    
    return NextResponse.json({ success: true, branding });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Error saving branding' },
      { status: 500 }
    );
  }
}
