import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image, 
  Video,
  Database,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface ExportData {
  experimentType: string;
  timestamp: string;
  parameters: Record<string, any>;
  results: {
    velocity: number[][];
    pressure: number[][];
    vorticity: number[][];
    temperature?: number[][];
    streamlines?: Array<{x: number, y: number}[]>;
  };
  metadata: {
    reynoldsNumber: number;
    meshResolution: [number, number];
    timeStep: number;
    simulationTime: number;
  };
}

interface DataExportManagerProps {
  data: ExportData;
  onExport?: (format: string, data: any) => void;
}

export const DataExportManager: React.FC<DataExportManagerProps> = ({
  data,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const exportFormats = [
    { value: 'csv', label: 'CSV 数据文件', icon: FileSpreadsheet, description: '适用于Excel、MATLAB等软件' },
    { value: 'json', label: 'JSON 数据文件', icon: Database, description: '结构化数据，适用于编程分析' },
    { value: 'vtk', label: 'VTK 科学数据', icon: FileText, description: '适用于ParaView、VisIt等可视化软件' },
    { value: 'png', label: 'PNG 图像', icon: Image, description: '高质量静态图像' },
    { value: 'gif', label: 'GIF 动画', icon: Video, description: '流场动画演示' },
    { value: 'report', label: 'PDF 实验报告', icon: FileText, description: '完整的实验分析报告' }
  ];

  // 导出为CSV格式
  const exportToCSV = (data: ExportData): string => {
    const { results, parameters, metadata } = data;
    let csv = '';
    
    // 添加元数据
    csv += `实验类型,${data.experimentType}\n`;
    csv += `时间戳,${data.timestamp}\n`;
    csv += `雷诺数,${metadata.reynoldsNumber}\n`;
    csv += `网格分辨率,"${metadata.meshResolution[0]}x${metadata.meshResolution[1]}"\n`;
    csv += `时间步长,${metadata.timeStep}\n`;
    csv += `模拟时间,${metadata.simulationTime}\n\n`;
    
    // 添加参数
    csv += '参数名,数值\n';
    Object.entries(parameters).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    csv += '\n';
    
    // 添加速度场数据
    csv += '速度场数据\n';
    csv += 'X坐标,Y坐标,U速度,V速度,速度幅值\n';
    results.velocity.forEach((row, i) => {
      row.forEach((u, j) => {
        const v = results.velocity[i] ? results.velocity[i][j] : 0;
        const magnitude = Math.sqrt(u * u + v * v);
        csv += `${j},${i},${u},${v},${magnitude}\n`;
      });
    });
    
    return csv;
  };

  // 导出为JSON格式
  const exportToJSON = (data: ExportData): string => {
    return JSON.stringify({
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  };

  // 导出为VTK格式
  const exportToVTK = (data: ExportData): string => {
    const { results, metadata } = data;
    const [nx, ny] = metadata.meshResolution;
    
    let vtk = '';
    vtk += '# vtk DataFile Version 3.0\n';
    vtk += `Fluid Dynamics Simulation - ${data.experimentType}\n`;
    vtk += 'ASCII\n';
    vtk += 'DATASET STRUCTURED_GRID\n';
    vtk += `DIMENSIONS ${nx} ${ny} 1\n`;
    vtk += `POINTS ${nx * ny} float\n`;
    
    // 写入网格点坐标
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        vtk += `${i * metadata.timeStep} ${j * metadata.timeStep} 0.0\n`;
      }
    }
    
    // 写入点数据
    vtk += `POINT_DATA ${nx * ny}\n`;
    vtk += 'VECTORS velocity float\n';
    
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const u = results.velocity[j] ? results.velocity[j][i] : 0;
        const v = results.velocity[j] ? results.velocity[j][i] : 0;
        vtk += `${u} ${v} 0.0\n`;
      }
    }
    
    // 添加压力场
    vtk += 'SCALARS pressure float 1\n';
    vtk += 'LOOKUP_TABLE default\n';
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const p = results.pressure[j] ? results.pressure[j][i] : 0;
        vtk += `${p}\n`;
      }
    }
    
    return vtk;
  };

  // 生成PNG图像
  const exportToPNG = async (data: ExportData): Promise<Blob> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    const { results, metadata } = data;
    const [width, height] = metadata.meshResolution;
    
    canvas.width = width;
    canvas.height = height;
    
    // 创建速度场的彩色图像
    const imageData = ctx.createImageData(width, height);
    
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const u = results.velocity[j] ? results.velocity[j][i] : 0;
        const v = results.velocity[j] ? results.velocity[j][i] : 0;
        const magnitude = Math.sqrt(u * u + v * v);
        
        // 将速度映射到颜色
        const normalizedVel = Math.min(magnitude / 5.0, 1.0);
        const pixelIndex = (j * width + i) * 4;
        
        // 使用热力图配色方案
        if (normalizedVel < 0.25) {
          imageData.data[pixelIndex] = 0;
          imageData.data[pixelIndex + 1] = Math.floor(normalizedVel * 4 * 255);
          imageData.data[pixelIndex + 2] = 255;
        } else if (normalizedVel < 0.5) {
          imageData.data[pixelIndex] = 0;
          imageData.data[pixelIndex + 1] = 255;
          imageData.data[pixelIndex + 2] = Math.floor((0.5 - normalizedVel) * 4 * 255);
        } else if (normalizedVel < 0.75) {
          imageData.data[pixelIndex] = Math.floor((normalizedVel - 0.5) * 4 * 255);
          imageData.data[pixelIndex + 1] = 255;
          imageData.data[pixelIndex + 2] = 0;
        } else {
          imageData.data[pixelIndex] = 255;
          imageData.data[pixelIndex + 1] = Math.floor((1 - normalizedVel) * 4 * 255);
          imageData.data[pixelIndex + 2] = 0;
        }
        imageData.data[pixelIndex + 3] = 255; // Alpha
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  };

  // 执行导出
  const handleExport = async () => {
    setExportStatus('exporting');
    setExportProgress(0);
    
    try {
      let result: string | Blob;
      let filename: string;
      let mimeType: string;
      
      switch (selectedFormat) {
        case 'csv':
          result = exportToCSV(data);
          filename = `fluid_simulation_${data.experimentType}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'json':
          result = exportToJSON(data);
          filename = `fluid_simulation_${data.experimentType}_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
          
        case 'vtk':
          result = exportToVTK(data);
          filename = `fluid_simulation_${data.experimentType}_${Date.now()}.vtk`;
          mimeType = 'text/plain';
          break;
          
        case 'png':
          result = await exportToPNG(data);
          filename = `fluid_simulation_${data.experimentType}_${Date.now()}.png`;
          mimeType = 'image/png';
          break;
          
        default:
          throw new Error('Unsupported format');
      }
      
      // 创建下载链接
      const blob = result instanceof Blob ? result : new Blob([result], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      setExportStatus('success');
      
      if (onExport) {
        onExport(selectedFormat, result);
      }
      
      // 3秒后重置状态
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
      }, 3000);
    }
  };

  const selectedFormatInfo = exportFormats.find(f => f.value === selectedFormat);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          数据导出管理器
        </CardTitle>
        <CardDescription>
          导出实验数据为多种格式，支持后续分析和可视化
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 数据信息摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">实验类型</div>
            <div className="text-lg font-bold text-blue-900">{data.experimentType}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">雷诺数</div>
            <div className="text-lg font-bold text-green-900">{data.metadata.reynoldsNumber.toFixed(0)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">网格分辨率</div>
            <div className="text-lg font-bold text-purple-900">
              {data.metadata.meshResolution[0]}×{data.metadata.meshResolution[1]}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">模拟时间</div>
            <div className="text-lg font-bold text-orange-900">{data.metadata.simulationTime.toFixed(2)}s</div>
          </div>
        </div>

        {/* 格式选择 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">选择导出格式</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      <format.icon className="h-4 w-4" />
                      {format.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedFormatInfo && (
            <Alert>
              <selectedFormatInfo.icon className="h-4 w-4" />
              <AlertDescription>
                {selectedFormatInfo.description}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 导出进度 */}
        {exportStatus !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">导出进度</span>
              <span className="text-sm text-gray-500">{exportProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${exportProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* 状态提示 */}
        {exportStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              数据导出成功！文件已保存到下载目录。
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              导出失败，请检查数据格式或重试。
            </AlertDescription>
          </Alert>
        )}

        {/* 导出按钮 */}
        <Button 
          onClick={handleExport}
          disabled={exportStatus === 'exporting'}
          className="w-full"
          size="lg"
        >
          {exportStatus === 'exporting' ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              正在导出...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </>
          )}
        </Button>

        {/* 隐藏的Canvas用于图像生成 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}; 