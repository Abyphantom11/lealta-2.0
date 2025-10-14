import { NextRequest, NextResponse } from 'next/server';

// Simple test route for reservas
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Reservas route works!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'POST works!',
    received: body,
    timestamp: new Date().toISOString()
  });
}
