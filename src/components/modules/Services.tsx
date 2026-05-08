import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Tag, Clock, Edit, Copy, Trash2, LayoutGrid, List } from 'lucide-react';
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

const CATEGORIES = ['Diseño', 'Edición', 'Video', 'Marketing', 'Otro'];

export const ServicesModule: React.FC = () => {
  const { services, handleAddService, handleUpdateService, handleDeleteService, bepHourlyRate } = useOutletContext<AgencyContextType>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newMargin, setNewMargin] = useState('30');
  const [newCategory, setNewCategory] = useState('Diseño');

  const calculateSuggestedPrice = (hours: number, marginPercent: number) => {
    const cost = hours * bepHourlyRate;
    const marginDecimal = marginPercent / 100;
    if (marginDecimal >= 1) return 0;
    return Math.round(cost / (1 - marginDecimal));
  };

  const hoursNum = parseFloat(newHours) || 0;
  const marginNum = parseFloat(newMargin) || 0;
  const suggestedPrice = calculateSuggestedPrice(hoursNum, marginNum);

  // Keyboard shortcut: Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  const handleOpenModal = (service?: AgencyService) => {
    if (service) {
      setEditingId(service.id);
      setNewName(service.name);
      setNewDesc(service.description || '');
      setNewHours(service.hours.toString());
      setNewMargin(service.margin ? service.margin.toString() : '30');
      setNewCategory(service.category || 'Diseño');
    } else {
      setEditingId(null);
      setNewName('');
      setNewDesc('');
      setNewHours('');
      setNewMargin('30');
      setNewCategory('Diseño');
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
      price: suggestedPrice,
      category: newCategory,
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
    setNewCategory('Diseño');
  };

  const handleDuplicate = (service: AgencyService) => {
    const duplicated: AgencyService = {
      ...service,
      id: generateId(),
      name: `${service.name} (Copia)`,
    };
    handleAddService(duplicated);
  };

  // Ctrl+Enter saves in modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
  };

  const existingCategories = ['Todos', ...CATEGORIES];

  const filteredServices = services
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(s => categoryFilter === 'Todos' || (s.category || 'Otro') === categoryFilter);

  const marginColor = (margin: number) =>
    margin >= 50 ? 'text-green-400' : margin >= 30 ? 'text-[#7F54F5]' : 'text-[#FD8000]';

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
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] text-gray-100 border border-[#7F54F5]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD8000]/50 placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[#111111] border border-[#7F54F5]/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#FFCC00]/20 text-[#FFCC00]' : 'text-gray-400 hover:text-gray-200'}`}
              title="Vista grilla"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#FFCC00]/20 text-[#FFCC00]' : 'text-gray-400 hover:text-gray-200'}`}
              title="Vista lista"
            >
              <List size={16} />
            </button>
          </div>
          <Button
            className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none shadow-sm transition-colors"
            onClick={() => handleOpenModal()}
            icon={<Plus size={18} />}
          >
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {existingCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === cat
                ? 'bg-[#7F54F5] border-[#7F54F5] text-white'
                : 'bg-[#1C1C1C] border-[#7F54F5]/30 text-gray-400 hover:border-[#7F54F5]/60 hover:text-gray-200'
            }`}
          >
            {cat}
            {cat !== 'Todos' && (
              <span className="ml-1.5 opacity-60">
                {services.filter(s => (s.category || 'Otro') === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, i) => (
            <Card
              key={service.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-200 hover:shadow-lg hover:border-[#7F54F5]/40 transition-all group relative flex flex-col bg-[#1C1C1C] border-[#7F54F5]/20 text-gray-100"
              style={{ animationDelay: `${i * 40}ms` } as React.CSSProperties}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-[#FFCC00] leading-tight">{service.name}</h3>
                  {service.category && (
                    <span className="text-[10px] text-[#7F54F5] font-semibold uppercase tracking-wider">{service.category}</span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase bg-[#111111] ${marginColor(service.margin)}`}>
                  {service.margin}% MG
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 min-h-[40px] whitespace-pre-line line-clamp-4">
                {service.description || 'Sin descripción'}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-[#7F54F5]/30 mt-auto">
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock size={14} className="mr-1" />
                  {service.hours}h
                </div>
                <div className="text-xl font-bold text-[#FFCC00]">
                  {formatCurrency(service.price)}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-[#7F54F5]/30">
                <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => handleOpenModal(service)} className="flex-1 text-gray-300 hover:text-white hover:bg-[#111111]">
                  Editar
                </Button>
                <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={() => handleDuplicate(service)} className="flex-1 text-gray-300 hover:text-white hover:bg-[#111111]">
                  Duplicar
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDeleteService(service.id)} className="flex-1 hover:bg-red-500/20 hover:text-red-400">
                  Quitar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filteredServices.length > 0 && (
        <Card noPadding className="bg-[#1C1C1C] border-[#7F54F5]/20 text-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#111111] text-gray-300 text-xs font-bold uppercase tracking-wider border-b border-[#7F54F5]/20">
              <tr>
                <th className="px-5 py-3">Servicio</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3 text-center">Horas</th>
                <th className="px-5 py-3 text-center">Margen</th>
                <th className="px-5 py-3 text-right">Precio</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7F54F5]/20">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-white/5 transition-colors animate-in fade-in duration-150">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-gray-100">{service.name}</div>
                    {service.description && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">{service.description.split('\n')[0]}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7F54F5]">
                      {service.category || 'Otro'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-300">{service.hours}h</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold ${marginColor(service.margin)}`}>{service.margin}%</span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold font-mono text-[#FFCC00]">{formatCurrency(service.price)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => handleOpenModal(service)} className="text-gray-400 hover:text-white">Editar</Button>
                      <Button variant="ghost" size="sm" icon={<Copy size={13} />} onClick={() => handleDuplicate(service)} className="text-gray-400 hover:text-white">Copia</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDeleteService(service.id)} className="text-red-500/70 hover:text-red-400 hover:bg-red-500/10" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Empty state */}
      {filteredServices.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-[#7F54F5]/20 flex items-center justify-center">
            <Tag size={28} className="text-[#7F54F5]/50" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-300 mb-1">
              {searchTerm || categoryFilter !== 'Todos' ? 'Sin resultados' : 'Aún no tienes servicios'}
            </p>
            <p className="text-sm text-gray-600 max-w-xs">
              {searchTerm || categoryFilter !== 'Todos'
                ? 'Prueba con otro término de búsqueda o cambia el filtro de categoría.'
                : 'Crea tu primer servicio de diseño o edición. El precio se calculará automáticamente según tu B.E.P.'}
            </p>
          </div>
          {!searchTerm && categoryFilter === 'Todos' && (
            <Button
              className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none mt-2"
              onClick={() => handleOpenModal()}
              icon={<Plus size={16} />}
            >
              Crear primer servicio
            </Button>
          )}
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
              <Tag className="text-[#FFCC00]" /> {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input label="Nombre del Servicio" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="h-10 bg-[#111111] border border-[#7F54F5]/30 text-gray-100 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <Input label="Horas Estimadas" type="number" value={newHours} onChange={e => setNewHours(e.target.value)} />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                  Descripción / Detalle del servicio
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={4}
                  placeholder={"Ej:\n- Diseño de logotipo\n- 2 revisiones incluidas\n- Entrega en 5 días"}
                  className="w-full bg-[#111111] border border-[#7F54F5]/30 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50 focus:border-[#FFCC00] resize-y transition-colors duration-200 text-sm placeholder-gray-500"
                />
              </div>

              <Input label="Margen Objetivo (%)" type="number" value={newMargin} onChange={e => setNewMargin(e.target.value)} />

              {/* Calculator Preview */}
              <div className="bg-[#111111] rounded-lg p-4 border border-dashed border-[#7F54F5]/30">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                  <span>Costo B.E.P. ({hoursNum}h × {formatCurrency(bepHourlyRate)})</span>
                  <span>{formatCurrency(hoursNum * bepHourlyRate)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-[#FFCC00] mt-2 pt-2 border-t border-[#7F54F5]/30">
                  <span>Precio Sugerido</span>
                  <span>{formatCurrency(suggestedPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <span className="text-[10px] text-gray-600">Ctrl+Enter para guardar · Esc para cerrar</span>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button className="bg-[#FD8000] text-white hover:bg-[#E07200] border-none shadow-sm" onClick={handleSave}>
                    {editingId ? 'Guardar Cambios' : 'Guardar Servicio'}
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
