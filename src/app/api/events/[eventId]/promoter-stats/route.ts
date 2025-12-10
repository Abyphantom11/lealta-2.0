/**
 * 📊 Event Promoter Statistics API
 * GET: Get promoter performance stats for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// GET /api/events/[eventId]/promoter-stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // Get all guests with promoter info and check-in status
    const guests = await prisma.eventGuest.findMany({
      where: { 
        eventId,
        promotorId: { not: null } // Only guests with promoter
      },
      include: {
        Promotor: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Group by promoter and calculate stats
    const promoterStats = new Map<string, {
      promotorId: string;
      promotorName: string;
      totalRegistered: number;
      totalCheckedIn: number;
      totalPeople: number;
      guests: Array<{
        name: string;
        status: string;
        checkedInAt: string | null;
        guestCount: number;
      }>;
    }>();

    for (const guest of guests) {
      if (!guest.Promotor) continue;

      const key = guest.promotorId!;
      const promotorName = guest.Promotor.nombre;

      if (!promoterStats.has(key)) {
        promoterStats.set(key, {
          promotorId: key,
          promotorName,
          totalRegistered: 0,
          totalCheckedIn: 0,
          totalPeople: 0,
          guests: []
        });
      }

      const stats = promoterStats.get(key)!;
      stats.totalRegistered++;
      stats.totalPeople += guest.guestCount;
      
      if (guest.status === 'CHECKED_IN') {
        stats.totalCheckedIn++;
      }

      stats.guests.push({
        name: guest.name,
        status: guest.status,
        checkedInAt: guest.checkedInAt?.toISOString() || null,
        guestCount: guest.guestCount
      });
    }

    // Convert to array and filter promoters with at least 1 checked-in guest
    const results = Array.from(promoterStats.values())
      .filter(stat => stat.totalCheckedIn > 0)
      .sort((a, b) => b.totalCheckedIn - a.totalCheckedIn);

    // Calculate totals
    const totals = {
      totalPromoters: results.length,
      totalRegistered: results.reduce((sum, p) => sum + p.totalRegistered, 0),
      totalCheckedIn: results.reduce((sum, p) => sum + p.totalCheckedIn, 0),
      totalPeople: results.reduce((sum, p) => sum + p.totalPeople, 0)
    };

    return NextResponse.json({
      success: true,
      promoters: results,
      totals
    });
  } catch (error) {
    console.error('❌ Error fetching promoter stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
