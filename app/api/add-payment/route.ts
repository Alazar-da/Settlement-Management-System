import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      settlementId,
      amount,
      note,
    } = body;

    const { data: settlement } = await supabase
      .from('revenue_settlements')
      .select('*')
      .eq('id', settlementId)
      .single();

    const totalPaid =
      Number(settlement.total_paid) +
      Number(amount);

    const remainingBalance =
      Number(settlement.total_net_revenue_collect) -
      totalPaid;

    let paymentStatus = 'UNPAID';

    if (remainingBalance <= 0) {
      paymentStatus = 'FULLY_PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    await supabase
      .from('payments')
      .insert({
        revenue_settlement_id: settlementId,
        amount,
        note,
      });

    await supabase
      .from('revenue_settlements')
      .update({
        total_paid: totalPaid,
        remaining_balance: remainingBalance,
        payment_status: paymentStatus,
      })
      .eq('id', settlementId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}