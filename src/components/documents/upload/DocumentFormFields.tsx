
import { useState, useEffect } from "react";
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
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const isAdmin = user?.role === 'admin';

  // Efeito para definir unidade como 5º CPA (Admin) por padrão para usuários normais
  useEffect(() => {
    // Se não for admin, força o envio para o 5º CPA (Admin)
    if (!isAdmin) {
      setUnitId("cpa-admin");
    }
  }, [isAdmin, setUnitId]);

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
      </div>      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unidade *</Label>
          {isAdmin ? (
            // Apenas administradores podem selecionar a unidade
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
                <SelectItem value="cpa-admin">5º CPA (Admin)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            // Usuários normais só podem enviar para o 5º CPA (Admin)
            <div className="flex items-center border rounded-md p-2 bg-gray-100">
              <span className="text-sm text-gray-700">5º CPA (Admin)</span>
              <input type="hidden" value="cpa-admin" />
            </div>
          )}
        </div>
          <div className="space-y-2">
          <Label htmlFor="documentDate">Data do Documento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal bg-white ${!documentDate ? "text-muted-foreground" : ""}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {documentDate ? format(new Date(documentDate), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={documentDate ? new Date(documentDate) : undefined}
                onSelect={(date) => {
                  // Quando o usuário seleciona uma data no calendário, formatamos para yyyy-MM-dd
                  if (date) {
                    const formattedDate = date.toISOString().split('T')[0];
                    setDocumentDate(formattedDate);
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <input type="hidden" id="documentDate" value={documentDate} required />
        </div>
      </div>
    </>
  );
}
