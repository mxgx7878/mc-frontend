// src/components/common/Input.tsx
import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { InputHTMLAttributes} from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  register?: UseFormRegisterReturn;
  icon?: LucideIcon;
}

const Input = ({ 
  label, 
  error, 
  type = 'text',
  register,
  icon: Icon,
  ...props 
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
            <Icon size={20} />
          </div>
        )}
        
        <input
          type={inputType}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error 
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500' 
              : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            disabled:bg-secondary-50 disabled:cursor-not-allowed
          `}
          {...register}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-error-500 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;