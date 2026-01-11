import React from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ReferenceLine, Legend 
} from 'recharts'; 
import { Card } from '../ui/Card';
import { AgencyCost, AgencyService, CostType, AgencySettings, AgencyClient, AgencyQuote, MonthlySale } from '../../types'; // Asegúrate de importar AgencySettings
import { formatCurrency, calculateBEP } from '../../utils/formatters';
import { MONTH_NAMES } from '../../constants';
import { Input } from '../ui/Input';

// Definimos qué datos vienen del Contexto (lo que envía App.tsx)
interface AgencyContextType {
  costs: AgencyCost[];
  setCosts: React.Dispatch<React.SetStateAction<AgencyCost[]>>;
  services: AgencyService[];
  setServices: React.Dispatch<React.SetStateAction<AgencyService[]>>;
  settings: AgencySettings;
  clients: AgencyClient[];
  setClients: React.Dispatch<React.SetStateAction<AgencyClient[]>>;
  quotes: AgencyQuote[];
  setQuotes: React.Dispatch<React.SetStateAction<AgencyQuote[]>>;
  monthlySales: MonthlySale[];
  setMonthlySales: React.Dispatch<React.SetStateAction<MonthlySale[]>>;
  handleUpdateSettings: (key: keyof AgencySettings, value: any) => void;
  bepHourlyRate: number;
  handleAddService: (newService: AgencyService) => void;
  handleUpdateService: (id: string, updatedService: AgencyService) => void;
  handleDeleteService: (id: string) => void;
  handleAddClient: (newClient: AgencyClient) => void;
  handleUpdateClient: (id: string, updatedClient: AgencyClient) => void;
  handleDeleteClient: (id: string) => void;
  handleUpdateQuote: (id: string, updatedQuote: AgencyQuote) => void;
  handleDeleteQuote: (id: string) => void;
}

export const AnalyticsModule: React.FC = () => {
  // 1. Aquí "pescamos" los datos del contexto en lugar de recibirlos por props
  const { costs, services, settings, monthlySales, setMonthlySales } = useOutletContext<AgencyContextType>();
  
  // Mapeamos la capacidad desde settings
  const capacity = settings.capacityHours; 
  const currentYear = new Date().getFullYear();

  const totalFixed = costs.filter(c => c.type === CostType.FIXED).reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = costs.filter(c => c.type === CostType.VARIABLE).reduce((acc, c) => acc + c.amount, 0);
  const totalMonthlyCost = totalFixed + totalVariable;

  // --- Lógica para el Flujo de Caja ---
  // Ahora se basa en los datos reales ingresados por el usuario
  const cashFlowData = MONTH_NAMES.map((month, index) => {
    const monthSale = monthlySales.find(s => s.year === currentYear && s.month === index);
    const ingresos = monthSale ? monthSale.sales : 0;
    
    return {
      name: month,
      Ingresos: ingresos,
      Egresos: totalMonthlyCost,
      Utilidad: ingresos - totalMonthlyCost,
    };
  });

  const handleSalesChange = (monthIndex: number, salesValue: string) => {
    const sales = parseFloat(salesValue) || 0;
    
    setMonthlySales(prevSales => {
      const existingSaleIndex = prevSales.findIndex(s => s.year === currentYear && s.month === monthIndex);
      
      if (existingSaleIndex > -1) {
        // Actualizar venta existente
        const updatedSales = [...prevSales];
        updatedSales[existingSaleIndex] = { ...updatedSales[existingSaleIndex], sales };
        return updatedSales;
      } else {
        // Agregar nueva venta
        return [...prevSales, { year: currentYear, month: monthIndex, sales }];
      }
    });
  };

  // BEP Chart Data
  const avgServicePricePerHour = services.length > 0 
    ? services.reduce((acc, s) => acc + (s.price / s.hours), 0) / services.length
    : calculateBEP(totalFixed, capacity) * 1.5;

  const bepPoints = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const hours = (capacity / steps) * i;
    const revenue = hours * avgServicePricePerHour;
    const cost = totalFixed + (hours * (totalVariable / capacity || 0)); 
    bepPoints.push({
      hours: Math.round(hours),
      Ventas: Math.round(revenue),
      Costos: Math.round(cost),
      Fijos: totalFixed
    });
  }

  return (
    <div className="space-y-6">
      {/* Card para Ingresar Ventas Mensuales */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-liu-text">Registro de Ventas Mensuales ({currentYear})</h3>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa los ingresos (ventas) de cada mes para que los gráficos reflejen la realidad de tu negocio. 
          Los meses sin datos se mostrarán con $0 en ingresos.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {MONTH_NAMES.map((month, index) => {
            const sale = monthlySales.find(s => s.year === currentYear && s.month === index);
            return (
              <Input
                key={month}
                label={month}
                type="number"
                placeholder="Ventas del mes"
                value={sale?.sales || ''}
                onChange={(e) => handleSalesChange(index, e.target.value)}
                className="text-right"
              />
            );
          })}
        </div>
      </Card>
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

      {/* Matrix Table */}
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