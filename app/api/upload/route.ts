import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import UploadBatch from '@/models/UploadBatch';
import Agent from '@/models/Agent';
import RevenueSettlement from '@/models/RevenueSettlement';
import { parseAlphaExcel, parseKiron2Excel } from '@/utils/excelParser';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const systemType = formData.get('systemType') as string;
    const commissionPercent = parseFloat(formData.get('commissionPercent') as string);
    const systemPaymentPercent = parseFloat(formData.get('systemPaymentPercent') as string);
    const settlementWeek = new Date(formData.get('settlementWeek') as string);
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    await dbConnect();

    // Check for duplicate upload (skip for preview)
    if (!isPreview) {
      const existingBatch = await UploadBatch.findOne({
        settlementWeek,
        systemType,
      });

      if (existingBatch) {
        return NextResponse.json(
          { error: 'Settlement for this week already exists' },
          { status: 400 }
        );
      }
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    let agentMap;
    
    if (systemType === 'Alpha') {
      agentMap = parseAlphaExcel(buffer);
    } else {
      agentMap = parseKiron2Excel(buffer);
    }

    // For preview, just return summary
    if (isPreview) {
      let totalGGR = 0;
      for (const [_, agentData] of agentMap) {
        totalGGR += agentData.totalGGR;
      }
      
      return NextResponse.json({
        agentCount: agentMap.size,
        totalGGR,
      });
    }

    // Create upload batch
    const uploadBatch = await UploadBatch.create({
      systemType,
      uploadedFileName: file.name,
      commissionPercent,
      systemPaymentPercent,
      settlementWeek,
    });

    const settlements = [];
    let totalGGR = 0;
    let totalNetRevenue = 0;
    const errors = [];
    const warnings = [];

    // Process each agent
    let index = 0;
    for (const [agentName, agentData] of agentMap) {
      index++;
      try {
        // Find or create agent
        let agent = await Agent.findOne({ 
          name: agentName, 
          systemType 
        });
        
        if (!agent) {
          agent = await Agent.create({
            name: agentName,
            systemType,
          });
          warnings.push({
            row: index,
            message: `New agent "${agentName}" was created automatically`,
          });
        }

        // Calculate amounts
        const netRevenueCollect = agentData.totalGGR * (commissionPercent / 100);
        const systemPayment = netRevenueCollect * (systemPaymentPercent / 100);
        
        totalGGR += agentData.totalGGR;
        totalNetRevenue += netRevenueCollect;

        // Create settlement record
        const settlement = await RevenueSettlement.create({
          agentId: agent._id,
          batchId: uploadBatch._id,
          systemType,
          totalGGR: agentData.totalGGR,
          totalNetRevenueCollect: netRevenueCollect,
          totalSystemPayment: systemPayment,
          totalPaid: 0,
          remainingBalance: netRevenueCollect,
          paymentStatus: 'Unpaid',
          settlementDate: settlementWeek,
        });
        
        settlements.push(settlement);
      } catch (error) {
        errors.push({
          row: index,
          message: `Failed to process agent "${agentName}": ${error.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAgents: agentMap.size,
        totalGGR,
        totalExpectedCollection: totalNetRevenue,
        settlements: settlements.length,
        batchId: uploadBatch._id,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload: ' + error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}