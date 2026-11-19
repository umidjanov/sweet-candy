import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency = "UZS"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${Number(num || 0).toLocaleString("ru-RU")} ${currency}`;
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

