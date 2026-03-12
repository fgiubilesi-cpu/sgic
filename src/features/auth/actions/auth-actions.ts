"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

function normalizeLoginError(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Credenziali non valide per il progetto corrente. Verifica email e password attive di Supabase.";
  }

  return message;
}

export async function login(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: "Invalid email or password format." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validation.data);

  if (error) {
    return { error: normalizeLoginError(error.message) };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
