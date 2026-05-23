import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get('file') as File;

    const systemType = formData.get('systemType') as string;

    const commission = Number(formData.get('commission'));

    const systemPayment = Number(formData.get('systemPayment'));

    const week = formData.get('week') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const workbook = XLSX.read(bytes);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    

    const groupedAgents: any = {};

  for (const row of rows) {
  let rawAgentName = '';
  let ggr = 0;

  if (systemType === 'KIRON2') {
    rawAgentName = row['Shop'];
    ggr = Number(row['GGR'] || 0);
  } else {
    rawAgentName = row['Master Agent'];
    ggr = Number(row['GGR'] || 0);
  }

  // Clean agent name
  const agentName = String(rawAgentName || '').trim();

  // Skip empty agents
  if (!agentName) {
    console.log('Skipped row with empty agent name:', row);
    continue;
  }

  // Prevent invalid numbers
  if (isNaN(ggr)) {
    console.log('Skipped row with invalid GGR:', row);
    continue;
  }

  // Initialize grouped agent
  if (!groupedAgents[agentName]) {
    groupedAgents[agentName] = {
      totalGGR: 0,
    };
  }

  // Add totals
  groupedAgents[agentName].totalGGR += ggr;
}

    const { data: batch } = await supabase
      .from('upload_batches')
      .insert({
        system_type: systemType,
        uploaded_file_name: file.name,
        commission_percent: commission,
        system_payment_percent: systemPayment,
        settlement_week: week,
      })
      .select()
      .single();

    for (const agentName in groupedAgents) {
      const totalGGR = groupedAgents[agentName].totalGGR;

      const netRevenueCollect =
        totalGGR * (commission / 100);

      const totalSystemPayment =
        netRevenueCollect * (systemPayment / 100);

      const remainingBalance = netRevenueCollect;

      let { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('name', agentName)
        .single();

      if (!existingAgent) {
        const { data: newAgent } = await supabase
          .from('agents')
          .insert({
            name: agentName,
          })
          .select()
          .single();

        existingAgent = newAgent;
      }

      await supabase
        .from('revenue_settlements')
        .insert({
          agent_id: existingAgent.id,
          batch_id: batch.id,

          system_type: systemType,

          total_ggr: totalGGR,

          total_net_revenue_collect:
            netRevenueCollect,

          total_system_payment:
            totalSystemPayment,

          remaining_balance:
            remainingBalance,

          payment_status: 'UNPAID',

          settlement_date: week,
        });
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      totalAgents: Object.keys(groupedAgents).length,
    });
  } catch (error: any) {
    console.log(error);

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