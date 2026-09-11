"use client";

import type { FieldErrors } from "@/lib/validation";

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export default FieldError;

export function errorInputClass(
  errors?: FieldErrors | null,
  field?: string
): string {
  return errors?.[field ?? ""] ? "border-red-500 dark:border-red-500 focus:ring-red-500" : "";
}