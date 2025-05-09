import { MainLayout } from "@/components/layout/MainLayout";
import { SupabaseDiagnostic } from "@/components/admin/SupabaseDiagnostic";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { runSupabaseDiagnostics } from "@/utils/supabaseSetup";

export default function SupabaseDiagnosticPage() {
  const [logOutput, setLogOutput] = useState<string[]>([]);
  
  // Sobrescrever console.log para capturar a saída do diagnóstico
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      setLogOutput(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')]);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      setLogOutput(prev => [...prev, `⚠️ ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`]);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      setLogOutput(prev => [...prev, `❌ ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`]);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);
  
  const handleRunDiagnostics = async () => {
    setLogOutput([]);
    await runSupabaseDiagnostics();
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnóstico do Supabase</h1>
          <p className="text-muted-foreground">
            Ferramenta de diagnóstico para verificar a conexão e configuração do Supabase
          </p>
        </div>
        
        <SupabaseDiagnostic />
        
        <Card>
          <CardHeader>
            <CardTitle>Console de diagnóstico</CardTitle>
            <CardDescription>
              Log detalhado da verificação do Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button onClick={handleRunDiagnostics}>
                Executar diagnóstico completo
              </Button>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">
                {logOutput.length > 0 
                  ? logOutput.map((log, i) => <div key={i}>{log}</div>)
                  : "Clique em 'Executar diagnóstico completo' para iniciar a verificação..."}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
