import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referrer-Policy': 'no-referrer-when-downgrade'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure referrer policy is set for each request
        config.headers['Referrer-Policy'] = 'no-referrer-when-downgrade';
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          console.error('Response error:', error.response.data);
          // Handle specific error cases
          if (error.response.status === 401) {
            // Handle unauthorized
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        } else if (error.request) {
          console.error('Request error:', error.request);
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      const response = await this.client.post('/api/auth/login', { email, password }, {
        headers: {
          'Referrer-Policy': 'no-referrer-when-downgrade'
        }
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
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