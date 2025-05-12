import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para o padrão dd/mm/yyyy
 * @param date Data a ser formatada, pode ser string, Date ou null/undefined
 * @param includeTime Se verdadeiro, inclui horas e minutos no formato
 * @returns String formatada no padrão brasileiro (dd/mm/yyyy)
 */
export function formatDate(
  date: string | Date | null | undefined,
  includeTime = false
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (includeTime) {
    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
