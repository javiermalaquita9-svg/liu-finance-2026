import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-liu text-liu-text hover:bg-[#E6B800] shadow-sm focus:ring-liu",
    secondary: "bg-[#1C1C1C] border border-[#7F54F5]/30 text-gray-200 hover:bg-[#222] focus:ring-[#7F54F5]/30",
    danger: "bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 focus:ring-red-800/30",
    ghost: "bg-transparent text-gray-300 hover:bg-white/10 focus:ring-gray-600"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-10 px-4 text-sm rounded-lg",
    lg: "h-12 px-6 text-base rounded-lg"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
