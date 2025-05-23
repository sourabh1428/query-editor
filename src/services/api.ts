import { API_URL } from '../config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  responseType?: 'json' | 'blob';
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async makeRequest(endpoint: string, options: RequestOptions = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      responseType = 'json'
    } = options;

    const url = `${API_URL}${endpoint}`;
    console.log(`API Request: ${method} ${url}`);

    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      },
      credentials: 'include'
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Request failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      if (responseType === 'blob') {
        return response.blob();
      }

      return response.json();
    } catch (error) {
      console.error(`API Error: ${method} ${url}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  async register(username: string, email: string, password: string) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    });
  }

  // Query endpoints
  async executeQuery(query: string) {
    return this.makeRequest('/queries/execute', {
      method: 'POST',
      body: { query }
    });
  }

  async getQueryHistory() {
    return this.makeRequest('/queries/history');
  }

  async deleteQuery(queryId: number) {
    return this.makeRequest(`/queries/${queryId}`, {
      method: 'DELETE'
    });
  }

  async downloadQueryResults(queryId: number) {
    return this.makeRequest(`/queries/${queryId}/download`, {
      responseType: 'blob'
    });
  }

  // Schema endpoints
  async getTables() {
    return this.makeRequest('/schema/tables');
  }

  async getTableSchema(tableName: string) {
    return this.makeRequest(`/schema/tables/${tableName}`);
  }
}

export const apiService = new ApiService(); 