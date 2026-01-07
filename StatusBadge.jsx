import React from 'react';

const statusStyles = {
  Borrador: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Enviado: 'bg-blue-100 text-blue-800 border-blue-300',
  Aprobado: 'bg-green-100 text-green-800 border-green-300',
  default: 'bg-gray-100 text-gray-800 border-gray-300',
};

const activeStyles = 'ring-2 ring-offset-1 ring-indigo-500';

export function StatusBadge({ status, active = false }) {
  const styles = statusStyles[status] || statusStyles.default;
  const combinedClasses = `px-3 py-1 text-sm font-medium rounded-full border transition-all ${styles} ${active ? activeStyles : ''}`;

  return <span className={combinedClasses}>{status}</span>;
}