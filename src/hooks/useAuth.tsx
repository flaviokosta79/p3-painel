
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Tipos
export type UserRole = 'admin' | 'user';

export interface Unit {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit: Unit;
  sessionKey?: string; // Chave de sessão para verificação
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Mock de dados iniciais
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin Geral',
    email: 'admin@pmerj.gov.br',
    password: 'admin123',
    role: 'admin' as UserRole,
    unit: { id: '1', name: 'Comando Central' },
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@pmerj.gov.br',
    password: 'user123',
    role: 'user' as UserRole,
    unit: { id: '2', name: '10º BPM' },
  },
];

// Nome da chave do session storage
const AUTH_STORAGE_KEY = 'pmerj_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Função para restaurar a sessão do localStorage
  const restoreSession = useCallback(() => {
    setIsLoading(true);
    try {
      // Tentar recuperar da sessão do navegador
      const session = localStorage.getItem(AUTH_STORAGE_KEY);
      if (session) {
        // Verificar se a sessão ainda é válida
        const userData = JSON.parse(session);
        
        // Adicionar alguma verificação de validade se necessário
        const sessionTimestamp = localStorage.getItem(`${AUTH_STORAGE_KEY}_timestamp`);
        const currentTime = new Date().getTime();
        
        // Se a sessão ainda for válida (24 horas)
        if (sessionTimestamp && (currentTime - parseInt(sessionTimestamp)) < 24 * 60 * 60 * 1000) {
          setUser(userData);
        } else {
          // Sessão expirada
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(`${AUTH_STORAGE_KEY}_timestamp`);
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
    // Efeito para verificar se há uma sessão salva ao carregar a aplicação
  useEffect(() => {
    restoreSession();
    
    // Adicionar listener para sincronização entre abas
    window.addEventListener('storage', (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        restoreSession();
      }
    });
    
    // Configurar um intervalo para manter a sessão ativa
    // Atualiza o timestamp a cada 10 minutos se o usuário estiver logado
    const sessionKeepAliveInterval = setInterval(() => {
      if (user) {
        localStorage.setItem(`${AUTH_STORAGE_KEY}_timestamp`, String(new Date().getTime()));
      }
    }, 10 * 60 * 1000); // 10 minutos
    
    return () => {
      clearInterval(sessionKeepAliveInterval);
    };
  }, [restoreSession, user]);
    const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Em um cenário real, esta solicitação seria feita a uma API
      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        
        // Gerar uma chave de sessão única (aqui estamos simulando)
        const sessionKey = Math.random().toString(36).substring(2, 15);
        const userWithSession = {
          ...userWithoutPassword,
          sessionKey
        };
        
        // Armazenar usuário no localStorage com timestamp
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithSession));
        localStorage.setItem(`${AUTH_STORAGE_KEY}_timestamp`, String(new Date().getTime()));
        
        // Em um cenário real, você poderia também fazer login no Supabase aqui
        // await supabase.auth.signInWithPassword({
        //   email: email,
        //   password: password,
        // });
        
        setUser(userWithSession);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };
  
  const logout = () => {
    try {
      setUser(null);
      
      // Remover do localStorage
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(`${AUTH_STORAGE_KEY}_timestamp`);
      
      // Em um cenário real, você também faria logout do Supabase
      // await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };
  
  // Se estiver carregando, poderia opcionalmente mostrar um loader aqui
  // if (isLoading) return <div>Carregando...</div>;
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
