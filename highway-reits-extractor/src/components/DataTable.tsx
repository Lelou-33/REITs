import React from 'react';
import { ReitData } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';

interface DataTableProps {
  data: ReitData[];
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-xl border-gray-200">
        <p className="text-sm text-gray-500">暂无提取数据。</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[100px]">报告期</TableHead>
            <TableHead>基金代码</TableHead>
            <TableHead>基金名称</TableHead>
            <TableHead>项目名称</TableHead>
            
            {/* Traffic Volume */}
            <TableHead className="text-right">日均车流量(当月)</TableHead>
            <TableHead className="text-right whitespace-nowrap">流量环比</TableHead>
            <TableHead className="text-right whitespace-nowrap">流量同比</TableHead>
            <TableHead className="text-right whitespace-nowrap">流量累计</TableHead>
            <TableHead className="text-right whitespace-nowrap">累积同比(流量)</TableHead>
            
            {/* Toll Revenue */}
            <TableHead className="text-right whitespace-nowrap">收入(万元,当月)</TableHead>
            <TableHead className="text-right whitespace-nowrap">收入环比</TableHead>
            <TableHead className="text-right whitespace-nowrap">收入同比</TableHead>
            <TableHead className="text-right whitespace-nowrap">收入累计</TableHead>
            <TableHead className="text-right whitespace-nowrap">累积同比(收入)</TableHead>

            <TableHead>备注</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-xs whitespace-nowrap">{item.reportPeriod || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{item.fundCode || '-'}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">{item.fundName || '-'}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">{item.projectName || '-'}</TableCell>
              
              <TableCell className="text-right font-mono text-xs">{item.trafficVolume !== null && item.trafficVolume !== undefined ? item.trafficVolume.toLocaleString() : '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.trafficMoM || '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.trafficYoY || '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.trafficYTD !== null && item.trafficYTD !== undefined ? item.trafficYTD.toLocaleString() : '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.trafficYTDYoY || '-'}</TableCell>

              <TableCell className="text-right font-mono text-xs">{item.tollRevenue !== null && item.tollRevenue !== undefined ? item.tollRevenue.toLocaleString() : '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.revenueMoM || '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.revenueYoY || '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.revenueYTD !== null && item.revenueYTD !== undefined ? item.revenueYTD.toLocaleString() : '-'}</TableCell>
              <TableCell className="text-right font-mono text-xs">{item.revenueYTDYoY || '-'}</TableCell>

              <TableCell className="max-w-[200px] truncate text-xs" title={item.remarks}>{item.remarks || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
