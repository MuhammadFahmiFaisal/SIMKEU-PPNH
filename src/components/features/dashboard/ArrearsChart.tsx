import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useArrears } from '../../../hooks/useArrears';
import { useTransactions } from '../../../hooks/useTransactions';

interface ArrearsChartProps {
  selectedYear: number;
}

export function ArrearsChart({ selectedYear }: ArrearsChartProps) {
  const { arrears } = useArrears();
  const { transactions } = useTransactions();

  // Helper to get month name from date string or month name string
  const getMonthName = (monthStr: string) => {
    // Current format is often "Januari 2026" or similar
    return monthStr.split(' ')[0].substring(0, 3);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const chartData = months.map((name, index) => {
    // Filter unpaid arrears for this month and selected year
    const monthlyArrears = arrears.filter(a => {
      const parts = a.month.split(' ');
      const aMonth = parts[0].substring(0, 3);
      const aYear = parts.length > 1 ? parseInt(parts[1], 10) : currentYear;
      return aMonth.toLowerCase().startsWith(name.toLowerCase()) && aYear === selectedYear && a.status !== 'Lunas';
    });

    // Filter paid arrears (total payments made) for this month and selected year
    // We can estimate the collected amount from transactions related to this month/category
    const collectedAmount = transactions
      .filter(t => {
        if (t.type !== 'Pelunasan' && t.type !== 'Penyesuaian') return false;
        // Check if transaction is in the selected year and month
        const dateParts = t.date.split(', ')[0].split('/');
        if (dateParts.length === 3) {
          const tMonth = parseInt(dateParts[1], 10) - 1;
          const tYear = parseInt(dateParts[2], 10);
          return tMonth === index && tYear === selectedYear;
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const unpaidTotal = monthlyArrears.reduce((sum, a) => sum + a.amount, 0);
    
    return {
      name,
      unpaid: unpaidTotal,
      paid: collectedAmount,
      active: index === currentMonthIdx && selectedYear === currentYear
    };
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)'
            }}
            formatter={(value: number, name: string) => [
              `Rp ${value.toLocaleString('id-ID')}`, 
              name === 'unpaid' ? 'Belum Bayar (Tunggakan)' : 'Telah Bayar (Lunas)'
            ]}
          />
          {/* Unpaid Bar */}
          <Bar dataKey="unpaid" radius={[6, 6, 0, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-unpaid-${index}`} 
                fill={entry.active ? '#ef4444' : '#2563eb'} 
                className="hover:opacity-80 transition-all duration-300 cursor-pointer"
              />
            ))}
          </Bar>
          {/* Paid Bar */}
          <Bar dataKey="paid" radius={[6, 6, 0, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-paid-${index}`} 
                fill="#cbd5e1" 
                className="hover:fill-emerald-400 transition-all duration-300 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
