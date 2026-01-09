import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AgencyClient, AgencyService, AgencyCost, AgencyQuote, AgencySettings } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2, Edit, PlusCircle, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react'; 
import { formatRut, formatCurrency } from '../../utils/formatters';

// This should ideally be in a shared types file
interface AgencyContextType {
  clients: AgencyClient[];
  handleUpdateClient: (id: string, updatedClient: AgencyClient) => void;
  handleDeleteClient: (id: string) => void;
  handleAddClient: (newClient: AgencyClient) => void;
  // Add other context properties to avoid TS errors if you use them
  costs: AgencyCost[];
  services: AgencyService[];
  quotes: AgencyQuote[];
  settings: AgencySettings;
}

const EMPTY_CLIENT: Omit<AgencyClient, 'id' | 'lastTotal'> = {
  name: '',
  rut: '',
  email: '',
  phone: '',
  city: '',
  giro: '',
};

export const ClientsModule: React.FC = () => {
  const { clients, handleAddClient, handleUpdateClient, handleDeleteClient } = useOutletContext<AgencyContextType>();

  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState<Omit<AgencyClient, 'id' | 'lastTotal'>>(EMPTY_CLIENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentClient, setCurrentClient] = useState<AgencyClient | null>(null);

  const handleStartEdit = (client: AgencyClient) => {
    setEditingId(client.id);
    setCurrentClient(JSON.parse(JSON.stringify(client))); // Deep copy
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCurrentClient(null);
  };

  const handleSaveEdit = () => {
    if (currentClient) {
      handleUpdateClient(currentClient.id, currentClient);
      handleCancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'rut' ? formatRut(value) : value;

    if (editingId && currentClient) {
      setCurrentClient({ ...currentClient, [name]: finalValue });
    } else {
      setNewClient({ ...newClient, [name]: finalValue });
    }
  };

  const handleAddNewClient = () => {
    if (newClient.name && newClient.rut) {
      const clientWithId: AgencyClient = { ...newClient, id: uuidv4(), lastTotal: 0 };
      handleAddClient(clientWithId);
      setNewClient(EMPTY_CLIENT);
      setIsAdding(false);
    } else {
      alert('Por favor, completa el nombre y el RUT del cliente.');
    }
  };

  const renderClientCard = (client: AgencyClient) => {
    const isEditing = editingId === client.id;
    const clientData = isEditing ? currentClient : client;

    if (!clientData) return null;

    if (isEditing) {
      return (
        <Card key={client.id} className="bg-yellow-50 border-yellow-200 col-span-full">
          <div className="p-4 space-y-4">
            <h3 className="font-bold text-lg">Editando Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre Cliente" name="name" value={clientData.name} onChange={handleInputChange} />
              <Input label="RUT" name="rut" value={clientData.rut} onChange={handleInputChange} />
              <Input label="Email" name="email" type="email" value={clientData.email} onChange={handleInputChange} />
              <Input label="Teléfono" name="phone" value={clientData.phone} onChange={handleInputChange} />
              <Input label="Ciudad" name="city" value={clientData.city} onChange={handleInputChange} />
              <Input label="Giro Comercial" name="giro" value={clientData.giro} onChange={handleInputChange} />
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
      <Card key={client.id} className="hover:shadow-md transition-shadow flex flex-col">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-liu-text">{client.name}</h3>
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                {client.rut}
              </span>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Briefcase size={12} /> <span>{client.giro || 'Sin giro'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => handleStartEdit(client)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-9 p-0" onClick={() => {
                if (window.confirm(`¿Estás seguro de que quieres eliminar al cliente "${client.name}"?`)) {
                  handleDeleteClient(client.id);
                }
              }}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <a href={`mailto:${client.email}`} className="hover:text-liu-text underline decoration-gray-300">{client.email || 'Sin email'}</a></div>
            <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> <span>{client.phone || 'Sin teléfono'}</span></div>
            <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> <span>{client.city || 'Ciudad no registrada'}</span></div>
          </div>
        </div>
        <div className="p-4 mt-auto border-t border-gray-100 flex justify-between items-center">
          <div className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> Última cotización</div>
          <div className="font-bold text-liu-text">{formatCurrency(client.lastTotal)}</div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-liu-text">Gestión de Clientes</h1>
        <Button onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {isAdding ? 'Cerrar' : 'Añadir Cliente'}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-blue-50 border-blue-200 col-span-full">
          <div className="p-4 space-y-4">
            <h3 className="font-bold text-lg">Nuevo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre Cliente" name="name" value={newClient.name} onChange={handleInputChange} placeholder="Ej: Juan Pérez" />
              <Input label="RUT" name="rut" value={newClient.rut} onChange={handleInputChange} placeholder="Ej: 12.345.678-9" />
              <Input label="Email" name="email" type="email" value={newClient.email} onChange={handleInputChange} />
              <Input label="Teléfono" name="phone" value={newClient.phone} onChange={handleInputChange} />
              <Input label="Ciudad" name="city" value={newClient.city} onChange={handleInputChange} />
              <Input label="Giro Comercial" name="giro" value={newClient.giro} onChange={handleInputChange} placeholder="Ej: Servicios de Publicidad" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button onClick={handleAddNewClient}>Crear Cliente</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length > 0 ? (
          clients.map(renderClientCard)
        ) : (
          !isAdding && (
            <p className="text-gray-500 col-span-full text-center py-10">
              No hay clientes registrados. ¡Añade el primero!
            </p>
          )
        )}
      </div>
    </div>
  );
};