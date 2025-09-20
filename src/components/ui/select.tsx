import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ children, className = '', onValueChange, ...props }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  };

  return (
    <select 
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className = '' }) => {
  return <span className={`text-gray-500 ${className}`}>{placeholder}</span>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  );
}; 