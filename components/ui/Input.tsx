import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  theme?: 'default' | 'paper';
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  theme = 'default', 
  error,
  className = '',
  ...props 
}) => {
  const isPaper = theme === 'paper';

  return (
    <div className={`flex flex-col ${className}`}>
      {label && !isPaper && (
        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full transition-colors duration-200
          ${isPaper 
            ? 'bg-transparent border-b border-transparent hover:border-gray-300 focus:border-liu focus:outline-none px-0 py-1 text-inherit placeholder-gray-300' 
            : 'bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-liu-text focus:outline-none focus:ring-2 focus:ring-liu/50 focus:border-liu focus:bg-white'
          }
          ${error ? 'border-red-300 focus:ring-red-200' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};