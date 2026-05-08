import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, TrendingUp, DollarSign, Activity, PieChart, Check, X, Pencil } from 'lucide-react';
import { AgencyCost, CostType, AgencySettings } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatCurrency, generateId } from '../../utils/formatters';

interface AgencyContextType {
  costs: AgencyCost[];
  setCosts: (costs: AgencyCost[]) => void;
  settings: AgencySettings;
  handleUpdateSettings: (key: keyof AgencySettings, value: any) => void;
}

const DEPRECIATION_ID = 'depreciation-virtual-cost';

export const CostsModule: React.FC = () => {
  const { costs, setCosts, settings, handleUpdateSettings } = useOutletContext<AgencyContextType>();

  const capacity = settings.capacityHours;
  const setCapacity = (val: number) => handleUpdateSettings('capacityHours', val);

  const [activeTab, setActiveTab] = useState<'fixed' | 'variable' | 'depreciation'>('fixed');
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostType, setNewCostType] = useState<CostType>(CostType.FIXED);
  const [editingCost, setEditingCost] = useState<{ id: string; amount: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalFixed = costs.filter(c => c.type === CostType.FIXED).reduce((acc, c) => acc + c.amount, 0);
  const totalVariable = costs.filter(c => c.type === CostType.VARIABLE).reduce((acc, c) => acc + c.amount, 0);
  const totalCosts = totalFixed + totalVariable;
  const bep = capacity > 0 ? Math.round(totalFixed / capacity) : 0;
  const fixedPercent = totalCosts > 0 ? (totalFixed / totalCosts) * 100 : 50;

  const fixedCosts = costs.filter(c => c.type === CostType.FIXED && c.id !== DEPRECIATION_ID);
  const variableCosts = costs.filter(c => c.type === CostType.VARIABLE);
  const depreciationCosts = costs.filter(c => c.id === DEPRECIATION_ID);
  const activeCosts = activeTab === 'fixed' ? fixedCosts : activeTab === 'variable' ? variableCosts : depreciationCosts;

  const handleAddCost = () => {
    if (!newCostName.trim() || !newCostAmount) return;
    const newCost: AgencyCost = {
      id: generateId(),
      name: newCostName.trim(),
      amount: parseInt(newCostAmount),
      type: newCostType,
      category: 'General',
    };
    setCosts([...costs, newCost]);
    setNewCostName('');
    setNewCostAmount('');
  };

  const handleDelete = (id: string) => {
    setCosts(costs.filter(c => c.id !== id));
    setDeletingId(null);
  };

  const handleSaveInlineEdit = () => {
    if (!editingCost) return;
    const amount = parseInt(editingCost.amount);
    if (!isNaN(amount) && amount >= 0) {
      setCosts(costs.map(c => c.id === editingCost.id ? { ...c, amount } : c));
    }
    setEditingCost(null);
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCost();
  };

  const tabs = [
    { key: 'fixed' as const, label: 'Fijos', count: fixedCosts.length, accent: '#7F54F5' },
    { key: 'variable' as const, label: 'Variables', count: variableCosts.length, accent: '#FD8000' },
    { key: 'depreciation' as const, label: 'Depreciación', count: depreciationCosts.length, accent: '#FFCC00' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1C1C1C] border-none text-gray-100 border-l-4 border-l-[#FFCC00]">
          <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Costos Totales</span>
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-bold text-[#FFCC00]">{formatCurrency(totalCosts)}</div>
          {totalCosts > 0 ? (
            <div className="mt-3">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-[#111111]">
                <div style={{ width: `${fixedPercent}%` }} className="bg-[#7F54F5] transition-all duration-500" />
                <div style={{ width: `${100 - fixedPercent}%` }} className="bg-[#FD8000] transition-all duration-500" />
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-[#7F54F5]">Fijos {fixedPercent.toFixed(0)}%</span>
                <span className="text-[#FD8000]">Variables {(100 - fixedPercent).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 mt-1">Sin costos registrados</div>
          )}
        </Card>

        <Card className="bg-[#1C1C1C] border-none text-gray-100 border-l-4 border-l-[#7F54F5]">
          <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Capacidad (Hrs)</span>
            <Activity size={16} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="text-2xl font-bold text-[#FFCC00] bg-transparent w-full focus:outline-none border-b border-dashed border-[#7F54F5]/50 focus:border-[#FFCC00]"
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">Mensual</div>
        </Card>

        <Card className="bg-[#1C1C1C] border-none text-gray-100 border-l-4 border-l-[#FD8000]">
          <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Valor Hora B.E.P.</span>
            <PieChart size={16} />
          </div>
          <div className="text-2xl font-bold text-[#FFCC00]">{formatCurrency(bep)}</div>
          <div className="text-xs text-gray-400 mt-1">Punto de equilibrio</div>
        </Card>

        <Card className="bg-[#1C1C1C] border-none text-gray-100 border-l-4 border-l-gray-500">
          <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
            <span>Proyección Anual</span>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-[#FFCC00]">{formatCurrency(totalCosts * 12)}</div>
          <div className="text-xs text-gray-400 mt-1">Sin inflación</div>
        </Card>
      </div>

      {/* Input row — hidden on Depreciación tab */}
      {activeTab !== 'depreciation' && (
        <div className="flex flex-col md:flex-row gap-4 items-end bg-[#1C1C1C] p-4 rounded-xl border border-[#7F54F5]/20 shadow-sm">
          <Input
            label="Nombre del ítem"
            placeholder="Ej: Arriendo Oficina"
            value={newCostName}
            onChange={(e) => setNewCostName(e.target.value)}
            onKeyDown={handleFormKeyDown}
            className="flex-1"
          />
          <Input
            label="Monto Mensual"
            placeholder="0"
            type="number"
            value={newCostAmount}
            onChange={(e) => setNewCostAmount(e.target.value)}
            onKeyDown={handleFormKeyDown}
            className="w-40"
          />
          <div className="flex flex-col w-40">
            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Tipo</label>
            <select
              value={newCostType}
              onChange={(e) => setNewCostType(e.target.value as CostType)}
              className="h-10 bg-[#111111] border border-[#7F54F5]/30 text-gray-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50"
            >
              <option value={CostType.FIXED}>Fijo</option>
              <option value={CostType.VARIABLE}>Variable</option>
            </select>
          </div>
          <Button onClick={handleAddCost} icon={<Plus size={18} />}>Agregar</Button>
        </div>
      )}

      {/* Tabs + Table */}
      <Card noPadding className="overflow-hidden bg-[#1C1C1C] border-none text-gray-100">
        {/* Tab header */}
        <div className="flex border-b border-[#7F54F5]/20 bg-[#111111]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#FFCC00] text-[#FFCC00]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? 'bg-[#FFCC00]/20 text-[#FFCC00]' : 'bg-white/10 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-[#111111] text-gray-300 uppercase text-xs font-bold tracking-wider border-b border-[#7F54F5]/20">
            <tr>
              <th className="px-6 py-4">Ítem de Costo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-right">Monto Mensual</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7F54F5]/20">
            {activeCosts.map((cost) => {
              const isDepreciation = cost.id === DEPRECIATION_ID;
              const isDeleting = deletingId === cost.id;
              const isEditing = editingCost?.id === cost.id;

              return (
                <tr
                  key={cost.id}
                  className={`transition-colors ${isDeleting ? 'bg-red-950/30' : 'hover:bg-white/5'}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-100">{cost.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide bg-[#111111] ${
                      isDepreciation ? 'text-[#FFCC00]' :
                      cost.type === CostType.FIXED ? 'text-[#7F54F5]' : 'text-[#FD8000]'
                    }`}>
                      {isDepreciation ? 'Depreciación' : cost.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-300">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingCost.amount}
                        onChange={e => setEditingCost({ ...editingCost, amount: e.target.value })}
                        onBlur={handleSaveInlineEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveInlineEdit();
                          if (e.key === 'Escape') setEditingCost(null);
                        }}
                        autoFocus
                        className="w-32 bg-[#111111] border border-[#FFCC00]/50 rounded px-2 py-1 text-right text-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]/50"
                      />
                    ) : (
                      <span
                        onClick={() => !isDepreciation && setEditingCost({ id: cost.id, amount: String(cost.amount) })}
                        className={`group inline-flex items-center gap-1 ${!isDepreciation ? 'cursor-pointer hover:text-[#FFCC00]' : ''}`}
                        title={!isDepreciation ? 'Click para editar' : undefined}
                      >
                        {formatCurrency(cost.amount)}
                        {!isDepreciation && (
                          <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isDepreciation ? (
                      <span className="text-[10px] text-gray-600 italic">Automático</span>
                    ) : isDeleting ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-400 mr-1">¿Eliminar?</span>
                        <button
                          onClick={() => handleDelete(cost.id)}
                          className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1.5 rounded bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(cost.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {activeCosts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center">
                      {activeTab === 'fixed' && <DollarSign size={22} className="text-[#7F54F5]/60" />}
                      {activeTab === 'variable' && <TrendingUp size={22} className="text-[#FD8000]/60" />}
                      {activeTab === 'depreciation' && <PieChart size={22} className="text-[#FFCC00]/60" />}
                    </div>
                    <p className="font-semibold text-sm text-gray-400">
                      {activeTab === 'fixed' && 'Sin costos fijos aún'}
                      {activeTab === 'variable' && 'Sin costos variables aún'}
                      {activeTab === 'depreciation' && 'Sin depreciación registrada'}
                    </p>
                    <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                      {activeTab === 'depreciation'
                        ? 'Agrega activos en la sección "Finanzas" para que la depreciación aparezca aquí de forma automática.'
                        : 'Usa el formulario de arriba para agregar ítems. Presiona Enter para agregar rápido.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {activeCosts.length > 0 && (
            <tfoot className="bg-[#111111] border-t border-[#7F54F5]/20">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Subtotal:
                </td>
                <td className="px-6 py-3 text-right font-mono font-bold text-[#FFCC00]">
                  {formatCurrency(activeCosts.reduce((acc, c) => acc + c.amount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </Card>
    </div>
  );
};
