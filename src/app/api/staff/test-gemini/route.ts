import { NextRequest, NextResponse } from 'next/server';
import { getGeminiApiKey } from '@/lib/env';

// 🧪 ENDPOINT DE TEST PARA VERIFICAR GEMINI API

export async function GET(request: NextRequest) {
  try {
    const apiKey = getGeminiApiKey();
    
    console.log('🧪 Testing Gemini API key configuration...');
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not configured',
        details: 'GOOGLE_GEMINI_API_KEY or GOOGLE_AI_API_KEY not found in environment'
      });
    }
    
    // Test básico de conectividad (sin gastar créditos)
    return NextResponse.json({
      success: true,
      message: 'Gemini API key is configured',
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 8) + '...',
      environment: process.env.NODE_ENV
    });
    
  } catch (error: any) {
    console.error('🧪 Error testing Gemini API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
