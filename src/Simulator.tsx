import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { formatCurrency } from './utils/formatters';
import { AgencyCost, AgencyService } from './types';
import { Calculator, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface SimulatorContext {
  costs: AgencyCost[];
  services: AgencyService[];
}

export const SimulatorModule: React.FC = () => {
  const { costs, services } = useOutletContext<SimulatorContext>();

  // Calculamos el costo total mensual a cubrir
  const totalCosts = useMemo(() => costs.reduce((acc, cost) => acc + Number(cost.amount), 0), [costs]);

  // Estado para el mix de ventas (cuántas unidades de cada servicio planeamos vender)
  const [mix, setMix] = useState<Record<string, number>>({});

  const handleMixChange = (serviceId: string, quantity: number) => {
    setMix(prev => ({ ...prev, [serviceId]: Math.max(0, quantity) }));
  };

  const projectedRevenue = useMemo(() => {
    return services.reduce((total, service) => {
      const qty = mix[service.id] || 0;
      return total + (service.price * qty);
    }, 0);
  }, [mix, services]);

  const balance = projectedRevenue - totalCosts;
  const isProfitable = balance >= 0;
  const progressPercentage = totalCosts > 0 ? Math.min((projectedRevenue / totalCosts) * 100, 100) : 100;

  if (services.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-xl font-bold text-gray-800">Aún no tienes servicios</h2>
        <p>Agrega servicios en la pestaña "Servicios" para poder usar el simulador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado y Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Target size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Meta (Costos Totales)</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(totalCosts)}</p>
        </Card>

        <Card className="p-6 border-l-4 border-[#FFCC00] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Calculator size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Ingreso Proyectado</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(projectedRevenue)}</p>
        </Card>

        <Card className={`p-6 border-l-4 shadow-sm ${isProfitable ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <TrendingUp size={16} className={isProfitable ? 'text-emerald-600' : 'text-red-600'} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
              {isProfitable ? 'Utilidad Estimada' : 'Faltante para Equilibrio'}
            </h3>
          </div>
          <p className={`text-3xl font-black ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
            {isProfitable ? formatCurrency(balance) : formatCurrency(Math.abs(balance))}
          </p>
        </Card>
      </div>

      {/* Barra de progreso */}
      <Card className="p-6 shadow-sm">
        <div className="flex justify-between items-end mb-2">
          <p className="text-xs font-bold uppercase text-gray-500">Progreso hacia el Punto de Equilibrio</p>
          <p className="text-lg font-black text-liu-text">{progressPercentage.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
          <div 
            className={`h-full transition-all duration-500 ${isProfitable ? 'bg-emerald-500' : 'bg-[#FFCC00]'}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escenario 1: Venta Única */}
        <Card className="p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 uppercase mb-2">Escenario 1: Venta Única</h2>
          <p className="text-xs text-gray-500 mb-6">Si vendieras <strong>SOLO</strong> un tipo de servicio, ¿cuántos necesitas vender al mes para cubrir tus costos totales?</p>
          
          <div className="space-y-4">
            {services.map(service => {
              const unitsNeeded = service.price > 0 ? Math.ceil(totalCosts / service.price) : 0;
              return (
                <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{service.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(service.price)} c/u</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-liu-text">{unitsNeeded}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">unidades</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Escenario 2: Mix de Ventas */}
        <Card className="p-6 shadow-sm border-2 border-[#FFCC00]">
          <h2 className="text-lg font-black text-gray-800 uppercase mb-2">Escenario 2: Mix de Ventas</h2>
          <p className="text-xs text-gray-500 mb-6">Combina múltiples servicios. Ingresa cuántos proyectas vender este mes de cada uno.</p>
          
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="flex gap-4 items-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{service.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(service.price)} c/u</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-center font-bold"
                    value={mix[service.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMixChange(service.id, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};