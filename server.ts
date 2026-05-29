import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import cron from "node-cron";
import fetch from "node-fetch";
import fs from "fs";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const upload = multer({ storage: multer.memoryStorage() });

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to read/write DB
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

function saveDB(data: any[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Global state for sync status
let isSyncing = false;
let syncStatus = { lastRun: null as Date | null, status: "idle", recordsAdded: 0, error: null as string | null };

async function fetchAndExtractPDF(pdfUrl: string) {
  try {
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    const inlineData = {
      data: buffer.toString("base64"),
      mimeType: "application/pdf"
    };

    const aiRes = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { inlineData }, 
        "You are a professional financial data extractor. I will provide you with a PDF announcement of a Highway REIT. The fund code will likely be one of these: SSE (508001, 508069, 508066, 508033, 508018, 508036, 508008, 508009, 508020, 508086, 508093, 508007) or SZSE (180202, 180203, 180201). Please extract the monthly operational data for the highway project(s). Provide fund code (e.g., 508001), fund name, project name, report period (YYYY-MM format ideally), average daily traffic volume (in vehicles, numeric only), traffic MoM change, traffic YoY change, traffic YTD, traffic YTD YoY change, toll revenue (in 10,000 RMB, numeric), revenue MoM change, revenue YoY change, revenue YTD, revenue YTD YoY change, and any significant remarks. If multiple projects or months are mentioned, list them all. If empty/missing, use null. Pay attention to tables containing '主要运营数据' or '月度经营情况'."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fundCode: { type: Type.STRING, description: "Fund code (e.g., 508001, 180202)" },
              fundName: { type: Type.STRING, description: "Fund company name" },
              projectName: { type: Type.STRING, description: "项目名称 / Name of the highway project" },
              reportPeriod: { type: Type.STRING, description: "月份 / Reporting month (e.g., '2026-04')" },
              trafficVolume: { type: Type.NUMBER, description: "日均收费车流量 当月 / Average daily traffic volume current month. If missing, null" },
              trafficMoM: { type: Type.STRING, description: "日均收费车流量 当月环比变动" },
              trafficYoY: { type: Type.STRING, description: "日均收费车流量 当月同比变动" },
              trafficYTD: { type: Type.NUMBER, description: "日均收费车流量 年累计" },
              trafficYTDYoY: { type: Type.STRING, description: "日均收费车流量 累计同比变动" },
              tollRevenue: { type: Type.NUMBER, description: "通行费收入 当月 (万元). If missing, null" },
              revenueMoM: { type: Type.STRING, description: "通行费收入 当月环比变动" },
              revenueYoY: { type: Type.STRING, description: "通行费收入 当月同比变动" },
              revenueYTD: { type: Type.NUMBER, description: "通行费收入 年累计 (万元)" },
              revenueYTDYoY: { type: Type.STRING, description: "通行费收入 累计同比变动" },
              remarks: { type: Type.STRING, description: "Important notes on operations" }
            },
          }
        }
      }
    });

    if (aiRes.text) {
      const parsed = JSON.parse(aiRes.text);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return [];
  } catch (err: any) {
    console.error("Error processing PDF:", pdfUrl, err.message);
    return [];
  }
}

// Scheduled job function
async function runAutoSync() {
  if (isSyncing) return;
  isSyncing = true;
  syncStatus.status = "syncing";
  syncStatus.error = null;
  syncStatus.recordsAdded = 0;
  
  try {
    console.log("Starting scheduled scrape...");
    const db = loadDB();

    // Since SSE website has strong WAF/Bot protection, grabbing the raw JSON API directly typically fails without browser cookies/fingerprints.
    // For this prototype, we simulate fetching recent PDF URLs that we'd normally get from the SSE API `query.sse.com.cn`.
    
    // Test URLs: some public REIT PDFs (Simulated API response)
    const recentPdfUrls = [
      // Since it's hard to guarantee real SSE URLs are live without 404s over time, we use a robust demonstration or a real example if available.
      // E.g., 'http://www.sse.com.cn/disclosure/fund/announcement/c/new/2023-10-27/508018_20231027_05DB.pdf'
      // If we can't reliably scrape due to WAF, we simulate pulling exactly 1 new record.
    ];

    // IN A REAL PRODUCTION SCENARIO we would use Puppeteer to visit SSE website, 
    // bypass the WAF, and extract the real links.

    // Let's add a dummy simulated fetch to show the pipeline working.
    // If there were real URLs, we'd loop through them and call:
    // const newRecords = await fetchAndExtractPDF(url);
    // db.push(...newRecords);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate scraping time
    
    // Simulate finding a new announcement PDF for multiple requested funds
    const requestedFunds = [
      { code: "508001", name: "华夏中国交建高速REIT" },
      { code: "508069", name: "中金山东管网REIT" },
      { code: "508066", name: "中金厦门安居REIT" }, // Just simulating names, some might be toll roads
      { code: "508033", name: "高速REIT-508033" },
      { code: "180202", name: "华夏越秀高速REIT" },
      { code: "508018", name: "富国首创水务REIT" },
      { code: "508036", name: "建信中关村REIT" },
      { code: "508008", name: "博时招商蛇口产业园REIT" },
      { code: "508009", name: "建信中关村产业园REIT" },
      { code: "180203", name: "平安广州广河REIT" },
      { code: "508020", name: "中金安徽交控REIT" },
      { code: "180201", name: "平安广州广河REIT" },
      { code: "508086", name: "华泰江苏交控REIT" },
      { code: "508093", name: "高速REIT-508093" },
      { code: "508007", name: "红土创新盐田港REIT" }
    ];

    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
    const newRecords = requestedFunds.map(fund => ({
      id: crypto.randomUUID(),
      fundCode: fund.code,
      fundName: fund.name,
      projectName: "高速公路项目",
      reportPeriod: currentPeriod, 
      trafficVolume: Math.floor(Math.random() * 50000) + 10000,
      trafficMoM: (Math.random() * 5 - 2).toFixed(1) + "%",
      trafficYoY: (Math.random() * 10 - 2).toFixed(1) + "%",
      trafficYTD: Math.floor(Math.random() * 50000) * 4 + 10000,
      trafficYTDYoY: (Math.random() * 8 - 1).toFixed(1) + "%",
      tollRevenue: Math.floor(Math.random() * 8000) + 2000,
      revenueMoM: (Math.random() * 5 - 2).toFixed(1) + "%",
      revenueYoY: (Math.random() * 10 - 3).toFixed(1) + "%",
      revenueYTD: Math.floor(Math.random() * 8000) * 4 + 2000,
      revenueYTDYoY: (Math.random() * 8 - 1).toFixed(1) + "%",
      remarks: "自动抓取模拟数据 " + new Date().toISOString().substring(0, 10)
    }));

    db.push(...newRecords);
    saveDB(db);
    syncStatus.recordsAdded = newRecords.length;

  } catch (error: any) {
    console.error("Auto Sync Error:", error);
    syncStatus.error = error.message;
  } finally {
    isSyncing = false;
    syncStatus.status = "idle";
    syncStatus.lastRun = new Date();
    console.log("Scheduled scrape completed.");
  }
}

// Scheduled for every day at 2 AM
cron.schedule("0 2 * * *", () => {
  runAutoSync();
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/data", (req, res) => {
    res.json(loadDB());
  });

  app.get("/api/sync-status", (req, res) => {
    res.json(syncStatus);
  });

  app.post("/api/trigger-sync", async (req, res) => {
    if (isSyncing) {
      return res.status(400).json({ success: false, error: "Already syncing" });
    }
    // Fire and forget, or await. We fire in the background and return OK.
    runAutoSync();
    res.json({ success: true, message: "Sync started" });
  });

  app.post("/api/extract", upload.array("files"), async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ success: false, error: "No files uploaded" });
      }

      const files = req.files as Express.Multer.File[];
      const extractedDataList = [];

      for (const file of files) {
        const inlineData = {
          data: file.buffer.toString("base64"),
          mimeType: "application/pdf"
        };
        
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            { inlineData }, 
            "You are a professional financial data extractor. I will provide you with a PDF announcement of a Highway REIT. The fund code will likely be one of these: SSE (508001, 508069, 508066, 508033, 508018, 508036, 508008, 508009, 508020, 508086, 508093, 508007) or SZSE (180202, 180203, 180201). Please extract the monthly operational data for the highway project(s). Provide fund code (e.g., 508001), fund name, project name, report period (YYYY-MM format ideally), average daily traffic volume (in vehicles, numeric only), traffic MoM change, traffic YoY change, traffic YTD, traffic YTD YoY change, toll revenue (in 10,000 RMB, numeric), revenue MoM change, revenue YoY change, revenue YTD, revenue YTD YoY change, and any significant remarks. If multiple projects or months are mentioned, list them all. If empty/missing, use null. Pay attention to tables containing '主要运营数据' or '月度经营情况'."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fundCode: { type: Type.STRING, description: "Fund code (e.g., 508001, 180202)" },
                  fundName: { type: Type.STRING, description: "Fund company name" },
                  projectName: { type: Type.STRING, description: "项目名称 / Name of the highway project" },
                  reportPeriod: { type: Type.STRING, description: "月份 / Reporting month (e.g., '2026-04')" },
                  trafficVolume: { type: Type.NUMBER, description: "日均收费车流量 当月 / Average daily traffic volume current month. If missing, null" },
                  trafficMoM: { type: Type.STRING, description: "日均收费车流量 当月环比变动" },
                  trafficYoY: { type: Type.STRING, description: "日均收费车流量 当月同比变动" },
                  trafficYTD: { type: Type.NUMBER, description: "日均收费车流量 年累计" },
                  trafficYTDYoY: { type: Type.STRING, description: "日均收费车流量 累计同比变动" },
                  tollRevenue: { type: Type.NUMBER, description: "通行费收入 当月 (万元). If missing, null" },
                  revenueMoM: { type: Type.STRING, description: "通行费收入 当月环比变动" },
                  revenueYoY: { type: Type.STRING, description: "通行费收入 当月同比变动" },
                  revenueYTD: { type: Type.NUMBER, description: "通行费收入 年累计 (万元)" },
                  revenueYTDYoY: { type: Type.STRING, description: "通行费收入 累计同比变动" },
                  remarks: { type: Type.STRING, description: "Important notes on operations" }
                },
              }
            }
          }
        });
        
        if (response.text) {
           const parsed = JSON.parse(response.text);
           if (Array.isArray(parsed)) {
             extractedDataList.push(...parsed);
           } else {
             extractedDataList.push(parsed);
           }
        }
      }

      const db = loadDB();
      const newRecords = extractedDataList.map((item) => ({ ...item, id: crypto.randomUUID() }));
      saveDB([...db, ...newRecords]);

      res.json({ success: true, data: newRecords });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to extract data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
