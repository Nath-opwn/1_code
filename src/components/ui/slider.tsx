import React from 'react';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ 
  value = [0],
  onValueChange,
  defaultValue = [0],
  max = 100,
  min = 0,
  step = 1,
  className = '',
  disabled = false
}) => {
  const currentValue = value[0] || defaultValue[0];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (onValueChange) {
      onValueChange([newValue]);
    }
  };
  
  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="relative h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}; 