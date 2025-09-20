import React, { useState } from 'react';
import { 
  Move3D, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  MousePointer2,
  Hand,
  Eye,
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Home
} from 'lucide-react';

interface Navigation3DWidgetProps {
  className?: string;
  onAction?: (action: string, data?: any) => void;
  showMiniMap?: boolean;
}

const Navigation3DWidget: React.FC<Navigation3DWidgetProps> = ({
  className = '',
  onAction,
  showMiniMap = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMode, setCurrentMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');

  const handleAction = (action: string, data?: any) => {
    onAction?.(action, data);
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      {/* 主导航面板 */}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
        <div className="flex flex-col space-y-3">
          {/* 模式切换 */}
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentMode('rotate')}
              className={`p-2 rounded text-xs transition-colors ${
                currentMode === 'rotate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="旋转模式 (左键拖拽)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMode('pan')}
              className={`p-2 rounded text-xs transition-colors ${
                currentMode === 'pan'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="平移模式 (右键拖拽)"
            >
              <Hand className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMode('zoom')}
              className={`p-2 rounded text-xs transition-colors ${
                currentMode === 'zoom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="缩放模式 (滚轮)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* 方向控制 */}
          <div className="grid grid-cols-3 gap-1">
            <div></div>
            <button
              onClick={() => handleAction('move', { direction: 'up' })}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="向上 (Q)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div></div>
            
            <button
              onClick={() => handleAction('move', { direction: 'left' })}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="向左 (A)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction('reset')}
              className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              title="重置视角 (Ctrl+R)"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction('move', { direction: 'right' })}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="向右 (D)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            <div></div>
            <button
              onClick={() => handleAction('move', { direction: 'down' })}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="向下 (E)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div></div>
          </div>

          {/* 缩放控制 */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleAction('zoom', { direction: 'in' })}
              className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-xs"
              title="放大"
            >
              <ZoomIn className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => handleAction('zoom', { direction: 'out' })}
              className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-xs"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4 mx-auto" />
            </button>
          </div>

          {/* 扩展控制 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors text-xs"
          >
            {isExpanded ? '收起' : '更多'}
          </button>
        </div>
      </div>

      {/* 扩展面板 */}
      {isExpanded && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center">
              <Compass className="w-4 h-4 mr-2" />
              快速视角
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction('preset', { view: 'front' })}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                前视图
              </button>
              <button
                onClick={() => handleAction('preset', { view: 'side' })}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                侧视图
              </button>
              <button
                onClick={() => handleAction('preset', { view: 'top' })}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                顶视图
              </button>
              <button
                onClick={() => handleAction('preset', { view: 'isometric' })}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                等距图
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  onChange={(e) => handleAction('autoRotate', { enabled: e.target.checked })}
                  className="rounded"
                />
                <span>自动旋转</span>
              </label>
              
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => handleAction('damping', { enabled: e.target.checked })}
                  className="rounded"
                />
                <span>平滑阻尼</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 小地图 */}
      {showMiniMap && (
        <div className="mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white">
          <div className="w-20 h-20 bg-gray-800 rounded relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <div className="absolute top-1 left-1 text-xs opacity-60">N</div>
            {/* 这里可以添加3D场景的俯视图 */}
          </div>
          <div className="text-xs text-center mt-1 opacity-60">俯视图</div>
        </div>
      )}
    </div>
  );
};

export default Navigation3DWidget; 