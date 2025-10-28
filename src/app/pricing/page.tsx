import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import PricingClient from './PricingClient';

/**
 * 💰 PÁGINA: Pricing
 * 
 * Página principal de precios con integración de Paddle
 */

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  return <PricingClient initialSession={session} />;
}
