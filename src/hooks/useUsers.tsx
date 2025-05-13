import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as AuthUser, useAuth, UserRole } from './useAuth'; 
import { usuários as defaultMockUsers, MockUserData } from '../db/mockData'; 
import { toast } from '@/components/ui/use-toast'; 

export interface Unit {
  id: string;
  name: string;
}

export interface UserData {
  id: string;
  nome: string; 
  email: string;
  perfil: UserRole; 
  unidadeId: string; 
  ativo: boolean; 
  senha?: string; 
}

interface UsersContextType {
  users: UserData[];
  units: Unit[];
  loading: boolean;
  addUser: (userData: Omit<UserData, 'id' | 'ativo' | 'unidadeId'> & { unidade: Unit, senha?: string }) => Promise<boolean>; 
  updateUser: (userId: string, userData: Partial<Omit<UserData, 'id' | 'ativo' | 'unidadeId' | 'senha'>> & { unidade?: Unit, senha?: string }) => Promise<boolean>; 
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (id: string, active: boolean) => Promise<boolean>;
  findUserById: (id: string) => UserData | undefined;
  getUnits: () => Unit[];
  getUnitNameById: (id: string) => string | undefined;
  getUserById: (id: string) => UserData | undefined;
  getUserNameById: (id: string) => string | undefined;
}

const defaultUnits: Unit[] = [
  { id: '1', name: '10º BPM' },
  { id: '2', name: '28º BPM' },
  { id: '3', name: '33º BPM' },
  { id: '4', name: '37º BPM' },
  { id: '5', name: '2ª CIPM' },
  { id: 'cpa5', name: '5º CPA' }, 
];

console.log('[useUsers] defaultUnits:', defaultUnits); // Log para verificar defaultUnits

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para gerar ID (simples para este exemplo)
  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    setLoading(true);
    const storedUsers = localStorage.getItem('pmerj_users');
    if (storedUsers) {
      try {
        const parsedUsers: UserData[] = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        console.log('[useUsers] Usuários carregados do localStorage:', parsedUsers); // Log usuários do localStorage
      } catch (e) {
        console.error("Erro ao parsear usuários do localStorage, usando mock data:", e);
        const mockUsersData: UserData[] = defaultMockUsers;
        setUsers(mockUsersData);
        localStorage.setItem('pmerj_users', JSON.stringify(mockUsersData));
        console.log('[useUsers] Usuários carregados do mockData (após erro localStorage):', mockUsersData); // Log usuários do mock
      }
    } else {
      const mockUsersData: UserData[] = defaultMockUsers;
      setUsers(mockUsersData);
      localStorage.setItem('pmerj_users', JSON.stringify(mockUsersData));
      console.log('[useUsers] Usuários carregados do mockData (localStorage vazio):', mockUsersData); // Log usuários do mock
    }
    setLoading(false);
  }, []);

  const addUser = async (userData: Omit<UserData, 'id' | 'ativo' | 'unidadeId'> & { unidade: Unit, senha?: string }): Promise<boolean> => {
    try {
      const newUser: UserData = {
        ...userData,
        id: generateId(),
        ativo: true, 
        unidadeId: userData.unidade.id, 
        // senha é opcional e já está em userData se fornecida
      };
      setUsers(prevUsers => {
        const updatedUsers = [...prevUsers, newUser];
        localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
      toast({
        title: "Usuário Adicionado",
        description: `O usuário ${userData.nome} foi adicionado com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      toast({
        title: "Erro ao adicionar usuário",
        description: "Ocorreu um erro ao tentar adicionar o novo usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<Omit<UserData, 'id' | 'ativo' | 'unidadeId' | 'senha'>> & { unidade?: Unit, senha?: string }): Promise<boolean> => {
    try {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user.id === userId) {
            const updatedUser = { ...user, ...userData };
            if (userData.unidade) {
              updatedUser.unidadeId = userData.unidade.id;
            }
            // delete (updatedUser as any).unidade; 
            return updatedUser;
          }
          return user;
        });
        localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
      toast({
        title: "Usuário Atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao tentar atualizar os dados do usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      let userName = "";
      setUsers(prevUsers => {
        const userToDelete = prevUsers.find(u => u.id === userId);
        if (userToDelete) userName = userToDelete.nome;
        const updatedUsers = prevUsers.filter(user => user.id !== userId);
        localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
      toast({
        title: "Usuário Excluído",
        description: `O usuário ${userName || 'ID: ' + userId} foi excluído com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao tentar excluir o usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleUserStatus = async (id: string, active: boolean): Promise<boolean> => {
    try {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user =>
          user.id === id ? { ...user, ativo: active } : user
        );
        localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });
      toast({
        title: "Status do Usuário Atualizado",
        description: `O usuário foi ${active ? 'ativado' : 'desativado'} com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status do usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const findUserById = (id: string): UserData | undefined => {
    return users.find(u => u.id === id);
  };

  const getUnits = (): Unit[] => {
    return defaultUnits;
  };

  const getUnitNameById = (id: string): string | undefined => {
    const unit = defaultUnits.find(u => u.id === id);
    return unit?.name;
  };

  const getUserById = (id: string): UserData | undefined => {
    return users.find(user => user.id === id);
  };

  const getUserNameById = (id: string): string | undefined => {
    const user = users.find(u => u.id === id);
    return user?.nome;
  };

  const value = {
    users,
    units: defaultUnits,
    loading,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    findUserById,
    getUnits,
    getUnitNameById,
    getUserById,
    getUserNameById,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
