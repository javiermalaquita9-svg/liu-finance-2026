import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // <--- IMPORTANTE
import { Search, Plus, Trash2, Download, FileText } from 'lucide-react';
import { AgencyClient, AgencyService, AgencyQuote, QuoteStatus, QuoteItem, AgencySettings, TermTemplate } from '../../types';
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
  termTemplates: TermTemplate[];
  handleUpdateQuote: (id: string, updatedQuote: AgencyQuote) => void;
}

export const QuotesModule: React.FC = () => {
  const { clients, services, quotes, setQuotes, settings, termTemplates, handleUpdateQuote } = useOutletContext<AgencyContextType>();

  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [status, setStatus] = useState<QuoteStatus>(QuoteStatus.DRAFT);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
  });

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.rut.includes(clientSearch)
  );

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
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
    if (!selectedClient) {
      alert('Por favor, selecciona un cliente para guardar la cotización.');
      return;
    }
    if (items.length === 0) {
      alert('Por favor, agrega al menos un ítem a la cotización.');
      return;
    }

    // 1. Crear y guardar la cotización en el historial
    const newQuote: AgencyQuote = {
      id: generateId(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientRut: selectedClient.rut,
      date: new Date().toISOString(),
      validUntil: validUntil,
      deliveryDate: deliveryDate,
      items: items,
      total: total,
      status: status,
      terms: terms,
    };
    setQuotes([...quotes, newQuote]);

    // 2. Descargar el PDF
    const element = document.getElementById('quote-preview');
    if (!element) return;
    
    // @ts-ignore
    if (window.html2pdf) {
      const opt = {
        margin: 0,
        filename: `Cotizacion_${newQuote.clientName}_${new Date(newQuote.date).toISOString().split('T')[0]}.pdf`,
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

  const handleLoadQuote = (quoteToLoad: AgencyQuote) => {
    const client = clients.find(c => c.id === quoteToLoad.clientId);

    // Carga el cliente para la previsualización. Si el cliente original fue eliminado,
    // crea un objeto de cliente temporal a partir de los datos de la cotización.
    if (client) {
      setSelectedClient(client);
      setClientSearch(client.name);
    } else {
      setSelectedClient({ id: quoteToLoad.clientId, name: quoteToLoad.clientName, rut: quoteToLoad.clientRut, email: '', phone: '', city: '', giro: '', lastTotal: 0 });
      setClientSearch(quoteToLoad.clientName);
    }

    setItems(quoteToLoad.items);
    setStatus(quoteToLoad.status);
    setTerms(quoteToLoad.terms);
    setDeliveryDate(quoteToLoad.deliveryDate || '');
    setValidUntil(quoteToLoad.validUntil || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    const quoteToUpdate = quotes.find(q => q.id === quoteId);
    if (quoteToUpdate) {
      handleUpdateQuote(quoteId, { ...quoteToUpdate, status: newStatus });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 pr-2 lg:sticky lg:top-24">
        <Card className="flex flex-col gap-6">
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
              {[QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.APPROVED, QuoteStatus.REJECTED].map(s => (
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de Entrega" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            <Input label="Vencimiento" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>

          {/* Services Quick Add */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Agregar Servicio</label>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar servicio..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-liu/50"
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {filteredServices.map(s => (
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

          {/* Terms and Conditions */}
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Términos y Condiciones</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {termTemplates.map(template => (
                <Button key={template.id} variant="secondary" size="sm" className="text-xs flex-grow" onClick={() => setTerms(template.content)}>
                  <FileText size={12} className="mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
            <textarea 
              className="w-full h-24 text-xs p-2 border border-gray-200 rounded bg-white resize-y focus:outline-none focus:border-liu"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Términos y condiciones..."
            />
          </div>

          <Button onClick={handleDownloadPDF} icon={<Download size={18}/>} className="w-full" disabled={!selectedClient || items.length === 0}>
            Guardar y Descargar PDF
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="w-40 h-16 rounded mb-2 overflow-hidden flex items-center justify-center">
                <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
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
                <p><span className="font-bold text-black">Fecha:</span> {new Date().toLocaleDateString('es-CL')}</p>
                {validUntil && <p><span className="font-bold text-black">Validez:</span> {new Date(validUntil + 'T00:00:00').toLocaleDateString('es-CL')}</p>}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8 p-4 rounded-lg border bg-gray-50 border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Cliente</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-gray-500">Nombre / Razón Social:</p>
                <p className="font-bold text-black">{selectedClient?.name || 'Nombre Cliente'}</p>
              </div>
              <div>
                <p className="text-gray-500">RUT:</p>
                <p className="font-bold text-black">{selectedClient?.rut || 'RUT'}</p>
              </div>
              <div>
                <p className="text-gray-500">Giro:</p>
                <p>{selectedClient?.giro || 'Sin giro'}</p>
              </div>
              <div>
                <p className="text-gray-500">Ciudad:</p>
                <p>{selectedClient?.city || 'Ciudad'}</p>
              </div>
              {deliveryDate && (
                <div>
                  <p className="text-gray-500">Fecha de Entrega:</p>
                  <p className="font-bold text-black">{new Date(deliveryDate + 'T00:00:00').toLocaleDateString('es-CL')}</p>
                </div>
              )}
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
                    <td className="py-4 pr-4 align-top">
                      <Input 
                        theme="paper" 
                        value={item.name} 
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="font-bold mb-1"
                      />
                      <div className="flex items-start text-xs text-gray-500 w-full">
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="flex-grow bg-transparent focus:bg-gray-50 focus:outline-none rounded p-1 resize-none"
                          rows={item.description?.split('\n').length || 1}
                        />
                      </div>
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
          <div className={`absolute inset-0 pointer-events-none flex items-center justify-center ${
            status === QuoteStatus.APPROVED ? 'opacity-[0.04] text-green-500' :
            status === QuoteStatus.REJECTED ? 'opacity-[0.04] text-red-500' :
            'opacity-[0.02] text-black' 
          }`}>
             <span className="text-[150px] font-black -rotate-45 uppercase">{status}</span>
          </div>
        </div>
      </div>
      </div>
      {/* Quote History */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-liu-text mb-4">Historial de Cotizaciones</h2>
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.slice().reverse().map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-liu">{q.id.substring(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium">{q.clientName}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(q.date).toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(q.total * 1.19)}</td>
                    <td className="px-4 py-3 text-center">
                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.id, e.target.value as QuoteStatus)}
                          className={`px-2 py-1 text-[10px] rounded-full font-bold border-transparent focus:ring-2 focus:ring-liu/50 appearance-none text-center cursor-pointer ${
                            q.status === QuoteStatus.APPROVED ? 'bg-green-100 text-green-700' :
                            q.status === QuoteStatus.REJECTED ? 'bg-red-100 text-red-700' :
                            q.status === QuoteStatus.SENT ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {Object.values(QuoteStatus).map(s => (
                            <option key={s} value={s} className="bg-white text-black">{s}</option>
                          ))}
                        </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleLoadQuote(q)}>Ver</Button>
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">No hay cotizaciones guardadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};