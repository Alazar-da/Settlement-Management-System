import * as XLSX from 'xlsx';

export interface Kiron2Row {
  Cashier: string;
  Shop: string;
  'Back Office'?: string;
  'Total Bets'?: number;
  'Bet Count'?: number;
  'Total Winnings'?: number;
  'Total Redeemed'?: number;
  'Redeemed Count'?: number;
  'Total Unclaimed Winnings'?: number;
  'Total Cancellations'?: number;
  'Cancellation Count'?: number;
  'Net Cash'?: number;
  GGR: number;
  NGR?: number;
  'RTP%'?: number;
}

export interface AlphaRow {
  'Agent/Shop': string;
  'Master Agent'?: string;
  Bets?: number;
  'Slip Count'?: number;
  'Pay Out'?: number;
  Unclaimed?: number;
  GGR: number;
  RTP?: number;
  'NET/NGR'?: number;
  Share?: number;
  'Shop NET'?: number;
  'Company NET'?: number;
}

export interface ProcessedAgentData {
  agentName: string;
  totalGGR: number;
  totalBets?: number;
  totalPayout?: number;
  cashiers?: string[];
}

export function parseKiron2Excel(fileBuffer: Buffer): Map<string, ProcessedAgentData> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: Kiron2Row[] = XLSX.utils.sheet_to_json(worksheet);
  
  const agentMap = new Map<string, ProcessedAgentData>();
  
  data.forEach(row => {
    const agentName = row.Shop?.trim();
    if (!agentName) return;
    
    const ggr = typeof row.GGR === 'number' ? row.GGR : parseFloat(String(row.GGR)) || 0;
    
    if (agentMap.has(agentName)) {
      const existing = agentMap.get(agentName)!;
      existing.totalGGR += ggr;
      if (row.Cashier && !existing.cashiers?.includes(row.Cashier)) {
        existing.cashiers?.push(row.Cashier);
      }
    } else {
      agentMap.set(agentName, {
        agentName,
        totalGGR: ggr,
        cashiers: row.Cashier ? [row.Cashier] : [],
      });
    }
  });
  
  return agentMap;
}

export function parseAlphaExcel(fileBuffer: Buffer): Map<string, ProcessedAgentData> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: AlphaRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  const agentMap = new Map<string, ProcessedAgentData>();
  
  data.forEach(row => {
    const agentName = row['Master Agent']?.trim() || row['Agent/Shop']?.trim();
    if (!agentName) return;
    
    const ggr = typeof row.GGR === 'number' ? row.GGR : parseFloat(String(row.GGR)) || 0;
    
    if (agentMap.has(agentName)) {
      const existing = agentMap.get(agentName)!;
      existing.totalGGR += ggr;
    } else {
      agentMap.set(agentName, {
        agentName,
        totalGGR: ggr,
      });
    }
  });
  
  return agentMap;
}