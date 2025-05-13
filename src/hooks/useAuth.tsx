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
  isAdmin: boolean; // Nova propriedade
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Nova propriedade para controlar o carregamento
}

// Removemos os dados mockados

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
      // Agora vamos verificar no localStorage (pmerj_users) se existe um usuário com esse email
      const storedUsers = localStorage.getItem('pmerj_users');
      if (!storedUsers) return false;
      
      const users = JSON.parse(storedUsers);
      
      // Obter as senhas armazenadas
      const userPasswords = JSON.parse(localStorage.getItem('pmerj_user_passwords') || '{}');
      
      // Verificar credenciais
      const foundUser = users.find((u: any) => u.email === email && u.active !== false);
      
      if (foundUser) {
        // Verificar a senha do usuário
        const userPassword = userPasswords[foundUser.id];
        
        // Se a senha armazenada corresponder à senha fornecida ou se for uma das senhas padrão para desenvolvimento
        if (userPassword === password || password === 'admin123' || password === 'user123') {
          // Cria o objeto de usuário autenticado
          const userObj: User = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            unit: foundUser.unit,
            isAdmin: foundUser.role === 'admin' // Adiciona a nova propriedade
          };
          
          // Armazena no estado e localStorage
          setUser(userObj);
          localStorage.setItem('pmerj_user', JSON.stringify(userObj));
          
          // Atualiza a data do último login
          const updatedUsers = users.map((u: any) => {
            if (u.id === foundUser.id) {
              return {
                ...u,
                lastLogin: new Date().toISOString()
              };
            }
            return u;
          });
          
          localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
          
          return true;
        }
      }
      
      // Se não houver usuários cadastrados, permitir login com admin padrão
      if (users.length === 0 && email === 'admin@pmerj.gov.br' && password === 'admin123') {
        // Cria um usuário admin padrão
        const defaultAdmin: User = {
          id: '1',
          name: 'Admin Padrão',
          email: 'admin@pmerj.gov.br',
          role: 'admin',
          unit: { id: '1', name: 'Comando Central' },
          isAdmin: true // Adiciona a nova propriedade
        };
        
        setUser(defaultAdmin);
        localStorage.setItem('pmerj_user', JSON.stringify(defaultAdmin));
        
        // Adiciona o admin ao localStorage de usuários
        const adminWithExtras = {
          ...defaultAdmin,
          createdAt: new Date().toISOString(),
          active: true
        };
        
        localStorage.setItem('pmerj_users', JSON.stringify([adminWithExtras]));
        
        // Armazena a senha padrão do admin
        const adminPasswords = {};
        adminPasswords['1'] = 'admin123';
        localStorage.setItem('pmerj_user_passwords', JSON.stringify(adminPasswords));
        
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
