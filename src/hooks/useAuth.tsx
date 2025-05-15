
import type React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '../lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export enum UserRole {
    ADMIN = 'admin',
    USUARIO = 'usuario',
}

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
  unidade_id: string | null;
  unidade_nome: string | null;
}

interface Credentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<{ user: AuthUser | null; session: Session | null; error: Error | null; }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  connectionStatus: { connected: boolean; lastChecked: Date | null; error?: string };
  checkConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; lastChecked: Date | null; error?: string }>({
      connected: false,
      lastChecked: null
    });

    const checkConnection = async () => {
      const result = await checkSupabaseConnection();
      setConnectionStatus({
        connected: result.connected,
        lastChecked: new Date(),
        error: result.error
      });
      
      if (!result.connected) {
        toast({
          title: "Problema de conexão",
          description: `Não foi possível conectar ao Supabase: ${result.error}`,
          variant: "destructive",
        });
      }
      
      return result;
    };

    useEffect(() => {
      setIsLoading(true); 
      
      // Check connection on initialization
      checkConnection();

      const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
          setUser(currentSession?.user ?? null);
          setSession(currentSession ?? null);
          if (!currentSession) {
              setUserProfile(null); 
              setIsLoading(false); 
          }
      });

      const checkInitialSession = async () => {
          try {
              const { data: { session: initialSess } } = await supabase.auth.getSession();
              if (!initialSess) {
                  setIsLoading(false);
              }
          } catch (error) {
              console.error('Erro ao buscar sessão inicial:', error);
              setIsLoading(false); 
          }
      };
      checkInitialSession();

      return () => {
          authListener.subscription.unsubscribe();
      };
    }, []); 

    const fetchProfileAndSetState = useCallback(async (currentAuthUser: AuthUser, eventName: string) => {
        try {
            // First check the connection status
            const connectionCheck = await checkConnection();
            if (!connectionCheck.connected) {
              setIsLoading(false);
              return;
            }
            
            // Query de teste simples para verificar acesso à tabela
            const { error: testError } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('id', currentAuthUser.id)
                .single();

            if (testError) {
                console.error('Erro na query de teste:', testError);
                toast({
                  title: "Erro de acesso",
                  description: `Problema ao acessar os dados do usuário: ${testError.message}`,
                  variant: "destructive",
                });
            }

            // Query completa para buscar o perfil do usuário
            const { data: profileData, error: profileError } = await supabase
                .from('usuarios')
                .select('id, nome, email, perfil, ativo, unidade_id, unidade:unidades (nome)')
                .eq('id', currentAuthUser.id)
                .single();

            if (profileError) {
                console.error('Erro ao buscar perfil do usuário:', profileError);
                toast({
                  title: "Erro de perfil",
                  description: `Não foi possível carregar seu perfil: ${profileError.message}`,
                  variant: "destructive",
                });
                setUserProfile(null);
            } else if (profileData) {
                let unidadeNome: string | null = null;
                if (profileData.unidade) {
                    if (Array.isArray(profileData.unidade)) {
                        if (profileData.unidade.length > 0 && profileData.unidade[0]) {
                            unidadeNome = profileData.unidade[0].nome;
                        }
                    } else {
                        unidadeNome = (profileData.unidade as { nome: string | null }).nome;
                    }
                }
                const fetchedProfile: UserProfile = {
                    id: profileData.id,
                    nome: profileData.nome,
                    email: profileData.email,
                    perfil: profileData.perfil as UserRole,
                    ativo: profileData.ativo,
                    unidade_id: profileData.unidade_id,
                    unidade_nome: unidadeNome,
                };
                setUserProfile(fetchedProfile);
            } else {
                console.warn(`Nenhum perfil encontrado para o usuário (ID: ${currentAuthUser.id}).`);
                setUserProfile(null);
            }
        } catch (e) {
            console.error('Erro inesperado ao buscar perfil:', e);
            toast({
              title: "Erro de sistema",
              description: "Ocorreu um erro ao buscar seus dados de perfil.",
              variant: "destructive",
            });
            setUserProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, [checkConnection]); 

    useEffect(() => {
        if (user) {
            setIsLoading(true); 
            fetchProfileAndSetState(user, 'PROFILE_FETCH_EFFECT');
        }
    }, [user, fetchProfileAndSetState]); 

    const login = async (credentials: Credentials) => {
        setIsLoading(true); 
        
        // Check connection before attempting login
        const connectionCheck = await checkConnection();
        if (!connectionCheck.connected) {
          setIsLoading(false);
          return { 
            user: null, 
            session: null, 
            error: new Error(`Problema de conexão ao Supabase: ${connectionCheck.error || 'Erro desconhecido'}`) 
          };
        }
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword(credentials);
            if (error) {
                console.error('Erro de login:', error);
                toast({ 
                  title: "Erro de Login", 
                  description: error.message, 
                  variant: "destructive" 
                });
                setIsLoading(false); 
                return { user: null, session: null, error };
            }
            return { user: data.user, session: data.session, error: null };
        } catch (e: unknown) { 
            const error = e instanceof Error ? e : new Error('Erro desconhecido durante o login');
            console.error('[AuthProvider login] Exceção:', error);
            toast({ 
              title: "Erro Crítico", 
              description: error.message, 
              variant: "destructive" 
            });
            setIsLoading(false);
            return { user: null, session: null, error };
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao sair:', error);
            toast({ 
              title: "Erro ao Sair", 
              description: error.message, 
              variant: "destructive" 
            });
        }
        setIsLoading(false);
    };

    const value: AuthContextType = {
        user,
        session,
        userProfile,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!userProfile,
        connectionStatus,
        checkConnection
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
