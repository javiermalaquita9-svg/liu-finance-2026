import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Users, FileText, Settings, Briefcase, Building2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AgencyCost, AgencyService, AgencyClient, AgencyQuote, AgencySettings, TabView 
} from './types';
import { DEFAULT_SETTINGS } from './constants';
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
  const location = useLocation();
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

  // Effects for Persistence
  useEffect(() => localStorage.setItem('liu_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('liu_costs', JSON.stringify(costs)), [costs]);
  useEffect(() => localStorage.setItem('liu_services', JSON.stringify(services)), [services]);
  useEffect(() => localStorage.setItem('liu_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('liu_quotes', JSON.stringify(quotes)), [quotes]);

  // Derived Calculations
  const totalFixedCosts = costs.filter(c => c.type === 'Fijo').reduce((acc, c) => acc + c.amount, 0);
  const bepHourlyRate = calculateBEP(totalFixedCosts, settings.capacityHours);

  const getCurrentTabFromPath = (pathname: string): TabView => {
    if (pathname.startsWith('/finances')) return 'finances';
    if (pathname.startsWith('/services')) return 'services';
    if (pathname.startsWith('/clients')) return 'clients';
    if (pathname.startsWith('/quotes')) return 'quotes';
    return 'analytics'; // Default tab for '/'
  };
  const activeTab = getCurrentTabFromPath(location.pathname);

  const navigation = [
    { id: 'analytics', to: '/', label: 'Análisis', icon: <LayoutDashboard size={18} /> },
    { id: 'finances', to: '/finances', label: 'Finanzas', icon: <Wallet size={18} /> },
    { id: 'services', to: '/services', label: 'Servicios', icon: <Briefcase size={18} /> },
    { id: 'clients', to: '/clients', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'quotes', to: '/quotes', label: 'Cotizador', icon: <FileText size={18} /> },
  ];

  const handleUpdateSettings = (key: keyof AgencySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-liu-text">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-liu w-8 h-8 rounded flex items-center justify-center font-black text-xs">LIU</div>
              <span className="font-bold text-lg tracking-tight">Finance 2026</span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Nav Links */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                      ${activeTab === item.id 
                        ? 'bg-gray-100 text-liu-text' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="h-6 w-[1px] bg-gray-200"></div>
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <Building2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'finances' && (
          <CostsModule 
            costs={costs} 
            setCosts={setCosts} 
            capacity={settings.capacityHours} 
            setCapacity={(h) => handleUpdateSettings('capacityHours', h)} 
          />
        )}
        {activeTab === 'services' && (
          <ServicesModule 
            services={services} 
            setServices={setServices} 
            bepHourlyRate={bepHourlyRate}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsModule 
            costs={costs} 
            services={services} 
            capacity={settings.capacityHours}
          />
        )}
        {activeTab === 'clients' && (
          <ClientsModule 
            clients={clients} 
            setClients={setClients}
          />
        )}
        {activeTab === 'quotes' && (
          <QuotesModule 
            clients={clients} 
            services={services} 
            quotes={quotes} 
            setQuotes={setQuotes}
            settings={settings}
          />
        )}
      </main>

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <Settings className="text-liu" /> Configuración de Agencia
               </h2>
               <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                 <X size={20} />
               </button>
             </div>

             <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative group cursor-pointer">
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Cambiar</div>
                  </div>
                </div>

                <Input 
                  label="Nombre de Fantasía" 
                  value={settings.companyName} 
                  onChange={(e) => handleUpdateSettings('companyName', e.target.value)}
                />
                <Input 
                  label="RUT Empresa" 
                  value={settings.rut} 
                  onChange={(e) => handleUpdateSettings('rut', e.target.value)}
                />
                <Input 
                  label="Dirección Comercial" 
                  value={settings.address} 
                  onChange={(e) => handleUpdateSettings('address', e.target.value)}
                />
                <Input 
                  label="Email Contacto" 
                  value={settings.contactEmail} 
                  onChange={(e) => handleUpdateSettings('contactEmail', e.target.value)}
                />
                <Input 
                  label="URL Logo" 
                  value={settings.logoUrl} 
                  onChange={(e) => handleUpdateSettings('logoUrl', e.target.value)}
                />

                <div className="pt-6 border-t border-gray-100">
                  <Button className="w-full" onClick={() => setIsSettingsOpen(false)}>Guardar Cambios</Button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;