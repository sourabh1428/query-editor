import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from '../components/ui/use-toast';
import { apiService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Note: We'll need to add a /users/me endpoint or handle auth validation differently
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (authLoading) {
      console.log('Login already in progress, ignoring duplicate call');
      return;
    }

    setAuthLoading(true);
    try {
      const data = await apiService.login(email, password);
      
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
        variant: "default",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    if (authLoading) {
      console.log('Registration already in progress, ignoring duplicate call');
      return;
    }

    setAuthLoading(true);
    try {
      const data = await apiService.register(username, email, password);
      
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);

      toast({
        title: "Registration Successful!",
        description: "Your account has been created.",
        variant: "default",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);

    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    authLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};