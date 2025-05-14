import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import { type User as AuthUser, useAuth, type UserRole } from './useAuth'; 
import { usuários as defaultMockUsers, type MockUserData } from '../db/mockData'; 
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

export const UsersProvider: FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para gerar ID (simples para este exemplo)
  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    setLoading(true);
    const storedUsers = localStorage.getItem('pmerj_users');
    let usersToProcess: UserData[] = [];
    let usersModifiedByAdminLogic = false;

    if (storedUsers) {
      try {
        const parsedUsers: UserData[] = JSON.parse(storedUsers);
        // Aplicar validação de nome da versão HEAD (origin/main)
        usersToProcess = parsedUsers.map(user => {
          if ((user as any).name && !user.nome) { // Lidar com campo 'name' legado
            return { ...user, nome: (user as any).name };
          }
          if (!user.nome && !(user as any).name) { // Garantir que 'nome' exista
            return { ...user, nome: `Usuário ${user.id}` }; // Nome padrão
          }
          return user;
        });
        console.log('[useUsers] Usuários carregados e validados do localStorage:', usersToProcess);
      } catch (e) {
        console.error("Erro ao parsear/validar usuários do localStorage, usando mock data:", e);
        usersToProcess = defaultMockUsers.map(u => ({...u})); 
      }
    } else {
      console.log('[useUsers] localStorage vazio, usando mock data.');
      usersToProcess = defaultMockUsers.map(u => ({...u}));
    }

    // Garantir que admins estejam sempre ativos (lógica do commit 4de79ab)
    const finalCorrectedUsers = usersToProcess.map(user => {
      if (user.perfil === 'admin' && !user.ativo) {
        usersModifiedByAdminLogic = true;
        return { ...user, ativo: true };
      }
      return user;
    });

    if (usersModifiedByAdminLogic || !storedUsers) { 
      localStorage.setItem('pmerj_users', JSON.stringify(finalCorrectedUsers));
      if (usersModifiedByAdminLogic) {
        console.log('[useUsers] Admin(s) inativo(s) foram forçados para ativo e localStorage atualizado.');
      } else if (!storedUsers) {
        console.log('[useUsers] Mock data salvo no localStorage.');
      }
    }
    
    setUsers(finalCorrectedUsers);
    console.log('[useUsers] Usuários carregados e processados finais:', finalCorrectedUsers);
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
        description: `O usuário ${userName || `ID: ${userId}`} foi excluído com sucesso.`,
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
    // Lógica de prevenção de desativação de admin do commit 4de79ab
    const userToToggle = users.find(u => u.id === id);
    if (userToToggle && userToToggle.perfil === 'admin' && !active) {
      toast({
        title: "Ação Não Permitida",
        description: "O usuário administrador não pode ser desativado.",
        variant: "destructive",
      });
      return false; // Impede a desativação do admin
    }

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
