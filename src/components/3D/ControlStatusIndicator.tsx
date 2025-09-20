import React from 'react';
import { 
  RotateCw, 
  Hand, 
  ZoomIn, 
  MousePointer2,
  Smartphone,
  Keyboard,
  Info
} from 'lucide-react';

interface ControlStatusIndicatorProps {
  className?: string;
  currentMode?: 'rotate' | 'pan' | 'zoom';
  isAutoRotate?: boolean;
  isDamping?: boolean;
}

const ControlStatusIndicator: React.FC<ControlStatusIndicatorProps> = ({
  className = '',
  currentMode = 'rotate',
  isAutoRotate = false,
  isDamping = true
}) => {
  const getModeInfo = () => {
    switch (currentMode) {
      case 'rotate':
        return {
          icon: RotateCw,
          title: '旋转模式',
          description: '左键拖拽旋转视角',
          color: 'text-blue-400'
        };
      case 'pan':
        return {
          icon: Hand,
          title: '平移模式',
          description: '右键拖拽平移视图',
          color: 'text-green-400'
        };
      case 'zoom':
        return {
          icon: ZoomIn,
          title: '缩放模式',
          description: '滚轮缩放视图',
          color: 'text-purple-400'
        };
      default:
        return {
          icon: MousePointer2,
          title: '自由模式',
          description: '多种操作可用',
          color: 'text-gray-400'
        };
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
        <div className="flex items-center space-x-3">
          {/* 当前模式 */}
          <div className="flex items-center space-x-2">
            <ModeIcon className={`w-5 h-5 ${modeInfo.color}`} />
            <div>
              <div className="text-sm font-semibold">{modeInfo.title}</div>
              <div className="text-xs text-gray-300">{modeInfo.description}</div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-gray-600"></div>

          {/* 状态指示 */}
          <div className="flex space-x-3">
            {isAutoRotate && (
              <div className="flex items-center space-x-1 text-green-400">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span className="text-xs">自动</span>
              </div>
            )}
            
            {isDamping && (
              <div className="flex items-center space-x-1 text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs">阻尼</span>
              </div>
            )}
          </div>

          {/* 分隔线 */}
          <div className="w-px h-8 bg-gray-600"></div>

          {/* 操作提示 */}
          <div className="flex space-x-4 text-xs text-gray-300">
            <div className="flex items-center space-x-1">
              <MousePointer2 className="w-3 h-3" />
              <span>鼠标</span>
            </div>
            <div className="flex items-center space-x-1">
              <Keyboard className="w-3 h-3" />
              <span>WASD</span>
            </div>
            <div className="flex items-center space-x-1">
              <Smartphone className="w-3 h-3" />
              <span>触控</span>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-2 bg-black/60 backdrop-blur-sm rounded px-3 py-1 text-xs text-gray-300 text-center">
        Ctrl+H: 帮助 | Ctrl+R: 重置 | Ctrl+Space: 自动旋转
      </div>
    </div>
  );
};

export default ControlStatusIndicator; 