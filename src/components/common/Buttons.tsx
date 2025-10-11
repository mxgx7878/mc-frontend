// src/components/common/Buttons.tsx
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  type = 'button',
  fullWidth = true,
  className = '',
  ...props 
}: ButtonProps) => {
  const baseStyles = `${fullWidth ? 'w-full' : ''} px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`;
  
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md",
    secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300",
    outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100",
    ghost: "text-primary-500 hover:bg-primary-50 active:bg-primary-100",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;