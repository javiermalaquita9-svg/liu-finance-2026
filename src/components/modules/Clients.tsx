import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserPlus, Mail, Phone, MapPin, Search, FileText } from 'lucide-react';
import { AgencyClient, AgencyQuote } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { generateId, formatRut, formatCurrency } from '../../utils/formatters';

interface AgencyContextType {
  clients: AgencyClient[];
  setClients: (clients: AgencyClient[]) => void;
  quotes: AgencyQuote[];
}

const AVATAR_COLORS = ['#7F54F5', '#FD8000', '#FFCC00'];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export const ClientsModule: React.FC = () => {
  const { clients, setClients, quotes } = useOutletContext<AgencyContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    name: '',
    rut: '',
    email: '',
    phone: '',
    city: '',
  });

  // Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModalOpen]);

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
      lastTotal: 0,
    };
    setClients([...clients, newClient]);
    setIsModalOpen(false);
    setForm({ name: '', rut: '', email: '', phone: '', city: '' });
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.includes(searchTerm)
  );

  const getClientQuoteCount = (clientId: string) =>
    quotes.filter(q => q.clientId === clientId).length;

  const getClientLastTotal = (clientId: string) => {
    const clientQuotes = quotes.filter(q => q.clientId === clientId);
    if (clientQuotes.length === 0) return 0;
    return clientQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].total;
  };

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
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] text-gray-100 border border-[#7F54F5]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD8000]/50 placeholder-gray-500"
          />
        </div>
        <Button
          className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none shadow-sm transition-colors"
          onClick={() => setIsModalOpen(true)}
          icon={<UserPlus size={18} />}
        >
          Nuevo Cliente
        </Button>
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-[#7F54F5]/20 flex items-center justify-center">
            <UserPlus size={28} className="text-[#7F54F5]/50" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-300 mb-1">
              {searchTerm ? 'Sin resultados' : 'Aún no tienes clientes'}
            </p>
            <p className="text-sm text-gray-600 max-w-xs">
              {searchTerm
                ? 'Prueba con otro nombre o RUT.'
                : 'Registra tu primer cliente para vincularlo a cotizaciones y llevar un historial de ventas.'}
            </p>
          </div>
          {!searchTerm && (
            <Button
              className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none mt-2"
              onClick={() => setIsModalOpen(true)}
              icon={<UserPlus size={16} />}
            >
              Registrar primer cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, i) => {
            const avatarColor = getAvatarColor(client.name);
            const initials = getInitials(client.name);
            const quoteCount = getClientQuoteCount(client.id);
            const lastTotal = getClientLastTotal(client.id);
            const isDark = avatarColor === '#FFCC00';

            return (
              <Card
                key={client.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-200 group hover:border-[#FFCC00]/40 transition-all bg-[#1C1C1C] text-gray-100"
                style={{ animationDelay: `${i * 40}ms` } as React.CSSProperties}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#FFCC00]">{client.name}</h3>
                    <span className="text-xs font-mono text-gray-400 bg-[#111111] px-2 py-0.5 rounded mt-1 inline-block">
                      {client.rut}
                    </span>
                  </div>
                  {/* Avatar with initials */}
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: avatarColor, color: isDark ? '#111111' : '#ffffff' }}
                  >
                    {initials}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-400 mb-5">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:text-gray-200 truncate transition-colors">
                      {client.email || 'Sin email'}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="shrink-0" />
                    <span>{client.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="shrink-0" />
                    <span>{client.city || 'Ciudad no registrada'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#7F54F5]/20 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText size={12} className={quoteCount > 0 ? 'text-[#7F54F5]' : ''} />
                    <span className={quoteCount > 0 ? 'text-[#7F54F5] font-semibold' : ''}>
                      {quoteCount > 0 ? `${quoteCount} cotización${quoteCount > 1 ? 'es' : ''}` : 'Sin cotizaciones'}
                    </span>
                  </div>
                  <div className="font-bold text-[#FFCC00] text-sm font-mono">
                    {lastTotal > 0 ? formatCurrency(lastTotal * 1.19) : '—'}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card
            className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 bg-[#1C1C1C] border-[#7F54F5]/20 text-gray-100"
            onKeyDown={handleModalKeyDown}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UserPlus className="text-[#FFCC00]" /> Registrar Cliente
            </h2>
            <div className="space-y-4">
              <Input label="Razón Social / Nombre" name="name" value={form.name} onChange={handleInputChange} autoFocus />
              <div className="grid grid-cols-2 gap-4">
                <Input label="RUT" name="rut" value={form.rut} onChange={handleInputChange} placeholder="12.345.678-9" />
                <Input label="Teléfono" name="phone" value={form.phone} onChange={handleInputChange} />
              </div>
              <Input label="Email Contacto" name="email" type="email" value={form.email} onChange={handleInputChange} />
              <Input label="Ciudad / Dirección" name="city" value={form.city} onChange={handleInputChange} />

              <div className="flex justify-between items-center mt-6">
                <span className="text-[10px] text-gray-600">Ctrl+Enter para guardar · Esc para cerrar</span>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none" onClick={handleSave}>
                    Guardar Cliente
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
