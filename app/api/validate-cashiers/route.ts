import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cashierNames: string[] =
      body.cashierNames || [];

    if (!cashierNames.length) {
      return NextResponse.json({
        assigned: [],
        unassigned: [],
        missing: [],
      });
    }

    const uniqueNames = [
      ...new Set(
        cashierNames
          .map((x) => String(x).trim())
          .filter(Boolean)
      ),
    ];

    const { data: cashiers, error } =
      await supabase
        .from('cashiers')
        .select(
          `
          id,
          name,
          agent_id,
          agents (
            id,
            name
          )
        `
        );

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const assigned: any[] = [];

    const unassigned: any[] = [];

    const missing: any[] = [];

    for (const cashierName of uniqueNames) {
      const cashier = cashiers?.find(
        (c) =>
          c.name.toLowerCase().trim() ===
          cashierName.toLowerCase().trim()
      );

      if (!cashier) {
        missing.push({
          cashier_name: cashierName,
        });

        continue;
      }

      if (!cashier.agent_id) {
        unassigned.push({
          cashier_id: cashier.id,
          cashier_name: cashier.name,
        });

        continue;
      }

      assigned.push({
        cashier_id: cashier.id,

        cashier_name: cashier.name,

        agent_id: cashier.agent_id,

        agent_name:
          (cashier as any).agents?.name || '',
      });
    }

    return NextResponse.json({
      assigned,
      unassigned,
      missing,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message ||
          'Validation failed',
      },
      {
        status: 500,
      }
    );
  }
}