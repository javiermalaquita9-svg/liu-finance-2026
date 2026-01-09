import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AgencyAsset } from './types';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { generateId, formatCurrency } from './utils/formatters';

interface AssetsContext {
  assets: AgencyAsset[];
  setAssets: React.Dispatch<React.SetStateAction<AgencyAsset[]>>;
}

export const AssetsModule: React.FC = () => {
  // Los datos ahora vienen del contexto de App.tsx
  const { assets, setAssets } = useOutletContext<AssetsContext>();

  // Estado para el formulario de nuevo activo
  const [name, setName] = useState('');
  const [initialValue, setInitialValue] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [usefulLife, setUsefulLife] = useState(3);

  /**
   * Calcula el valor actual de un activo usando depreciación lineal.
   * Asume un valor residual de 0.
   */
  const calculateCurrentValue = (asset: AgencyAsset): number => {
    const purchase = new Date(asset.purchaseDate);
    const now = new Date();
    
    // Calcula los años transcurridos desde la compra
    const yearsPassed = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (yearsPassed <= 0) {
      return asset.initialValue;
    }

    if (yearsPassed >= asset.usefulLife) {
      return 0; // El activo está completamente depreciado
    }

    const annualDepreciation = asset.initialValue / asset.usefulLife;
    const totalDepreciation = annualDepreciation * yearsPassed;
    const currentValue = asset.initialValue - totalDepreciation;

    return Math.max(0, currentValue); // El valor no puede ser negativo
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || initialValue <= 0 || usefulLife <= 0) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }

    const newAsset: AgencyAsset = {
      id: generateId(),
      name,
      initialValue,
      purchaseDate,
      usefulLife,
    };

    setAssets([...assets, newAsset]);

    // Limpiar formulario
    setName('');
    setInitialValue(0);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setUsefulLife(3);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-liu-text">Gestión de Activos</h2>

      {/* Formulario para agregar activos */}
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Input
            label="Nombre del Activo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: MacBook Pro 16"
          />
          <Input
            label="Valor Inicial"
            type="number"
            value={initialValue}
            onChange={(e) => setInitialValue(parseFloat(e.target.value))}
          />
          <Input
            label="Fecha de Compra"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <Input
            label="Vida Útil (años)"
            type="number"
            value={usefulLife}
            onChange={(e) => setUsefulLife(parseInt(e.target.value))}
          />
          <Button type="submit" className="w-full">Agregar Activo</Button>
        </form>
      </Card>

      {/* Tabla de Activos */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Fecha Compra</th>
                <th className="px-4 py-3 text-right">Valor Inicial</th>
                <th className="px-4 py-3 text-right">Depreciación Anual</th>
                <th className="px-4 py-3 text-right font-bold text-liu-text">Valor Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map(asset => {
                const currentValue = calculateCurrentValue(asset);
                const annualDepreciation = asset.initialValue / asset.usefulLife;
                return (
                  <tr key={asset.id}>
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(asset.purchaseDate + 'T00:00:00').toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(asset.initialValue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-500">-{formatCurrency(annualDepreciation)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(currentValue)}</td>
                  </tr>
                );
              })}
              {assets.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">No hay activos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};