import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key || key.startsWith("re_placeholder")) {
      throw new Error(
        "RESEND_API_KEY non configurata. Aggiungi la chiave reale in .env.local."
      );
    }
    _client = new Resend(key);
  }
  return _client;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@giubilesi.it";

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? "filippo@giubilesi.it";
