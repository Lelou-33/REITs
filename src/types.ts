export interface ReitData {
  id: string;
  fundCode: string;
  fundName: string;
  projectName: string;
  reportPeriod: string;
  
  trafficVolume: number | null; // 当月
  trafficMoM: string;         // 当月环比变动
  trafficYoY: string;         // 当月同比变动
  trafficYTD: number | null;  // 累计
  trafficYTDYoY: string;      // 累计同比变动

  tollRevenue: number | null; // 当月
  revenueMoM: string;         // 当月环比变动
  revenueYoY: string;         // 当月同比变动
  revenueYTD: number | null;  // 累计
  revenueYTDYoY: string;      // 累计同比变动

  remarks: string;
}

export interface ExtractionResponse {
  success: boolean;
  data?: Omit<ReitData, 'id'>[];
  error?: string;
}
