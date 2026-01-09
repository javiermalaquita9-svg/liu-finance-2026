import React, { useState } from 'react';
import { CostsModule } from './components/modules/Costs';
import { AssetsModule } from './Assets';

type FinanceTab = 'costs' | 'assets';

export const FinancesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('costs');

  const getTabClass = (tab: FinanceTab) => {
    const baseClass = "px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none";
    if (activeTab === tab) {
      return `${baseClass} bg-liu text-white shadow-sm`;
    }
    return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-liu-text">Finanzas</h1>
        <div className="flex items-center p-1 bg-gray-200 rounded-lg space-x-1">
          <button onClick={() => setActiveTab('costs')} className={getTabClass('costs')}>
            Costos
          </button>
          <button onClick={() => setActiveTab('assets')} className={getTabClass('assets')}>
            Activos
          </button>
        </div>
      </div>

      {activeTab === 'costs' && <CostsModule />}
      {activeTab === 'assets' && <AssetsModule />}
    </div>
  );
};