import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { Search, Plus, Trash2, Download } from 'lucide-react';
import { AgencyClient, AgencyService, AgencyQuote, QuoteStatus, QuoteItem, AgencySettings } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { generateId, formatCurrency } from '../../utils/formatters';
import { DEFAULT_TERMS } from '../../constants';

interface AgencyContextType {
  clients: AgencyClient[];
  services: AgencyService[];
  quotes: AgencyQuote[];
  setQuotes: (quotes: AgencyQuote[]) => void;
  settings: AgencySettings;
}

export const QuotesModule: React.FC = () => {
  const { clients, services, quotes, setQuotes, settings } = useOutletContext<AgencyContextType>();

  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [status, setStatus] = useState<QuoteStatus>(QuoteStatus.DRAFT);
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.rut.includes(clientSearch)
  );

  const handleAddItem = (service: AgencyService) => {
    const newItem: QuoteItem = {
      id: generateId(),
      serviceId: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('quote-preview');
    if (!element) return;
    
    // @ts-ignore
    if (window.html2pdf) {
      const opt = {
        margin: 0,
        filename: `Cotizacion_${selectedClient?.name || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert("La librería PDF aún está cargando. Intente en unos segundos.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-lg">Configuración</h3>
          
          {/* Client Search */}
          <div className="relative">
            <Input 
              label="Cliente" 
              placeholder="Buscar cliente..." 
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              onFocus={() => setSelectedClient(null)} // Reset on search to show list
            />
            {clientSearch && !selectedClient && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                {filteredClients.map(c => (
                  <div 
                    key={c.id} 
                    className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => { setSelectedClient(c); setClientSearch(c.name); }}
                  >
                    <div className="font-bold">{c.name}</div>
                    <div className="text-gray-400 text-xs">{c.rut}</div>
                  </div>
                ))}
                {filteredClients.length === 0 && <div className="p-3 text-gray-400 text-sm">No encontrado</div>}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Estado</label>
            <div className="flex gap-2">
              {[QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.APPROVED].map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-xs rounded-lg font-medium border transition-colors ${
                    status === s 
                      ? 'bg-liu border-liu text-black' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Services Quick Add */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Agregar Servicio</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleAddItem(s)}
                  className="text-xs bg-gray-50 border border-gray-200 px-2 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1"
                >
                  <Plus size={12} /> {s.name}
                </button>
              ))}
            </div>
          </div>

          <textarea 
            className="w-full h-32 text-xs p-2 border border-gray-200 rounded bg-gray-50 resize-none focus:outline-none focus:border-liu"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Términos y condiciones..."
          />

          <Button onClick={handleDownloadPDF} icon={<Download size={18}/>} className="w-full">
            Descargar PDF
          </Button>
        </Card>
      </div>

      {/* A4 Preview */}
      <div className="w-full lg:w-2/3 bg-gray-200 rounded-xl p-8 overflow-y-auto flex justify-center shadow-inner">
        <div 
          id="quote-preview"
          className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[15mm] flex flex-col justify-between text-sm relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded mb-2 overflow-hidden">
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-bold text-2xl text-black uppercase tracking-tight">{settings.companyName}</h1>
              <div className="text-gray-500 text-xs mt-1">
                <p>{settings.rut}</p>
                <p>{settings.address}</p>
                <p>{settings.contactEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-gray-100 uppercase tracking-widest mb-2">Presupuesto</h2>
              <div className="text-xs space-y-1">
                <p><span className="font-bold text-black">Fecha:</span> {new Date().toLocaleDateString()}</p>
                <p><span className="font-bold text-black">Validez:</span> 15 días</p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left w-64 ml-auto border border-gray-100">
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Cliente</p>
                  <p className="font-bold text-black text-base">{selectedClient?.name || 'Nombre Cliente'}</p>
                  <p className="text-gray-500">{selectedClient?.rut || 'RUT'}</p>
                  <p className="text-gray-500">{selectedClient?.city || 'Ciudad'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-grow">
            <table className="w-full mb-8">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="text-left py-2 font-black uppercase text-xs">Descripción</th>
                  <th className="text-center py-2 font-black uppercase text-xs w-20">Cant</th>
                  <th className="text-right py-2 font-black uppercase text-xs w-32">Precio U.</th>
                  <th className="text-right py-2 font-black uppercase text-xs w-32">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-4 pr-4">
                      <Input 
                        theme="paper" 
                        value={item.name} 
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="font-bold mb-1"
                      />
                       <Input 
                        theme="paper" 
                        value={item.description} 
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="text-xs text-gray-500 w-full"
                      />
                    </td>
                    <td className="py-4 text-center align-top pt-5">
                       <input 
                        type="number"
                        min="1"
                        className="w-12 text-center border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-liu bg-transparent"
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                      />
                    </td>
                    <td className="py-4 text-right align-top pt-5 font-mono text-gray-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-4 text-right align-top pt-5 font-bold font-mono">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                    <td className="py-4 text-center align-top pt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer & Totals */}
          <div className="border-t border-gray-200 pt-8 mt-auto">
            <div className="flex justify-between items-start">
              <div className="w-1/2 text-xs text-gray-500 whitespace-pre-wrap">
                <p className="font-bold text-black uppercase mb-2">Términos y Condiciones</p>
                {terms}
              </div>
              <div className="w-1/3">
                <div className="flex justify-between mb-2 text-gray-500">
                  <span>Subtotal Neto</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between mb-4 text-gray-500">
                  <span>IVA (19%)</span>
                  <span>{formatCurrency(total * 0.19)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t-2 border-black text-xl font-black text-black">
                  <span>TOTAL</span>
                  <span>{formatCurrency(total * 1.19)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-dashed border-gray-300 flex justify-between items-center text-xs text-gray-400">
              <span>{settings.companyName} - Propuesta Comercial</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
          
          {/* Watermark for visual effect */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
             <span className="text-[150px] font-black -rotate-45">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};