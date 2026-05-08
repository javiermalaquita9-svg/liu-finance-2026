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
        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full transition-colors duration-200
          ${isPaper
            ? 'bg-transparent border-b border-transparent hover:border-gray-300 focus:border-liu focus:outline-none px-0 py-1 text-inherit placeholder-gray-300'
            : 'bg-[#111111] border border-[#7F54F5]/30 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50 focus:border-[#FFCC00]'
          }
          ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
};
