import { NextRequest } from 'next/server';
import { handleCSPViolation } from '@/lib/security-headers';

export async function POST(request: NextRequest) {
  return handleCSPViolation(request);
}