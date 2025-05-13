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
}

interface UsersContextType {
  users: UserData[];
  units: Unit[];
  loading: boolean;
  findUserById: (id: string) => UserData | undefined;
  getUnits: () => Unit[];
  getUnitNameById: (id: string) => string | undefined;
  toggleUserStatus: (id: string, active: boolean) => Promise<boolean>;
  getUserById: (id: string) => UserData | undefined;
  getUserNameById: (id: string) => string | undefined;
}

const defaultUnits: Unit[] = [
  { id: '1', name: '10º BPM' },
  { id: '2', name: '28º BPM' },
  { id: '3', name: '33º BPM' },
  { id: '4', name: '37º BPM' },
  { id: '5', name: '2ª CIPM' },
];

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const storedUsers = localStorage.getItem('pmerj_users');
    if (storedUsers) {
      try {
        const parsedUsers: UserData[] = JSON.parse(storedUsers);
        setUsers(parsedUsers);
      } catch (e) {
        console.error("Erro ao parsear usuários do localStorage, usando mock data:", e);
        const mockUsersData: UserData[] = defaultMockUsers;
        setUsers(mockUsersData);
        localStorage.setItem('pmerj_users', JSON.stringify(mockUsersData));
      }
    } else {
      const mockUsersData: UserData[] = defaultMockUsers;
      setUsers(mockUsersData);
      localStorage.setItem('pmerj_users', JSON.stringify(mockUsersData));
    }
    setLoading(false);
  }, []);

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
    findUserById,
    getUnits,
    getUnitNameById,
    toggleUserStatus,
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
