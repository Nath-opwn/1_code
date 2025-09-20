import axios from 'axios';

// API基础配置
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // 可以重定向到登录页
      window.location.href = '/login';
    }
    
    // 返回标准化错误信息
    const errorMessage = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(errorMessage));
  }
);

// 类型安全的API调用包装器
const apiWrapper = {
  get: <T>(url: string): Promise<T> => api.get(url),
  post: <T>(url: string, data?: any): Promise<T> => api.post(url, data),
  put: <T>(url: string, data?: any): Promise<T> => api.put(url, data),
  delete: <T>(url: string): Promise<T> => api.delete(url)
};

export { apiWrapper };
export default api; 