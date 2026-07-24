import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if it exists
    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  get = (url: string, config?: any) => this.client.get(url, config);
  post = (url: string, data?: any, config?: any) => this.client.post(url, data, config);
  put = (url: string, data?: any, config?: any) => this.client.put(url, data, config);
  patch = (url: string, data?: any, config?: any) => this.client.patch(url, data, config);
  delete = (url: string, config?: any) => this.client.delete(url, config);
}

export default new ApiClient();
