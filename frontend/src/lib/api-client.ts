import axios, { AxiosInstance } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Attach JWT access token to authenticated requests
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Handle authentication failures centrally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get = (url: string, config?: any) =>
    this.client.get(url, config);

  post = (url: string, data?: any, config?: any) =>
    this.client.post(url, data, config);

  put = (url: string, data?: any, config?: any) =>
    this.client.put(url, data, config);

  patch = (url: string, data?: any, config?: any) =>
    this.client.patch(url, data, config);

  delete = (url: string, config?: any) =>
    this.client.delete(url, config);
}

export default new ApiClient();
