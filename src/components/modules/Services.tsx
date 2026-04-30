import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { Plus, Search, Tag, Clock, Edit, Copy, Trash2 } from 'lucide-react';
import { AgencyService } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatCurrency, generateId } from '../../utils/formatters';

interface AgencyContextType {
  services: AgencyService[];
  setServices: (services: AgencyService[]) => void;
  handleAddService: (service: AgencyService) => void;
  handleUpdateService: (id: string, service: AgencyService) => void;
  handleDeleteService: (id: string) => void;
  bepHourlyRate: number;
}

export const ServicesModule: React.FC = () => {
  const { services, handleAddService, handleUpdateService, handleDeleteService, bepHourlyRate } = useOutletContext<AgencyContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleOpenModal = (service?: AgencyService) => {
    if (service) {
      setEditingId(service.id);
      setNewName(service.name);
      setNewDesc(service.description || '');
      setNewHours(service.hours.toString());
      setNewMargin(service.margin ? service.margin.toString() : '30');
    } else {
      setEditingId(null);
      setNewName('');
      setNewDesc('');
      setNewHours('');
      setNewMargin('30');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newName || !newHours) return;
    const serviceData: AgencyService = {
      id: editingId || generateId(),
      name: newName,
      description: newDesc,
      hours: hoursNum,
      margin: marginNum,
      price: suggestedPrice
    };

    if (editingId) {
      handleUpdateService(editingId, serviceData);
    } else {
      handleAddService(serviceData);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setNewName('');
    setNewDesc('');
    setNewHours('');
    setNewMargin('30');
  };

  const handleDuplicate = (service: AgencyService) => {
    const duplicated: AgencyService = {
      ...service,
      id: generateId(),
      name: `${service.name} (Copia)`
    };
    handleAddService(duplicated);
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
        <Button onClick={() => handleOpenModal()} icon={<Plus size={18} />}>
          Nuevo Servicio
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <Card key={service.id} className="hover:shadow-md transition-shadow group relative flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-liu-text">{service.name}</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                service.margin >= 50 ? 'bg-green-100 text-green-700' :
                service.margin >= 30 ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {service.margin}% MG
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4 min-h-[40px] whitespace-pre-line line-clamp-4">
              {service.description || 'Sin descripción'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              <div className="flex items-center text-gray-400 text-sm">
                <Clock size={14} className="mr-1" />
                {service.hours}h
              </div>
              <div className="text-xl font-bold text-liu-text">
                {formatCurrency(service.price)}
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit size={14} />}
                onClick={() => handleOpenModal(service)}
                className="flex-1 text-gray-600"
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => handleDuplicate(service)}
                className="flex-1 text-gray-600"
              >
                Duplicar
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => handleDeleteService(service.id)}
                className="flex-1"
              >
                Quitar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Tag className="text-liu" /> {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            
            <div className="space-y-4">
              <Input 
                label="Nombre del Servicio" 
                value={newName} onChange={e => setNewName(e.target.value)} 
                autoFocus
              />
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                  Descripción / Detalle del servicio
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={4}
                  placeholder={"Ej:\n- Diseño de logotipo\n- 2 revisiones incluidas\n- Entrega en 5 días"}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-liu-text focus:outline-none focus:ring-2 focus:ring-liu/50 focus:border-liu focus:bg-white resize-y transition-colors duration-200 text-sm"
                />
              </div>
              
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
                  <Button onClick={handleSave}>{editingId ? 'Guardar Cambios' : 'Guardar Servicio'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};