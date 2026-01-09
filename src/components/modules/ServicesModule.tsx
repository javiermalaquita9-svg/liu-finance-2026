import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AgencyService, AgencyClient, AgencyCost, AgencyQuote, AgencySettings } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// This should ideally be in a shared types file
interface AgencyContextType {
  services: AgencyService[];
  handleUpdateService: (id: string, updatedService: AgencyService) => void;
  handleDeleteService: (id: string) => void;
  handleAddService: (newService: AgencyService) => void;
  // Add other context properties to avoid TS errors if you use them
  costs: AgencyCost[];
  clients: AgencyClient[];
  quotes: AgencyQuote[];
  settings: AgencySettings;
  bepHourlyRate: number;
}

const EMPTY_SERVICE: Omit<AgencyService, 'id'> = {
  name: '',
  description: '',
  hours: 0,
  margin: 20, // Default margin
  price: 0,
};

export const ServicesModule: React.FC = () => {
  const { services, handleAddService, handleUpdateService, handleDeleteService, bepHourlyRate } = useOutletContext<AgencyContextType>();

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<Omit<AgencyService, 'id'>>(EMPTY_SERVICE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState<AgencyService | null>(null);

  const handleStartEdit = (service: AgencyService) => {
    setEditingId(service.id);
    setCurrentService(JSON.parse(JSON.stringify(service))); // Deep copy to avoid mutation issues
    setIsAdding(false); // Close add form if open
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCurrentService(null);
  };

  const handleSaveEdit = () => {
    if (currentService) {
      handleUpdateService(currentService.id, currentService);
      handleCancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['hours', 'price', 'margin'].includes(name);
    const val = isNumeric ? parseFloat(value) || 0 : value;

    if (editingId && currentService) {
      setCurrentService({ ...currentService, [name]: val });
    } else {
      setNewService({ ...newService, [name]: val });
    }
  };

  const handleAddNewService = () => {
    if (newService.name && newService.price > 0) {
      const serviceWithId: AgencyService = { ...newService, id: uuidv4() };
      handleAddService(serviceWithId);
      setNewService(EMPTY_SERVICE);
      setIsAdding(false);
    } else {
      alert('Por favor, completa el nombre y el precio del servicio.');
    }
  };
  
  const calculateCost = (hours: number) => bepHourlyRate * hours;

  const renderServiceRow = (service: AgencyService) => {
    const isEditing = editingId === service.id;
    const serviceData = isEditing ? currentService : service;

    if (!serviceData) return null;
    const cost = calculateCost(serviceData.hours);

    if (isEditing) {
      return (
        <Card key={service.id} className="bg-yellow-50 border-yellow-200 col-span-full">
          <div className="p-4 space-y-4">
            <h3 className="font-bold text-lg">Editando Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre del Servicio" name="name" value={serviceData.name} onChange={handleInputChange} />
              <Input label="Horas Estimadas" name="hours" type="number" value={serviceData.hours} onChange={handleInputChange} />
              <div className="md:col-span-2">
                <label htmlFor="edit-description" className="block text-xs font-medium text-gray-700 mb-1">Detalles del Servicio (Viñetas)</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={serviceData.description}
                  onChange={handleInputChange}
                  className="w-full h-24 text-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-liu focus:border-liu bg-white"
                  rows={4}
                />
              </div>
              <Input label="Precio Final (Venta)" name="price" type="number" value={serviceData.price} onChange={handleInputChange} />
              <Input label="Margen (%)" name="margin" type="number" value={serviceData.margin} onChange={handleInputChange} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card key={service.id} className="hover:shadow-md transition-shadow flex flex-col">
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-liu-text">{service.name}</h3>
              <p className="text-sm text-gray-500">{service.hours} horas</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => handleStartEdit(service)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => {
                  if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) {
                    handleDeleteService(service.id);
                  }
                }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <span className={`mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase ${
                service.margin >= 50 ? 'bg-green-100 text-green-700' : 
                service.margin >= 30 ? 'bg-blue-50 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {service.margin}% Margen
              </span>
            </div>
          </div>
          {service.description && (
            <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100 flex-grow">
              <div className="whitespace-pre-wrap font-sans leading-relaxed">
                {service.description}
              </div>
            </div>
          )}
          <div className="mt-auto pt-4 grid grid-cols-2 gap-4 text-center border-t">
            <div>
              <p className="text-xs text-gray-400">Costo</p>
              <p className="font-bold">{formatCurrency(cost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Venta</p>
              <p className="font-bold text-liu">{formatCurrency(service.price)}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-liu-text">Gestión de Servicios</h1>
        <Button onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {isAdding ? 'Cerrar' : 'Añadir Servicio'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdding && (
           <Card className="bg-blue-50 border-blue-200 col-span-full">
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">Nuevo Servicio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nombre del Servicio" name="name" value={newService.name} onChange={handleInputChange} placeholder="Ej: Diseño de Landing Page" />
                <Input label="Horas Estimadas" name="hours" type="number" value={newService.hours} onChange={handleInputChange} />
                <div className="md:col-span-2">
                  <label htmlFor="add-description" className="block text-xs font-medium text-gray-700 mb-1">Detalles del Servicio (Viñetas)</label>
                  <textarea
                    id="add-description"
                    name="description"
                    value={newService.description}
                    onChange={handleInputChange}
                    placeholder="- Creación de 3 propuestas de diseño.&#10;- Desarrollo en WordPress.&#10;- Optimización SEO básica."
                    className="w-full h-24 text-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-liu focus:border-liu bg-white"
                    rows={4}
                  />
                </div>
                <Input label="Precio Final (Venta)" name="price" type="number" value={newService.price} onChange={handleInputChange} />
                <Input label="Margen (%)" name="margin" type="number" value={newService.margin} onChange={handleInputChange} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button onClick={handleAddNewService}>Crear Servicio</Button>
              </div>
            </div>
          </Card>
        )}
        {services.length > 0 ? (
          services.map(renderServiceRow)
        ) : (
          !isAdding && <p className="text-gray-500 col-span-full text-center py-10">No hay servicios registrados. ¡Añade el primero!</p>
        )}
      </div>
    </div>
  );
};