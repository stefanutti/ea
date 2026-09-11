import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIconsForApplication(app: any): string[] {
  const icons: string[] = [];

  if (!app || !app.properties) return icons;

  const p = app.properties;

  // ACCESS TYPE → Web  
  if (p.access_type === "Web") {
    icons.push("/svg/arcese_logo.svg");
  }

  // HOSTING → Cloud  
  if (p.hosting === "Cloud") {
    icons.push("/svg/google_cloud.svg");
  }

  // SUPPLIER → Frontiere  
  if (p.sw_supplier.toLowerCase() === "frontiere") {
    icons.push("/svg/frontiere.svg");
  }

  return icons;
}