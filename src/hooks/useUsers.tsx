import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import { type User as AuthUser, useAuth, type UserRole } from './useAuth'; 
import { toast } from '@/components/ui/use-toast'; 
import { supabase } from '@/lib/supabaseClient'; 

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

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const fetchUnits = async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('id, nome'); 

      if (error) {
        console.error("Erro ao buscar unidades do Supabase:", error);
        toast({
          title: "Erro ao Carregar Unidades",
          description: "Não foi possível buscar as unidades do sistema.",
          variant: "destructive",
        });
        return []; 
      } 
      return data ? data.map(unit => ({ id: unit.id, name: unit.nome })) : [];
    };

    const fetchUsersFromSupabase = async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*'); 

      if (usersError) {
        console.error("Erro ao buscar usuários do Supabase:", usersError);
        toast({
          title: "Erro ao Carregar Usuários",
          description: "Não foi possível buscar os usuários do sistema.",
          variant: "destructive",
        });
        return []; 
      }
      
      const processedUsers: UserData[] = usersData ? usersData.map(user => ({
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil as UserRole, 
          unidadeId: user.unidade_id, 
          ativo: user.ativo,
      })) : [];
      
      return processedUsers;
    };

    const initializeData = async () => {
      const fetchedUnits = await fetchUnits();
      setUnits(fetchedUnits);

      const supabaseUsers = await fetchUsersFromSupabase();
      setUsers(supabaseUsers);
      
      setLoading(false); 
    };

    initializeData();
  }, []);

  const addUser = async (userData: Omit<UserData, 'id' | 'ativo' | 'unidadeId'> & { unidade: Unit, senha?: string }): Promise<boolean> => {
    if (!userData.senha) {
      toast({
        title: "Erro ao Adicionar Usuário",
        description: "A senha é obrigatória para criar um novo usuário.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
        options: {
          data: {
            full_name: userData.nome, // Sincronizando o nome para user_metadata
          }
        }
      });

      if (authError || !authData || !authData.user) {
        console.error("Erro ao criar usuário no Supabase Auth:", authError);
        toast({
          title: "Erro ao Criar Usuário (Auth)",
          description: authError?.message || "Não foi possível criar o usuário no sistema de autenticação.",
          variant: "destructive",
        });
        return false;
      }

      // Se signUp retorna uma sessão, definir explicitamente no cliente supabase-js.
      if (authData.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
        if (sessionError) {
          console.error("Erro ao definir a sessão após signUp:", sessionError);
          toast({
            title: "Erro de Sessão Pós-Registro",
            description: `Não foi possível estabelecer a sessão do usuário após o registro: ${sessionError.message}. O perfil pode não ter sido salvo.`,
            variant: "destructive",
          });
          // O usuário foi criado no Auth, mas a sessão não pôde ser definida no cliente.
          // Isso pode impedir a inserção do perfil se a RLS for rigorosa.
          return false;
        }
      } else {
        // Se não há sessão após o signUp (ex: confirmação de e-mail pendente e configurada para não emitir sessão imediata)
        console.warn("Nenhuma sessão retornada ou definida após signUp. A inserção do perfil dependerá da política de RLS permitir operações por usuários recém-registrados sem sessão ativa no cliente ou com confirmação pendente.");
        // Não necessariamente um erro fatal aqui, pois a RLS pode permitir a inserção
        // baseada no token que o signUp implicitamente usa, mas é um aviso.
      }
      
      const newAuthUserId = authData.user.id;

      // 2. Inserir perfil na tabela 'usuarios'
      const userProfileData = {
        id: newAuthUserId, 
        nome: userData.nome,
        email: userData.email,
        perfil: userData.perfil,
        unidade_id: userData.unidade.id, 
        ativo: true, 
      };

      const { error: insertError } = await supabase
        .from('usuarios')
        .insert(userProfileData);

      if (insertError) {
        console.error("Erro ao inserir perfil do usuário no Supabase:", insertError);
        // Aqui, idealmente, deveríamos tentar deletar o usuário do Auth se a inserção do perfil falhar.
        // Por simplicidade, vamos apenas notificar o erro por enquanto.
        toast({
          title: "Erro ao Salvar Perfil do Usuário",
          description: insertError.message || "Não foi possível salvar os detalhes do perfil do usuário.",
          variant: "destructive",
        });
        // Poderia ser útil tentar reverter a criação do usuário no Auth aqui.
        // Ex: await supabase.auth.admin.deleteUser(newAuthUserId) // Requer privilégios de admin
        return false;
      }

      // 3. Atualizar estado local se tudo correu bem
      const newUserForState: UserData = {
        id: newAuthUserId,
        nome: userData.nome,
        email: userData.email,
        perfil: userData.perfil,
        unidadeId: userData.unidade.id,
        ativo: true,
        // Não armazenamos a senha no estado local
      };

      setUsers(prevUsers => [...prevUsers, newUserForState]);
      
      toast({
        title: "Usuário Adicionado",
        description: `O usuário ${userData.nome} foi adicionado com sucesso.`,
      });
      return true;

    } catch (error) {
      console.error("Erro inesperado ao adicionar usuário:", error);
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro inesperado ao tentar adicionar o novo usuário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<Omit<UserData, 'id' | 'ativo' | 'unidadeId' | 'senha'>> & { unidade?: Unit, senha?: string }): Promise<boolean> => {
    try {
      const dataToUpdate: {
        nome?: string;
        perfil?: UserRole;
        unidade_id?: string;
        // Adicione outros campos do perfil aqui se necessário, exceto email/senha por enquanto
      } = {};

      if (userData.nome !== undefined) {
        dataToUpdate.nome = userData.nome;
      }
      if (userData.perfil !== undefined) {
        dataToUpdate.perfil = userData.perfil;
      }
      if (userData.unidade?.id !== undefined) {
        dataToUpdate.unidade_id = userData.unidade.id;
      }

      // Se não há nada para atualizar, retorne sucesso (ou trate como preferir)
      if (Object.keys(dataToUpdate).length === 0) {
        toast({
          title: "Nenhuma Alteração",
          description: "Nenhum dado foi modificado.",
        });
        return true;
      }

      console.log("[updateUser] Tentando atualizar tabela 'usuarios'. UserID:", userId, "Dados para atualizar:", dataToUpdate);

      const { error } = await supabase
        .from('usuarios')
        .update(dataToUpdate)
        .eq('id', userId);

      if (error) {
        console.error("Erro ao atualizar usuário no Supabase:", error);
        toast({
          title: "Erro ao Atualizar Usuário",
          description: error.message || "Não foi possível atualizar os dados do usuário.",
          variant: "destructive",
        });
        return false;
      }

      // Se o nome foi atualizado, tentar sincronizar com user_metadata no Supabase Auth
      // Isso atualizará o user_metadata do USUÁRIO LOGADO.
      // Se um admin estiver editando outro usuário, isso não atualizará o user_metadata do usuário editado,
      // apenas do admin logado (se o admin tiver um user_metadata.full_name).
      // Para atualizar o user_metadata de outro usuário, seria necessário usar admin.updateUserById() (geralmente via Edge Function).
      if (dataToUpdate.nome !== undefined) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: { full_name: dataToUpdate.nome }
        });

        if (authUpdateError) {
          console.warn("Aviso ao sincronizar nome com Supabase Auth:", authUpdateError);
          toast({
            title: "Aviso de Sincronização (Auth)",
            description: `Perfil atualizado, mas o nome no sistema de autenticação pode não ter sido sincronizado: ${authUpdateError.message}`,
            variant: "default", // Não é um erro fatal para a operação principal
          });
          // Continuar mesmo se isso falhar, pois a tabela 'usuarios' foi atualizada.
        }
      }

      // Atualizar estado local
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? {
                ...user,
                ...(dataToUpdate.nome !== undefined && { nome: dataToUpdate.nome }),
                ...(dataToUpdate.perfil !== undefined && { perfil: dataToUpdate.perfil }),
                ...(dataToUpdate.unidade_id !== undefined && { unidadeId: dataToUpdate.unidade_id }),
              }
            : user
        )
      );

      toast({
        title: "Usuário Atualizado",
        description: "Os dados do usuário foram atualizados com sucesso.",
      });
      return true;

    } catch (error) {
      console.error("Erro inesperado ao atualizar usuário:", error);
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro inesperado ao tentar atualizar o usuário.",
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
    const userToToggle = users.find(u => u.id === id);
    if (userToToggle && userToToggle.perfil === 'admin' && !active) {
      toast({
        title: "Ação Não Permitida",
        description: "O usuário administrador não pode ser desativado.",
        variant: "destructive",
      });
      return false; 
    }

    try {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user =>
          user.id === id ? { ...user, ativo: active } : user
        );
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
    return units; 
  };

  const getUnitNameById = (id: string): string | undefined => {
    const unit = units.find(u => u.id === id);
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
    units,
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
