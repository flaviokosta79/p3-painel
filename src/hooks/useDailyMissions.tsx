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
      try {
        // Primeiro, tente buscar do Supabase
        const { data, error } = await supabase
          .from('daily_missions')
          .select('*')
          .order('dayNumber');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Se houver dados no Supabase, use-os
          setDailyMissions(data as DayMissions[]);
        } else {
          // Se não houver dados no Supabase, tente o localStorage
          const storedMissions = localStorage.getItem('pmerj_daily_missions');
          
          if (storedMissions) {
            setDailyMissions(JSON.parse(storedMissions));
          } else {
            // Se não houver dados no localStorage, use os padrões
            setDailyMissions(defaultDailyMissions);
            // Salve os dados padrões no localStorage
            localStorage.setItem('pmerj_daily_missions', JSON.stringify(defaultDailyMissions));
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar missões';
        console.error("Erro ao carregar missões diárias:", errorMessage);
        setError(errorMessage);
        
        // Em caso de erro, tente carregar do localStorage
        const storedMissions = localStorage.getItem('pmerj_daily_missions');
        
        if (storedMissions) {
          setDailyMissions(JSON.parse(storedMissions));
        } else {
          setDailyMissions(defaultDailyMissions);
          localStorage.setItem('pmerj_daily_missions', JSON.stringify(defaultDailyMissions));
        }
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
      // Primeiro, deletar todas as missões existentes
      const { error: deleteError } = await supabase
        .from('daily_missions')
        .delete()
        .not('id', 'is', null); // Garantir que estamos deletando registros existentes
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Depois, inserir as missões atualizadas
      const { error: insertError } = await supabase
        .from('daily_missions')
        .insert(dailyMissions);
      
      if (insertError) {
        throw insertError;
      }
      
      return;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao salvar missões';
      console.error("Erro ao salvar todas as alterações:", errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  // Fazer upload de um arquivo para o Supabase Storage
  const uploadFile = async (taskId: string, file: File): Promise<string> => {
    try {
      // Gerar um nome de arquivo único que inclui o taskId e um timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;
      const filePath = `daily-missions/${fileName}`;
      
      // Fazer o upload do arquivo para o Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Registrar o upload na tabela de uploads
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
          user_id: 'current-user-id' // Este valor deve ser substituído pelo ID real do usuário
        });
      
      if (insertError) {
        throw insertError;
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
        throw error;
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
