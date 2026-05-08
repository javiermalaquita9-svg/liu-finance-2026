import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, ...rest }) => {
  return (
    <div className={`bg-[#1C1C1C] border border-[#7F54F5]/20 rounded-xl shadow-sm overflow-hidden ${className}`} {...rest}>
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
};
