import React from 'react';
import { RotateCw, Home } from 'lucide-react';

interface ControlPanelProps {
  isAutoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetView: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isAutoRotate,
  onToggleAutoRotate,
  onResetView
}) => {
  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white z-10">
      <div className="space-y-2">
        <div className="text-xs text-center text-blue-300 mb-2">3D 控制</div>
        
        <button
          onClick={onToggleAutoRotate}
          className={`w-full px-2 py-1 text-xs rounded transition-colors ${
            isAutoRotate
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          <RotateCw className="w-3 h-3 inline mr-1" />
          {isAutoRotate ? '停止旋转' : '自动旋转'}
        </button>
        
        <button
          onClick={onResetView}
          className="w-full px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          <Home className="w-3 h-3 inline mr-1" />
          重置视角
        </button>
      </div>
    </div>
  );
};

export default ControlPanel; 