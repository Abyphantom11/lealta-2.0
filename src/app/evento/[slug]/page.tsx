import { Metadata } from 'next';
import EventRegistrationPage from './EventRegistrationPage';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/public/${slug}`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) {
      return { title: 'Evento no encontrado' };
    }
    
    const event = await res.json();
    
    return {
      title: `${event.name} - Registro`,
      description: event.description || `Regístrate para ${event.name}`,
      openGraph: {
        title: event.name,
        description: event.description || `Regístrate para ${event.name}`,
        images: event.imageUrl ? [event.imageUrl] : [],
      },
    };
  } catch {
    return { title: 'Evento' };
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  
  return <EventRegistrationPage slug={slug} />;
}
