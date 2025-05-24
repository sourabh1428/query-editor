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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async makeRequest(endpoint: string, options: RequestOptions = {}) {
    const {
      method = 'GET',
      headers = {},
      body,
      responseType = 'json'
    } = options;

    const url = `${API_URL}${endpoint}`;
    console.log(`🚀 API Request: ${method} ${url}`);
    console.log(`🔍 API URL from config: ${API_URL}`);
    console.log(`🌐 Current origin: ${window.location.origin}`);

    const config: RequestInit = {
      method,
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      },
      mode: 'cors',
      credentials: 'include'
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
      console.log(`📤 Request body:`, body);
    }

    console.log(`📋 Full request config:`, {
      url,
      method,
      headers: config.headers,
      mode: config.mode,
      credentials: config.credentials,
      body: body ? JSON.stringify(body) : undefined
    });

    try {
      console.log(`⏳ Starting fetch request...`);
      const response = await fetch(url, config);
      
      console.log(`📥 Response received:`);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  OK: ${response.ok}`);
      console.log(`  Type: ${response.type}`);
      console.log(`  URL: ${response.url}`);
      
      // Log all response headers
      console.log(`📥 Response headers:`);
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error text:`, errorText);
        
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
        const blobData = await response.blob();
        console.log(`✅ Blob response received, size: ${blobData.size}`);
        return blobData;
      }

      const responseData = await response.json();
      console.log(`✅ JSON response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`❌ API Error Details:`);
      console.error(`  Method: ${method}`);
      console.error(`  URL: ${url}`);
      console.error(`  Error:`, error);
      console.error(`  Error type:`, typeof error);
      console.error(`  Error name:`, error instanceof Error ? error.name : 'Unknown');
      console.error(`  Error message:`, error instanceof Error ? error.message : String(error));
      
      // More detailed error analysis
      if (error instanceof TypeError) {
        console.error('🚫 TypeError detected - likely network/CORS issue');
        console.error('🔍 Check:');
        console.error('  1. Backend is running on:', API_URL);
        console.error('  2. CORS configuration allows origin:', window.location.origin);
        console.error('  3. Network connectivity');
      }
      
      // Check if it's a CORS-specific error
      if (error instanceof Error && error.message.includes('CORS')) {
        console.error('🚫 CORS error specifically detected');
      }
      
      if (error instanceof Error && error.message.includes('fetch')) {
        console.error('🚫 Fetch error - network or CORS related');
      }
      
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