import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_URL } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    console.log('Initializing API client with base URL:', API_URL);
    
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log('Making request to:', config.url);
        console.log('Request headers:', config.headers);
        console.log('Request data:', config.data);
        
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request error:', {
          message: error.message,
          config: error.config,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('Response received:', {
          status: response.status,
          headers: response.headers,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          console.error('Response error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          });
          
          if (error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        } else if (error.request) {
          console.error('No response received:', {
            request: error.request,
            message: error.message,
            code: error.code
          });
        } else {
          console.error('Error setting up request:', {
            message: error.message,
            config: error.config
          });
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      console.log('Attempting login for:', email);
      const response = await this.client.post('/api/auth/login', { email, password });
      console.log('Login successful:', response.data);
      return response;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Login error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      } else {
        console.error('Unknown login error:', error);
      }
      throw error;
    }
  }

  async register(username: string, email: string, password: string) {
    return this.client.post('/api/auth/register', { username, email, password });
  }

  // Query endpoints
  async executeQuery(query: string) {
    return this.client.post('/api/queries/execute', { query });
  }

  async getQueryHistory() {
    return this.client.get('/api/queries/history');
  }

  async deleteQuery(queryId: number) {
    return this.client.delete(`/api/queries/${queryId}`);
  }

  async downloadQueryResults(queryId: number) {
    return this.client.get(`/api/queries/${queryId}/download`, {
      responseType: 'blob'
    });
  }

  // Schema endpoints
  async getTables() {
    return this.client.get('/api/schema/tables');
  }

  async getTableSchema(tableName: string) {
    return this.client.get(`/api/schema/tables/${tableName}`);
  }
}

export const apiClient = new ApiClient(); 