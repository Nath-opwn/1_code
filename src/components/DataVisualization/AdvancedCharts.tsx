import React, { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  LineChart, 
  Activity, 
  Zap, 
  Wind,
  Download,
  Settings,
  Eye
} from 'lucide-react';

interface FluidDataPoint {
  x: number;
  y: number;
  u: number;
  v: number;
  p: number;
  vorticity: number;
  temperature?: number;
}

interface AdvancedChartsProps {
  data: FluidDataPoint[][];
  width: number;
  height: number;
  reynoldsNumber: number;
  timeStep: number;
  currentTime: number;
}

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  data,
  width,
  height,
  reynoldsNumber,
  timeStep,
  currentTime
}) => {
  const [selectedChart, setSelectedChart] = React.useState('velocity-field');
  const [selectedColormap, setSelectedColormap] = React.useState('viridis');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement>(null);

  const chartTypes = [
    { value: 'velocity-field', label: '速度场', icon: Wind, description: '显示流场速度矢量' },
    { value: 'pressure-contour', label: '压力等高线', icon: BarChart3, description: '显示压力分布等高线' },
    { value: 'vorticity-field', label: '涡量场', icon: Activity, description: '显示涡量分布' },
    { value: 'streamlines', label: '流线图', icon: LineChart, description: '显示流体流线' },
    { value: 'velocity-profile', label: '速度剖面', icon: Zap, description: '特定位置的速度剖面' }
  ];

  const colormaps = [
    { value: 'viridis', label: 'Viridis (蓝绿紫)', colors: ['#440154', '#31688e', '#35b779', '#fde725'] },
    { value: 'plasma', label: 'Plasma (紫红黄)', colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921'] },
    { value: 'jet', label: 'Jet (蓝青黄红)', colors: ['#000080', '#0000ff', '#00ffff', '#ffff00', '#ff0000'] },
    { value: 'coolwarm', label: 'Cool-Warm (蓝白红)', colors: ['#3b4cc0', '#7396d4', '#b4d7f0', '#f4b4a7', '#d73027'] }
  ];

  // 计算统计数据
  const statistics = useMemo(() => {
    if (!data || data.length === 0) return null;

    let maxVel = 0;
    let minPressure = Infinity;
    let maxPressure = -Infinity;
    let maxVorticity = 0;
    let totalPoints = 0;

    for (let j = 0; j < data.length; j++) {
      for (let i = 0; i < data[j].length; i++) {
        const point = data[j][i];
        const velocity = Math.sqrt(point.u * point.u + point.v * point.v);
        
        maxVel = Math.max(maxVel, velocity);
        minPressure = Math.min(minPressure, point.p);
        maxPressure = Math.max(maxPressure, point.p);
        maxVorticity = Math.max(maxVorticity, Math.abs(point.vorticity));
        totalPoints++;
      }
    }

    return {
      maxVelocity: maxVel,
      minPressure,
      maxPressure,
      maxVorticity,
      totalPoints,
      averagePressure: (minPressure + maxPressure) / 2
    };
  }, [data]);

  // 颜色映射函数
  const getColor = (value: number, min: number, max: number, colormap: string): [number, number, number] => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    switch (colormap) {
      case 'viridis':
        if (normalized < 0.25) {
          const t = normalized / 0.25;
          return [68 + t * (49 - 68), 1 + t * (104 - 1), 84 + t * (142 - 84)];
        } else if (normalized < 0.5) {
          const t = (normalized - 0.25) / 0.25;
          return [49 + t * (53 - 49), 104 + t * (183 - 104), 142 + t * (121 - 142)];
        } else if (normalized < 0.75) {
          const t = (normalized - 0.5) / 0.25;
          return [53 + t * (253 - 53), 183 + t * (231 - 183), 121 + t * (37 - 121)];
        } else {
          const t = (normalized - 0.75) / 0.25;
          return [253, 231, 37];
        }
      
      case 'plasma':
        if (normalized < 0.2) {
          const t = normalized / 0.2;
          return [13 + t * (126 - 13), 8 + t * (3 - 8), 135 + t * (168 - 135)];
        } else if (normalized < 0.4) {
          const t = (normalized - 0.2) / 0.2;
          return [126 + t * (204 - 126), 3 + t * (71 - 3), 168 + t * (120 - 168)];
        } else if (normalized < 0.6) {
          const t = (normalized - 0.4) / 0.2;
          return [204 + t * (248 - 204), 71 + t * (148 - 71), 120 + t * (65 - 120)];
        } else if (normalized < 0.8) {
          const t = (normalized - 0.6) / 0.2;
          return [248 + t * (240 - 248), 148 + t * (249 - 148), 65 + t * (33 - 65)];
        } else {
          return [240, 249, 33];
        }
      
      case 'jet':
        if (normalized < 0.25) {
          return [0, 0, Math.floor(128 + normalized * 4 * 127)];
        } else if (normalized < 0.5) {
          return [0, Math.floor((normalized - 0.25) * 4 * 255), 255];
        } else if (normalized < 0.75) {
          return [Math.floor((normalized - 0.5) * 4 * 255), 255, Math.floor(255 - (normalized - 0.5) * 4 * 255)];
        } else {
          return [255, Math.floor(255 - (normalized - 0.75) * 4 * 255), 0];
        }
      
      case 'coolwarm':
        if (normalized < 0.5) {
          const t = normalized * 2;
          return [59 + t * (180 - 59), 76 + t * (215 - 76), 192 + t * (240 - 192)];
        } else {
          const t = (normalized - 0.5) * 2;
          return [180 + t * (215 - 180), 215 + t * (48 - 215), 240 + t * (39 - 240)];
        }
      
      default:
        return [Math.floor(normalized * 255), Math.floor(normalized * 255), Math.floor(normalized * 255)];
    }
  };

  // 绘制速度场
  const drawVelocityField = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    const cellWidth = width / data[0].length;
    const cellHeight = height / data.length;

    // 绘制速度幅值的颜色映射
    for (let j = 0; j < data.length; j++) {
      for (let i = 0; i < data[j].length; i++) {
        const point = data[j][i];
        const velocity = Math.sqrt(point.u * point.u + point.v * point.v);
        const [r, g, b] = getColor(velocity, 0, statistics.maxVelocity, selectedColormap);
        
        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
      }
    }

    // 绘制速度矢量
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    const vectorScale = Math.min(cellWidth, cellHeight) * 0.3 / statistics.maxVelocity;

    for (let j = 0; j < data.length; j += 3) {
      for (let i = 0; i < data[j].length; i += 3) {
        const point = data[j][i];
        const centerX = (i + 0.5) * cellWidth;
        const centerY = (j + 0.5) * cellHeight;
        const endX = centerX + point.u * vectorScale;
        const endY = centerY + point.v * vectorScale;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 绘制箭头
        const angle = Math.atan2(point.v, point.u);
        const arrowLength = 3;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - Math.PI / 6),
          endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + Math.PI / 6),
          endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  };

  // 绘制压力等高线
  const drawPressureContour = () => {
    const canvas = contourCanvasRef.current;
    if (!canvas || !data || !statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    const cellWidth = width / data[0].length;
    const cellHeight = height / data.length;

    // 绘制压力颜色映射
    for (let j = 0; j < data.length; j++) {
      for (let i = 0; i < data[j].length; i++) {
        const point = data[j][i];
        const [r, g, b] = getColor(point.p, statistics.minPressure, statistics.maxPressure, selectedColormap);
        
        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
      }
    }

    // 绘制等高线
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1;
    
    const contourLevels = 10;
    const pressureRange = statistics.maxPressure - statistics.minPressure;
    
    for (let level = 1; level < contourLevels; level++) {
      const contourValue = statistics.minPressure + (level / contourLevels) * pressureRange;
      
      // 简化的等高线绘制（实际应用中可以使用更复杂的算法）
      for (let j = 0; j < data.length - 1; j++) {
        for (let i = 0; i < data[j].length - 1; i++) {
          const p1 = data[j][i].p;
          const p2 = data[j][i + 1].p;
          const p3 = data[j + 1][i].p;
          const p4 = data[j + 1][i + 1].p;
          
          // 检查是否有等高线穿过这个单元格
          if ((p1 <= contourValue && p2 >= contourValue) || (p1 >= contourValue && p2 <= contourValue)) {
            const x1 = i * cellWidth;
            const x2 = (i + 1) * cellWidth;
            const y = j * cellHeight;
            const t = (contourValue - p1) / (p2 - p1);
            const x = x1 + t * (x2 - x1);
            
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, 2 * Math.PI);
            ctx.stroke();
          }
        }
      }
    }
  };

  // 绘制涡量场
  const drawVorticityField = () => {
    const canvas = vectorCanvasRef.current;
    if (!canvas || !data || !statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    const cellWidth = width / data[0].length;
    const cellHeight = height / data.length;

    // 绘制涡量颜色映射
    for (let j = 0; j < data.length; j++) {
      for (let i = 0; i < data[j].length; i++) {
        const point = data[j][i];
        const [r, g, b] = getColor(
          Math.abs(point.vorticity), 
          0, 
          statistics.maxVorticity, 
          selectedColormap
        );
        
        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
      }
    }

    // 绘制涡量等高线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;
    
    for (let j = 1; j < data.length - 1; j++) {
      for (let i = 1; i < data[j].length - 1; i++) {
        const vorticity = data[j][i].vorticity;
        if (Math.abs(vorticity) > statistics.maxVorticity * 0.5) {
          const centerX = (i + 0.5) * cellWidth;
          const centerY = (j + 0.5) * cellHeight;
          const radius = Math.abs(vorticity) / statistics.maxVorticity * 5;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }
  };

  // 根据选择的图表类型绘制
  useEffect(() => {
    switch (selectedChart) {
      case 'velocity-field':
        drawVelocityField();
        break;
      case 'pressure-contour':
        drawPressureContour();
        break;
      case 'vorticity-field':
        drawVorticityField();
        break;
      default:
        drawVelocityField();
    }
  }, [selectedChart, selectedColormap, data]);

  const selectedChartInfo = chartTypes.find(c => c.value === selectedChart);

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            高级数据可视化
          </CardTitle>
          <CardDescription>
            多维度流场数据的科学可视化分析工具
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">可视化类型</label>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((chart) => (
                    <SelectItem key={chart.value} value={chart.value}>
                      <div className="flex items-center gap-2">
                        <chart.icon className="h-4 w-4" />
                        {chart.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">颜色映射</label>
              <Select value={selectedColormap} onValueChange={setSelectedColormap}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colormaps.map((colormap) => (
                    <SelectItem key={colormap.value} value={colormap.value}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {colormap.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {colormap.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedChartInfo && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <selectedChartInfo.icon className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedChartInfo.label}</span>
              </div>
              <p className="text-sm text-blue-700">{selectedChartInfo.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计信息 */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">实时统计数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-red-600 font-medium">最大速度</div>
                <div className="text-lg font-bold text-red-900">
                  {statistics.maxVelocity.toFixed(2)} m/s
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">压力范围</div>
                <div className="text-lg font-bold text-blue-900">
                  {(statistics.maxPressure - statistics.minPressure).toFixed(0)} Pa
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">最大涡量</div>
                <div className="text-lg font-bold text-green-900">
                  {statistics.maxVorticity.toFixed(2)} 1/s
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">雷诺数</div>
                <div className="text-lg font-bold text-purple-900">
                  {reynoldsNumber.toFixed(0)}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">模拟时间</div>
                <div className="text-lg font-bold text-orange-900">
                  {currentTime.toFixed(2)}s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 可视化画布 */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={`w-full h-96 border rounded-lg ${selectedChart === 'velocity-field' ? 'block' : 'hidden'}`}
              style={{ imageRendering: 'pixelated' }}
            />
            <canvas
              ref={contourCanvasRef}
              className={`w-full h-96 border rounded-lg ${selectedChart === 'pressure-contour' ? 'block' : 'hidden'}`}
              style={{ imageRendering: 'pixelated' }}
            />
            <canvas
              ref={vectorCanvasRef}
              className={`w-full h-96 border rounded-lg ${selectedChart === 'vorticity-field' ? 'block' : 'hidden'}`}
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* 颜色条 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
              <div className="text-xs font-medium mb-2">
                {selectedChart === 'velocity-field' && '速度 (m/s)'}
                {selectedChart === 'pressure-contour' && '压力 (Pa)'}
                {selectedChart === 'vorticity-field' && '涡量 (1/s)'}
              </div>
              <div className="w-4 h-20 bg-gradient-to-t from-blue-500 via-green-500 to-red-500 rounded"></div>
              <div className="text-xs mt-1">
                {statistics && (
                  <>
                    <div>{selectedChart === 'velocity-field' && statistics.maxVelocity.toFixed(1)}</div>
                    <div className="my-1">{selectedChart === 'velocity-field' && (statistics.maxVelocity / 2).toFixed(1)}</div>
                    <div>0.0</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 