"use client";

import { useState } from "react";
import { login } from "@/features/auth/actions/auth-actions"; // Importa la Server Action
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Usiamo Sonner come installato

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    
    // Chiamata alla Server Action
    const result = await login(formData);

    if (result?.error) {
      toast.error("Errore Login", { description: result.error });
      setLoading(false);
    } else {
      // Il redirect viene gestito dal server action, qui non serve fare nulla
      toast.success("Login effettuato!");
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Accedi a SGIC</CardTitle>
        <CardDescription>Inserisci le tue credenziali aziendali.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="mario.rossi@azienda.it" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}