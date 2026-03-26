import { DailyEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface Props {
  entries: DailyEntry[];
  initialDeposit: number;
  showBalance: boolean;
  showProfitAmounts: boolean;
}

export default function TradingCharts({ entries, initialDeposit, showBalance, showProfitAmounts }: Props) {
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
      <h2 className="text-lg font-semibold text-foreground">Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-fade-in card-elevated" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            {showBalance ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="2 6" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '12px',
                        color: tooltipText,
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                      labelStyle={{ color: textColor }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={lineColor}
                      strokeWidth={2.5}
                      dot={{ r: 0 }}
                      activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-center text-sm text-muted-foreground">
                Balance view is hidden. Use the eye button in the header to show it again.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in card-elevated" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {showProfitAmounts ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="2 6" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: textColor }} stroke={gridColor} tickFormatter={v => `$${v}`} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '12px',
                        color: tooltipText,
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
                      labelStyle={{ color: textColor }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke={greenColor}
                      strokeWidth={2.5}
                      dot={({ cx, cy, payload }) => (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={payload.profit >= 0 ? greenColor : redColor}
                        />
                      )}
                      activeDot={({ cx, cy, payload }) => (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={payload.profit >= 0 ? greenColor : redColor}
                        />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-center text-sm text-muted-foreground">
                Profit amounts are hidden. Percent values stay visible in the summary cards.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
