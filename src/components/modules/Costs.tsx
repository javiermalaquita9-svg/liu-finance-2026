import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { Plus, Trash2, Upload, Calculator, TrendingUp, DollarSign, Activity, PieChart } from 'lucide-react';
import { AgencyCost, CostType, AgencySettings } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatCurrency, generateId } from '../../utils/formatters';

// Definimos lo que viene del Outlet (Contexto)
interface AgencyContextType {
  costs: AgencyCost[];
  setCosts: (costs: AgencyCost[]) => void;
  settings: AgencySettings;
  handleUpdateSettings: (key: keyof AgencySettings, value: any) => void;
}

export const CostsModule: React.FC = () => {
  // Conectamos al contexto
  const { costs, setCosts, settings, handleUpdateSettings } = useOutletContext<AgencyContextType>();

  // Mapeamos las variables para que el resto del código funcione igual
  const capacity = settings.capacityHours;
  const setCapacity = (val: number) => handleUpdateSettings('capacityHours', val);

  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostType, setNewCostType] = useState<CostType>(CostType.FIXED);

  const totalFixed = costs.filter(c => c.type === CostType.FIXED).reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = costs.filter(c => c.type === CostType.VARIABLE).reduce((acc, c) => acc + c.amount, 0);
  const totalCosts = totalFixed + totalVariable;
  const bep = capacity > 0 ? Math.round(totalFixed / capacity) : 0;

  const handleAddCost = () => {
    if (!newCostName || !newCostAmount) return;
    const newCost: AgencyCost = {
      id: generateId(),
      name: newCostName,
      amount: parseInt(newCostAmount),
      type: newCostType,
      category: 'General'
    };
    setCosts([...costs, newCost]);
    setNewCostName('');
    setNewCostAmount('');
  };

  const handleDelete = (id: string) => {
    setCosts(costs.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-liu">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Costos Totales</span>
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-bold text-liu-text">{formatCurrency(totalCosts)}</div>
          <div className="text-xs text-gray-400 mt-1">
            Fijos: {formatCurrency(totalFixed)}
          </div>
        </Card>

        <Card className="border-l-4 border-l-tech-purple">
          <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Capacidad (Hrs)</span>
            <Activity size={16} />
          </div>
          <div className="flex items-center gap-2">
             <input 
              type="number" 
              value={capacity} 
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="text-2xl font-bold text-liu-text bg-transparent w-full focus:outline-none border-b border-dashed border-gray-300 focus:border-liu"
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">Mensual</div>
        </Card>

        <Card className="border-l-4 border-l-tech-orange">
           <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Valor Hora B.E.P.</span>
            <PieChart size={16} />
          </div>
          <div className="text-2xl font-bold text-liu-text">{formatCurrency(bep)}</div>
          <div className="text-xs text-gray-400 mt-1">Punto de equilibrio</div>
        </Card>

        <Card className="border-l-4 border-l-gray-800">
           <div className="flex items-center justify-between text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Proyección Anual</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-liu-text">{formatCurrency(totalCosts * 12)}</div>
           <div className="text-xs text-gray-400 mt-1">Sin inflación</div>
        </Card>
      </div>

      {/* Tools & Input */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Input 
          label="Nombre del ítem" 
          placeholder="Ej: Arriendo Oficina" 
          value={newCostName}
          onChange={(e) => setNewCostName(e.target.value)}
          className="flex-1"
        />
        <Input 
          label="Monto Mensual" 
          placeholder="0" 
          type="number"
          value={newCostAmount}
          onChange={(e) => setNewCostAmount(e.target.value)}
          className="w-40"
        />
        <div className="flex flex-col w-40">
           <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Tipo</label>
           <select 
            value={newCostType}
            onChange={(e) => setNewCostType(e.target.value as CostType)}
            className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-liu/50"
           >
             <option value={CostType.FIXED}>Fijo</option>
             <option value={CostType.VARIABLE}>Variable</option>
           </select>
        </div>
        <Button onClick={handleAddCost} icon={<Plus size={18}/>}>Agregar</Button>
        <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
        <Button variant="secondary" icon={<Upload size={18}/>}>Importar</Button>
      </div>

      {/* Table */}
      <Card noPadding className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Ítem de Costo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-right">Monto</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {costs.map((cost) => (
              <tr key={cost.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-liu-text">{cost.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${
                    cost.type === CostType.FIXED ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {cost.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">
                  {formatCurrency(cost.amount)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(cost.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  No hay costos registrados. Agrega uno arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};