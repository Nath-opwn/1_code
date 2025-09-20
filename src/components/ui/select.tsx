import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
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
  onSelect?: (value: string) => void;
}

// 创建Context来共享选中的值
const SelectContext = createContext<{
  selectedValue: string;
  isOpen: boolean;
  onSelect: (value: string) => void;
  toggleOpen: () => void;
}>({
  selectedValue: '',
  isOpen: false,
  onSelect: () => {},
  toggleOpen: () => {}
});

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (itemValue: string) => {
    setSelectedValue(itemValue);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(itemValue);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <SelectContext.Provider value={{
      selectedValue,
      isOpen,
      onSelect: handleSelect,
      toggleOpen
    }}>
      <div ref={selectRef} className={`relative ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className = ''
}) => {
  const { toggleOpen, isOpen } = useContext(SelectContext);
  
  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
      onClick={toggleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleOpen();
        }
      }}
      aria-expanded={isOpen}
    >
      {children}
      <svg 
        className="h-4 w-4 opacity-50" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ 
  placeholder = "Select an option...", 
  className = ''
}) => {
  const { selectedValue } = useContext(SelectContext);
  
  return (
    <span className={className}>
      {selectedValue || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className = ''
}) => {
  const { isOpen, onSelect, selectedValue } = useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onSelect,
            isSelected: selectedValue === child.props.value
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onSelect?: (value: string) => void; isSelected?: boolean }> = ({ 
  value, 
  children, 
  className = '',
  onSelect,
  isSelected 
}) => {
  return (
    <div
      role="option"
      tabIndex={0}
      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer ${
        isSelected ? 'bg-blue-50 text-blue-600' : ''
      } ${className}`}
      onClick={() => onSelect?.(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(value);
        }
      }}
    >
      {children}
    </div>
  );
}; 