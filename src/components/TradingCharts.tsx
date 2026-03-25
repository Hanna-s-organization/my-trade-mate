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

  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  const gridColor = isDark ? 'hsl(222, 15%, 20%)' : 'hsl(220, 13%, 91%)';
  const textColor = isDark ? 'hsl(215, 15%, 55%)' : 'hsl(220, 10%, 46%)';
  const tooltipBg = isDark ? 'hsl(222, 22%, 13%)' : 'hsl(0, 0%, 100%)';
  const tooltipBorder = isDark ? 'hsl(222, 15%, 22%)' : 'hsl(220, 13%, 91%)';
  const tooltipText = isDark ? 'hsl(210, 20%, 92%)' : 'hsl(220, 25%, 10%)';
  const lineColor = 'hsl(217, 70%, 55%)';
  const greenColor = isDark ? 'hsl(142, 72%, 50%)' : 'hsl(152, 69%, 45%)';
  const redColor = isDark ? 'hsl(0, 72%, 55%)' : 'hsl(0, 72%, 51%)';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Діаграми</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-fade-in card-elevated" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Крива капіталу</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} />
                  <YAxis tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Баланс']}
                    labelStyle={{ color: textColor }}
                  />
                  <Area type="monotone" dataKey="balance" stroke={lineColor} fill="url(#balanceGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in card-elevated" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Місячний прибуток</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} />
                  <YAxis tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Прибуток']}
                    labelStyle={{ color: textColor }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((d, i) => (
                      <Cell key={i} fill={d.profit >= 0 ? greenColor : redColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
