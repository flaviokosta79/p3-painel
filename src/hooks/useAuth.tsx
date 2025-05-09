
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Nova propriedade para controlar o carregamento
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar carregamento inicial
  
  useEffect(() => {
    // Verificar se há um usuário no localStorage
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('pmerj_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('pmerj_user'); // Remove dados inválidos
      } finally {
        setIsLoading(false); // Finaliza o carregamento independente do resultado
      }
    };
    
    loadUser();
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Em um cenário real, esta solicitação seria feita a uma API
      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        
        // Armazena no estado e localStorage
        setUser(userWithoutPassword);
        localStorage.setItem('pmerj_user', JSON.stringify(userWithoutPassword));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro durante o login:', error);
      return false;
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('pmerj_user');
  };
  
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
