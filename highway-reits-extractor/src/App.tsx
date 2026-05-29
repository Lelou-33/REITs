import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { DataTable } from './components/DataTable';
import { ReitData, ExtractionResponse } from './types';
import { Download, LayoutDashboard, Search, RefreshCw, Clock } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';

export default function App() {
  const [data, setData] = useState<ReitData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [syncStatus, setSyncStatus] = useState<any>({ status: 'idle', lastRun: null });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSyncStatus();
    const interval = setInterval(() => {
      fetchSyncStatus();
      fetchData(); // pull new data if updated
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {}
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync-status');
      if (res.ok) {
        const json = await res.json();
        setSyncStatus(json);
        setIsSyncing(json.status === 'syncing');
      }
    } catch (e) {}
  };

  const handleTriggerSync = async () => {
    try {
      await fetch('/api/trigger-sync', { method: 'POST' });
      fetchSyncStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const result: ExtractionResponse = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to extract data");
      }

      await fetchData(); // refresh table
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = [
      "报告期", "基金代码", "基金名称", "项目名称", 
      "日均车流量(当月)", "流量环比", "流量同比", "流量累计", "累积同比(流量)",
      "路费收入(万元,当月)", "收入环比", "收入同比", "收入累计", "累积同比(收入)", 
      "备注"
    ];
    const rows = data.map(i => [
      i.reportPeriod ? `"${i.reportPeriod}"` : "",
      i.fundCode ? `"${i.fundCode}"` : "",
      i.fundName ? `"${i.fundName.replace(/"/g, '""')}"` : "",
      i.projectName ? `"${i.projectName.replace(/"/g, '""')}"` : "",
      i.trafficVolume !== null && i.trafficVolume !== undefined ? i.trafficVolume : "",
      i.trafficMoM ? `"${i.trafficMoM}"` : "",
      i.trafficYoY ? `"${i.trafficYoY}"` : "",
      i.trafficYTD !== null && i.trafficYTD !== undefined ? i.trafficYTD : "",
      i.trafficYTDYoY ? `"${i.trafficYTDYoY}"` : "",
      i.tollRevenue !== null && i.tollRevenue !== undefined ? i.tollRevenue : "",
      i.revenueMoM ? `"${i.revenueMoM}"` : "",
      i.revenueYoY ? `"${i.revenueYoY}"` : "",
      i.revenueYTD !== null && i.revenueYTD !== undefined ? i.revenueYTD : "",
      i.revenueYTDYoY ? `"${i.revenueYTDYoY}"` : "",
      i.remarks ? `"${i.remarks.replace(/"/g, '""')}"` : ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `REIT_Operations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="px-8 flex items-center h-16 border-b bg-white">
        <div className="flex flex-1 justify-between items-center w-full max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight">上交所高速公路REITs数据提取器</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {syncStatus.lastRun ? `上次同步时间：${new Date(syncStatus.lastRun).toLocaleTimeString()}` : '从未同步'}
            </div>
            <Button variant="outline" onClick={handleTriggerSync} disabled={isSyncing} className="h-8 text-xs font-medium">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '抓取数据中...' : '同步最新数据'}
            </Button>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-6xl mx-auto flex flex-col space-y-8">
          
          <div className="flex flex-col space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">月度运营数据</h2>
            <p className="text-sm text-gray-500">可从上交所自动抓取数据，或直接上传公告PDF文件进行提取。</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-8 items-start">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-sm">手动上传PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader onUpload={handleUpload} isLoading={isLoading} />
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span>已提取记录 ({data.length})</span>
                </div>
                {data.length > 0 && (
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    导出 CSV
                  </Button>
                )}
              </div>
              
              <DataTable data={data} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
