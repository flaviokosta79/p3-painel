
import { useState, useEffect } from "react";
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface DocumentFormFieldsProps {
  control: Control<any>;
  errors?: FieldErrors;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  isEditMode?: boolean;
  existingFile?: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
}

export function DocumentFormFields({ 
  control,
  errors,
  setValue,
  watch,
  isEditMode = false,
  existingFile
}: DocumentFormFieldsProps) {
  const { user } = useAuth();
  const { getUnits } = useUsers();
  const units = getUnits();
  const isAdmin = user?.role === 'admin';
  
  const documentDate = watch('documentDate');
  const unitId = watch('unitId');

  // Efeito para definir unidade como 5º CPA (Admin) por padrão para usuários normais
  useEffect(() => {
    // Se não for admin, força o envio para o 5º CPA (Admin)
    if (!isAdmin) {
      setValue("unitId", "cpa-admin");
    }
  }, [isAdmin, setValue]);

  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Título do Documento *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Relatório Mensal de Ocorrências"
                className="bg-white"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Breve descrição do conteúdo do documento"
                className="min-h-[80px] bg-white"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="unitId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Unidade *</FormLabel>
              <FormControl>
                {isAdmin ? (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
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
                  <div className="flex items-center border rounded-md p-2 bg-gray-100">
                    <span className="text-sm text-gray-700">5º CPA (Admin)</span>
                    <input type="hidden" {...field} value="cpa-admin" />
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="documentDate"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Data do Documento *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal bg-white ${!field.value ? "text-muted-foreground" : ""}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isEditMode && (
          <FormField
            control={control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem className="col-span-2 space-y-2">
                <FormLabel>Arquivo *</FormLabel>
                <FormControl>
                  <Input 
                    type="file"
                    className="bg-white"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        setValue('file', file);
                      }
                    }}
                    {...fieldProps}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isEditMode && existingFile && (
          <div className="col-span-2 mt-2 p-3 border rounded-md bg-gray-50">
            <Label>Arquivo atual</Label>
            <div className="mt-1 flex items-center space-x-2 text-sm">
              <div className="flex-1 text-blue-600 underline">
                <a href={existingFile.url} target="_blank" rel="noopener noreferrer">
                  {existingFile.name}
                </a>
              </div>
              <div className="text-gray-500">
                ({Math.round(existingFile.size / 1024)} KB)
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Para substituir o arquivo, é necessário enviar um novo documento.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
