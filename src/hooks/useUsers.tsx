import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole, Unit } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Tipos
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit: Unit;
  createdAt: string;
  lastLogin?: string;
 
  active: boolean;
}

interface UsersContextType {
  users: UserData[];
  loading: boolean;
  addUser: (user: Omit<UserData, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUser: (id: string, data: Partial<Omit<UserData, 'id'>>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>; // Para exclusão permanente
  toggleUserStatus: (id: string) => Promise<boolean>; // Nova função para ativar/desativar
  getUserById: (id: string) => UserData | undefined;
  getUnits: () => Unit[];
}

// Mock de unidades
const MOCK_UNITS: Unit[] = [
  { id: '1', name: 'Comando Central' },
  { id: '2', name: '10º BPM' },
  { id: '3', name: '12º BPM' },
  { id: '4', name: '15º BPM' },
  { id: '5', name: '22º BPM' },
];

// Mock de usuários
const MOCK_USERS: UserData[] = [
  {
    id: '1',
    name: 'Admin Geral',
    email: 'admin@pmerj.gov.br',
    role: 'admin',
    unit: MOCK_UNITS[0],
    createdAt: '2025-01-01T00:00:00',
    lastLogin: '2025-05-08T08:30:00',
    active: true,
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@pmerj.gov.br',
    role: 'user',
    unit: MOCK_UNITS[1],
    createdAt: '2025-02-15T00:00:00',
    lastLogin: '2025-05-07T14:20:00',
    active: true,
  },
  {
    id: '3',
    name: 'Maria Costa',
    email: 'maria@pmerj.gov.br',
    role: 'user',
    unit: MOCK_UNITS[2],
    createdAt: '2025-03-10T00:00:00',
    lastLogin: '2025-05-05T09:45:00',
    active: true,
  },
  {
    id: '4',
    name: 'Carlos Souza',
    email: 'carlos@pmerj.gov.br',
    role: 'user',
    unit: MOCK_UNITS[3],
    createdAt: '2025-04-05T00:00:00',
    active: true,
  },
];

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simula carregamento dos usuários
    const loadUsers = () => {
      setTimeout(() => {
        const storedUsers = localStorage.getItem('pmerj_users');
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        } else {
          setUsers(MOCK_USERS);
          localStorage.setItem('pmerj_users', JSON.stringify(MOCK_USERS));
        }
        setLoading(false);
      }, 500);
    };
    
    loadUsers();
  }, []);
  
  const addUser = async (userData: Omit<UserData, 'id' | 'createdAt'>) => {
    try {
      // Verificar se já existe um usuário com este e-mail
      const existingUser = users.find((user) => user.email === userData.email);
      if (existingUser) {
        toast({
          title: "Erro ao adicionar usuário",
          description: "Já existe um usuário com este e-mail.",
          variant: "destructive",
        });
        return false;
      }
      
      const newUser: UserData = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Usuário adicionado",
        description: "O usuário foi criado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      
      toast({
        title: "Erro ao adicionar usuário",
        description: "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const updateUser = async (id: string, data: Partial<Omit<UserData, 'id'>>) => {
    try {
      // Se estiver atualizando o e-mail, verificar se já existe
      if (data.email) {
        const existingUser = users.find(
          (user) => user.email === data.email && user.id !== id
        );
        
        if (existingUser) {
          toast({
            title: "Erro ao atualizar usuário",
            description: "Este e-mail já está em uso.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      const updatedUsers = users.map((user) =>
        user.id === id ? { ...user, ...data } : user
      );
      
      setUsers(updatedUsers);
      localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      toast({
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao atualizar as informações do usuário.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      let userNewStatus = false;
      const updatedUsers = users.map((user) => {
        if (user.id === id) {
          userNewStatus = !user.active; // Captura o novo status para a mensagem do toast
          return { ...user, active: !user.active };
        }
        return user;
      });

      setUsers(updatedUsers);
      localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));

      toast({
        title: `Usuário ${userNewStatus ? "ativado" : "desativado"}`,
        description: `O usuário foi ${userNewStatus ? "ativado" : "desativado"} com sucesso.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status do usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Modificado para remover permanentemente o usuário
      const updatedUsers = users.filter((user) => user.id !== id);
      
      setUsers(updatedUsers);
      localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Usuário excluído", // Mensagem atualizada
        description: "O usuário foi excluído permanentemente com sucesso.", // Mensagem atualizada
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error); // Mensagem de erro atualizada
      
      toast({
        title: "Erro ao excluir usuário", // Mensagem atualizada
        description: "Ocorreu um erro ao excluir o usuário permanentemente.", // Mensagem atualizada
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  const getUserById = (id: string) => {
    return users.find((user) => user.id === id);
  };
  
  const getUnits = () => {
    return MOCK_UNITS;
  };
  
  const value = {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser, // Mantém a exclusão permanente
    toggleUserStatus, // Adiciona a nova função
    getUserById,
    getUnits,
  };
  
  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers deve ser usado dentro de um UsersProvider');
  }
  return context;
};
