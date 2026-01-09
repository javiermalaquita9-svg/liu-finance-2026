import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Users, FileText, Settings, Briefcase, Building2, X } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  AgencyCost, AgencyService, AgencyClient, AgencyQuote, AgencySettings, TabView, TermTemplate
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

  const [termTemplates, setTermTemplates] = useState<TermTemplate[]>(() => {
    const saved = localStorage.getItem('liu_term_templates');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'General', content: DEFAULT_TERMS },
      { id: '2', name: 'Diseño Web', content: `Términos y Condiciones para Diseño Web:\n- Se requiere un 50% de anticipo.\n- El cliente debe proveer todo el contenido (textos e imágenes).\n- Se incluyen 2 rondas de revisiones.` },
      { id: '3', name: 'Marketing', content: `Términos y Condiciones para Marketing Digital:\n- Contrato mínimo de 3 meses.\n- El pago es mensual y por adelantado.\n- Los resultados pueden variar.` },
    ];
  });

  // Effects for Persistence
  useEffect(() => localStorage.setItem('liu_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('liu_costs', JSON.stringify(costs)), [costs]);
  useEffect(() => localStorage.setItem('liu_services', JSON.stringify(services)), [services]);
  useEffect(() => localStorage.setItem('liu_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('liu_quotes', JSON.stringify(quotes)), [quotes]);
  useEffect(() => localStorage.setItem('liu_term_templates', JSON.stringify(termTemplates)), [termTemplates]);

  // Derived Calculations
  const totalFixedCosts = costs.filter(c => c.type === 'Fijo').reduce((acc, c) => acc + c.amount, 0);
  const bepHourlyRate = calculateBEP(totalFixedCosts, settings.capacityHours);

  const navigation = [
    { to: '/', label: 'Análisis', icon: <LayoutDashboard size={18} /> },
    { to: '/finances', label: 'Finanzas', icon: <Wallet size={18} /> },
    { to: '/services', label: 'Servicios', icon: <Briefcase size={18} /> },
    { to: '/clients', label: 'Clientes', icon: <Users size={18} /> },
    { to: '/quotes', label: 'Cotizador', icon: <FileText size={18} /> },
  ];

  const handleUpdateSettings = (key: keyof AgencySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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

  const handleUpdateQuote = (id: string, updatedQuote: AgencyQuote) => {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === id ? updatedQuote : quote))
    );
  };
  // --- End new functions ---

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
                {navigation.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        isActive ? 'bg-gray-100 text-liu-text' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
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
        {/* react-router-dom renderizará el componente de la página correcta aquí */}
        <Outlet
          context={{
            costs, setCosts, services, setServices, clients, setClients, quotes, setQuotes, settings, handleUpdateSettings, bepHourlyRate,
            handleAddService, handleUpdateService, handleDeleteService,
            handleAddClient, handleUpdateClient, handleDeleteClient, handleUpdateQuote,
            termTemplates, setTermTemplates
          }}
        />
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
                  <div className="w-40 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative group cursor-pointer">
                    <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
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