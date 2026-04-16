"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PublicLoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setErrorMessage("");

      const result = await signIn("user-credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false
      });

      if (!result || result.error) {
        setErrorMessage("Credenciais invalidas ou usuario inativo.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Entrar para comentar</CardTitle>
        <CardDescription>Use um `User` ativo do banco para participar da discussao das materias publicadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar no portal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
