import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Users, FileText, Settings, Briefcase, Building2, X, Calculator } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  AgencyCost, AgencyService, AgencyClient, AgencyQuote, AgencySettings, TabView, TermTemplate, AgencyAsset, CostType, MonthlySale
} from './types';
import { DEFAULT_SETTINGS, DEFAULT_TERMS } from './constants';
import { calculateBEP } from './utils/formatters';

// Modules
import { CostsModule } from './components/modules/Costs';
import { ServicesModule } from './components/modules/Services';
import { AnalyticsModule } from './components/modules/Analytics';
import { ClientsModule } from './components/modules/Clients';
import { QuotesModule } from './components/modules/Quotes';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

const App: React.FC = () => {
  // Global State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Data Stores (persisted in a real app, just state here for demo)
  const [settings, setSettings] = useState<AgencySettings>(() => {
    const saved = localStorage.getItem('liu_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [costs, setCosts] = useState<AgencyCost[]>(() => {
    const saved = localStorage.getItem('liu_costs');
    return saved ? JSON.parse(saved) : [];
  });

  const [services, setServices] = useState<AgencyService[]>(() => {
    const saved = localStorage.getItem('liu_services');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<AgencyClient[]>(() => {
    const saved = localStorage.getItem('liu_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [quotes, setQuotes] = useState<AgencyQuote[]>(() => {
    const saved = localStorage.getItem('liu_quotes');
    return saved ? JSON.parse(saved) : [];
  });

  const [assets, setAssets] = useState<AgencyAsset[]>(() => {
    const saved = localStorage.getItem('liu_assets');
    return saved ? JSON.parse(saved) : [];
  });

  const [termTemplates, setTermTemplates] = useState<TermTemplate[]>(() => {
    const saved = localStorage.getItem('liu_term_templates');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'General', content: DEFAULT_TERMS },
      { id: '2', name: 'Diseño Web', content: `Términos y Condiciones para Diseño Web:\n- Se requiere un 50% de anticipo.\n- El cliente debe proveer todo el contenido (textos e imágenes).\n- Se incluyen 2 rondas de revisiones.` },
      { id: '3', name: 'Marketing', content: `Términos y Condiciones para Marketing Digital:\n- Contrato mínimo de 3 meses.\n- El pago es mensual y por adelantado.\n- Los resultados pueden variar.` },
    ];
  });

  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>(() => {
    const saved = localStorage.getItem('liu_monthly_sales');
    return saved ? JSON.parse(saved) : [];
  });

  // Función auxiliar para evitar bucles infinitos de sincronización entre pestañas
  const saveToStorage = (key: string, data: any) => {
    const stringified = JSON.stringify(data);
    if (localStorage.getItem(key) !== stringified) {
      localStorage.setItem(key, stringified);
    }
  };

  // Effects for Persistence
  useEffect(() => saveToStorage('liu_settings', settings), [settings]);
  useEffect(() => saveToStorage('liu_costs', costs), [costs]);
  useEffect(() => saveToStorage('liu_services', services), [services]);
  useEffect(() => saveToStorage('liu_clients', clients), [clients]);
  useEffect(() => saveToStorage('liu_quotes', quotes), [quotes]);
  useEffect(() => saveToStorage('liu_assets', assets), [assets]);
  useEffect(() => saveToStorage('liu_term_templates', termTemplates), [termTemplates]);
  useEffect(() => saveToStorage('liu_monthly_sales', monthlySales), [monthlySales]);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'liu_settings' && e.newValue) setSettings(JSON.parse(e.newValue));
      if (e.key === 'liu_costs' && e.newValue) setCosts(JSON.parse(e.newValue));
      if (e.key === 'liu_services' && e.newValue) setServices(JSON.parse(e.newValue));
      if (e.key === 'liu_clients' && e.newValue) setClients(JSON.parse(e.newValue));
      if (e.key === 'liu_quotes' && e.newValue) setQuotes(JSON.parse(e.newValue));
      if (e.key === 'liu_assets' && e.newValue) setAssets(JSON.parse(e.newValue));
      if (e.key === 'liu_term_templates' && e.newValue) setTermTemplates(JSON.parse(e.newValue));
      if (e.key === 'liu_monthly_sales' && e.newValue) setMonthlySales(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Derived Calculations

  // 1. Calcular la depreciación mensual total de todos los activos.
  const totalMonthlyDepreciation = assets.reduce((acc, asset) => {
    // Asegurarse de que la vida útil sea mayor a cero para evitar división por cero.
    if (asset.usefulLife > 0) {
      // La depreciación se calcula anualmente y luego se divide por 12 para obtener el costo mensual.
      const annualDepreciation = asset.initialValue / asset.usefulLife;
      return acc + (annualDepreciation / 12);
    }
    return acc;
  }, 0);

  // 2. Crear un "costo fijo virtual" para la depreciación.
  // Esto permite que todos los demás módulos (Análisis, Costos) lo incluyan automáticamente.
  const depreciationCost: AgencyCost | null = totalMonthlyDepreciation > 0 ? {
    id: 'depreciation-virtual-cost', // ID especial para identificarlo y tratarlo como solo lectura
    name: 'Depreciación de Activos',
    amount: totalMonthlyDepreciation,
    category: 'Depreciación', // Añadimos la propiedad 'category'
    type: CostType.FIXED,
  } : null;

  // 3. Agregar la depreciación a la lista de costos y calcular el total de costos fijos.
  const costsWithDepreciation = depreciationCost ? [...costs, depreciationCost] : costs;
  const totalFixedCosts = costsWithDepreciation.filter(c => c.type === CostType.FIXED).reduce((acc, c) => acc + c.amount, 0);
  const bepHourlyRate = calculateBEP(totalFixedCosts, settings.capacityHours);

  const navigation = [
    { to: '/', label: 'Análisis', icon: <LayoutDashboard size={18} /> },
    { to: '/finances', label: 'Finanzas', icon: <Wallet size={18} /> },
    { to: '/services', label: 'Servicios', icon: <Briefcase size={18} /> },
    { to: '/clients', label: 'Clientes', icon: <Users size={18} /> },
    { to: '/quotes', label: 'Cotizador', icon: <FileText size={18} /> },
    { to: '/simulator', label: 'Simulador', icon: <Calculator size={18} /> },
  ];

  const handleUpdateSettings = (key: keyof AgencySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // --- New functions for Costs ---
  const handleAddCost = (newCost: AgencyCost) => {
    setCosts((prev) => [...prev, newCost]);
  };

  const handleUpdateCost = (id: string, amount: number) => {
    setCosts((prev) => prev.map((c) => (c.id === id ? { ...c, amount } : c)));
  };

  const handleDeleteCost = (id: string) => {
    setCosts((prev) => prev.filter((c) => c.id !== id));
  };

  // --- New functions for Services and Clients ---

  const handleAddService = (newService: AgencyService) => {
    setServices((prev) => [...prev, newService]);
  };

  const handleUpdateService = (id: string, updatedService: AgencyService) => {
    setServices((prev) =>
      prev.map((service) => (service.id === id ? updatedService : service))
    );
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const handleAddClient = (newClient: AgencyClient) => {
    setClients((prev) => [...prev, newClient]);
  };

  const handleUpdateClient = (id: string, updatedClient: AgencyClient) => {
    setClients((prev) =>
      prev.map((client) => (client.id === id ? updatedClient : client))
    );
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((quote) => quote.id !== id));
  };

  const handleUpdateQuote = (id: string, updatedQuote: AgencyQuote) => {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === id ? updatedQuote : quote))
    );
  };
  // --- End new functions ---

  return (
    <div className="min-h-screen bg-[#111111] font-sans text-gray-100">
      {/* Top Header */}
      <header className="bg-[#111111] border-b border-[#7F54F5]/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFCC00] text-[#111111] w-8 h-8 rounded flex items-center justify-center font-black text-xs">LIU</div>
              <span className="font-bold text-lg tracking-tight text-[#FFCC00]">Finance 2026</span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Nav Links */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 border ${
                        isActive ? 'border-[#FD8000] text-[#FD8000] bg-[#FD8000]/10 shadow-sm' : 'border-transparent text-gray-300 hover:text-[#FD8000]'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="h-6 w-[1px] bg-[#7F54F5]/30"></div>
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full border border-transparent hover:text-[#FD8000] text-gray-300 transition-all duration-200"
              >
                <Building2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* react-router-dom renderizará el componente de la página correcta aquí */}
        <Outlet
          context={{ // Pasamos la lista de costos que ya incluye la depreciación
            costs: costsWithDepreciation, monthlySales, setMonthlySales,
            handleAddCost, handleUpdateCost, handleDeleteCost, services, setServices, clients, setClients, quotes, setQuotes, settings, handleUpdateSettings, bepHourlyRate, assets, setAssets,
            handleAddService, handleUpdateService, handleDeleteService,
            handleAddClient, handleUpdateClient, handleDeleteClient, handleUpdateQuote, handleDeleteQuote,
            termTemplates, setTermTemplates
          }}
        />
      </main>

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
           <div className="relative w-full max-w-md bg-[#1C1C1C] text-gray-100 h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-[#7F54F5]/30">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <Settings className="text-[#FFCC00]" /> Configuración de Agencia
               </h2>
               <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-[#FD8000] hover:text-white rounded-full transition-colors">
                 <X size={20} />
               </button>
             </div>

             <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="w-40 h-20 bg-[#7F54F5]/10 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-[#7F54F5] relative group cursor-pointer">
                    <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Cambiar</div>
                  </div>
                </div>

                <Input 
                  label="Nombre de Fantasía" 
                  value={settings.companyName} 
                  onChange={(e) => handleUpdateSettings('companyName', e.target.value)}
                  className="!bg-[#111111] !text-gray-100 !border-[#7F54F5]/30 placeholder-gray-500 focus:!border-[#FFCC00] focus:!ring-[#FFCC00]/50"
                />
                <Input 
                  label="RUT Empresa" 
                  value={settings.rut} 
                  onChange={(e) => handleUpdateSettings('rut', e.target.value)}
                  className="!bg-[#111111] !text-gray-100 !border-[#7F54F5]/30 placeholder-gray-500 focus:!border-[#FFCC00] focus:!ring-[#FFCC00]/50"
                />
                <Input 
                  label="Dirección Comercial" 
                  value={settings.address} 
                  onChange={(e) => handleUpdateSettings('address', e.target.value)}
                  className="!bg-[#111111] !text-gray-100 !border-[#7F54F5]/30 placeholder-gray-500 focus:!border-[#FFCC00] focus:!ring-[#FFCC00]/50"
                />
                <Input 
                  label="Email Contacto" 
                  value={settings.contactEmail} 
                  onChange={(e) => handleUpdateSettings('contactEmail', e.target.value)}
                  className="!bg-[#111111] !text-gray-100 !border-[#7F54F5]/30 placeholder-gray-500 focus:!border-[#FFCC00] focus:!ring-[#FFCC00]/50"
                />
                <Input 
                  label="URL Logo" 
                  value={settings.logoUrl} 
                  onChange={(e) => handleUpdateSettings('logoUrl', e.target.value)}
                  className="!bg-[#111111] !text-gray-100 !border-[#7F54F5]/30 placeholder-gray-500 focus:!border-[#FFCC00] focus:!ring-[#FFCC00]/50"
                />

                <div className="pt-6 border-t border-[#7F54F5]/30">
                  <Button className="w-full bg-[#FD8000] text-white hover:bg-[#E07200] border-none shadow-sm transition-colors" onClick={() => setIsSettingsOpen(false)}>Guardar Cambios</Button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;