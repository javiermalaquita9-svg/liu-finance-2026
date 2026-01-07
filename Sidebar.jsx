import React from 'react';
import { PredictiveSearch } from '../ui/PredictiveSearch';
import { StatusBadge } from '../ui/StatusBadge';

// Datos de ejemplo que podrías obtener de un estado global o API
const mockCustomers = [
  { value: '1', label: 'Cliente A (11.111.111-1)', phone: '912345678' },
  { value: '2', label: 'Cliente B (22.222.222-2)', phone: '987654321' },
];

const termTemplates = [
  { id: 't1', name: 'Plantilla Estándar' },
  { id: 't2', name: 'Plantilla Proyectos Largos' },
];

export function Sidebar({ quote, setQuote }) {
  const handleStatusChange = (newStatus) => {
    setQuote({ ...quote, status: newStatus });
  };

  return (
    <aside className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Configuración</h2>

      <div className="space-y-6">
        <div>
          <label className="font-semibold text-gray-700">Cliente</label>
          <PredictiveSearch
            options={mockCustomers}
            placeholder="Buscar por nombre, RUT, teléfono..."
            onChange={(selected) => setQuote({ ...quote, customer: selected })}
            value={quote.customer}
          />
        </div>

        <div>
          <label className="font-semibold text-gray-700 mb-2 block">Estado</label>
          <div className="flex items-center gap-2">
            {['Borrador', 'Enviado', 'Aprobado'].map((status) => (
              <button key={status} onClick={() => handleStatusChange(status)} className="focus:outline-none">
                <StatusBadge status={status} active={quote.status === status} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="terms" className="font-semibold text-gray-700">Términos y Condiciones</label>
          <select id="terms" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" value={quote.termsId || ''} onChange={(e) => setQuote({ ...quote, termsId: e.target.value })}>
            {termTemplates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}