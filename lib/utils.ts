import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isMembershipActive(expiryDate: string | Date): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return expiry >= now;
}

export function getMembershipStatus(expiryDate: string | Date): "active" | "expiring_soon" | "expired" {
  const expiry = new Date(expiryDate);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 7) return "active";
  if (diffDays >= 0 && diffDays <= 7) return "expiring_soon";
  return "expired";
}

export function getDaysRemainingText(expiryDate: string | Date): string {
  const expiry = new Date(expiryDate);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays} days left`;
  if (diffDays === 0) return "Expires today";
  return `Expired ${Math.abs(diffDays)} days ago`;
}

export function calcMembershipTypeFromDates(start: string | null, end: string | null): string {
  if (!start || !end) return "1 Month";
  const s = new Date(start);
  const e = new Date(end);
  const diffMonths = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (diffMonths <= 1.5) return "1 Month";
  if (diffMonths <= 2.5) return "2 Months";
  if (diffMonths <= 4.5) return "3 Months";
  if (diffMonths <= 8) return "6 Months";
  return "12 Months";
}