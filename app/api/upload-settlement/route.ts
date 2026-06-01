import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { supabase } from '@/lib/supabase';

// =========================
// ROUND TO 2 DECIMALS
// =========================
const round2 = (num: number) =>
  Number(num.toFixed(2));



export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const cashierAssignments = JSON.parse(
  String(
    formData.get('cashierAssignments') || '[]'
  )
);

const assignmentMap = new Map(
  cashierAssignments
    .filter((x: any) => x.agent_id)
    .map((x: any) => [
      x.cashier_name
        .toLowerCase()
        .trim(),
      x.agent_id,
    ])
);

    const file = formData.get('file') as File;

    const systemId = formData.get('systemId') as string;

    const commission = Number(
      formData.get('commission')
    );

    const week = formData.get('week') as string;

    if (!file) {
      return NextResponse.json(
        {
          error: 'No file uploaded',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // GET SYSTEM
    // =========================

    const { data: system } =
      await supabase
        .from('systems')
        .select('*')
        .eq('id', systemId)
        .single();

    if (!system) {
      return NextResponse.json(
        {
          error: 'Invalid system',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // CHECK DUPLICATE
    // =========================

    const { data: existingBatch } =
      await supabase
        .from('upload_batches')
        .select('id')
        .eq('system_id', systemId)
        .eq('settlement_week', week)
        .maybeSingle();

    if (existingBatch) {
      return NextResponse.json(
        {
          error:
            'Settlement already uploaded for this week',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // READ EXCEL
    // =========================

    const bytes = await file.arrayBuffer();

    const workbook = XLSX.read(bytes);

    const sheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[][] =
      XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      });

    // =========================
    // GROUP BY AGENT
    // =========================

const groupedAgents: any = {};
const groupedCashiers: any = {};

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];

  // COLUMN A = CASHIER
  const cashierName = String(
    row[0] || ''
  ).trim();

  // COLUMN B = NET CASH
  const netCash = round2(
    Number(row[1] || 0)
  );

  if (!cashierName) continue;

  if (isNaN(netCash)) continue;

  // =========================
  // FIND CASHIER
  // =========================

let { data: cashier } =
  await supabase
    .from('cashiers')
    .select(`
      *,
      agents(*)
    `)
    .ilike('name', cashierName)
    .maybeSingle();

// =========================
// CASHIER DOES NOT EXIST
// =========================

if (!cashier) {
  const assignedAgent =
    assignmentMap.get(
      cashierName
        .toLowerCase()
        .trim()
    );

  // Skip new cashier if user did not select an agent
  if (!assignedAgent) {
    continue;
  }

  const {
    data: newCashier,
    error: createError,
  } = await supabase
    .from('cashiers')
    .insert({
      name: cashierName,
      agent_id: assignedAgent,
    })
  }

// =========================
// CASHIER EXISTS
// BUT NO AGENT
// =========================

if (
  cashier &&
  !cashier.agent_id
) {
  const assignedAgent =
    assignmentMap.get(
      cashierName
        .toLowerCase()
        .trim()
    );

  // Existing cashier without agent
  // Skip if no agent selected
  if (!assignedAgent) {
    continue;
  }
}

// =========================
// FINAL SAFETY CHECK
// =========================

if (
  !cashier ||
  !cashier.agent_id
) {
  continue;
}

  const agentId = cashier.agent_id;

  const agentName =
    cashier.agents?.name || '';

  // =========================
  // GROUP AGENTS
  // =========================

  if (!groupedAgents[agentId]) {
    groupedAgents[agentId] = {
      agentId,
      agentName,
      totalNetCash: 0,
    };
  }

  groupedAgents[
    agentId
  ].totalNetCash = round2(
    groupedAgents[agentId]
      .totalNetCash + netCash
  );

  // =========================
  // GROUP CASHIERS
  // =========================

  if (!groupedCashiers[cashier.id]) {
    groupedCashiers[cashier.id] = {
      cashierId: cashier.id,

      cashierName: cashier.name,

      agentId,

      totalNetCash: 0,
    };
  }

  groupedCashiers[
    cashier.id
  ].totalNetCash = round2(
    groupedCashiers[cashier.id]
      .totalNetCash + netCash
  );
}

    // =========================
    // TOTALS
    // =========================

    let totalNetCash = 0;

    let totalExpectedCollection = 0;

    // =========================
    // CREATE BATCH
    // =========================

    const { data: batch, error: batchError } =
      await supabase
        .from('upload_batches')
        .insert({
          system_id: systemId,

          system_type: system.name,

          uploaded_file_name: file.name,

          commission_percent: round2(
            commission
          ),

          system_payment_percent: round2(
            system.system_payment_percentage
          ),

          settlement_week: week,
        })
        .select()
        .single();

    if (batchError || !batch) {
      console.log(batchError);

      return NextResponse.json(
        {
          error:
            batchError?.message ||
            'Failed to create batch',
        },
        {
          status: 500,
        }
      );
    }

    // =========================
    // INSERT SETTLEMENTS
    // =========================

    for (const agentId in groupedAgents) {
      const agent =
        groupedAgents[agentId];

      const agentNetCash = round2(
        agent.totalNetCash
      );

      const collection = round2(
        agentNetCash *
          (commission / 100)
      );

      const systemPayment = round2(
        agentNetCash *
          (system.system_payment_percentage /
            100)
      );

      totalNetCash = round2(
        totalNetCash + agentNetCash
      );

      totalExpectedCollection = round2(
        totalExpectedCollection +
          collection
      );

      const { error } = await supabase
        .from('revenue_settlements')
        .insert({
          agent_id: agentId,

          batch_id: batch.id,

          system_id: systemId,

          system_type: system.name,

          total_net_cash: agentNetCash,

          total_net_revenue_collect:
            collection,

          total_system_payment:
            systemPayment,

          total_paid: 0,

          remaining_balance:
            collection,

          payment_status: 'UNPAID',

          settlement_date: week,
        });

      if (error) {
        console.log(
          'Settlement insert error',
          error
        );
      }
    }

    // =========================
// INSERT CASHIER SETTLEMENTS
// =========================

for (const cashierId in groupedCashiers) {
  const cashier =
    groupedCashiers[cashierId];

  const cashierAmount = round2(
    cashier.totalNetCash
  );

  const { error } = await supabase
    .from('cashier_settlements')
    .insert({
      cashier_id: cashier.cashierId,

      batch_id: batch.id,

      agent_id: cashier.agentId,

      system_id: systemId,

      system_type: system.name,

      cashier_amount:
        cashierAmount,
    });

  if (error) {
    console.log(
      'Cashier settlement insert error',
      error
    );
  }
}

    // =========================
    // UPDATE BATCH TOTALS
    // =========================

    await supabase
      .from('upload_batches')
      .update({
        total_rows: rows.length - 1,

        total_agents:
          Object.keys(groupedAgents).length,

        total_net_cash: round2(
          totalNetCash
        ),

        total_expected_collection:
          round2(
            totalExpectedCollection
          ),
      })
      .eq('id', batch.id);


    return NextResponse.json({
      success: true,

      totalRows: rows.length - 1,

      totalAgents:
        Object.keys(groupedAgents).length,

      totalNetCash: round2(
        totalNetCash
      ),
    });
  } catch (error: any) {
    console.log(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          'Upload failed',
      },
      {
        status: 500,
      }
    );
  }
}