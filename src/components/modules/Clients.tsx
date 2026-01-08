import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { UserPlus, Mail, Phone, MapPin, Search, Calendar } from 'lucide-react';
import { AgencyClient } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { generateId, formatRut, formatCurrency } from '../../utils/formatters';

interface AgencyContextType {
  clients: AgencyClient[];
  setClients: (clients: AgencyClient[]) => void;
}

export const ClientsModule: React.FC = () => {
  const { clients, setClients } = useOutletContext<AgencyContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    rut: '',
    email: '',
    phone: '',
    city: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'rut') {
      setForm(prev => ({ ...prev, rut: formatRut(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!form.name || !form.rut) return;
    const newClient: AgencyClient = {
      id: generateId(),
      ...form,
      lastTotal: 0
    };
    setClients([...clients, newClient]);
    setIsModalOpen(false);
    setForm({ name: '', rut: '', email: '', phone: '', city: '' });
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.rut.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por Nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-liu/50"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<UserPlus size={18} />}>
          Nuevo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Card key={client.id} className="group hover:border-liu transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-liu-text">{client.name}</h3>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {client.rut}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-liu group-hover:text-black transition-colors">
                <MapPin size={14} />
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <a href={`mailto:${client.email}`} className="hover:text-liu-text underline decoration-gray-300">{client.email || 'Sin email'}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span>{client.phone || 'Sin teléfono'}</span>
              </div>
               <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span>{client.city || 'Ciudad no registrada'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={12} /> Última cotización
              </div>
              <div className="font-bold text-liu-text">
                {formatCurrency(client.lastTotal)}
              </div>
            </div>
          </Card>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="text-liu" /> Registrar Cliente
            </h2>
            <div className="space-y-4">
              <Input label="Razón Social / Nombre" name="name" value={form.name} onChange={handleInputChange} autoFocus />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="RUT" name="rut" value={form.rut} onChange={handleInputChange} placeholder="12.345.678-9" />
                 <Input label="Teléfono" name="phone" value={form.phone} onChange={handleInputChange} />
              </div>
              <Input label="Email Contacto" name="email" type="email" value={form.email} onChange={handleInputChange} />
              <Input label="Ciudad / Dirección" name="city" value={form.city} onChange={handleInputChange} />
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cliente</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};