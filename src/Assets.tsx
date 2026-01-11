import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AgencyAsset } from './types';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { generateId, formatCurrency } from './utils/formatters';
import { Trash2, Edit, Save, XCircle } from 'lucide-react';

interface AssetsContext {
  assets: AgencyAsset[];
  setAssets: React.Dispatch<React.SetStateAction<AgencyAsset[]>>;
}

export const AssetsModule: React.FC = () => {
  // Los datos ahora vienen del contexto de App.tsx
  const { assets, setAssets } = useOutletContext<AssetsContext>();

  // Estado para el formulario de nuevo activo
  const [name, setName] = useState('');
  const [initialValue, setInitialValue] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [usefulLife, setUsefulLife] = useState<number | ''>(3);

  // Estado para la edición en línea
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentAsset, setCurrentAsset] = useState<AgencyAsset | null>(null);

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
    if (!name || initialValue === '' || initialValue <= 0 || usefulLife === '' || usefulLife <= 0) {
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
    setInitialValue('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setUsefulLife(3);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este activo? Esta acción no se puede deshacer.')) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  const handleStartEdit = (asset: AgencyAsset) => {
    setEditingId(asset.id);
    setCurrentAsset(JSON.parse(JSON.stringify(asset))); // Copia profunda para edición segura
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCurrentAsset(null);
  };

  const handleSaveEdit = () => {
    if (currentAsset && currentAsset.name && currentAsset.initialValue > 0 && currentAsset.usefulLife > 0) {
      setAssets(assets.map(asset => (asset.id === editingId ? currentAsset : asset)));
      handleCancelEdit();
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentAsset) return;
    const { name, value } = e.target;
    const isNumeric = ['initialValue', 'usefulLife'].includes(name);
    const val = isNumeric ? parseFloat(value) || 0 : value;

    setCurrentAsset({
      ...currentAsset,
      [name]: val,
    });
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
            onChange={(e) => setInitialValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
            onChange={(e) => setUsefulLife(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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
                <th className="px-4 py-3 text-center">Vida Útil (años)</th>
                <th className="px-4 py-3 text-right">Valor Inicial</th>
                <th className="px-4 py-3 text-right">Depreciación Anual</th>
                <th className="px-4 py-3 text-right font-bold text-liu-text">Valor Actual</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map(asset => {
                if (editingId === asset.id && currentAsset) {
                  const annualDepreciation = currentAsset.usefulLife > 0 ? currentAsset.initialValue / currentAsset.usefulLife : 0;
                  const currentValue = calculateCurrentValue(currentAsset);
                  return (
                    <tr key={asset.id} className="bg-yellow-50">
                      <td className="px-2 py-2"><Input name="name" value={currentAsset.name} onChange={handleEditInputChange} /></td>
                      <td className="px-2 py-2"><Input name="purchaseDate" type="date" value={currentAsset.purchaseDate} onChange={handleEditInputChange} /></td>
                      <td className="px-2 py-2 text-center"><Input name="usefulLife" type="number" value={currentAsset.usefulLife} onChange={handleEditInputChange} className="w-20 text-center" /></td>
                      <td className="px-2 py-2"><Input name="initialValue" type="number" value={currentAsset.initialValue} onChange={handleEditInputChange} className="text-right" /></td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">-{formatCurrency(annualDepreciation)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(currentValue)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={handleSaveEdit}><Save size={14} className="mr-1" /> Guardar</Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="p-2 h-auto"><XCircle size={16} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const currentValue = calculateCurrentValue(asset);
                const annualDepreciation = asset.usefulLife > 0 ? asset.initialValue / asset.usefulLife : 0;
                return (
                  <tr key={asset.id}>
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(asset.purchaseDate + 'T00:00:00').toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3 text-center">{asset.usefulLife}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(asset.initialValue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-500">-{formatCurrency(annualDepreciation)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(currentValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="p-2" onClick={() => handleStartEdit(asset)} aria-label="Editar">
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(asset.id)} 
                          className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700" 
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No hay activos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};