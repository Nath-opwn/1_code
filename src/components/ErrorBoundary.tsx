import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                应用出现错误
              </h2>
              <p className="text-gray-600 mb-4">
                很抱歉，应用遇到了一个意外错误。
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-left">
                  <h3 className="font-semibold text-red-800 mb-2">错误详情：</h3>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                重新加载页面
              </button>
              
              <div className="mt-4">
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="text-blue-500 hover:text-blue-600 text-sm underline"
                >
                  尝试继续
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 