import React, { useState } from 'react';
import { CostsModule } from './components/modules/Costs';
import { AssetsModule } from './Assets';
import { DollarSign, Package } from 'lucide-react';

type FinanceTab = 'costs' | 'assets';

const tabs: { key: FinanceTab; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    key: 'costs',
    label: 'Costos',
    icon: <DollarSign size={15} />,
    hint: 'Fijos, variables y depreciación',
  },
  {
    key: 'assets',
    label: 'Activos',
    icon: <Package size={15} />,
    hint: 'Equipos y herramientas',
  },
];

export const FinancesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('costs');

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex items-end gap-0 border-b border-[#7F54F5]/20 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[#FFCC00] text-[#FFCC00]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20'
            }`}
          >
            <span className={activeTab === tab.key ? 'text-[#FFCC00]' : 'text-gray-500'}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {activeTab !== tab.key && (
              <span className="hidden md:inline text-[10px] text-gray-600 font-normal ml-1">
                — {tab.hint}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'costs' && <CostsModule />}
      {activeTab === 'assets' && <AssetsModule />}
    </div>
  );
};
