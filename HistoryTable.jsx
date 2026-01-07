import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { StatusBadge } from '../ui/StatusBadge';

export function HistoryTable({ onSelectQuote }) {
  const [quotes] = useLocalStorage('quotes', []);

  if (!quotes || quotes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50">
        No hay cotizaciones guardadas en el historial.
      </div>
    );
  }

  return (
    <div className="w-full border-t border-gray-300">
      <h2 className="text-xl font-bold p-4 bg-gray-100">Historial de Cotizaciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <tr key={quote.id} onClick={() => onSelectQuote(quote)} className="hover:bg-gray-100 cursor-pointer">
                <td className="py-4 px-6 whitespace-nowrap">{quote.id}</td>
                <td className="py-4 px-6 whitespace-nowrap">{quote.customer?.label}</td>
                <td className="py-4 px-6 whitespace-nowrap">{quote.date}</td>
                <td className="py-4 px-6 whitespace-nowrap"><StatusBadge status={quote.status} /></td>
                <td className="py-4 px-6 whitespace-nowrap font-semibold">{/* Lógica para calcular total */}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}