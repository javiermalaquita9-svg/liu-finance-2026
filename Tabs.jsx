import React from 'react';

export function Tabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div>
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex space-x-8 px-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`${
                activeTab === tab.name
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}