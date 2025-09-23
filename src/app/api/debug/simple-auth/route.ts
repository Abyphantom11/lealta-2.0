import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { compare } from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple auth test starting...');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('📧 Login attempt for:', email);
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });
    }
    
    // Test de conexión a base de datos
    console.log('🗄️  Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('✅ Database connected, users:', userCount);
    
    // Buscar usuario
    console.log('🔍 Searching for user:', email);
    const user = await prisma.user.findFirst({
      where: { 
        email: email,
        isActive: true 
      },
      include: {
        business: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });
    
    // Verificar password
    console.log('🔒 Verifying password...');
    const isValid = await compare(password, user.passwordHash);
    
    if (!isValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json({ error: 'Password inválido' }, { status: 401 });
    }
    
    console.log('✅ Password valid for:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId
      }
    });
    
  } catch (error) {
    console.error('❌ Simple auth test error:', error);
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
