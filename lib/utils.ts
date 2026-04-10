import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { InventoryEntry, InventoryStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStepDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatGreetingDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

export function inventoryStatusLabel(status: InventoryStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In progress";
    default:
      return "Draft";
  }
}

export function inventoryEntryHref(entry: InventoryEntry) {
  if (entry.status === "completed") {
    return `/app/inventory/${entry.id}`;
  }

  if (!entry.extractedResentment) {
    return `/app/inventory/${entry.id}/clarify`;
  }

  return `/app/inventory/${entry.id}/review`;
}
