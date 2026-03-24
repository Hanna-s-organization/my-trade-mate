import { DailyEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

interface Props {
  entries: DailyEntry[];
  initialDeposit: number;
}

export default function TradingCharts({ entries, initialDeposit }: Props) {
  const equityData = useMemo(() => {
    const data = [{ date: 'Start', balance: initialDeposit }];
    entries.forEach(e => {
      data.push({ date: e.date.slice(5), balance: Math.round(e.endingBalance * 100) / 100 });
    });
    return data;
  }, [entries, initialDeposit]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    entries.forEach(e => {
      const key = e.date.slice(0, 7);
      months[key] = (months[key] || 0) + e.profitAmount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, profit]) => ({
        month: month.slice(2),
        profit: Math.round(profit * 100) / 100,
      }));
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Крива капіталу</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 70%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 70%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(224, 25%, 12%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Баланс']}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(217, 70%, 55%)" fill="url(#balanceGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Місячний прибуток</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(224, 25%, 12%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Прибуток']}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((d, i) => (
                    <Cell key={i} fill={d.profit >= 0 ? 'hsl(152, 60%, 40%)' : 'hsl(0, 72%, 51%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
