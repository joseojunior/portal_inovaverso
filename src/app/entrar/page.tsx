import { MessageSquareMore } from "lucide-react";

import { PublicLoginForm } from "@/features/auth/components/public-login-form";

export default function PublicLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(82,212,255,0.18),_transparent_35%),linear-gradient(180deg,#0d0717_0%,#140a22_100%)] px-6 py-12">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_26rem] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/58">
            <MessageSquareMore className="size-4 text-[#52d4ff]" />
            Acesso publico para comentarios moderados
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white">
              Participe da conversa sem abrir mao da curadoria editorial.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/62">
              O portal aceita comentarios apenas de usuarios autenticados. Cada envio entra em moderacao antes de aparecer publicamente.
            </p>
          </div>
        </div>
        <PublicLoginForm />
      </div>
    </div>
  );
}
