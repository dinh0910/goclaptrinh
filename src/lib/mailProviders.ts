export type MailProvider = "resend" | "sendgrid" | "google";

export const MAIL_PROVIDERS: MailProvider[] = ["resend", "sendgrid", "google"];

export const MAIL_PROVIDER_OPTIONS: Array<{
  value: MailProvider;
  label: string;
}> = [
  { value: "resend", label: "Resend" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "google", label: "Google (Gmail / Workspace)" },
];

export function isMailProvider(value: unknown): value is MailProvider {
  return typeof value === "string" && (MAIL_PROVIDERS as string[]).includes(value);
}