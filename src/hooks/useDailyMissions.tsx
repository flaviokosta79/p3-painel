import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';

// Tipos
export interface DailyTask {
  id: string;
  name: string;
  description?: string;
  frequency?: string;
}

export interface DayMissions {
  day: string;
  dayNumber: number;
  tasks: DailyTask[];
}

interface DailyMissionsContextType {
  dailyMissions: DayMissions[];
  loading: boolean;
  error: string | null;
  addTask: (dayNumber: number, task: DailyTask) => void;
  updateTask: (dayNumber: number, task: DailyTask) => void;
  deleteTask: (dayNumber: number, taskId: string) => void;
  saveAllChanges: () => Promise<void>;
  uploadFile: (taskId: string, file: File) => Promise<string>;
  hasUserCompletedTaskToday: (taskId: string, userId: string) => Promise<boolean>;
}

// Dados padrão das missões diárias
const defaultDailyMissions: DayMissions[] = [
  {
    day: "Segunda-feira",
    dayNumber: 1,
    tasks: [
      { id: "op-police-mon", name: "Relatório Operações Policiais" },
      { id: "cargo-theft-mon", name: "Relatório Roubo de carga" },
      { id: "rush-op", name: 'Planejamento Operação "RUSH" (PM/3)', frequency: "Quinzenal" },
      { id: "revista-op", name: 'Planejamento Operação "REVISTA" (PM/3)', frequency: "Quinzenal" },
      { id: "staff-plan", name: "Planilha de Emprego de Efetivo", description: "Salvar na pasta" },
      { id: "ptou-plan", name: 'Planejamento "PTOU" atualizado' },
      { id: "ptou-report", name: 'Relatório "PTOU" – msg nº 920 do EME e 287 5º CPA' },
      { id: "sme-missions-mon", name: "Encaminhar Missões da SME e salvar os relatórios" },
    ],
  },
  {
    day: "Terça-feira",
    dayNumber: 2,
    tasks: [
      { id: "op-police-tue", name: "Relatório Operações Policiais" },
      { id: "cargo-theft-tue", name: "Relatório Roubo de carga" },
      { id: "safe-displace", name: "Relatório Deslocamento Seguro (PM/3)" },
      { id: "in-067", name: 'Relatório IN nº 067 (Quando o PM pode Atirar)', description: "Semana anterior" },
      { id: "school-visit", name: 'Relatório Visita Escolar', description: "Semana anterior" },
      { id: "sme-missions-tue", name: "Encaminhar Missões da SME e salvar os relatórios" },
    ],
  },
  {
    day: "Quarta-feira",
    dayNumber: 3,
    tasks: [
      { id: "op-police-wed", name: "Relatório Operações Policiais" },
      { id: "cargo-theft-wed", name: "Relatório Roubo de carga" },
      { id: "base-closure", name: "Planejamento Fecha Quartel da próxima semana" },
      { id: "sme-missions-wed", name: "Encaminhar Missões da SME e salvar os relatórios" },
      { id: "orders-in-force", name: "Remeter as ordens em vigor para corregedoria", description: "E-mail: sisd@cintpm.rj.gov.br" },
    ],
  },
  {
    day: "Quinta-feira",
    dayNumber: 4,
    tasks: [
      { id: "op-police-thu", name: "Relatório Operações Policiais" },
      { id: "cargo-theft-thu", name: "Relatório Roubo de carga" },
      { id: "safe-displace-plan", name: "Planejamento deslocamento Seguro (PM/3)" },
      { id: "arep3-plan", name: "Planejamento ARep 3 – Diretriz 008/2020 (PM/3)" },
      { id: "sme-missions-thu", name: "Encaminhar Missões da SME e salvar os relatórios" },
    ],
  },
  {
    day: "Sexta-feira",
    dayNumber: 5,
    tasks: [
      { id: "op-police-fri", name: "Relatório Operações Policiais" },
      { id: "cargo-theft-fri", name: "Relatório Roubo de carga" },
      { id: "sme-missions-fri", name: "Encaminhar Missões da SME e salvar os relatórios" },
      { id: "orders-summary", name: "Fazer os resumos das ordens em Vigor" },
    ],
  },
];

const DailyMissionsContext = createContext<DailyMissionsContextType | undefined>(undefined);

export function DailyMissionsProvider({ children }: { children: ReactNode }) {
  const [dailyMissions, setDailyMissions] = useState<DayMissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    // Carregar as missões diárias do Supabase ou do localStorage
  useEffect(() => {
    const loadDailyMissions = async () => {
      setLoading(true);
      
      // Verificar primeiro se temos dados no localStorage
      const storedMissions = localStorage.getItem('pmerj_daily_missions');
      
      // Se tivermos dados no localStorage, use-os imediatamente para melhorar a UX
      if (storedMissions) {
        try {
          const parsedMissions = JSON.parse(storedMissions);
          setDailyMissions(parsedMissions);
        } catch (parseError) {
          console.warn("Erro ao processar missões do localStorage, usando valores padrão:", parseError);
          setDailyMissions(defaultDailyMissions);
        }
      } else {
        // Se não houver no localStorage, use os valores padrão
        setDailyMissions(defaultDailyMissions);
      }
      
      // Em paralelo, tente buscar dados atualizados do Supabase
      try {
        // Verificar se o Supabase está configurado
        if (!supabase || !supabase.from) {
          console.warn("Cliente Supabase não está disponível ou configurado corretamente");
          return;
        }
        
        // Tente buscar do Supabase
        const { data, error } = await supabase
          .from('daily_missions')
          .select('*')
          .order('day_number'); // Usar snake_case conforme o SQL do Supabase
        
        if (error) {
          console.warn("Erro ao buscar missões do Supabase:", error.message);
          // Não lance um erro, apenas registre o aviso e continue usando dados locais
        } else if (data && data.length > 0) {
          // Se houver dados no Supabase, converta-os para o formato correto e atualize
          const formattedData = data.map(item => ({
            day: item.day,
            dayNumber: item.day_number,
            tasks: Array.isArray(item.tasks) ? item.tasks : JSON.parse(item.tasks)
          }));
          
          // Atualizar estado e localStorage
          setDailyMissions(formattedData as DayMissions[]);
          localStorage.setItem('pmerj_daily_missions', JSON.stringify(formattedData));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar missões';
        console.error("Erro ao carregar missões diárias:", errorMessage);
        setError(errorMessage);
        // Não é necessário fazer nada aqui, pois já carregamos do localStorage ou usamos os valores padrão
      } finally {
        setLoading(false);
      }
    };
    
    loadDailyMissions();
  }, []);
  
  // Adicionar nova tarefa
  const addTask = (dayNumber: number, newTask: DailyTask) => {
    setDailyMissions(prevMissions => 
      prevMissions.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            tasks: [...day.tasks, newTask]
          };
        }
        return day;
      })
    );
    
    // Salvar no localStorage para ter um backup
    localStorage.setItem('pmerj_daily_missions', JSON.stringify(dailyMissions));
  };
  
  // Atualizar tarefa existente
  const updateTask = (dayNumber: number, updatedTask: DailyTask) => {
    setDailyMissions(prevMissions => 
      prevMissions.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            tasks: day.tasks.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            )
          };
        }
        return day;
      })
    );
    
    // Salvar no localStorage para ter um backup
    localStorage.setItem('pmerj_daily_missions', JSON.stringify(dailyMissions));
  };
  
  // Excluir tarefa
  const deleteTask = (dayNumber: number, taskId: string) => {
    setDailyMissions(prevMissions => 
      prevMissions.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            tasks: day.tasks.filter(task => task.id !== taskId)
          };
        }
        return day;
      })
    );
    
    // Salvar no localStorage para ter um backup
    localStorage.setItem('pmerj_daily_missions', JSON.stringify(dailyMissions));
  };
    // Salvar todas as alterações no Supabase
  const saveAllChanges = async () => {
    try {
      // Verificar se o Supabase está disponível
      if (!supabase || !supabase.from) {
        throw new Error('Cliente Supabase não está disponível');
      }
      
      // Formatar os dados para o formato esperado pelo Supabase (snake_case)
      const formattedMissions = dailyMissions.map(mission => ({
        day: mission.day,
        day_number: mission.dayNumber,
        tasks: JSON.stringify(mission.tasks)
      }));
      
      // Primeiro, deletar todas as missões existentes
      const { error: deleteError } = await supabase
        .from('daily_missions')
        .delete()
        .not('id', 'is', null); // Garantir que estamos deletando registros existentes
      
      if (deleteError) {
        console.error("Erro ao excluir missões existentes:", deleteError);
        throw deleteError;
      }
      
      // Depois, inserir as missões atualizadas
      const { error: insertError } = await supabase
        .from('daily_missions')
        .insert(formattedMissions);
      
      if (insertError) {
        console.error("Erro ao inserir novas missões:", insertError);
        throw insertError;
      }
      
      // Atualizar localStorage com os dados atuais
      localStorage.setItem('pmerj_daily_missions', JSON.stringify(dailyMissions));
      
      return;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao salvar missões';
      console.error("Erro ao salvar todas as alterações:", errorMessage);
      
      // Mesmo em caso de erro, salvar localmente
      localStorage.setItem('pmerj_daily_missions', JSON.stringify(dailyMissions));
      
      throw new Error(errorMessage);
    }
  };
    // Fazer upload de um arquivo para o Supabase Storage
  const uploadFile = async (taskId: string, file: File, userId: string = 'default-user'): Promise<string> => {
    try {
      // Verificar se o Supabase está configurado corretamente
      if (!supabase || !supabase.storage || !supabase.from) {
        throw new Error('Cliente Supabase não está configurado corretamente');
      }
      
      // Primeiro, verificar se o bucket existe
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'documents');
        
        if (!bucketExists) {
          console.warn("Bucket 'documents' não existe. Tentando criar...");
          // Em uma aplicação real, você poderia tentar criar o bucket aqui
          // mas geralmente isso exige permissões de administrador
          throw new Error("Bucket 'documents' não encontrado no Supabase Storage");
        }
      } catch (bucketError) {
        console.warn("Erro ao verificar buckets:", bucketError);
        // Continue mesmo com erro, pois o bucket pode existir e apenas a verificação falhou
      }
      
      // Gerar um nome de arquivo único que inclui o taskId e um timestamp
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${taskId}/${timestamp}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
      const filePath = `daily-missions/${fileName}`;
      
      // Primeiro, salvar os metadados localmente para ter um backup
      try {
        // Armazenar uma referência local enquanto tentamos carregar o arquivo
        const localUploads = localStorage.getItem('pmerj_pending_uploads') || '[]';
        const pendingUploads = JSON.parse(localUploads);
        pendingUploads.push({
          id: uuidv4(),
          task_id: taskId,
          file_path: filePath,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
          user_id: userId
        });
        localStorage.setItem('pmerj_pending_uploads', JSON.stringify(pendingUploads));
      } catch (localError) {
        console.warn("Erro ao salvar upload localmente:", localError);
        // Continue mesmo com erro no armazenamento local
      }
      
      // Fazer o upload do arquivo para o Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Erro no upload para o Supabase Storage:", error);
        throw error;
      }
      
      // Registrar o upload na tabela de uploads, se ela existir
      try {
        const { error: insertError } = await supabase
          .from('task_uploads')
          .insert({
            id: uuidv4(),
            task_id: taskId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            uploaded_at: new Date().toISOString(),
            user_id: userId
          });
        
        if (insertError) {
          console.warn("Erro ao salvar metadados do arquivo na tabela task_uploads:", insertError.message);
          // Continue mesmo em caso de erro, pois o arquivo já foi carregado
        }
      } catch (tableError) {
        console.warn("Erro ao acessar tabela task_uploads:", tableError);
        // Continue mesmo em caso de erro, pois o arquivo já foi carregado
      }
      
      return filePath;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload do arquivo';
      console.error("Erro ao fazer upload de arquivo:", errorMessage);
      throw new Error(errorMessage);
    }
  };
    // Verificar se o usuário já enviou este documento hoje
  const hasUserCompletedTaskToday = async (taskId: string, userId: string): Promise<boolean> => {
    try {
      // Verificar primeiro no armazenamento local
      try {
        const pendingUploads = localStorage.getItem('pmerj_pending_uploads');
        if (pendingUploads) {
          const uploads = JSON.parse(pendingUploads);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Verificar se há algum upload para esta tarefa hoje
          const hasUpload = uploads.some((upload: any) => {
            const uploadDate = new Date(upload.uploaded_at);
            return upload.task_id === taskId && 
                   upload.user_id === userId && 
                   uploadDate >= today;
          });
          
          if (hasUpload) return true;
        }
      } catch (localError) {
        console.warn("Erro ao verificar uploads locais:", localError);
      }
      
      // Se não encontrou localmente, tente no Supabase
      if (!supabase || !supabase.from) {
        console.warn("Cliente Supabase não está disponível");
        return false;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Buscar os uploads do usuário para esta tarefa no dia de hoje
      const { data, error } = await supabase
        .from('task_uploads')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .gte('uploaded_at', today.toISOString());
      
      if (error) {
        console.warn("Erro ao verificar uploads na API:", error.message);
        return false;
      }
      
      return data && data.length > 0;
    } catch (err) {
      console.error("Erro ao verificar uploads do usuário:", err);
      return false;
    }
  };

  return (
    <DailyMissionsContext.Provider
      value={{
        dailyMissions,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        saveAllChanges,
        uploadFile,
        hasUserCompletedTaskToday
      }}
    >
      {children}
    </DailyMissionsContext.Provider>
  );
}

export function useDailyMissions() {
  const context = useContext(DailyMissionsContext);
  
  if (context === undefined) {
    throw new Error('useDailyMissions deve ser usado dentro de um DailyMissionsProvider');
  }
  
  return context;
}
