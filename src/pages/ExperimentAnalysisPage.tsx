import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, Download, FileText, Database, Eye } from 'lucide-react';

interface ExperimentResult {
  id: string;
  experimentType: string;
  experimentName: string;
  timestamp: string;
  parameters: Record<string, number>;
  results: Record<string, number>;
  notes?: string;
}

interface AnalysisData {
  summary: {
    totalExperiments: number;
    experimentsToday: number;
    averageAccuracy: number;
    successRate: number;
  };
  charts: {
    performanceTrend: Array<{ date: string; value: number }>;
    experimentDistribution: Array<{ type: string; count: number }>;
    parameterCorrelation: Array<{ x: number; y: number; label: string }>;
  };
}

const ExperimentAnalysisPage: React.FC = () => {
  const [selectedExperiment, setSelectedExperiment] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  // 模拟实验结果数据
  const mockResults: ExperimentResult[] = [
    {
      id: '1',
      experimentType: 'reynolds',
      experimentName: '雷诺实验',
      timestamp: '2024-01-15T10:30:00Z',
      parameters: { velocity: 2.5, diameter: 0.02, viscosity: 1.5e-5 },
      results: { reynoldsNumber: 3333, flowType: 1, pressureDrop: 125.5 },
      notes: '层流转湍流的临界点观察'
    },
    {
      id: '2',
      experimentType: 'bernoulli',
      experimentName: '伯努利实验',
      timestamp: '2024-01-15T14:20:00Z',
      parameters: { inletVelocity: 3.0, pipeDiameter1: 0.05, pipeDiameter2: 0.03 },
      results: { pressureDrop: 245.8, energyLoss: 12.3, efficiency: 95.2 },
      notes: '能量守恒验证实验'
    },
    {
      id: '3',
      experimentType: 'drag',
      experimentName: '阻力实验',
      timestamp: '2024-01-16T09:15:00Z',
      parameters: { windSpeed: 20, objectSize: 0.2, fluidDensity: 1.225 },
      results: { dragCoefficient: 0.47, dragForce: 2.84, reynolds: 26667 },
      notes: '球体阻力系数测试'
    },
    {
      id: '4',
      experimentType: 'pitot-tube',
      experimentName: '毕托管实验',
      timestamp: '2024-01-16T16:45:00Z',
      parameters: { airSpeed: 50, altitude: 1000, temperature: 15 },
      results: { staticPressure: 89875, totalPressure: 91412, velocity: 50.2 },
      notes: '高空流速测量校准'
    }
  ];

  // 生成分析数据
  const generateAnalysisData = (results: ExperimentResult[]): AnalysisData => {
    return {
      summary: {
        totalExperiments: results.length,
        experimentsToday: results.filter(r => 
          new Date(r.timestamp).toDateString() === new Date().toDateString()
        ).length,
        averageAccuracy: 94.5,
        successRate: 96.8
      },
      charts: {
        performanceTrend: [
          { date: '2024-01-10', value: 92.1 },
          { date: '2024-01-11', value: 93.4 },
          { date: '2024-01-12', value: 94.2 },
          { date: '2024-01-13', value: 93.8 },
          { date: '2024-01-14', value: 95.1 },
          { date: '2024-01-15', value: 94.9 },
          { date: '2024-01-16', value: 96.2 }
        ],
        experimentDistribution: [
          { type: '雷诺实验', count: 25 },
          { type: '伯努利实验', count: 18 },
          { type: '阻力实验', count: 22 },
          { type: '毕托管实验', count: 15 },
          { type: '卡门涡街', count: 12 }
        ],
        parameterCorrelation: [
          { x: 2000, y: 95.2, label: 'Re=2000' },
          { x: 3000, y: 94.8, label: 'Re=3000' },
          { x: 4000, y: 92.1, label: 'Re=4000' },
          { x: 5000, y: 89.5, label: 'Re=5000' },
          { x: 6000, y: 87.3, label: 'Re=6000' }
        ]
      }
    };
  };

  // 过滤结果
  const filteredResults = selectedExperiment === 'all' 
    ? results 
    : results.filter(r => r.experimentType === selectedExperiment);

  // 获取实验类型选项
  const experimentTypes = [
    { value: 'all', label: '全部实验' },
    { value: 'reynolds', label: '雷诺实验' },
    { value: 'bernoulli', label: '伯努利实验' },
    { value: 'drag', label: '阻力实验' },
    { value: 'pitot-tube', label: '毕托管实验' }
  ];

  // 时间范围选项
  const timeRanges = [
    { value: 'day', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '本年' }
  ];

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(filteredResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `experiment_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 生成报告
  const generateReport = () => {
    alert('报告生成功能开发中...');
  };

  useEffect(() => {
    setLoading(true);
    // 模拟数据加载
    setTimeout(() => {
      setResults(mockResults);
      setAnalysisData(generateAnalysisData(mockResults));
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载分析数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">实验数据分析</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            深入分析实验数据，发现规律和趋势，提升实验效果
          </p>
        </motion.div>

        {/* 筛选和操作栏 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据筛选与操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* 实验类型筛选 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">实验类型:</label>
                <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experimentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 时间范围筛选 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">时间范围:</label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 ml-auto">
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
                <Button onClick={generateReport} variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  生成报告
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        {analysisData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总实验数</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisData.summary.totalExperiments}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">今日实验</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysisData.summary.experimentsToday}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均精度</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analysisData.summary.averageAccuracy}%
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">成功率</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analysisData.summary.successRate}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 图表分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 性能趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle>实验性能趋势</CardTitle>
              <CardDescription>过去一周的实验准确率变化</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analysisData?.charts.performanceTrend.map((point, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                      style={{ height: `${(point.value - 85) * 3}px` }}
                      title={`${point.date}: ${point.value}%`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                      {point.date.split('-')[2]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                日期 (1月)
              </div>
            </CardContent>
          </Card>

          {/* 实验分布图 */}
          <Card>
            <CardHeader>
              <CardTitle>实验类型分布</CardTitle>
              <CardDescription>各类型实验的执行次数统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData?.charts.experimentDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${(item.count / 25) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 实验记录列表 */}
        <Card>
          <CardHeader>
            <CardTitle>实验记录详情</CardTitle>
            <CardDescription>
              显示 {filteredResults.length} 条记录 (共 {results.length} 条)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{result.experimentName}</h3>
                      <p className="text-sm text-gray-500">{formatTime(result.timestamp)}</p>
                    </div>
                    <Badge variant="outline">{result.experimentType}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">实验参数</h4>
                      <div className="space-y-1">
                        {Object.entries(result.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">实验结果</h4>
                      <div className="space-y-1">
                        {Object.entries(result.results).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-mono text-blue-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {result.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">备注:</span> {result.notes}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 分析建议 */}
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            <strong>分析建议:</strong>
            根据数据趋势，建议增加雷诺实验的测试点密度，特别是在临界雷诺数附近。
            伯努利实验的能量损失偏高，可能需要检查管道粗糙度设置。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ExperimentAnalysisPage; 