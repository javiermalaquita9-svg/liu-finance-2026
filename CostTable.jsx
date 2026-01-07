import React from 'react';

export function CostTable({ costs }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Gestión de Costos</h3>
      {/* TODO: Añadir filtros visuales aquí */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 uppercase">Monto Mensual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {costs.map(cost => (
              <tr key={cost.id}>
                <td className="py-3 px-4">{cost.item}</td>
                <td className="py-3 px-4">{cost.category}</td>
                <td className="py-3 px-4 text-right font-mono">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(cost.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}