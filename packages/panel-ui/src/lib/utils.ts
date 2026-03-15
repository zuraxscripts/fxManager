import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatUptime(startedAt: Date | string | number): string {
  const initialDate = startedAt instanceof Date ? startedAt : new Date(startedAt);
  const diff = Math.floor((Date.now() - initialDate.getTime()) / 1000);

  return formatDuration(diff);
}
