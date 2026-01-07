import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, DollarSign, BarChart2, Users, FileText, Plus, Search, Trash2, Edit, X, Calculator, Upload, Building, MoreVertical, Wallet, Monitor, CloudUpload, Mail, Phone, MapPin, UserCheck, User, Save, Download, RefreshCw, Edit3, LogOut } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// =================================================================
// 1. HOOKS & UTILS
// =================================================================

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const formatCurrency = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

const formatRut = (rut) => {
  if (!rut) return '';
  let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  let body = cleanRut.slice(0, -1);
  let verifier = cleanRut.slice(-1);
  let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${verifier}`;
};

// =================================================================
// 2. REUSABLE UI COMPONENTS
// =================================================================

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-[#FFCC00] text-black hover:bg-yellow-400 focus:ring-[#FFCC00] shadow-sm',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };
  return <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ label, id, theme, className = '', ...props }) => {
  const themeClasses = {
    default: 'bg-white border border-gray-300 rounded-md shadow-sm focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]',
    paper: 'bg-transparent border-none focus:bg-yellow-50 focus:ring-0',
  };
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{label}</label>}
      <input id={id} className={`w-full p-2 text-sm ${themeClasses[theme] || themeClasses.default} ${className}`} {...props} />
    </div>
  );
};

const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// = a.k.a. PredictiveSearch
const Select = ({ label, id, options, ...props }) => (
    <div>
        {label && <label htmlFor={id} className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{label}</label>}
        <select id={id} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]" {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// =================================================================
// LOGIN SCREEN COMPONENT
// =================================================================

const LoginScreen = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Card className="p-8 text-center max-w-sm">
        <div className="w-16 h-16 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign size={32} className="text-black" />
        </div>
        <h1 className="text-2xl font-black mb-2">AgencyFinance</h1>
        <p className="text-gray-500 mb-6">Tu centro de control financiero. Inicia sesión para continuar.</p>
        <Button onClick={onLogin} className="w-full">
          <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2c-27.3-26.1-63.5-42.1-104.1-42.1-83.2 0-151.2 67.9-151.2 151.2s68 151.2 151.2 151.2c96.5 0 133.3-67.4 137.2-101.2H248v-95.1h236.3c2.3 12.7 3.7 26.1 3.7 40.8z"></path></svg>
          Iniciar Sesión con Google
        </Button>
      </Card>
    </div>
  );
};

// =================================================================
// 3. MAIN FUNCTIONAL MODULES (Sub-components)
// =================================================================

const CostStructure = ({ costs, setCosts, settings, setSettings, estimatedIncome, setEstimatedIncome }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [newAsset, setNewAsset] = useState({ name: '', value: 0, years: 3 });
  
  // Formulario de ingreso rápido
  const [quickCost, setQuickCost] = useState({ name: '', amount: '', type: 'Fijo', category: 'Operativo' });

  // Cálculos de KPIs
  const totalCosts = useMemo(() => costs.reduce((acc, cost) => acc + cost.amount, 0), [costs]);
  const totalFixedCosts = useMemo(() => costs.filter(c => c.type === 'Fijo').reduce((acc, cost) => acc + cost.amount, 0), [costs]);
  const bepHourValue = useMemo(() => (settings.capacityHours > 0 ? totalFixedCosts / settings.capacityHours : 0), [totalFixedCosts, settings.capacityHours]);
  const cashFlowResult = estimatedIncome - totalCosts;

  const handleAddQuickCost = () => {
    if (!quickCost.name || !quickCost.amount) return;
    setCosts([...costs, { ...quickCost, amount: Number(quickCost.amount), id: Date.now() }]);
    setQuickCost({ name: '', amount: '', type: 'Fijo', category: 'Operativo' });
  };

  const handleDeleteCost = (id) => {
    setCosts(costs.filter(c => c.id !== id));
  };

  const handleImportTSV = () => {
    const lines = importText.split('\n');
    const newCosts = lines.map(line => {
      const [name, amount, type, category] = line.split('\t');
      if (name && amount) {
        return { id: Math.random(), name, amount: Number(amount.replace(/[^0-9]/g, '')), type: type || 'Fijo', category: category || 'General' };
      }
      return null;
    }).filter(Boolean);
    setCosts([...costs, ...newCosts]);
    setIsImportModalOpen(false);
    setImportText('');
  };

  const handleAddAsset = () => {
    const monthlyDepreciation = newAsset.value / (newAsset.years * 12);
    setCosts([...costs, { 
      id: Date.now(), 
      name: `Depreciación: ${newAsset.name}`, 
      amount: Math.round(monthlyDepreciation), 
      type: 'Fijo', 
      category: 'Tecnología',
      isAsset: true 
    }]);
    setIsAssetModalOpen(false);
    setNewAsset({ name: '', value: 0, years: 3 });
  };

  const categories = ['Administrativo', 'Operativo', 'Tecnología', 'RRHH', 'Ventas'];

  return (
    <div className="p-6 space-y-6">
      {/* 1. Panel Superior de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4 border-l-4 border-[#7F54F5]">
          <h3 className="text-xs font-bold uppercase text-gray-500">Costos Mensuales</h3>
          <p className="text-2xl font-black">{formatCurrency(totalCosts)}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold">FIJOS: {formatCurrency(totalFixedCosts)}</p>
        </Card>
        
        <Card className="p-4 border-l-4 border-[#FFCC00]">
          <h3 className="text-xs font-bold uppercase text-gray-500">Capacidad (Horas)</h3>
          <input 
            type="number"
            value={settings.capacityHours}
            onChange={e => setSettings(s => ({...s, capacityHours: Number(e.target.value)}))}
            className="text-2xl font-black bg-transparent focus:outline-none w-full p-0"
          />
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">Horas Facturables / Mes</p>
        </Card>

        <Card className="p-4 border-l-4 border-[#FD8000]">
          <h3 className="text-xs font-bold uppercase text-gray-500">Costo Hora B.E.P.</h3>
          <p className="text-2xl font-black">{formatCurrency(bepHourValue)}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">Punto de Equilibrio</p>
        </Card>

        <Card className={`p-4 border-l-4 ${cashFlowResult >= 0 ? 'border-[#7F54F5]' : 'border-red-500'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Ingresos:</span>
            <input 
              type="number" 
              className="text-[10px] font-bold bg-gray-50 rounded px-1 w-20 focus:outline-none"
              value={estimatedIncome}
              onChange={e => setEstimatedIncome(Number(e.target.value))}
            />
          </div>
          <p className={`text-2xl font-black ${cashFlowResult >= 0 ? 'text-[#7F54F5]' : 'text-red-500'}`}>
            {formatCurrency(cashFlowResult)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase">Proyección Flujo Caja</p>
        </Card>
      </div>

      {/* 2. Barra de Herramientas */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#FFCC00] rounded-lg">
            <Wallet size={20} className="text-black" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Registro de Gastos</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            <CloudUpload size={16} /> Importar
          </Button>
          <Button variant="secondary" onClick={() => setIsAssetModalOpen(true)}>
            <Monitor size={16} /> + Activo
          </Button>
        </div>
      </div>

      {/* 3. Formulario de Ingreso Rápido */}
      <Card className="p-4 bg-gray-50 border-dashed border-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Input label="Concepto" placeholder="Ej: Suscripción Adobe" value={quickCost.name} onChange={e => setQuickCost({...quickCost, name: e.target.value})} />
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Categoría</label>
            <select className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md" value={quickCost.category} onChange={e => setQuickCost({...quickCost, category: e.target.value})}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Input label="Monto" type="number" value={quickCost.amount} onChange={e => setQuickCost({...quickCost, amount: e.target.value})} />
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tipo</label>
            <select className="w-full p-2 text-sm bg-white border border-gray-300 rounded-md" value={quickCost.type} onChange={e => setQuickCost({...quickCost, type: e.target.value})}>
              <option value="Fijo">Fijo</option>
              <option value="Variable">Variable</option>
            </select>
          </div>
          <Button onClick={handleAddQuickCost} className="w-full"><Plus size={16} /> Añadir</Button>
        </div>
      </Card>

      {/* 4. Tabla de Costos */}
      <Card className="p-4">
        <table className="min-w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="py-3 px-3 text-left text-[10px] font-bold text-gray-400 uppercase">Concepto</th>
              <th className="py-3 px-3 text-left text-[10px] font-bold text-gray-400 uppercase">Categoría</th>
              <th className="py-3 px-3 text-left text-[10px] font-bold text-gray-400 uppercase">Tipo</th>
              <th className="py-3 px-3 text-right text-[10px] font-bold text-gray-400 uppercase">Monto</th>
              <th className="py-3 px-3 text-center text-[10px] font-bold text-gray-400 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody>
            {costs.map(cost => (
              <tr key={cost.id} className="border-b border-gray-100">
                <td className="py-3 px-3 text-sm font-medium flex items-center gap-2">
                  {cost.isAsset && <Monitor size={14} className="text-blue-500" />}
                  {cost.name}
                </td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-full uppercase">
                    {cost.category}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    cost.type === 'Fijo' ? 'bg-purple-100 text-[#7F54F5]' : 'bg-orange-100 text-[#FD8000]'
                  }`}>
                    {cost.type}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-sm">{formatCurrency(cost.amount)}</td>
                <td className="py-3 px-3 text-center">
                  <button onClick={() => handleDeleteCost(cost.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modales */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-black uppercase mb-2">Importar desde Excel/TSV</h3>
          <p className="text-xs text-gray-500 mb-4">Pega tus datos con formato: Concepto [TAB] Monto [TAB] Tipo [TAB] Categoría</p>
          <textarea 
            className="w-full h-48 p-3 text-xs font-mono border rounded-md focus:ring-[#FFCC00] focus:border-[#FFCC00]"
            placeholder="Sueldo Juan	1200000	Fijo	RRHH"
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleImportTSV}>Procesar Carga</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={20} className="text-[#FFCC00]" />
            <h3 className="text-lg font-black uppercase">Calculadora de Activos</h3>
          </div>
          <div className="space-y-4">
            <Input label="Nombre del Equipo" placeholder="Ej: MacBook Pro M3" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
            <Input label="Valor de Compra" type="number" value={newAsset.value} onChange={e => setNewAsset({...newAsset, value: Number(e.target.value)})} />
            <Input label="Vida Útil (Años)" type="number" value={newAsset.years} onChange={e => setNewAsset({...newAsset, years: Number(e.target.value)})} />
            
            <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Depreciación Mensual Estimada:</p>
              <p className="text-xl font-black text-blue-700">
                {formatCurrency(newAsset.value / (newAsset.years * 12) || 0)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAsset}>Agregar a Costos Fijos</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ServicesManager = ({ services, setServices, bepHourValue }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newService, setNewService] = useState({ name: '', description: '', hours: 1, margin: 30 });

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const costoBase = newService.hours * bepHourValue;
  const precioSugerido = newService.margin < 100 ? costoBase / (1 - newService.margin / 100) : 0;

  const handleSave = () => {
    if (!newService.name) return;
    setServices(s => [...s, { ...newService, id: Date.now(), price: precioSugerido }]);
    setIsModalOpen(false);
    setNewService({ name: '', description: '', hours: 1, margin: 30 });
  };

  const handleDelete = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  const getMarginBadgeStyle = (margin) => {
    if (margin >= 50) return 'bg-[#FFCC00] text-black';
    if (margin >= 30) return 'bg-[#7F54F5] text-white';
    return 'bg-[#FD8000] text-white';
  };

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen">
      {/* A. Barra de Herramientas (Header) */}
      <Card className="p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFCC00] rounded-lg">
            <Calculator size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Matriz de Servicios</h2>
            <p className="text-xs font-bold text-gray-500 uppercase">
              Costo Hora Base: <span className="text-[#FFCC00]">{formatCurrency(bepHourValue)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar servicio..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#FFCC00] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nuevo Servicio
          </Button>
        </div>
      </Card>

      {/* C. Grid de Tarjetas de Servicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <Card key={service.id} className="relative p-5 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className={`absolute top-4 right-4 text-[10px] font-black px-2 py-1 rounded-full uppercase ${getMarginBadgeStyle(service.margin)}`}>
              {service.margin}% Margen
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[#111111] pr-16">{service.name}</h3>
              <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">{service.description || 'Sin descripción.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Horas</p>
                <p className="text-sm font-bold text-[#111111]">{service.hours}h</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Costo Interno</p>
                <p className="text-sm font-bold text-[#111111]">{formatCurrency(service.hours * bepHourValue)}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Precio de Venta</p>
                <p className="text-xl font-black text-[#7F54F5]">{formatCurrency(service.price)}</p>
              </div>
              <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* B. Modal de Creación */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-xl font-black text-[#111111] uppercase mb-6">Nuevo Servicio</h3>
          <div className="space-y-4">
            <Input
              label="Nombre del Servicio"
              placeholder="Ej: Branding Corporativo"
              value={newService.name}
              onChange={e => setNewService({ ...newService, name: e.target.value })}
            />
            <div className="w-full">
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Descripción Corta</label>
              <textarea
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#FFCC00] focus:border-[#FFCC00] focus:outline-none"
                rows="2"
                value={newService.description}
                onChange={e => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Horas Estimadas"
                type="number"
                value={newService.hours}
                onChange={e => setNewService({ ...newService, hours: Number(e.target.value) })}
              />
              <Input
                label="Margen %"
                type="number"
                value={newService.margin}
                onChange={e => setNewService({ ...newService, margin: Number(e.target.value) })}
              />
            </div>

            {/* Calculadora en Tiempo Real */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Costo Base:</span>
                <span className="text-sm font-bold text-[#111111]">{formatCurrency(costoBase)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 uppercase pb-1">Precio Sugerido:</span>
                <span className="text-2xl font-black text-[#7F54F5]">{formatCurrency(precioSugerido)}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <Button onClick={handleSave}>Guardar Servicio</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ClientsManager = ({ clients, setClients, quotes, setActiveTab, onNewQuoteForClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    rut: '',
    giro: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setNewClient(c => ({ ...c, rut: formatted }));
  };

  const handleSave = () => {
    if (!newClient.name) return;
    setClients(cs => [...cs, { ...newClient, id: Date.now(), lastTotal: 0 }]);
    setIsModalOpen(false);
    setNewClient({ name: '', rut: '', giro: '', email: '', phone: '', address: '' });
  };

  const handleDeleteClient = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen">
      {/* A. Barra de Herramientas (Header) */}
      <Card className="p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFCC00] rounded-lg">
            <Users size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Gestión de Clientes</h2>
            <p className="text-xs font-bold text-gray-500 uppercase">Base de datos de clientes y su historial de cotizaciones.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#FFCC00] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nuevo Cliente
          </Button>
        </div>
      </Card>

      {/* C. Grid de Tarjetas de Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const clientQuotes = quotes.filter(q => q.customer?.label.includes(client.name));
          return (
            <Card key={client.id} className="p-5 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111111]">{client.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#7F54F5]/10 text-[#7F54F5] rounded-full uppercase">
                      {client.rut}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Eliminar Cliente"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={14} /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={14} /> {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} /> {client.address}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Última Compra</p>
                    <p className="text-sm font-black text-[#FFCC00]">{formatCurrency(client.lastTotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Cotizaciones</p>
                    <p className="text-sm font-black text-[#111111]">{clientQuotes.length}</p>
                  </div>
                </div>

                <div className="max-h-24 overflow-y-auto bg-gray-50 rounded p-2 mb-4 space-y-1">
                  {clientQuotes.length > 0 ? (
                    clientQuotes.map(q => (
                      <div key={q.id} className="flex justify-between text-[10px] font-medium text-gray-600">
                        <span>{q.id}</span>
                        <span>{formatCurrency(q.total || 0)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 italic text-center">Sin historial</p>
                  )}
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    onNewQuoteForClient(client);
                    setActiveTab('Cotizador');
                  }}
                >
                  <FileText size={16} /> Nueva Cotización
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck size={24} className="text-[#FFCC00]" />
            <h3 className="text-xl font-black text-[#111111] uppercase">Nuevo Cliente</h3>
          </div>
          <div className="space-y-4">
            <Input
              label="Razón Social / Nombre"
              placeholder="Ej: Inversiones Tech SpA"
              value={newClient.name}
              onChange={e => setNewClient({ ...newClient, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="RUT"
                placeholder="12.345.678-9"
                value={newClient.rut}
                onChange={handleRutChange}
              />
              <Input
                label="Giro Comercial"
                placeholder="Ej: Servicios TI"
                value={newClient.giro}
                onChange={e => setNewClient({ ...newClient, giro: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="contacto@empresa.cl"
                value={newClient.email}
                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
              />
              <Input
                label="Teléfono"
                placeholder="+56 9 ..."
                value={newClient.phone}
                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </div>
            <Input
              label="Ciudad / Dirección"
              placeholder="Ej: Santiago, Chile"
              value={newClient.address}
              onChange={e => setNewClient({ ...newClient, address: e.target.value })}
            />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <Button onClick={handleSave}>Guardar Cliente</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const TC_TEMPLATES = {
  Estándar: "Validez de la oferta: 15 días. Forma de pago: 50% anticipado, 50% contra entrega.",
  "Desarrollo Web": "Incluye 3 meses de soporte técnico. No incluye hosting ni dominio.",
  "Retainer Mensual": "Servicio mensual recurrente. Facturación los primeros 5 días de cada mes."
};

const QuoteBuilder = ({ quotes, setQuotes, clients, setClients, services, settings, preloadedClient, setPreloadedClient }) => {
  const [currentQuote, setCurrentQuote] = useState({
    id: `COT-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: '',
    status: 'Borrador',
    terms: TC_TEMPLATES.Estándar,
    items: [],
    customer: { name: '', rut: '', giro: '', email: '', phone: '', address: '' }
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  useEffect(() => {
    if (preloadedClient) {
      setCurrentQuote(prev => ({
        ...prev,
        customer: {
          name: preloadedClient.name || '',
          rut: preloadedClient.rut || '',
          giro: preloadedClient.giro || '',
          email: preloadedClient.email || '',
          phone: preloadedClient.phone || '',
          address: preloadedClient.address || ''
        }
      }));
      setPreloadedClient(null);
    }
  }, [preloadedClient, setPreloadedClient]);

  useEffect(() => {
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.rut.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(clientSearch))
    );
  }, [clients, clientSearch]);

  const handleAddService = () => {
    const service = services.find(s => s.id.toString() === selectedServiceId);
    if (service) {
      setCurrentQuote(prev => ({
        ...prev,
        items: [...prev.items, { 
          id: Date.now(), 
          description: service.name, 
          subDescription: service.description,
          quantity: 1, 
          price: service.price 
        }]
      }));
      setSelectedServiceId('');
    }
  };

  const totals = useMemo(() => {
    const subtotal = currentQuote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [currentQuote.items]);

  const handleSave = () => {
    const existingClientIndex = clients.findIndex(c => c.rut === currentQuote.customer.rut);
    if (existingClientIndex > -1) {
      const updatedClients = [...clients];
      updatedClients[existingClientIndex] = { ...updatedClients[existingClientIndex], ...currentQuote.customer, lastTotal: totals.total };
      setClients(updatedClients);
    } else if (currentQuote.customer.name && currentQuote.customer.rut) {
      setClients([...clients, { ...currentQuote.customer, id: Date.now(), lastTotal: totals.total }]);
    }

    const existingQuoteIndex = quotes.findIndex(q => q.id === currentQuote.id);
    const quoteToSave = { ...currentQuote, total: totals.total };
    if (existingQuoteIndex > -1) {
      const updatedQuotes = [...quotes];
      updatedQuotes[existingQuoteIndex] = quoteToSave;
      setQuotes(updatedQuotes);
    } else {
      setQuotes([...quotes, quoteToSave]);
    }
    alert("Cotización guardada y cliente actualizado.");
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('quote-sheet');
    element.classList.add('pdf-mode');
    
    const opt = {
      margin: 0,
      filename: `${currentQuote.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().from(element).set(opt).save().then(() => {
      element.classList.remove('pdf-mode');
    });
  };

  const handleNew = () => {
    setCurrentQuote({
      id: `COT-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryDate: '',
      status: 'Borrador',
      terms: TC_TEMPLATES.Estándar,
      items: [],
      customer: { name: '', rut: '', giro: '', email: '', phone: '', address: '' }
    });
    setClientSearch('');
  };

  const statusColors = {
    Borrador: 'bg-gray-500',
    Enviado: 'bg-blue-500',
    Aprobado: 'bg-emerald-500',
    Rechazado: 'bg-red-500'
  };

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar (33%) */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Cargar Cliente */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Cargar Cliente</h3>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar por Nombre, RUT o Teléfono..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#FFCC00] focus:outline-none"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientResults(true);
                  }}
                />
              </div>
              {showClientResults && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <div 
                      key={c.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => {
                        setCurrentQuote(prev => ({ ...prev, customer: { ...c } }));
                        setClientSearch(c.name);
                        setShowClientResults(false);
                      }}
                    >
                      <p className="text-sm font-bold">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.rut} | {c.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Ajustes Cotización */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Ajustes de Cotización</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Estado del Documento</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(statusColors).map(status => (
                    <button
                      key={status}
                      onClick={() => setCurrentQuote(prev => ({ ...prev, status }))}
                      className={`py-2 px-3 text-xs font-bold rounded border transition-all ${
                        currentQuote.status === status 
                        ? `${statusColors[status]} text-white border-transparent` 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Plantilla T&C</label>
                <select 
                  className="w-full p-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#FFCC00]"
                  value={Object.keys(TC_TEMPLATES).find(k => TC_TEMPLATES[k] === currentQuote.terms) || ''}
                  onChange={(e) => setCurrentQuote(prev => ({ ...prev, terms: TC_TEMPLATES[e.target.value] }))}
                >
                  {Object.keys(TC_TEMPLATES).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <Button className="w-full" onClick={handleSave}>
                <Save size={18} /> Guardar y Actualizar Cliente
              </Button>
            </div>
          </Card>
        </div>

        {/* Workspace (66%) */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Barra de Herramientas de Ítems */}
          <Card className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <select 
                className="w-full p-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#FFCC00]"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Seleccionar Servicio...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>)}
              </select>
            </div>
            <Button onClick={handleAddService} variant="secondary">
              <Plus size={18} /> Agregar
            </Button>
          </Card>

          {/* The Paper */}
          <div id="quote-sheet" className="bg-white mx-auto shadow-xl p-12 min-h-[800px] relative overflow-hidden" style={{ width: '210mm' }}>
            <header className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />}
                <div className="text-[10px] text-gray-500 uppercase font-bold leading-tight">
                  <p className="text-sm text-black font-black">{settings.companyName}</p>
                  <p>RUT: {settings.rut}</p>
                  <p>{settings.address}</p>
                  <p>{settings.email} | {settings.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-black text-gray-200 mb-4 uppercase tracking-tighter">Presupuesto</h1>
                <div className="space-y-1">
                  <div className="flex justify-end items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">N°:</span>
                    <input 
                      className="text-right font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-24"
                      value={currentQuote.id}
                      onChange={(e) => setCurrentQuote(prev => ({ ...prev, id: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Fecha:</span>
                    <span className="text-right text-sm">{currentQuote.date}</span>
                  </div>
                  <div className="flex justify-end items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Vencimiento:</span>
                    <input 
                      type="date"
                      className="text-right text-xs bg-transparent border-none p-0 focus:ring-0"
                      value={currentQuote.expiryDate}
                      onChange={(e) => setCurrentQuote(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Información del Cliente */}
            <section className="bg-gray-50 p-6 rounded-lg mb-8 grid grid-cols-2 gap-x-8 gap-y-4">
              <Input 
                theme="paper" label="Razón Social" value={currentQuote.customer.name} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))} 
              />
              <Input 
                theme="paper" label="RUT" value={currentQuote.customer.rut} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, rut: formatRut(e.target.value) } }))} 
              />
              <Input 
                theme="paper" label="Giro" value={currentQuote.customer.giro} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, giro: e.target.value } }))} 
              />
              <Input 
                theme="paper" label="Email" value={currentQuote.customer.email} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))} 
              />
              <Input 
                theme="paper" label="Teléfono" value={currentQuote.customer.phone} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))} 
              />
              <Input 
                theme="paper" label="Dirección" value={currentQuote.customer.address} 
                onChange={e => setCurrentQuote(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))} 
              />
              <div className="col-span-2">
                <Input 
                  theme="paper" label="Fecha de Entrega Estimada" type="date" value={currentQuote.deliveryDate} 
                  onChange={e => setCurrentQuote(prev => ({ ...prev, deliveryDate: e.target.value }))} 
                />
              </div>
            </section>

            {/* Tabla de Ítems */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Descripción</th>
                  <th className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase w-20">Cant.</th>
                  <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase w-32">Unitario</th>
                  <th className="py-3 text-right text-[10px] font-bold text-gray-400 uppercase w-32">Total</th>
                  <th className="w-8 no-print"></th>
                </tr>
              </thead>
              <tbody>
                {currentQuote.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50 group">
                    <td className="py-4">
                      <p className="font-bold text-sm">{item.description}</p>
                      <p className="text-[10px] text-gray-500">{item.subDescription}</p>
                    </td>
                    <td className="py-4 text-center">
                      <input 
                        type="number"
                        className="w-12 text-center text-sm bg-transparent border-none p-0 focus:ring-0 font-bold"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...currentQuote.items];
                          newItems[idx].quantity = Number(e.target.value);
                          setCurrentQuote(prev => ({ ...prev, items: newItems }));
                        }}
                      />
                    </td>
                    <td className="py-4 text-right text-sm font-medium">{formatCurrency(item.price)}</td>
                    <td className="py-4 text-right text-sm font-bold">{formatCurrency(item.price * item.quantity)}</td>
                    <td className="py-4 text-right no-print">
                      <button 
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => {
                          setCurrentQuote(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }));
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end mb-12">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>IVA (19%)</span>
                  <span>{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                  <span className="text-[10px] font-bold uppercase text-gray-400 pb-1">Total</span>
                  <span className="text-2xl font-black text-[#111111]">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            {/* T&C */}
            <footer className="border-t border-gray-100 pt-6">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Términos y Condiciones</h4>
              <textarea 
                className="w-full text-[10px] text-gray-500 bg-transparent border-none p-0 focus:ring-0 resize-none h-24"
                value={currentQuote.terms}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, terms: e.target.value }))}
              />
            </footer>
          </div>

          {/* Botonera de Acciones */}
          <div className="flex justify-center gap-4">
            <Button variant="secondary" onClick={handleNew}>
              <RefreshCw size={18} /> Nuevo
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download size={18} /> Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Historial de Presupuestos */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-sm font-bold uppercase text-gray-500">Historial de Presupuestos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-[10px] font-bold text-gray-400 uppercase">N° Folio</th>
                <th className="py-3 px-6 text-left text-[10px] font-bold text-gray-400 uppercase">Cliente</th>
                <th className="py-3 px-6 text-left text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                <th className="py-3 px-6 text-right text-[10px] font-bold text-gray-400 uppercase">Total</th>
                <th className="py-3 px-6 text-center text-[10px] font-bold text-gray-400 uppercase">Estado</th>
                <th className="py-3 px-6 text-center text-[10px] font-bold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold">{q.id}</td>
                  <td className="py-4 px-6 text-sm">{q.customer?.name}</td>
                  <td className="py-4 px-6 text-sm">{q.date}</td>
                  <td className="py-4 px-6 text-right text-sm font-bold">{formatCurrency(q.total)}</td>
                  <td className="py-4 px-6 text-center">
                    <select 
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                        q.status === 'Borrador' ? 'bg-gray-100 text-gray-600' :
                        q.status === 'Enviado' ? 'bg-blue-100 text-blue-600' :
                        q.status === 'Aprobado' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-red-100 text-red-600'
                      }`}
                      value={q.status}
                      onChange={(e) => {
                        const newQuotes = [...quotes];
                        const idx = newQuotes.findIndex(item => item.id === q.id);
                        newQuotes[idx].status = e.target.value;
                        setQuotes(newQuotes);
                      }}
                    >
                      {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="p-1 text-gray-400 hover:text-[#FFCC00] transition-colors"
                        onClick={() => {
                          setCurrentQuote({ ...q });
                          setClientSearch(q.customer?.name || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => setQuotes(quotes.filter(item => item.id !== q.id))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        .pdf-mode .no-print { display: none !important; }
        .pdf-mode { box-shadow: none !important; margin: 0 !important; }
        .pdf-mode input, .pdf-mode textarea { border: none !important; outline: none !important; }
      `}</style>
    </div>
  );
};

const AnalyticsDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Gráfico Punto de Equilibrio</h3>
        <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md mt-4">
          <p className="text-gray-500">// TODO: Implementar visualización SVG custom</p>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Flujo de Caja (12 Meses)</h3>
        <div className="h-64 bg-gray-100 flex items-center justify-center rounded-md mt-4">
          <p className="text-gray-500">// TODO: Implementar gráfico de barras SVG</p>
        </div>
      </Card>
    </div>
  );
};


// =================================================================
// 4. MAIN APP COMPONENT
// =================================================================

const TABS = [
  { name: 'Finanzas', icon: DollarSign, component: CostStructure },
  { name: 'Servicios', icon: Briefcase, component: ServicesManager },
  { name: 'Clientes', icon: Users, component: ClientsManager },
  { name: 'Cotizador', icon: FileText, component: QuoteBuilder },
  { name: 'Análisis', icon: BarChart2, component: AnalyticsDashboard },
];

function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State Management ---
  const [settings, setSettings] = useLocalStorage('agency_settings', {
    companyName: 'Tu Agencia SpA',
    rut: '76.123.456-7',
    address: 'Av. Ejemplo 123, Santiago',
    logoUrl: '',
    brandColor: '#FFCC00',
    email: 'contacto@tuagencia.cl',
    phone: '+56 9 1234 5678',
    capacityHours: 160,
  });
  const [costs, setCosts] = useLocalStorage('agency_costs', [
    { id: 1, name: 'Arriendo Oficina', amount: 500000, type: 'Fijo', category: 'Operaciones' },
    { id: 2, name: 'Software (Suscripción)', amount: 50000, type: 'Variable', category: 'Herramientas' },
    { id: 3, name: 'Sueldos', amount: 2000000, type: 'Fijo', category: 'RRHH' },
  ]);
  const [estimatedIncome, setEstimatedIncome] = useLocalStorage('agency_estimated_income', 5000000);
  const [services, setServices] = useLocalStorage('agency_services', [
    { id: 1, name: 'Diseño de Landing Page', description: 'Página única optimizada para conversión.', hours: 20, margin: 50, price: 1500000 },
  ]);
  const [clients, setClients] = useLocalStorage('agency_clients', [
    { id: 1, name: 'Comercial ABC Ltda.', rut: '77.888.999-K' },
  ]);
  const [quotes, setQuotes] = useLocalStorage('agency_quotes', []);

  // --- Auth Logic ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- Derived State ---
  const bepHourValue = useMemo(() => {
    const fixedCosts = costs.filter(c => c.type === 'Fijo').reduce((acc, cost) => acc + cost.amount, 0);
    return settings.capacityHours > 0 ? fixedCosts / settings.capacityHours : 0;
  }, [costs, settings.capacityHours]);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('Finanzas');
  const [preloadedClient, setPreloadedClient] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const ActiveComponent = TABS.find(tab => tab.name === activeTab)?.component;

  const componentProps = {
    Finanzas: { costs, setCosts, settings, setSettings, estimatedIncome, setEstimatedIncome },
    Servicios: { services, setServices, bepHourValue },
    Clientes: { clients, setClients, quotes, setActiveTab, onNewQuoteForClient: setPreloadedClient },
    Cotizador: { quotes, setQuotes, clients, setClients, services, settings, preloadedClient, setPreloadedClient },
    Análisis: { costs, quotes, services },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-bold text-gray-500">Cargando aplicación...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFCC00] rounded-md flex items-center justify-center">
              <DollarSign size={18} className="text-black" />
            </div>
            <span className="font-bold text-lg">AgencyFinance</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar Sesión" className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <LogOut size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-full transition-all ${
                  isSettingsOpen ? 'bg-[#111111] text-[#FFCC00]' : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Building size={18} />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[80vh]">
                  {/* A. Encabezado del Panel */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-500" />
                      <h4 className="font-bold text-sm text-[#111111]">Datos de mi Agencia</h4>
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={18} />
                    </button>
                  </div>

                  {/* B & C. Cuerpo del Panel */}
                  <div className="p-4 space-y-6 overflow-y-auto">
                    {/* Identidad Visual */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identidad Visual</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <Input label="Logo URL" placeholder="https://..." value={settings.logoUrl} onChange={e => setSettings(s => ({...s, logoUrl: e.target.value}))} />
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Color Marca</label>
                        <div className="flex gap-2">
                          <div className="w-10 h-10 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: settings.brandColor }}></div>
                          <input type="color" value={settings.brandColor} onChange={e => setSettings(s => ({...s, brandColor: e.target.value}))} className="flex-1 h-10 p-1 bg-white border border-gray-300 rounded cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    {/* Datos de la Empresa */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Datos de la Empresa</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <Input label="Nombre Fantasía" value={settings.companyName} onChange={e => setSettings(s => ({...s, companyName: e.target.value}))} />
                      <Input label="RUT Empresa" value={settings.rut} onChange={e => setSettings(s => ({...s, rut: formatRut(e.target.value)}))} />
                      <Input label="Dirección" value={settings.address} onChange={e => setSettings(s => ({...s, address: e.target.value}))} />
                      <Input label="Email Contacto" type="email" value={settings.email} onChange={e => setSettings(s => ({...s, email: e.target.value}))} />
                      <Input label="Teléfono / WhatsApp" value={settings.phone} onChange={e => setSettings(s => ({...s, phone: e.target.value}))} />
                    </div>
                  </div>

                  {/* D. Pie del Panel */}
                  <div className="p-4 border-t border-gray-100">
                    <Button className="w-full" onClick={() => setIsSettingsOpen(false)}>Guardar</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="px-6">
          <div className="flex space-x-6">
            {TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                  activeTab === tab.name
                    ? 'border-[#FFCC00] text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main>
        {ActiveComponent && <ActiveComponent {...componentProps[activeTab]} />}
      </main>
    </div>
  );
}

export default App;