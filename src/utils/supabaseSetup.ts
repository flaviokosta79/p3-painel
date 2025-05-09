import { supabase } from '@/lib/supabaseClient';

/**
 * Função utilitária para verificar se o Supabase está conectado e configurado corretamente.
 * Pode ser executada durante o desenvolvimento para diagnosticar problemas.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Verificando conexão com Supabase...");
    if (!supabase) {
      console.error("Cliente Supabase não está inicializado.");
      return false;
    }
    
    // Testar conexão para verificar se o Supabase está acessível
    const { error } = await supabase.from('_unused_table_name').select('count', { count: 'exact', head: true });
    
    // Note que esperamos um erro 400 (tabela não encontrada) mas não erros de conexão
    if (error && error.code !== '42P01') {
      console.error("Erro ao conectar com Supabase:", error);
      return false;
    }
    
    console.log("Conexão com Supabase estabelecida com sucesso.");
    return true;
  } catch (error) {
    console.error("Erro ao verificar conexão com Supabase:", error);
    return false;
  }
}

/**
 * Verifica se as tabelas necessárias existem no Supabase
 */
export async function checkRequiredTables(): Promise<{exists: boolean, missingTables: string[]}> {
  try {
    console.log("Verificando tabelas no Supabase...");
    if (!supabase) {
      console.error("Cliente Supabase não está inicializado.");
      return {exists: false, missingTables: ['daily_missions', 'task_uploads']};
    }
    
    const requiredTables = ['daily_missions', 'task_uploads'];
    const missingTables: string[] = [];
    
    for (const table of requiredTables) {
      // Tentar fazer uma consulta simples para verificar se a tabela existe
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      
      if (error && error.code === '42P01') {
        console.warn(`Tabela '${table}' não encontrada.`);
        missingTables.push(table);
      } else if (error) {
        console.error(`Erro ao verificar tabela '${table}':`, error);
        missingTables.push(table);
      } else {
        console.log(`Tabela '${table}' encontrada.`);
      }
    }
    
    return {
      exists: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error("Erro ao verificar tabelas:", error);
    return {exists: false, missingTables: ['daily_missions', 'task_uploads']};
  }
}

/**
 * Verifica se o bucket de storage necessário existe
 */
export async function checkStorageBucket(): Promise<boolean> {
  try {
    console.log("Verificando bucket de storage...");
    if (!supabase || !supabase.storage) {
      console.error("Cliente Supabase Storage não está disponível.");
      return false;
    }
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erro ao listar buckets:", error);
      return false;
    }
    
    const documentsBucketExists = buckets?.some(bucket => bucket.name === 'documents');
    
    if (!documentsBucketExists) {
      console.warn("Bucket 'documents' não encontrado.");
      return false;
    }
    
    console.log("Bucket 'documents' encontrado.");
    return true;
  } catch (error) {
    console.error("Erro ao verificar bucket:", error);
    return false;
  }
}

/**
 * Executar diagnóstico completo do Supabase
 */
export async function runSupabaseDiagnostics(): Promise<void> {
  console.group("=== Diagnóstico do Supabase ===");
  
  const isConnected = await checkSupabaseConnection();
  
  if (isConnected) {
    const { exists, missingTables } = await checkRequiredTables();
    const bucketExists = await checkStorageBucket();
    
    console.log("\nResultado do diagnóstico:");
    console.log(`- Conexão com Supabase: ${isConnected ? '✅ OK' : '❌ Falhou'}`);
    console.log(`- Tabelas necessárias: ${exists ? '✅ OK' : '❌ Faltando: ' + missingTables.join(', ')}`);
    console.log(`- Bucket 'documents': ${bucketExists ? '✅ OK' : '❌ Não encontrado'}`);
    
    if (!exists || !bucketExists) {
      console.log("\n⚠️ AÇÃO NECESSÁRIA:");
      console.log("Execute o script SQL de configuração disponível em: docs/supabase_setup_daily_missions.sql");
    }
  } else {
    console.log("\n❌ Não foi possível conectar ao Supabase. Verifique:");
    console.log("1. Se as variáveis de ambiente estão configuradas corretamente");
    console.log("2. Se o projeto Supabase está ativo");
    console.log("3. Se a internet está funcionando");
  }
  
  console.groupEnd();
}
