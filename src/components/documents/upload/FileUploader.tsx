
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { File, Upload } from "lucide-react";

interface FileUploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  fileError: string;
  setFileError: (error: string) => void;
}

export function FileUploader({ file, setFile, fileError, setFileError }: FileUploaderProps) {
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

  return (
    <div className="space-y-2">
      <div className="border rounded-md p-6 bg-white flex flex-col items-center justify-center">
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
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="text-center font-medium mt-2">
              Arraste e solte ou clique para selecionar um arquivo
            </p>
            <p className="text-sm text-gray-500 mt-1 mb-3">
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
  );
}
