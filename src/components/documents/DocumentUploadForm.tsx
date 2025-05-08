
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { File, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function DocumentUploadForm() {
  const { user } = useAuth();
  const { addDocument } = useDocuments();
  const { getUnits } = useUsers();
  const navigate = useNavigate();
  
  const units = getUnits();
  
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unitId, setUnitId] = useState(user?.unit.id || "");
  const [documentDate, setDocumentDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  
  // Validação de arquivo
  const validateFile = (file: File): boolean => {
    // Verificar tipo de arquivo
    const allowedTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png"
    ];
    
    // Verificar extensão
    const fileName = file.name.toLowerCase();
    const validExtension = /\.(pdf|xlsx|docx|jpg|jpeg|png)$/i.test(fileName);
    
    if (!allowedTypes.includes(file.type) || !validExtension) {
      setFileError("Tipo de arquivo não permitido. Use PDF, XLSX, DOCX, JPG ou PNG.");
      return false;
    }
    
    // Verificar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      setFileError("O arquivo excede o tamanho máximo de 10MB.");
      return false;
    }
    
    setFileError("");
    return true;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        e.target.value = "";
        setFile(null);
      }
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setFileError("Selecione um arquivo para enviar.");
      return;
    }
    
    if (!title || !unitId || !documentDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Em um cenário real, faríamos upload do arquivo para um servidor
      // Aqui estamos simulando isso
      
      // Dados necessários para criar o documento
      const unitData = units.find((u) => u.id === unitId);
      
      if (!unitData) {
        toast({
          title: "Erro",
          description: "Unidade não encontrada.",
          variant: "destructive",
        });
        return;
      }
      
      // Criar novo documento
      const success = await addDocument({
        title,
        description,
        unitId: unitData.id,
        unitName: unitData.name,
        documentDate,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file), // Em produção, seria a URL do servidor
      });
      
      if (success) {
        navigate("/documents");
      }
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Envio de Documento</CardTitle>
        <CardDescription>
          Preencha o formulário abaixo para enviar um novo documento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Documento *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Relatório Mensal de Ocorrências"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do conteúdo do documento"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select 
                value={unitId} 
                onValueChange={setUnitId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentDate">Data do Documento *</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]} // Não permite datas futuras
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <div className="border rounded-md p-4 bg-muted/20">
              {file ? (
                <div className="flex flex-col items-center p-2 gap-2">
                  <File className="h-10 w-10 text-pmerj-blue" />
                  <div className="text-center">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFile(null)}
                  >
                    Trocar arquivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4 gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-center font-medium">
                    Arraste e solte ou clique para selecionar um arquivo
                  </p>
                  <p className="text-sm text-gray-500">
                    Formatos aceitos: PDF, XLSX, DOCX, JPG, PNG (máximo 10MB)
                  </p>
                  <Input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.docx,.jpg,.jpeg,.png"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    Selecionar arquivo
                  </Button>
                </div>
              )}
            </div>
            {fileError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Erro no arquivo</AlertTitle>
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <CardFooter className="flex justify-between px-0 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-pmerj-blue text-white hover:bg-pmerj-blue/90"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar Documento"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
