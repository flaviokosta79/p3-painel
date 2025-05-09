import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { runSupabaseDiagnostics, checkRequiredTables, checkStorageBucket } from '@/utils/supabaseSetup';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export function SupabaseDiagnostic() {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [tablesOk, setTablesOk] = useState<{exists: boolean, missingTables: string[]} | null>(null);
  const [bucketOk, setBucketOk] = useState<boolean | null>(null);
  const [showSetupSql, setShowSetupSql] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningCheck(true);
    
    try {
      // Verificar conexão
      let isConnected = false;
      try {
        if (!supabase) {
          setConnectionOk(false);
          throw new Error("Cliente Supabase não inicializado");
        }
        
        const { data, error } = await supabase.from('_fake_table').select('count', { count: 'exact', head: true });
        
        // Esperamos um erro específico de "tabela não existe", mas não outros erros de conexão
        isConnected = !error || error.code === '42P01';
        setConnectionOk(isConnected);
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        setConnectionOk(false);
        isConnected = false;
      }
      
      if (isConnected) {
        // Verificar tabelas
        const tablesResult = await checkRequiredTables();
        setTablesOk(tablesResult);
        
        // Verificar bucket
        const bucketResult = await checkStorageBucket();
        setBucketOk(bucketResult);
      }
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
      toast({
        title: "Erro ao executar diagnóstico",
        description: "Ocorreu um erro ao verificar a conexão com o Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico do Supabase</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {connectionOk === null ? (
            <Alert>
              <AlertTitle>Verificação de conexão</AlertTitle>
              <AlertDescription>
                Clique no botão abaixo para verificar a conexão com o Supabase
              </AlertDescription>
            </Alert>
          ) : connectionOk ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Conexão estabelecida</AlertTitle>
              <AlertDescription>
                A conexão com o Supabase foi estabelecida com sucesso.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha na conexão</AlertTitle>
              <AlertDescription>
                Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente
                e se o projeto Supabase está acessível.
              </AlertDescription>
            </Alert>
          )}
          
          {tablesOk !== null && (
            <Alert className={tablesOk.exists ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
              {tablesOk.exists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <AlertTitle>Tabelas necessárias</AlertTitle>
              <AlertDescription>
                {tablesOk.exists 
                  ? "Todas as tabelas necessárias foram encontradas." 
                  : `Tabelas faltando: ${tablesOk.missingTables.join(', ')}`}
              </AlertDescription>
            </Alert>
          )}
          
          {bucketOk !== null && (
            <Alert className={bucketOk ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
              {bucketOk ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <AlertTitle>Bucket de armazenamento</AlertTitle>
              <AlertDescription>
                {bucketOk 
                  ? "O bucket 'documents' foi encontrado." 
                  : "O bucket 'documents' não foi encontrado."}
              </AlertDescription>
            </Alert>
          )}
          
          {(tablesOk !== null && !tablesOk.exists) || (bucketOk !== null && !bucketOk) ? (
            <div className="pt-4">
              <Button onClick={() => setShowSetupSql(!showSetupSql)}>
                {showSetupSql ? 'Ocultar' : 'Mostrar'} SQL de configuração
              </Button>
              
              {showSetupSql && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                  <p className="text-sm font-medium mb-2">Execute este SQL no Editor SQL do Supabase:</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
{`-- Criar a tabela de missões diárias para armazenar configurações de tarefas
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  tasks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar a tabela de uploads para rastrear arquivos enviados
CREATE TABLE task_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar bucket de armazenamento para documentos de missões diárias
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Permitir que usuários autenticados leiam qualquer arquivo no bucket documents
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Permitir que qualquer pessoa faça upload de arquivos (para desenvolvimento)
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');`}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunningCheck}
          className="w-full"
        >
          {isRunningCheck ? 'Verificando...' : 'Verificar configuração do Supabase'}
        </Button>
      </CardFooter>
    </Card>
  );
}
