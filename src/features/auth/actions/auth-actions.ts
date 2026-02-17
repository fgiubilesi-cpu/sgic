"use server"; // <--- QUESTA RIGA È IL MURO CHE PROTEGGE IL SERVER

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  // 1. Estrazione e Validazione
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: "Formato email o password non valido." };
  }

  // 2. Esecuzione Server-Side (Qui possiamo usare i cookie!)
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validation.data);

  if (error) {
    return { error: error.message };
  }

  // 3. Redirect alla Dashboard
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Dopo il logout torniamo alla schermata di login
  redirect("/login");
}