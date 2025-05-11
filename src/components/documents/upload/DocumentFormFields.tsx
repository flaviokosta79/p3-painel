
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";

interface DocumentFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  unitId: string;
  setUnitId: (unitId: string) => void;
  documentDate: string;
  setDocumentDate: (date: string) => void;
}

export function DocumentFormFields({ 
  title, setTitle,
  description, setDescription,
  unitId, setUnitId,
  documentDate, setDocumentDate
}: DocumentFormFieldsProps) {
  const { user } = useAuth();
  const { getUnits } = useUsers();
  const units = getUnits();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Título do Documento *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ex: Relatório Mensal de Ocorrências"
          className="bg-white"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descrição do conteúdo do documento"
          className="min-h-[80px] bg-white"
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
            <SelectTrigger className="bg-white">
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
            className="bg-white"
          />
        </div>
      </div>
    </>
  );
}
