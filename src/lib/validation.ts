export type FieldErrors = Record<string, string>;

export interface ApiErrorResponse {
  field?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function fieldErrorsFrom(
  data: ApiErrorResponse
): {
  errors: FieldErrors;
  message: string;
} {
  if (data && data.field && data.error) {
    return { errors: { [data.field]: data.error }, message: data.error };
  }
  return { errors: {}, message: data?.error || "Đã có lỗi xảy ra" };
}