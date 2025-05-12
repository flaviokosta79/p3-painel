import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole, Unit } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Tipos
export interface UserData {
  id: string;
  name: string;
  email: string;
  password?: string; // Campo opcional para senha
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

// Lista de unidades padrão
const defaultUnits: Unit[] = [
  { id: '1', name: '10º BPM' },
  { id: '2', name: '28º BPM' },
  { id: '3', name: '33º BPM' },
  { id: '4', name: '37º BPM' },
  { id: '5', name: '2ª CIPM' },
];

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Carrega os usuários do localStorage
    const loadUsers = () => {
      setTimeout(() => {
        const storedUsers = localStorage.getItem('pmerj_users');
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        } else {
          // Inicializa com array vazio se não houver usuários
          setUsers([]);
          localStorage.setItem('pmerj_users', JSON.stringify([]));
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
      
      // Extrair a senha do userData antes de criar o novo usuário
      const { password, ...userDataWithoutPassword } = userData;
      
      const newUser: UserData = {
        ...userDataWithoutPassword,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      // Armazenar a senha em localStorage separado para fins de demonstração
      // Em um sistema real, isso seria feito de forma segura no backend
      if (password) {
        const userPasswords = JSON.parse(localStorage.getItem('pmerj_user_passwords') || '{}');
        userPasswords[newUser.id] = password;
        localStorage.setItem('pmerj_user_passwords', JSON.stringify(userPasswords));
      }
      
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
  
  const updateUser = async (id: string, data: Partial<Omit<UserData, 'id'>> & { password?: string }) => {
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
      
      // Extrair a senha do data antes de atualizar o usuário
      const { password, ...dataWithoutPassword } = data;
      
      const updatedUsers = users.map((user) =>
        user.id === id ? { ...user, ...dataWithoutPassword } : user
      );
      
      setUsers(updatedUsers);
      localStorage.setItem('pmerj_users', JSON.stringify(updatedUsers));
      
      // Se houver senha, atualizar no localStorage separado
      if (password) {
        const userPasswords = JSON.parse(localStorage.getItem('pmerj_user_passwords') || '{}');
        userPasswords[id] = password;
        localStorage.setItem('pmerj_user_passwords', JSON.stringify(userPasswords));
      }
      
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
    // Retorna as unidades padrão (em uma implementação real, isso viria de uma API)
    const storedUnits = localStorage.getItem('pmerj_units');
    if (storedUnits) {
      return JSON.parse(storedUnits);
    } else {
      // Se não houver unidades no localStorage, usa as unidades padrão e salva
      localStorage.setItem('pmerj_units', JSON.stringify(defaultUnits));
      return defaultUnits;
    }
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
