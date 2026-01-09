import React from 'react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';

// Componente para inputs editables "invisibles"
const EditableField = ({ value, onChange, placeholder, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`bg-transparent focus:bg-gray-100 focus:outline-none p-1 rounded w-full ${className}`}
  />
);

export function Preview({ quote, setQuote }) {
  const handleFieldChange = (field) => (e) => {
    setQuote({ ...quote, [field]: e.target.value });
  };

  const handleGeneratePdf = () => {
    const element = document.getElementById('quote-sheet');
    const opt = {
      margin: 0.5,
      filename: `cotizacion-${quote.id || 'nueva'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <main className="flex-1 p-8 bg-gray-200 overflow-y-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleGeneratePdf}
          className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Download size={18} />
          Generar PDF
        </button>
      </div>

      {/* Hoja A4 Virtual */}
      <div id="quote-sheet" className="bg-white p-12 mx-auto max-w-4xl shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
        <header className="flex justify-between items-start mb-12">
          <h1 className="text-4xl font-bold text-gray-800">COTIZACIÓN</h1>
          <div>
            <EditableField
              value={quote.id || ''}
              onChange={handleFieldChange('id')}
              placeholder="N° Cotización"
              className="text-right font-semibold"
            />
            <EditableField
              value={quote.date || new Date().toLocaleDateString('es-CL')}
              onChange={handleFieldChange('date')}
              placeholder="Fecha"
              className="text-right"
            />
          </div>
        </header>

        <section className="mb-12">
          <h3 className="font-bold mb-2">Cliente:</h3>
          <p>{quote.customer?.label || 'Seleccione un cliente'}</p>
        </section>
        
        {/* Aquí iría el selector de servicios y la tabla de ítems */}
      </div>
    </main>
  );
}