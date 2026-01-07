import React from 'react';

const borderColors = {
  blue: 'border-l-blue-500',
  green: 'border-l-green-500',
  yellow: 'border-l-yellow-500',
  red: 'border-l-red-500',
};

export function KpiCard({ title, value, children, color = 'blue' }) {
  const borderColorClass = borderColors[color] || 'border-l-gray-500';

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${borderColorClass}`}>
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      <div className="mt-1 text-3xl font-semibold text-gray-900">{value}</div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}