import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ReferenceLine, Legend 
} from 'recharts';
import { Card } from '../ui/Card';
import { AgencyCost, AgencyService, CostType } from '../../types';
import { formatCurrency, calculateBEP } from '../../utils/formatters';
import { MONTH_NAMES } from '../../constants';

interface AnalyticsModuleProps {
  costs: AgencyCost[];
  services: AgencyService[];
  capacity: number;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ costs, services, capacity }) => {
  const totalFixed = costs.filter(c => c.type === CostType.FIXED).reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = costs.filter(c => c.type === CostType.VARIABLE).reduce((acc, c) => acc + c.amount, 0);
  const totalMonthlyCost = totalFixed + totalVariable;

  // Mock Projection Data (Cash Flow)
  const cashFlowData = MONTH_NAMES.map((month, index) => {
    // Simulate some growth and seasonality
    const growthFactor = 1 + (index * 0.05);
    const seasonality = index === 11 || index === 5 ? 1.2 : 1;
    const estimatedSales = (totalMonthlyCost * 1.3) * growthFactor * seasonality;
    
    return {
      name: month,
      Ingresos: Math.round(estimatedSales),
      Egresos: totalMonthlyCost,
      Utilidad: Math.round(estimatedSales - totalMonthlyCost)
    };
  });

  // BEP Chart Data
  // We need to show where Revenue crosses Total Costs
  const avgServicePricePerHour = services.length > 0 
    ? services.reduce((acc, s) => acc + (s.price / s.hours), 0) / services.length
    : calculateBEP(totalFixed, capacity) * 1.5; // Fallback

  const bepPoints = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const hours = (capacity / steps) * i;
    const revenue = hours * avgServicePricePerHour;
    const cost = totalFixed + (hours * (totalVariable / capacity)); // Simplified variable cost allocation
    bepPoints.push({
      hours: Math.round(hours),
      Ventas: Math.round(revenue),
      Costos: Math.round(cost),
      Fijos: totalFixed
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <Card className="h-96">
          <h3 className="text-lg font-bold mb-6 text-liu-text">Flujo de Caja Proyectado</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="Ingresos" fill="#FFCC00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Egresos" fill="#111111" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* BEP Chart */}
        <Card className="h-96">
          <h3 className="text-lg font-bold mb-6 text-liu-text">Punto de Equilibrio (Break-Even)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={bepPoints}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="hours" fontSize={12} label={{ value: 'Horas Vendidas', position: 'insideBottom', offset: -5 }} />
              <YAxis fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="Ventas" stroke="#FFCC00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Costos" stroke="#FD8000" strokeWidth={3} dot={false} />
              <ReferenceLine y={totalFixed} label="Fijos" stroke="#7F54F5" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Matrix Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Concepto</th>
                {MONTH_NAMES.map(m => <th key={m} className="px-2 py-3">{m}</th>)}
                <th className="px-4 py-3 bg-yellow-50 text-liu-text">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-left font-bold">Ingresos</td>
                {cashFlowData.map((d, i) => (
                  <td key={i} className="px-2 py-3 text-gray-600">{formatCurrency(d.Ingresos).replace('$', '')}</td>
                ))}
                <td className="px-4 py-3 font-bold bg-yellow-50">{formatCurrency(cashFlowData.reduce((a,b)=>a+b.Ingresos,0))}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-left font-bold text-red-500">Egresos</td>
                {cashFlowData.map((d, i) => (
                  <td key={i} className="px-2 py-3 text-gray-600">{formatCurrency(d.Egresos).replace('$', '')}</td>
                ))}
                <td className="px-4 py-3 font-bold bg-yellow-50">{formatCurrency(cashFlowData.reduce((a,b)=>a+b.Egresos,0))}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-left font-bold text-liu-text">Utilidad</td>
                {cashFlowData.map((d, i) => (
                  <td key={i} className={`px-2 py-3 font-medium ${d.Utilidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(d.Utilidad).replace('$', '')}
                  </td>
                ))}
                <td className="px-4 py-3 font-bold bg-yellow-100 text-liu-text">
                  {formatCurrency(cashFlowData.reduce((a,b)=>a+b.Utilidad,0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};