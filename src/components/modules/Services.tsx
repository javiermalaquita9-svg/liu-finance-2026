import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { Plus, Search, Tag, Clock } from 'lucide-react';
import { AgencyService } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatCurrency, generateId } from '../../utils/formatters';

interface AgencyContextType {
  services: AgencyService[];
  setServices: (services: AgencyService[]) => void;
  bepHourlyRate: number;
}

export const ServicesModule: React.FC = () => {
  const { services, setServices, bepHourlyRate } = useOutletContext<AgencyContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Service Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newMargin, setNewMargin] = useState('30');

  const calculateSuggestedPrice = (hours: number, marginPercent: number) => {
    const cost = hours * bepHourlyRate;
    const marginDecimal = marginPercent / 100;
    if (marginDecimal >= 1) return 0;
    return Math.round(cost / (1 - marginDecimal));
  };

  const hoursNum = parseFloat(newHours) || 0;
  const marginNum = parseFloat(newMargin) || 0;
  const suggestedPrice = calculateSuggestedPrice(hoursNum, marginNum);

  const handleCreate = () => {
    if (!newName || !newHours) return;
    const newService: AgencyService = {
      id: generateId(),
      name: newName,
      description: newDesc,
      hours: hoursNum,
      margin: marginNum,
      price: suggestedPrice
    };
    setServices([...services, newService]);
    setIsModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewHours('');
    setNewMargin('30');
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-liu/50"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
          Nuevo Servicio
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <Card key={service.id} className="hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-liu-text">{service.name}</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                service.margin >= 50 ? 'bg-green-100 text-green-700' : 
                service.margin >= 30 ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {service.margin}% MG
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
              {service.description || 'Sin descripción'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-gray-400 text-sm">
                <Clock size={14} className="mr-1" />
                {service.hours}h
              </div>
              <div className="text-xl font-bold text-liu-text">
                {formatCurrency(service.price)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Tag className="text-liu" /> Nuevo Servicio
            </h2>
            
            <div className="space-y-4">
              <Input 
                label="Nombre del Servicio" 
                value={newName} onChange={e => setNewName(e.target.value)} 
                autoFocus
              />
              <Input 
                label="Descripción Corta" 
                value={newDesc} onChange={e => setNewDesc(e.target.value)} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Horas Estimadas" 
                  type="number"
                  value={newHours} onChange={e => setNewHours(e.target.value)} 
                />
                <Input 
                  label="Margen Objetivo (%)" 
                  type="number"
                  value={newMargin} onChange={e => setNewMargin(e.target.value)} 
                />
              </div>

              {/* Calculator Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mt-2 border border-dashed border-gray-300">
                <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                  <span>Costo B.E.P. ({hoursNum}h x {formatCurrency(bepHourlyRate)})</span>
                  <span>{formatCurrency(hoursNum * bepHourlyRate)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-liu-text mt-2 pt-2 border-t border-gray-200">
                  <span>Precio Sugerido</span>
                  <span>{formatCurrency(suggestedPrice)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Crear Servicio</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};